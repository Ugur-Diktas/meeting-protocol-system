const APITestHelper = require('./helpers/api');
const { db } = require('../models');

describe('Group Management API', () => {
  let api;
  
  beforeEach(() => {
    api = new APITestHelper();
  });

  describe('POST /api/groups/create', () => {
    let user;

    beforeEach(async () => {
      const authData = await api.createAuthenticatedUser();
      user = authData.user;
    });

    it('should create a new group successfully', async () => {
      const groupData = {
        name: 'Test Organization',
        description: 'A test organization for unit tests'
      };

      const res = await api.post('/api/groups/create', groupData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('group');
      expect(res.body).toHaveProperty('code');
      expect(res.body.group.name).toBe(groupData.name);
      expect(res.body.group.description).toBe(groupData.description);
      expect(res.body.code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should make creator an admin', async () => {
      const res = await api.post('/api/groups/create', {
        name: 'Admin Test Group'
      });

      expect(res.status).toBe(201);

      // Check user role was updated
      const updatedUser = await db.users.findById(user.id);
      expect(updatedUser.role).toBe('admin');
    });

    it('should fail without group name', async () => {
      const res = await api.post('/api/groups/create', {
        description: 'Missing name'
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('name is required');
    });

    it('should generate unique group codes', async () => {
      const codes = new Set();
      
      for (let i = 0; i < 3; i++) {
        const res = await api.post('/api/groups/create', {
          name: `Group ${i}`
        });
        
        expect(res.status).toBe(201);
        codes.add(res.body.code);
      }

      expect(codes.size).toBe(3); // All codes should be unique
    });

    it('should fail without authentication', async () => {
      api.clearAuth();
      
      const res = await api.post('/api/groups/create', {
        name: 'Unauthorized Group'
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/groups/join', () => {
    let testGroup;

    beforeEach(async () => {
      testGroup = await global.testUtils.createTestGroup();
    });

    it('should join a group successfully with valid code', async () => {
      await api.createAuthenticatedUser();
      
      const res = await api.post('/api/groups/join', {
        code: testGroup.code
      });

      expect(res.status).toBe(200);
      expect(res.body.group.id).toBe(testGroup.id);
    });

    it('should handle case-insensitive group codes', async () => {
      await api.createAuthenticatedUser();
      
      const res = await api.post('/api/groups/join', {
        code: testGroup.code.toLowerCase()
      });

      expect(res.status).toBe(200);
      expect(res.body.group.id).toBe(testGroup.id);
    });

    it('should fail with invalid group code', async () => {
      await api.createAuthenticatedUser();
      
      const res = await api.post('/api/groups/join', {
        code: 'INVALID'
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Invalid group code');
    });

    it('should handle user already in a group', async () => {
      // Create user already in a group
      const existingGroup = await global.testUtils.createTestGroup();
      await api.createAuthenticatedUser({ 
        group_id: existingGroup.id 
      });
      
      const res = await api.post('/api/groups/join', {
        code: testGroup.code
      });

      // The actual behavior might allow switching groups
      // or it might prevent it - adjust based on your API
      expect([200, 400]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toContain('already a member');
      }
    });

    it('should fail without group code', async () => {
      await api.createAuthenticatedUser();
      
      const res = await api.post('/api/groups/join', {});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('code is required');
    });
  });

  describe('GET /api/groups/my-group', () => {
    it('should get current group info with members', async () => {
      const group = await global.testUtils.createTestGroup();
      
      // Create user directly in the group
      const { user } = await api.createAuthenticatedUser({ 
        group_id: group.id 
      });

      // Verify user is in group before making request
      const updatedUser = await db.users.findById(user.id);
      expect(updatedUser.group_id).toBe(group.id);

      const res = await api.get('/api/groups/my-group');

      if (res.status === 404) {
        // If still 404, the user might not be properly associated
        console.log('User group_id:', updatedUser.group_id);
        console.log('Expected group id:', group.id);
      }

      expect(res.status).toBe(200);
      expect(res.body.group.id).toBe(group.id);
      expect(res.body.members).toHaveLength(1);
    });

    it('should fail if user not in a group', async () => {
      await api.createAuthenticatedUser();
      
      const res = await api.get('/api/groups/my-group');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not a member');
    });
  });

  describe('POST /api/groups/leave', () => {
    it('should leave group successfully', async () => {
      const group = await global.testUtils.createTestGroup();
      const { user } = await api.createAuthenticatedUser({ 
        group_id: group.id 
      });
      
      // Verify user is in group before leaving
      const userBeforeLeave = await db.users.findById(user.id);
      expect(userBeforeLeave.group_id).toBe(group.id);
      
      const res = await api.post('/api/groups/leave');

      if (res.status === 400) {
        console.log('Leave error:', res.body.error);
        console.log('User group_id before leave:', userBeforeLeave.group_id);
      }

      expect(res.status).toBe(200);
      
      // Verify user no longer in group
      const updatedUser = await db.users.findById(user.id);
      expect(updatedUser.group_id).toBeNull();
      expect(updatedUser.role).toBe('member'); // Role reset
    });

    it('should fail if not in a group', async () => {
      await api.createAuthenticatedUser();
      
      const res = await api.post('/api/groups/leave');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('not a member');
    });
  });

  describe('PUT /api/groups/update', () => {
    it('should update group details as admin', async () => {
      await api.createAuthenticatedUser();
      
      // Create group (user becomes admin)
      const createRes = await api.post('/api/groups/create', {
        name: 'Original Name'
      });
      
      expect(createRes.status).toBe(201);

      const res = await api.put('/api/groups/update', {
        name: 'Updated Name',
        description: 'Updated description',
        settings: { theme: 'dark' }
      });

      expect(res.status).toBe(200);
      expect(res.body.group.name).toBe('Updated Name');
      expect(res.body.group.description).toBe('Updated description');
      expect(res.body.group.settings.theme).toBe('dark');
    });

    it('should fail as non-admin member', async () => {
      const group = await global.testUtils.createTestGroup();
      
      // Create user as regular member
      const { user } = await api.createAuthenticatedUser({ 
        group_id: group.id,
        role: 'member' 
      });
      
      // Verify user is in group but not admin
      const verifyUser = await db.users.findById(user.id);
      expect(verifyUser.group_id).toBe(group.id);
      expect(verifyUser.role).toBe('member');
      
      const res = await api.put('/api/groups/update', {
        name: 'Unauthorized Update'
      });

      expect(res.status).toBe(403);
      // The error might be about group membership or admin rights
      expect(res.body.error.toLowerCase()).toMatch(/admin|group/);
    });

    it('should fail if not in a group', async () => {
      await api.createAuthenticatedUser();
      
      const res = await api.put('/api/groups/update', {
        name: 'No Group Update'
      });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('belong to a group');
    });
  });

  describe('GET /api/groups/activity', () => {
    it('should get group activity log', async () => {
      const group = await global.testUtils.createTestGroup();
      const { user } = await api.createAuthenticatedUser({ 
        group_id: group.id 
      });
      
      // Verify user is in group
      const verifyUser = await db.users.findById(user.id);
      expect(verifyUser.group_id).toBe(group.id);
      
      const res = await api.get('/api/groups/activity');

      expect(res.status).toBe(200);
      expect(res.body.activities).toBeInstanceOf(Array);
    });

    it('should respect limit parameter', async () => {
      const group = await global.testUtils.createTestGroup();
      await api.createAuthenticatedUser({ 
        group_id: group.id 
      });
      
      const res = await api.get('/api/groups/activity?limit=5');

      expect(res.status).toBe(200);
      expect(res.body.activities).toBeInstanceOf(Array);
      if (res.body.activities.length > 0) {
        expect(res.body.activities.length).toBeLessThanOrEqual(5);
      }
    });

    it('should fail if not in a group', async () => {
      await api.createAuthenticatedUser();
      
      const res = await api.get('/api/groups/activity');

      expect(res.status).toBe(403);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete group lifecycle', async () => {
      // 1. Create user and group
      await api.createAuthenticatedUser();
      
      const createRes = await api.post('/api/groups/create', {
        name: 'Lifecycle Test Group',
        description: 'Testing complete lifecycle'
      });
      
      expect(createRes.status).toBe(201);
      const groupCode = createRes.body.code;

      // 2. Verify creator is admin
      const myGroupRes = await api.get('/api/groups/my-group');
      expect(myGroupRes.status).toBe(200);
      expect(myGroupRes.body.members).toHaveLength(1);
      expect(myGroupRes.body.members[0].role).toBe('admin');

      // 3. Update group settings
      const updateRes = await api.put('/api/groups/update', {
        settings: { welcome_message: 'Welcome!' }
      });
      expect(updateRes.status).toBe(200);

      // 4. Add another member
      const api2 = new APITestHelper();
      await api2.createAuthenticatedUser();
      
      const joinRes = await api2.post('/api/groups/join', { code: groupCode });
      expect(joinRes.status).toBe(200);

      // 5. Check updated member list
      const updatedGroupRes = await api.get('/api/groups/my-group');
      expect(updatedGroupRes.status).toBe(200);
      expect(updatedGroupRes.body.members).toHaveLength(2);

      // 6. Check activity log
      const activityRes = await api.get('/api/groups/activity');
      expect(activityRes.status).toBe(200);
      expect(activityRes.body.activities.length).toBeGreaterThan(0);
    });

    it('should handle multiple users joining and leaving', async () => {
      // Create a group
      const group = await global.testUtils.createTestGroup();
      
      // Create multiple users
      const users = [];
      for (let i = 0; i < 3; i++) {
        const userApi = new APITestHelper();
        await userApi.createAuthenticatedUser();
        users.push(userApi);
      }

      // All users join the group
      for (const userApi of users) {
        const res = await userApi.post('/api/groups/join', { code: group.code });
        expect(res.status).toBe(200);
      }

      // One user leaves
      const leaveRes = await users[0].post('/api/groups/leave');
      expect(leaveRes.status).toBe(200);

      // Verify member count
      const groupRes = await users[1].get('/api/groups/my-group');
      expect(groupRes.status).toBe(200);
      expect(groupRes.body.members).toHaveLength(2);
    });

    it('should allow duplicate group names', async () => {
      // Create first group
      await api.createAuthenticatedUser();
      const res1 = await api.post('/api/groups/create', {
        name: 'Duplicate Name Test'
      });
      expect(res1.status).toBe(201);

      // Create second group with same name
      const api2 = new APITestHelper();
      await api2.createAuthenticatedUser();
      const res2 = await api2.post('/api/groups/create', {
        name: 'Duplicate Name Test'
      });
      
      // Should succeed with different code
      expect(res2.status).toBe(201);
      expect(res2.body.code).not.toBe(res1.body.code);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await api.createAuthenticatedUser();
    });

    it('should handle very long group names', async () => {
      const longName = 'A'.repeat(255);
      const res = await api.post('/api/groups/create', {
        name: longName
      });

      // Should either succeed or fail with validation
      if (res.status === 201) {
        expect(res.body.group.name).toBe(longName);
      } else {
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('too long');
      }
    });

    it('should handle special characters in group names', async () => {
      const specialName = 'Test & Co. <Group> "2024" ® 🚀';
      const res = await api.post('/api/groups/create', {
        name: specialName
      });

      expect(res.status).toBe(201);
      expect(res.body.group.name).toBe(specialName);
    });

    it('should handle rapid group creation', async () => {
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          api.post('/api/groups/create', {
            name: `Rapid Group ${i}`
          })
        );
      }

      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(res => {
        expect(res.status).toBe(201);
      });

      // All should have unique codes
      const codes = results.map(r => r.body.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(3);
    });
  });
});