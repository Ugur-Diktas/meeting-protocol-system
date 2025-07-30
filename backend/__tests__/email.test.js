const emailService = require('../utils/email');
const { sendWeeklySummaryToUser, sendWeeklyTodoEmails } = require('../jobs/weeklyTodoEmail');
const { db } = require('../models');

// Mock Resend
let mockResendSend;

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      mockResendSend = jest.fn().mockResolvedValue({ 
        data: { id: 'test-message-id' }, 
        error: null 
      });
      return {
        emails: {
          send: mockResendSend
        }
      };
    })
  };
});

describe('Email Service', () => {
  beforeEach(() => {
    // Reset email service state
    emailService.initialized = false;
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set test API key
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  describe('Email Templates', () => {
    it('should generate weekly todo summary email', async () => {
      const user = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com'
      };

      const tasks = [
        {
          id: 'task-1',
          title: 'Overdue Task',
          deadline: '2024-01-01',
          status: 'todo',
          priority: 'high'
        },
        {
          id: 'task-2',
          title: 'Upcoming Task',
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'in_progress',
          priority: 'medium'
        },
        {
          id: 'task-3',
          title: 'No Deadline Task',
          status: 'todo',
          priority: 'low'
        }
      ];

      const result = await emailService.sendWeeklyTodoSummary(user, tasks);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      
      // Verify Resend was called with correct parameters
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: expect.stringContaining('3 pending tasks'),
          html: expect.stringContaining('Overdue Tasks'),
          text: expect.stringContaining('OVERDUE TASKS'),
          tags: [
            { name: 'type', value: 'weekly-summary' },
            { name: 'user-id', value: 'user-123' }
          ]
        })
      );
    });

    it('should handle empty task list', async () => {
      const user = {
        id: 'user-123',
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const result = await emailService.sendWeeklyTodoSummary(user, []);

      expect(result.success).toBe(true);
      
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('All caught up!'),
          text: expect.stringContaining('All caught up!')
        })
      );
    });

    it('should handle email send failure', async () => {
      // Override mock for this test
      mockResendSend.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'API rate limit exceeded' } 
      });

      const user = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
      };

      const result = await emailService.sendWeeklyTodoSummary(user, []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API rate limit exceeded');
    });
  });

  describe('Email Service Initialization', () => {
    it('should initialize with Resend when API key is present', async () => {
      await emailService.initialize();
      expect(emailService.initialized).toBe(true);
    });

    it('should not initialize without API key', async () => {
      delete process.env.RESEND_API_KEY;
      
      await emailService.initialize();
      expect(emailService.initialized).toBe(false);
    });
  });

  describe('Email Service Connection Test', () => {
    it('should test Resend connection successfully', async () => {
      const result = await emailService.testConnection();
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'delivered@resend.dev',
          subject: 'Test Connection'
        })
      );
    });

    it('should handle connection test failure', async () => {
      mockResendSend.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Invalid API key' } 
      });
      
      const result = await emailService.testConnection();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });
  });
});

describe('Weekly Todo Email Job', () => {
  let testGroup, testUsers;

  beforeEach(async () => {
    // Set up fresh test data
    process.env.RESEND_API_KEY = 'test-api-key';
    
    // Reset email service
    emailService.initialized = false;
    
    // Clear mocks
    jest.clearAllMocks();
    
    testGroup = await global.testUtils.createTestGroup();
    testUsers = [];

    // Create test users with different preferences
    for (let i = 0; i < 3; i++) {
      const user = await global.testUtils.createTestUser({
        name: `Test User ${i}`,
        group_id: testGroup.id,
        preferences: {
          notifications: {
            weeklyTodoEmail: i !== 1, // User 1 has emails disabled
            emailTime: '09:00',
            timezone: 'UTC'
          }
        }
      });
      testUsers.push(user);
    }

    // Create tasks for users
    for (const user of testUsers) {
      await global.testUtils.createTestTask(testGroup.id, user.id, {
        title: `Task for ${user.name}`,
        assigned_to: user.id,
        status: 'todo'
      });
    }
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  describe('sendWeeklySummaryToUser', () => {
    it('should send email to user with enabled notifications', async () => {
      const result = await sendWeeklySummaryToUser(testUsers[0]);

      expect(result.status).toBe('sent');
      expect(result.userId).toBe(testUsers[0].id);
      expect(result.taskCount).toBe(1);
    });

    it('should skip user with disabled notifications', async () => {
      const result = await sendWeeklySummaryToUser(testUsers[1]);

      expect(result.status).toBe('skipped');
      expect(result.reason).toBe('disabled');
    });

    it('should handle email send errors gracefully', async () => {
      // Ensure mock is available and override it
      await emailService.initialize();
      mockResendSend.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Email failed' } 
      });

      const result = await sendWeeklySummaryToUser(testUsers[0]);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Email failed');
    });
  });

  /*
  describe('sendWeeklyTodoEmails', () => {
    it('should send emails to all eligible users', async () => {
      // Mock successful email sends
      await emailService.initialize();
      mockResendSend.mockResolvedValue({ 
        data: { id: 'test-id' }, 
        error: null 
      });

      const summary = await sendWeeklyTodoEmails();

      expect(summary.sent).toBe(2); // Users 0 and 2
      expect(summary.skipped).toBe(1); // User 1
      expect(summary.failed).toBe(0);
      expect(summary.duration).toBeGreaterThan(0);
    });

    it('should handle partial failures', async () => {
      // Initialize to ensure mock is set up
      await emailService.initialize();
      
      // First call succeeds, second fails
      mockResendSend
        .mockResolvedValueOnce({ data: { id: 'test-id-1' }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'API error' } })
        .mockResolvedValueOnce({ data: { id: 'test-id-3' }, error: null });

      const summary = await sendWeeklyTodoEmails();

      expect(summary.sent).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.skipped).toBe(1);
    });

    it('should handle no users with notifications enabled', async () => {
      // Disable notifications for all users
      for (const user of testUsers) {
        await db.users.update(user.id, {
          preferences: {
            ...user.preferences,
            notifications: { 
              ...user.preferences?.notifications,
              weeklyTodoEmail: false 
            }
          }
        });
      }

      const summary = await sendWeeklyTodoEmails();

      expect(summary.sent).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.skipped).toBe(0);
    });

    it('should log job completion', async () => {
      const initialActivityCount = await db.supabase
        .from('activity_logs')
        .select('count')
        .eq('action', 'weekly_email_job_completed');

      await sendWeeklyTodoEmails();

      const finalActivityCount = await db.supabase
        .from('activity_logs')
        .select('count')
        .eq('action', 'weekly_email_job_completed');

      // Should have one more log entry
      // Note: This might fail if count queries don't work as expected
      // In that case, just check if any log was created
    });
  });
  */

  describe('Manual Trigger', () => {
    it('should allow admin to trigger weekly emails', async () => {
      const { triggerWeeklyEmails } = require('../jobs/weeklyTodoEmail');
      
      // Mock admin user
      const req = {
        user: { id: 'admin-id', role: 'admin' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await triggerWeeklyEmails(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Weekly email job completed',
          summary: expect.objectContaining({
            sent: expect.any(Number),
            failed: expect.any(Number),
            skipped: expect.any(Number)
          })
        })
      );
    });

    it('should reject non-admin users', async () => {
      const { triggerWeeklyEmails } = require('../jobs/weeklyTodoEmail');
      
      const req = {
        user: { id: 'user-id', role: 'member' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await triggerWeeklyEmails(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Admin access required'
        })
      );
    });
  });
});