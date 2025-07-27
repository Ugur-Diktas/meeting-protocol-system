// __tests__/helpers/api.js
const request = require('supertest');
const { app } = require('../../app');
const { generateToken } = require('../../utils/auth');
const { db } = require('../../models');
const logger = require('./logger');

class APITestHelper {
  constructor() {
    this.app = app;
    this.token = null;
    this.user = null;
  }

  // Set authentication token
  setAuth(user, token) {
    this.user = user;
    this.token = token || generateToken(user.id);
    logger.debug('Auth set', { userId: user.id, hasToken: !!this.token });
    return this;
  }

  // Clear authentication
  clearAuth() {
    this.user = null;
    this.token = null;
    logger.debug('Auth cleared');
    return this;
  }

  // Make authenticated request
  async makeRequest(method, path, data = null) {
    let req = request(this.app)[method.toLowerCase()](path);
    
    if (this.token) {
      req = req.set('Authorization', `Bearer ${this.token}`);
    }
    
    if (data) {
      req = req.send(data);
    }
    
    const response = await req;
    
    // Log API call
    logger.apiCall(method, path, data, response);
    
    return response;
  }

  // Convenience methods
  get(path) {
    return this.makeRequest('GET', path);
  }

  post(path, data) {
    return this.makeRequest('POST', path, data);
  }

  put(path, data) {
    return this.makeRequest('PUT', path, data);
  }

  patch(path, data) {
    return this.makeRequest('PATCH', path, data);
  }

  delete(path) {
    return this.makeRequest('DELETE', path);
  }

  // Auth endpoints
  async register(userData) {
    return request(this.app)
      .post('/api/auth/register')
      .send(userData);
  }

  async login(credentials) {
    return request(this.app)
      .post('/api/auth/login')
      .send(credentials);
  }

  // Helper to create authenticated user for tests
  async createAuthenticatedUser(userData = {}) {
    const email = userData.email || global.testUtils.randomEmail();
    const password = userData.password || 'TestPass123!';
    
    try {
      // First try to register via API
      const registerRes = await this.register({
        email,
        password,
        name: userData.name || 'Test User',
        groupCode: userData.groupCode
      });

      if (registerRes.status === 201) {
        this.setAuth(registerRes.body.user, registerRes.body.token);
        return registerRes.body;
      }
      
      // If registration failed due to email validation, create user directly
      if (registerRes.status === 400 && 
          (registerRes.body.error?.includes('email') || 
           registerRes.body.error?.includes('Test emails'))) {
        
        logger.info('Using direct user creation for testing');
        
        // Create user directly
        const user = await global.testUtils.createTestUser({
          email,
          name: userData.name || 'Test User',
          group_id: userData.groupCode ? 
            (await db.groups.findByCode(userData.groupCode))?.id : null
        });
        
        // Generate token for the user
        const token = generateToken(user.id);
        this.setAuth(user, token);
        
        return { user, token };
      }

      throw new Error(`Registration failed: ${registerRes.body.error}`);
    } catch (error) {
      logger.error('Failed to create authenticated user:', error);
      
      // Fallback: create user directly in database
      const user = await global.testUtils.createTestUser({
        email,
        name: userData.name || 'Test User',
        group_id: userData.groupCode ? 
          (await db.groups.findByCode(userData.groupCode))?.id : null
      });
      
      const token = generateToken(user.id);
      this.setAuth(user, token);
      
      return { user, token };
    }
  }
  
  // Cleanup helper
  async cleanup() {
    this.clearAuth();
  }
}

module.exports = APITestHelper;