const request = require('supertest');
const { app } = require('../../app');
const { generateToken } = require('../../utils/auth');

class APITestHelper {
  constructor() {
    this.app = app;
    this.token = null;
    this.user = null;
  }

  setAuth(user, token) {
    this.user = user;
    this.token = token || generateToken(user.id);
    return this;
  }

  clearAuth() {
    this.user = null;
    this.token = null;
    return this;
  }

  // Generic request method
  async request(method, path, data = null) {
    let req = request(this.app)[method.toLowerCase()](path);
    
    if (this.token) {
      req = req.set('Authorization', `Bearer ${this.token}`);
    }
    
    if (data) {
      req = req.send(data);
    }
    
    return req;
  }

  // Convenience methods
  get(path) { return this.request('GET', path); }
  post(path, data) { return this.request('POST', path, data); }
  put(path, data) { return this.request('PUT', path, data); }
  patch(path, data) { return this.request('PATCH', path, data); }
  delete(path) { return this.request('DELETE', path); }

  // Auth shortcuts
  register(userData) {
    return this.post('/api/auth/register', userData);
  }

  login(credentials) {
    return this.post('/api/auth/login', credentials);
  }

  // Create authenticated user for tests
  async createAuthenticatedUser(userData = {}) {
    const user = await global.testUtils.createTestUser(userData);
    const token = generateToken(user.id);
    this.setAuth(user, token);
    return { user, token };
  }
}

module.exports = APITestHelper;