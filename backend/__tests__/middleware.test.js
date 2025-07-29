const APITestHelper = require('./helpers/api');
const { generateToken } = require('../utils/auth');
const { db } = require('../models');

describe('Middleware and Edge Cases', () => {
  let api;
  
  beforeEach(() => {
    api = new APITestHelper();
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without token', async () => {
      const endpoints = ['/api/groups/my-group', '/api/protocols', '/api/tasks', '/api/templates'];

      for (const endpoint of endpoints) {
        const res = await api.get(endpoint);
        expect(res.status).toBe(401);
        expect(res.body.error).toContain('No token provided');
      }
    });

    it('should reject requests with malformed token', async () => {
      api.setAuth({ id: 'fake' }, 'malformed-token');
      
      const res = await api.get('/api/groups/my-group');
      
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid token');
    });

    it('should reject expired or invalid JWT', async () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid';
      
      api.setAuth({ id: 'test-user-id' }, invalidToken);
      
      const res = await api.get('/api/groups/my-group');
      
      expect(res.status).toBe(401);
    });

    it('should reject token for non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const token = generateToken(fakeUserId);
      
      api.setAuth({ id: fakeUserId }, token);
      
      const res = await api.get('/api/groups/my-group');
      
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('User not found');
    });

    it('should handle Bearer token format', async () => {
      const { user, token } = await api.createAuthenticatedUser();
      
      // Test with correct Bearer format
      const res = await api.get('/api/auth/me');
      expect(res.status).toBe(200);
    });
  });

  describe('Group Requirement Middleware', () => {
    it('should reject endpoints requiring group when user has no group', async () => {
      await api.createAuthenticatedUser();
      
      const endpoints = [
        { method: 'GET', path: '/api/protocols' },
        { method: 'POST', path: '/api/protocols' },
        { method: 'GET', path: '/api/tasks' },
        { method: 'POST', path: '/api/tasks' }
      ];

      for (const endpoint of endpoints) {
        const res = await api[endpoint.method.toLowerCase()](
          endpoint.path,
          endpoint.method === 'POST' ? {} : undefined
        );
        expect(res.status).toBe(403);
        expect(res.body.error).toContain('group');
      }
    });

    it('should allow access when user has group', async () => {
      const group = await global.testUtils.createTestGroup();
      await api.createAuthenticatedUser({ group_id: group.id });
      
      const res = await api.get('/api/protocols');
      
      // Should return 200 with empty array or protocols
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('protocols');
    });
  });

  describe('Request Validation', () => {
    let testGroup, testUser;

    beforeEach(async () => {
      testGroup = await global.testUtils.createTestGroup();
      const authData = await api.createAuthenticatedUser({ group_id: testGroup.id });
      testUser = authData.user;
    });

    it('should handle large request bodies', async () => {
      const largeDescription = 'x'.repeat(10000); // 10KB of text
      
      const res = await api.post('/api/tasks', {
        title: 'Task with large description',
        description: largeDescription
      });

      expect(res.status).toBe(201);
      expect(res.body.task.description).toBe(largeDescription);
    });

    it('should handle special characters and SQL injection attempts', async () => {
      const specialChars = `Test "with" 'quotes' & <tags> and émojis 🎉`;
      
      const res = await api.post('/api/tasks', {
        title: specialChars,
        description: `SQL injection attempt: '; DROP TABLE tasks; --`
      });

      expect(res.status).toBe(201);
      expect(res.body.task.title).toBe(specialChars);
    });

    it('should handle Unicode properly', async () => {
      const unicodeText = '测试 テスト тест 🌍🌎🌏';
      
      const res = await api.post('/api/protocols', {
        meetingDate: '2024-01-01',
        title: unicodeText
      });

      expect(res.status).toBe(201);
      expect(res.body.protocol.title).toBe(unicodeText);
    });

    it('should validate required fields', async () => {
      // Missing title for task
      const res1 = await api.post('/api/tasks', {
        description: 'Missing title'
      });
      expect(res1.status).toBe(400);

      // Missing date for protocol
      const res2 = await api.post('/api/protocols', {
        title: 'Missing date'
      });
      expect(res2.status).toBe(400);
    });

    it('should handle date format validation', async () => {
      const res = await api.post('/api/protocols', {
        meetingDate: 'invalid-date',
        title: 'Test Protocol'
      });
      
      // Should reject with validation error
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('Concurrent Operations', () => {
    let testGroup, testUser;

    beforeEach(async () => {
      testGroup = await global.testUtils.createTestGroup();
      const authData = await api.createAuthenticatedUser({ group_id: testGroup.id });
      testUser = authData.user;
    });

    it('should handle concurrent task creation', async () => {
      const taskPromises = [];
      const taskCount = 5;
      
      for (let i = 0; i < taskCount; i++) {
        taskPromises.push(
          api.post('/api/tasks', {
            title: `Concurrent Task ${i}`,
            description: 'Testing concurrent creation'
          })
        );
      }

      const results = await Promise.all(taskPromises);
      
      // All should succeed
      results.forEach(res => {
        expect(res.status).toBe(201);
      });

      // All should have unique IDs
      const ids = results.map(r => r.body.task.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(taskCount);
    });

    it('should handle concurrent updates', async () => {
      // Create multiple tasks
      const tasks = [];
      for (let i = 0; i < 3; i++) {
        const task = await global.testUtils.createTestTask(testGroup.id, testUser.id, {
          title: `Task ${i}`
        });
        tasks.push(task);
      }

      // Update all tasks concurrently
      const updatePromises = tasks.map((task, index) => 
        api.put(`/api/tasks/${task.id}`, {
          title: `Updated Task ${index}`,
          priority: 'high'
        })
      );

      const results = await Promise.all(updatePromises);
      
      // All should succeed
      results.forEach((res, index) => {
        expect(res.status).toBe(200);
        expect(res.body.task.title).toBe(`Updated Task ${index}`);
      });
    });

    it('should handle race conditions in group joining', async () => {
      const newGroup = await global.testUtils.createTestGroup();
      
      // Create multiple users trying to join same group
      const userApis = [];
      for (let i = 0; i < 3; i++) {
        const userApi = new APITestHelper();
        await userApi.createAuthenticatedUser();
        userApis.push(userApi);
      }

      // All try to join simultaneously
      const joinPromises = userApis.map(userApi => 
        userApi.post('/api/groups/join', { code: newGroup.code })
      );

      const results = await Promise.all(joinPromises);
      
      // All should succeed
      results.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection check', async () => {
      const res = await api.get('/api/test-db');
      
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent routes', async () => {
      const res = await api.get('/api/non-existent-endpoint');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    it('should not leak sensitive information', async () => {
      const res = await api.post('/api/auth/login', {
        invalidField: true
      });

      expect(res.body).not.toHaveProperty('stack');
      expect(res.body).toHaveProperty('error');
    });

    it('should handle invalid API paths properly', async () => {
      // Create user WITH a group to bypass group requirement middleware
      const group = await global.testUtils.createTestGroup();
      await api.createAuthenticatedUser({ group_id: group.id });
      
      const invalidRoutes = [
        '/api/invalid',
        '/api/groups/invalid/route',
        '/api/tasks/not/a/valid/path'
      ];

      for (const route of invalidRoutes) {
        const res = await api.get(route);
        expect(res.status).toBe(404);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid requests', async () => {
      const attempts = 10;
      const results = [];
      
      for (let i = 0; i < attempts; i++) {
        results.push(
          api.login({
            email: 'test@example.com',
            password: 'wrong-password'
          })
        );
      }
      
      const responses = await Promise.all(results);
      
      // All should complete
      expect(responses.length).toBe(attempts);
      
      // Check statuses
      const unauthorized = responses.filter(r => r.status === 401);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(unauthorized.length + rateLimited.length).toBe(attempts);
    });
  });

  describe('Business Logic Edge Cases', () => {
    let testGroup, testUser;

    beforeEach(async () => {
      testGroup = await global.testUtils.createTestGroup();
      const authData = await api.createAuthenticatedUser({ group_id: testGroup.id });
      testUser = authData.user;
    });

    it('should handle protocol operations', async () => {
      const protocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id,
        { data: {} }
      );

      // Test finalization
      const res = await api.post(`/api/protocols/${protocol.id}/finalize`);
      expect(res.status).toBe(200);
      expect(res.body.protocol.status).toBe('finalized');
    });

    it('should handle task status transitions', async () => {
      const task = await global.testUtils.createTestTask(
        testGroup.id,
        testUser.id,
        { status: 'todo' }
      );

      // Valid transition
      const res1 = await api.patch(`/api/tasks/${task.id}/status`, {
        status: 'in_progress'
      });
      expect(res1.status).toBe(200);

      // Invalid status
      const res2 = await api.patch(`/api/tasks/${task.id}/status`, {
        status: 'invalid-status'
      });
      expect([400, 422, 500]).toContain(res2.status);
    });

    it('should handle task assignment validation', async () => {
      const res = await api.post('/api/tasks', {
        title: 'Task for non-existent user',
        assignedTo: '00000000-0000-0000-0000-000000000000'
      });

      // Should either reject or create unassigned
      expect([400, 201, 500]).toContain(res.status);
      
      if (res.status === 201) {
        expect([null, testUser.id]).toContain(res.body.task.assigned_to);
      }
    });

    it('should enforce permissions on task operations', async () => {
      // Create another user in same group
      const api2 = new APITestHelper();
      const { user: otherUser } = await api2.createAuthenticatedUser({ 
        group_id: testGroup.id 
      });

      // Create task assigned to other user
      const task = await global.testUtils.createTestTask(
        testGroup.id,
        testUser.id,
        { assigned_to: otherUser.id }
      );

      // Creator should be able to update
      const res1 = await api.put(`/api/tasks/${task.id}`, {
        title: 'Updated by creator'
      });
      expect(res1.status).toBe(200);

      // Assigned user should be able to update status
      const res2 = await api2.patch(`/api/tasks/${task.id}/status`, {
        status: 'in_progress'
      });
      expect(res2.status).toBe(200);

      // Third user might have limited access
      const api3 = new APITestHelper();
      await api3.createAuthenticatedUser({ group_id: testGroup.id });
      
      const res3 = await api3.delete(`/api/tasks/${task.id}`);
      expect(res3.status).toBe(403);
    });

    it('should handle timezone considerations', async () => {
      const task = await global.testUtils.createTestTask(
        testGroup.id,
        testUser.id,
        { deadline: '2024-12-31' }
      );

      expect(task.deadline).toBeTruthy();
      expect(task.deadline).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
  });
});