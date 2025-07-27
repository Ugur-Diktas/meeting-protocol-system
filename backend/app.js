require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only use morgan in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Add io instance to all requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
const routes = require('./routes');
app.use('/api', routes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Meeting Protocol System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      protocols: '/api/protocols',
      groups: '/api/groups',
      tasks: '/api/tasks'
    }
  });
});

// Test Supabase connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    const { data, error } = await supabase
      .from('groups')
      .select('count')
      .single();
    
    if (error) throw error;
    
    res.json({ 
      status: 'connected',
      message: 'Database connection successful'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('User connected:', socket.id);
  }
  
  // Join a protocol room
  socket.on('join-protocol', (protocolId) => {
    socket.join(`protocol-${protocolId}`);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`User ${socket.id} joined protocol ${protocolId}`);
    }
    
    // Notify others in the room
    socket.to(`protocol-${protocolId}`).emit('user-joined', {
      socketId: socket.id,
      protocolId
    });
  });
  
  // Leave a protocol room
  socket.on('leave-protocol', (protocolId) => {
    socket.leave(`protocol-${protocolId}`);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`User ${socket.id} left protocol ${protocolId}`);
    }
    
    // Notify others in the room
    socket.to(`protocol-${protocolId}`).emit('user-left', {
      socketId: socket.id,
      protocolId
    });
  });
  
  // Join group room for task updates
  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`User ${socket.id} joined group ${groupId}`);
    }
  });
  
  // Handle protocol updates
  socket.on('protocol-update', (data) => {
    // Broadcast to all users in the same protocol room
    socket.to(`protocol-${data.protocolId}`).emit('protocol-updated', data);
  });
  
  // Handle cursor position for collaborative editing
  socket.on('cursor-position', (data) => {
    socket.to(`protocol-${data.protocolId}`).emit('cursor-moved', {
      userId: data.userId,
      position: data.position,
      section: data.section
    });
  });
  
  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(`protocol-${data.protocolId}`).emit('user-typing', {
      userId: data.userId,
      section: data.section
    });
  });
  
  socket.on('typing-stop', (data) => {
    socket.to(`protocol-${data.protocolId}`).emit('user-stopped-typing', {
      userId: data.userId,
      section: data.section
    });
  });
  
  socket.on('disconnect', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('User disconnected:', socket.id);
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export app and server for testing
module.exports = { app, httpServer, io };