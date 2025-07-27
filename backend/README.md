# Meeting Protocol System - Backend

Node.js/Express backend API for the Meeting Protocol System with Supabase integration and real-time capabilities.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Run production server
npm start

# Run tests
npm test
```

## 🛠️ Technology Stack

- **Node.js** - JavaScript runtime
- **Express.js 5** - Web framework
- **Supabase** - Database and authentication
- **Socket.io** - Real-time communication
- **JWT** - JSON Web Tokens for authentication
- **Puppeteer** - PDF generation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **bcrypt** - Password hashing
- **dotenv** - Environment configuration

## 📁 Project Structure

```
backend/
├── controllers/        # Request handlers
│   └── authController.js
├── middleware/         # Express middleware
│   └── auth.js        # Authentication middleware
├── routes/            # API routes
│   ├── index.js       # Route aggregator
│   └── auth.js        # Auth routes
├── utils/             # Utility functions
│   └── auth.js        # Auth helpers
├── server.js          # Express server setup
├── .env.example       # Environment variables example
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Security Configuration

The application uses several security measures:
- Helmet.js for security headers
- CORS configuration for frontend access
- JWT token validation
- Password hashing with bcrypt
- Input validation and sanitization

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |

### System

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/api` | API info | No |
| GET | `/api/test-db` | Test database connection | No |

### Groups (To be implemented)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/groups` | List user's groups | Yes |
| POST | `/api/groups` | Create new group | Yes |
| GET | `/api/groups/:id` | Get group details | Yes |
| PUT | `/api/groups/:id` | Update group | Yes |
| POST | `/api/groups/join` | Join group with code | Yes |

### Protocols (To be implemented)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/protocols` | List protocols | Yes |
| POST | `/api/protocols` | Create protocol | Yes |
| GET | `/api/protocols/:id` | Get protocol | Yes |
| PUT | `/api/protocols/:id` | Update protocol | Yes |
| DELETE | `/api/protocols/:id` | Delete protocol | Yes |
| GET | `/api/protocols/:id/pdf` | Generate PDF | Yes |

## 🔐 Authentication Flow

1. **Registration**
   - User provides email, password, name
   - Password is hashed with bcrypt
   - User created in Supabase Auth
   - Profile created in users table
   - JWT token returned

2. **Login**
   - User provides email and password
   - Credentials verified with Supabase Auth
   - JWT token generated and returned
   - Token includes user ID

3. **Protected Routes**
   - Client sends token in Authorization header
   - Middleware verifies JWT token
   - User data attached to request
   - Route handler processes request

### Example Request with Authentication

```javascript
// Client-side
const response = await fetch('http://localhost:3001/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Server-side middleware
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

## 🔄 Real-time Features

### Socket.io Events

```javascript
// Client connects
socket.on('connection', (socket) => {
  console.log('User connected:', socket.id);
});

// Join protocol room
socket.on('join-protocol', (protocolId) => {
  socket.join(`protocol-${protocolId}`);
});

// Protocol updates
socket.on('protocol-update', (data) => {
  socket.to(`protocol-${data.protocolId}`).emit('protocol-updated', data);
});
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  group_id UUID REFERENCES groups(id),
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Groups Table
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Protocols Table
```sql
CREATE TABLE protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id),
  meeting_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Structure
```
backend/
├── tests/
│   ├── unit/
│   │   ├── auth.test.js
│   │   └── utils.test.js
│   └── integration/
│       ├── auth.test.js
│       └── api.test.js
```

## 📝 Development

### Starting Development Server
```bash
npm run dev
```

This runs the server with nodemon for automatic restarts on file changes.

### Code Style
- Use ES6+ features
- Follow Express.js best practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Add JSDoc comments for functions

### Adding New Routes

1. Create controller in `controllers/`
2. Create route file in `routes/`
3. Import and mount in `routes/index.js`
4. Add middleware if needed

Example:
```javascript
// controllers/protocolController.js
const createProtocol = async (req, res) => {
  try {
    // Implementation
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// routes/protocols.js
router.post('/', authenticate, createProtocol);

// routes/index.js
router.use('/protocols', protocolRoutes);
```

## 🚀 Deployment

### Render Deployment

1. **Connect GitHub Repository**
2. **Configure Service**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. **Set Environment Variables**
4. **Deploy**

### Production Considerations

- Set `NODE_ENV=production`
- Use strong JWT secret
- Configure proper CORS origins
- Enable rate limiting
- Set up monitoring (e.g., PM2, New Relic)
- Configure logs aggregation
- Set up backup strategies

## 🐛 Debugging

### Common Issues

1. **Database Connection Failed**
   - Check Supabase credentials
   - Verify network connectivity
   - Check Supabase project status

2. **CORS Errors**
   - Verify FRONTEND_URL in .env
   - Check CORS middleware configuration

3. **Authentication Failures**
   - Verify JWT_SECRET matches
   - Check token expiration
   - Verify Supabase auth settings

### Debug Mode
```bash
# Run with debug logging
DEBUG=* npm run dev
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Logs
- Morgan logs HTTP requests
- Console logs for debugging
- Error logs for failures

## 🔧 Maintenance

### Database Migrations
```bash
# Run migrations (if implemented)
npm run migrate

# Rollback migrations
npm run migrate:rollback
```

### Backup
- Supabase handles automatic backups
- Export data via Supabase dashboard
- Implement custom backup scripts if needed

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [JWT Documentation](https://jwt.io/)

## 🤝 API Development Guidelines

1. **RESTful Design**: Follow REST principles
2. **Error Handling**: Always return consistent error responses
3. **Validation**: Validate all input data
4. **Documentation**: Update API docs for new endpoints
5. **Testing**: Write tests for new features
6. **Security**: Follow security best practices

## 📄 License

Proprietary - Internal use only