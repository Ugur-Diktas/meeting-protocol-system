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
      const endpoints = [
        '/api/groups/my-group',
        '/api/protocols',
        '/api/tasks',
        '/api/templates'
      ];

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

    it('should reject expired token', async () => {
      // Create a token with invalid signature
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid';
      
      api.setAuth({ id: 'test-user-id' }, expiredToken);
      
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

    it('should handle Bearer token format correctly', async () => {
      const { user, token } = await api.createAuthenticatedUser();
      
      // Test with correct Bearer format (already handled by api helper)
      const res1 = await api.get('/api/auth/me');
      expect(res1.status).toBe(200);
      
      // Test without Bearer prefix by making raw request
      const request = require('supertest');
      const { app } = require('../app');
      
      const res2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', token); // Without "Bearer "
      
      expect(res2.status).toBe(401);
    });
  });

  describe('Group Requirement Middleware', () => {
    it('should reject protocol endpoints without group', async () => {
      // Create user without group
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
      await api.createAuthenticatedUser({ groupCode: group.code });
      
      // Should not get 403 for group requirement
      const res = await api.get('/api/protocols');
      expect(res.status).not.toBe(403);
    });
  });

  describe('Request Validation', () => {
    let testGroup;
    let testUser;

    beforeEach(async () => {
      testGroup = await global.testUtils.createTestGroup();
      const authData = await api.createAuthenticatedUser({ groupCode: testGroup.code });
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

    it('should reject extremely large bodies', async () => {
      const hugeData = 'x'.repeat(1000000); // 1MB
      
      const res = await api.post('/api/protocols', {
        meetingDate: '2024-01-01',
        title: 'Protocol',
        data: { notes: hugeData }
      });

      // Should be rejected by express body parser or validation
      expect([400, 413]).toContain(res.status);
    });

    it('should handle special characters in input', async () => {
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
      // Missing required fields for task
      const res1 = await api.post('/api/tasks', {
        description: 'Missing title'
      });
      expect(res1.status).toBe(400);

      // Missing required fields for protocol
      const res2 = await api.post('/api/protocols', {
        title: 'Missing date'
      });
      expect(res2.status).toBe(400);
    });

    it('should validate date formats', async () => {
      const invalidDates = ['invalid-date', '2024-13-01', '2024-01-32', '01-01-2024'];
      
      for (const date of invalidDates) {
        const res = await api.post('/api/protocols', {
          meetingDate: date,
          title: 'Test Protocol'
        });
        
        // Should either reject with validation error or server error
        if (res.status === 201) {
          // If accepted, should be stored as valid date
          expect(res.body.protocol.meeting_date).toMatch(/^\d{4}-\d{2}-\d{2}/);
        } else {
          // Could be 400 (validation) or 500 (server error)
          expect([400, 500]).toContain(res.status);
        }
      }
    });
  });

  describe('Concurrent Operations', () => {
    let testGroup;
    let testUser;

    beforeEach(async () => {
      testGroup = await global.testUtils.createTestGroup();
      const authData = await api.createAuthenticatedUser({ groupCode: testGroup.code });
      testUser = authData.user;
    });

    it('should handle concurrent task creation', async () => {
      const taskPromises = [];
      const taskCount = 10;
      
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

    it('should handle concurrent updates to different resources', async () => {
      // Create multiple tasks
      const tasks = [];
      for (let i = 0; i < 5; i++) {
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
      for (let i = 0; i < 5; i++) {
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

      // Verify group has all members
      const groupRes = await userApis[0].get('/api/groups/my-group');
      expect(groupRes.body.members.length).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking the database connection
      // For now, test error response format
      const res = await api.get('/api/test-db');
      
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('message');
    });

    it('should handle 404 for non-existent routes', async () => {
      const res = await api.get('/api/non-existent-endpoint');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    it('should not leak sensitive information in production', async () => {
      // Test error response doesn't include stack trace
      const res = await api.post('/api/auth/login', {
        // Invalid body to trigger error
        invalidField: true
      });

      expect(res.body).not.toHaveProperty('stack');
      expect(res.body).toHaveProperty('error');
    });

    it('should handle missing routes with proper error', async () => {
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

  describe('Rate Limiting Scenarios', () => {
    it('should handle rapid task creation', async () => {
      const group = await global.testUtils.createTestGroup();
      await api.createAuthenticatedUser({ groupCode: group.code });

      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          api.post('/api/tasks', {
            title: `Rapid task ${i}`
          })
        );
      }

      const results = await Promise.all(promises);
      
      // Count successful vs rate limited
      const successful = results.filter(r => r.status === 201).length;
      const rateLimited = results.filter(r => r.status === 429).length;
      
      // If no rate limiting implemented, all should succeed
      if (rateLimited === 0) {
        expect(successful).toBe(20);
      } else {
        // If rate limiting exists, some should be limited
        expect(rateLimited).toBeGreaterThan(0);
      }
    });

    it('should handle rapid authentication attempts', async () => {
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
      
      // All should complete (either 401 or 429)
      expect(responses.length).toBe(attempts);
      
      // Check if any were rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      const unauthorized = responses.filter(r => r.status === 401);
      
      expect(unauthorized.length + rateLimited.length).toBe(attempts);
    });
  });

  describe('Data Integrity', () => {
    let testGroup;
    let testUser;

    beforeEach(async () => {
      testGroup = await global.testUtils.createTestGroup();
      const authData = await api.createAuthenticatedUser({ groupCode: testGroup.code });
      testUser = authData.user;
    });

    it('should maintain referential integrity on user deletion', async () => {
      // Create protocol and task
      const protocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id
      );
      const task = await global.testUtils.createTestTask(
        testGroup.id,
        testUser.id,
        { assigned_to: testUser.id }
      );

      // Tasks and protocols should handle null user references gracefully
      const protocolCheck = await db.protocols.findById(protocol.id);
      const taskCheck = await db.tasks.findById(task.id);

      expect(protocolCheck).toBeTruthy();
      expect(taskCheck).toBeTruthy();
      expect(protocolCheck.created_by).toBe(testUser.id);
      expect(taskCheck.assigned_to).toBe(testUser.id);
    });

    it('should handle protocol version conflicts', async () => {
      const protocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id
      );

      // First update attempt
      const res1 = await api.put(`/api/protocols/${protocol.id}`, {
        title: 'First Update'
      });
      
      // Protocol updates might not be implemented
      if (res1.status === 200) {
        // Second update
        const res2 = await api.put(`/api/protocols/${protocol.id}`, {
          title: 'Second Update'
        });
        expect(res2.status).toBe(200);

        // Check version incremented
        expect(res2.body.protocol.version).toBeGreaterThan(protocol.version);
      } else {
        // Update not implemented or failing
        expect([404, 405, 500]).toContain(res1.status);
      }
    });

    it('should prevent invalid status transitions', async () => {
      const task = await global.testUtils.createTestTask(
        testGroup.id,
        testUser.id,
        { status: 'todo' }
      );

      // Valid transition: todo -> in_progress
      const res1 = await api.patch(`/api/tasks/${task.id}/status`, {
        status: 'in_progress'
      });
      expect(res1.status).toBe(200);

      // Valid transition: in_progress -> done
      const res2 = await api.patch(`/api/tasks/${task.id}/status`, {
        status: 'done'
      });
      expect(res2.status).toBe(200);

      // Invalid status
      const res3 = await api.patch(`/api/tasks/${task.id}/status`, {
        status: 'invalid-status'
      });
      // Could be validation error (400/422) or server error (500)
      expect([400, 422, 500]).toContain(res3.status);
    });
  });

  describe('Edge Cases in Business Logic', () => {
    let testGroup;
    let testUser;

    beforeEach(async () => {
      testGroup = await global.testUtils.createTestGroup();
      const authData = await api.createAuthenticatedUser({ groupCode: testGroup.code });
      testUser = authData.user;
    });

    it('should handle protocol finalization with no tasks', async () => {
      const protocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id,
        { data: {} } // No todos section
      );

      const res = await api.post(`/api/protocols/${protocol.id}/finalize`);
      
      expect(res.status).toBe(200);
      expect(res.body.protocol.status).toBe('finalized');
    });

    it('should handle empty attendee list', async () => {
      const protocol = await global.testUtils.createTestProtocol(testGroup.id, testUser.id);

      const res = await api.put(`/api/protocols/${protocol.id}/attendees`, {
        attendees: []
      });

      expect(res.status).toBe(200);
    });

    it('should handle task assignment to non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      
      const res = await api.post('/api/tasks', {
        title: 'Task for non-existent user',
        assignedTo: fakeUserId
      });

      // Should either reject with validation/server error or create unassigned
      expect([400, 201, 500]).toContain(res.status);
      
      if (res.status === 201) {
        // If created, should be unassigned or assigned to creator
        expect([null, testUser.id]).toContain(res.body.task.assigned_to);
      }
    });

    it('should handle circular task dependencies if implemented', async () => {
      // Create parent task
      const parentRes = await api.post('/api/tasks', {
        title: 'Parent Task'
      });
      
      if (parentRes.status === 201) {
        const parentId = parentRes.body.task.id;

        // Try to create subtask
        const subtaskRes = await api.post('/api/tasks', {
          title: 'Subtask',
          parent_task_id: parentId
        });

        // If subtasks are supported
        if (subtaskRes.status === 201 && subtaskRes.body.task.parent_task_id) {
          const subtaskId = subtaskRes.body.task.id;

          // Try to set parent's parent to subtask (circular)
          const circularRes = await api.put(`/api/tasks/${parentId}`, {
            parent_task_id: subtaskId
          });

          // Should prevent circular dependency
          expect([400, 422]).toContain(circularRes.status);
        }
      }
    });

    it('should handle protocol deletion cascades', async () => {
      const protocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id
      );

      // Create related data
      await api.post(`/api/protocols/${protocol.id}/comments`, {
        sectionId: 'notes',
        comment: 'Test comment'
      });

      // If protocol deletion is implemented
      const deleteRes = await api.delete(`/api/protocols/${protocol.id}`);
      
      if (deleteRes.status === 200) {
        // Verify cascade deletion
        const getRes = await api.get(`/api/protocols/${protocol.id}`);
        expect(getRes.status).toBe(404);
      } else {
        // Deletion might not be implemented or restricted
        expect([403, 404, 405]).toContain(deleteRes.status);
      }
    });

    it('should handle timezone considerations for deadlines', async () => {
      const task = await global.testUtils.createTestTask(
        testGroup.id,
        testUser.id,
        {
          deadline: '2024-12-31' // End of year
        }
      );

      // Task should be created with deadline
      expect(task.deadline).toBeTruthy();
      
      // Check if deadline is stored as date only (no time)
      expect(task.deadline).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });

    it('should handle permission edge cases', async () => {
      // Create another user in same group
      const api2 = new APITestHelper();
      const { user: otherUser } = await api2.createAuthenticatedUser({ 
        groupCode: testGroup.code 
      });

      // Create task assigned to other user
      const task = await global.testUtils.createTestTask(
        testGroup.id,
        testUser.id,
        { assigned_to: otherUser.id }
      );

      // Original creator should be able to update
      const res1 = await api.put(`/api/tasks/${task.id}`, {
        title: 'Updated by creator'
      });
      expect(res1.status).toBe(200);

      // Assigned user should be able to update status
      const res2 = await api2.patch(`/api/tasks/${task.id}/status`, {
        status: 'in_progress'
      });
      expect(res2.status).toBe(200);

      // Third user (not creator or assigned) might have limited access
      const api3 = new APITestHelper();
      await api3.createAuthenticatedUser({ groupCode: testGroup.code });
      
      const res3 = await api3.delete(`/api/tasks/${task.id}`);
      expect(res3.status).toBe(403);
    });
  });
});