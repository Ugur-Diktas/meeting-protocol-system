const { createClient } = require('@supabase/supabase-js');
const { verifyToken, extractToken } = require('../utils/auth');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, group_id, role')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user belongs to a group
const requireGroup = async (req, res, next) => {
  if (!req.user.group_id) {
    return res.status(403).json({ 
      error: 'You must belong to a group to access this resource' 
    });
  }
  next();
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required' 
    });
  }
  next();
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      const { data: user } = await supabase
        .from('users')
        .select('id, email, name, group_id, role')
        .eq('id', decoded.userId)
        .single();
      
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  
  next();
};

module.exports = {
  authenticate,
  requireGroup,
  requireAdmin,
  optionalAuth
};