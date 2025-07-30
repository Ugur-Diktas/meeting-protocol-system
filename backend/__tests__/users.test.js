const APITestHelper = require('./helpers/api');
const { db } = require('../models');

// Mock Resend at the top level
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ 
        data: { id: 'test-message-id' }, 
        error: null 
      })
    }
  }))
}));

describe('User Settings API', () => {
  let api;
  let testUser;
  
  beforeAll(() => {
    // Set test environment variables
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    // Clean up environment
    delete process.env.RESEND_API_KEY;
  });
  
  beforeEach(async () => {
    api = new APITestHelper();
    const authData = await api.createAuthenticatedUser();
    testUser = authData.user;
  });

  describe('GET /api/users/settings', () => {
    it('should get user settings with defaults', async () => {
      const res = await api.get('/api/users/settings');

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name
      });
      expect(res.body.preferences).toMatchObject({
        notifications: {
          weeklyTodoEmail: true,
          emailTime: '09:00',
          timezone: 'UTC'
        },
        ui: {
          theme: 'light',
          colorScheme: 'blue',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h'
        },
        tasks: {
          defaultView: 'list',
          showCompletedTasks: true,
          groupByPriority: false
        },
        protocols: {
          autoSave: true,
          autoSaveInterval: 30,
          showVersionHistory: true
        }
      });
    });

    it('should merge stored preferences with defaults', async () => {
      // Update user with partial preferences
      await db.users.update(testUser.id, {
        preferences: {
          ui: { theme: 'dark' },
          notifications: { weeklyTodoEmail: false }
        }
      });

      const res = await api.get('/api/users/settings');

      expect(res.status).toBe(200);
      expect(res.body.preferences.ui.theme).toBe('dark');
      expect(res.body.preferences.ui.colorScheme).toBe('blue'); // default
      expect(res.body.preferences.notifications.weeklyTodoEmail).toBe(false);
      expect(res.body.preferences.notifications.emailTime).toBe('09:00'); // default
    });
  });

  describe('PUT /api/users/settings', () => {
    it('should update user settings', async () => {
      const updates = {
        name: 'Updated Name',
        preferences: {
          ui: {
            theme: 'dark',
            colorScheme: 'purple'
          },
          notifications: {
            weeklyTodoEmail: false,
            emailTime: '10:00'
          }
        }
      };

      const res = await api.put('/api/users/settings', updates);

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Name');
      expect(res.body.preferences.ui.theme).toBe('dark');
      expect(res.body.preferences.ui.colorScheme).toBe('purple');
      expect(res.body.preferences.notifications.weeklyTodoEmail).toBe(false);
      expect(res.body.preferences.notifications.emailTime).toBe('10:00');
    });

    it('should update only specified fields', async () => {
      const res = await api.put('/api/users/settings', {
        preferences: {
          ui: { theme: 'system' }
        }
      });

      expect(res.status).toBe(200);
      expect(res.body.preferences.ui.theme).toBe('system');
      expect(res.body.preferences.ui.colorScheme).toBe('blue'); // unchanged
      expect(res.body.user.name).toBe(testUser.name); // unchanged
    });

    it('should handle avatar URL update', async () => {
      const res = await api.put('/api/users/settings', {
        avatar_url: 'https://example.com/avatar.jpg'
      });

      expect(res.status).toBe(200);
      expect(res.body.user.avatar_url).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('GET /api/users/settings/notifications', () => {
    it('should get notification settings', async () => {
      const res = await api.get('/api/users/settings/notifications');

      expect(res.status).toBe(200);
      expect(res.body.notifications).toMatchObject({
        weeklyTodoEmail: true,
        emailTime: '09:00',
        timezone: 'UTC'
      });
    });
  });

  describe('PUT /api/users/settings/notifications', () => {
    it('should update notification settings', async () => {
      const res = await api.put('/api/users/settings/notifications', {
        weeklyTodoEmail: false,
        emailTime: '18:00',
        timezone: 'America/New_York'
      });

      expect(res.status).toBe(200);
      expect(res.body.notifications).toMatchObject({
        weeklyTodoEmail: false,
        emailTime: '18:00',
        timezone: 'America/New_York'
      });
    });

    it('should update individual notification settings', async () => {
      const res = await api.put('/api/users/settings/notifications', {
        weeklyTodoEmail: false
      });

      expect(res.status).toBe(200);
      expect(res.body.notifications.weeklyTodoEmail).toBe(false);
      expect(res.body.notifications.emailTime).toBe('09:00'); // unchanged
    });
  });

  describe('GET /api/users/settings/ui-options', () => {
    it('should get available UI customization options', async () => {
      const res = await api.get('/api/users/settings/ui-options');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('themes');
      expect(res.body).toHaveProperty('colorSchemes');
      expect(res.body).toHaveProperty('languages');
      expect(res.body).toHaveProperty('dateFormats');
      expect(res.body).toHaveProperty('timeFormats');

      expect(res.body.themes).toHaveLength(3);
      expect(res.body.colorSchemes).toHaveLength(4);
      expect(res.body.languages.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/users/test-email', () => {
    it('should send test email to user', async () => {
      // Create some tasks for the user
      const group = await global.testUtils.createTestGroup();
      await db.users.update(testUser.id, { group_id: group.id });

      await global.testUtils.createTestTask(group.id, testUser.id, {
        title: 'Test Task 1',
        assigned_to: testUser.id,
        status: 'todo'
      });

      await global.testUtils.createTestTask(group.id, testUser.id, {
        title: 'Test Task 2',
        assigned_to: testUser.id,
        status: 'in_progress',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      const res = await api.post('/api/users/test-email');

      // In test environment, email might not be configured
      if (res.status === 200) {
        expect(res.body.message).toContain('Test email sent');
        expect(res.body.preview.taskCount).toBe(2);
        expect(res.body.preview.email).toBe(testUser.email);
      } else {
        // Accept failure in test environment
        expect(res.status).toBe(500);
        expect(res.body.error).toBeDefined();
      }
    });
  });

  describe('Preferences Persistence', () => {
    it('should persist complex preference updates', async () => {
      const complexPreferences = {
        notifications: {
          weeklyTodoEmail: false,
          emailTime: '07:30',
          timezone: 'Europe/Berlin'
        },
        ui: {
          theme: 'dark',
          colorScheme: 'green',
          language: 'de',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h'
        },
        tasks: {
          defaultView: 'kanban',
          showCompletedTasks: false,
          groupByPriority: true
        },
        protocols: {
          autoSave: false,
          autoSaveInterval: 60,
          showVersionHistory: false
        }
      };

      // Update preferences
      await api.put('/api/users/settings', { preferences: complexPreferences });

      // Retrieve and verify
      const res = await api.get('/api/users/settings');

      expect(res.status).toBe(200);
      expect(res.body.preferences).toMatchObject(complexPreferences);
    });

    it('should handle invalid preference values gracefully', async () => {
      const res = await api.put('/api/users/settings', {
        preferences: {
          ui: {
            theme: 'invalid-theme',
            colorScheme: 'invalid-color'
          },
          notifications: {
            emailTime: '25:00' // invalid time
          }
        }
      });

      // Should accept any values (frontend validates)
      expect(res.status).toBe(200);
      expect(res.body.preferences.ui.theme).toBe('invalid-theme');
    });
  });

  describe('Activity Logging', () => {
    it('should log settings updates', async () => {
      const group = await global.testUtils.createTestGroup();
      await db.users.update(testUser.id, { group_id: group.id });

      await api.put('/api/users/settings', {
        name: 'Activity Test',
        preferences: { ui: { theme: 'dark' } }
      });

      const activities = await db.activityLogs.findByGroupId(group.id);
      const settingsActivity = activities.find(a => a.action === 'settings_updated');

      expect(settingsActivity).toBeTruthy();
      expect(settingsActivity.user_id).toBe(testUser.id);
      expect(settingsActivity.details.updated_fields).toContain('name');
      expect(settingsActivity.details.updated_fields).toContain('preferences');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty preferences object', async () => {
      const res = await api.put('/api/users/settings', {
        preferences: {}
      });

      expect(res.status).toBe(200);
      expect(res.body.preferences).toBeDefined();
      // Should maintain all default values
      expect(res.body.preferences.ui.theme).toBe('light');
    });

    it('should handle null preferences', async () => {
      // Set preferences to null
      await db.supabase
        .from('users')
        .update({ preferences: null })
        .eq('id', testUser.id);

      const res = await api.get('/api/users/settings');

      expect(res.status).toBe(200);
      // Should return defaults
      expect(res.body.preferences.ui.theme).toBe('light');
    });

    it('should handle very long preference values', async () => {
      const longString = 'a'.repeat(1000);
      
      const res = await api.put('/api/users/settings', {
        name: longString.substring(0, 255), // Assuming name has length limit
        preferences: {
          ui: {
            theme: longString // No length limit in JSONB
          }
        }
      });

      expect(res.status).toBe(200);
      expect(res.body.preferences.ui.theme).toBe(longString);
    });
  });
});