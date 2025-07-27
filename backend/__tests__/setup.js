// Load test environment first
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const { supabase } = require('../models');
const logger = require('./helpers/logger');
const TestAuthHelper = require('./helpers/testAuth');

// Log environment info
logger.info('Test environment loaded', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set'
});

// Set test timeout
jest.setTimeout(30000);

// Track test data for better cleanup
const testDataTracker = {
  users: new Set(),
  groups: new Set(),
  protocols: new Set(),
  tasks: new Set(),
  templates: new Set(),
  
  track(type, id) {
    if (this[type] && id) {
      this[type].add(id);
    }
  },
  
  clear() {
    Object.keys(this).forEach(key => {
      if (this[key] instanceof Set) {
        this[key].clear();
      }
    });
  },
  
  getTrackedIds(type) {
    return this[type] ? Array.from(this[type]) : [];
  }
};

// Global test utilities
global.testUtils = {
  // Generate random email with valid domain
  randomEmail: () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test_${timestamp}_${random}@testmail.app`;
  },
  
  // Generate random string
  randomString: (length = 10) => Math.random().toString(36).substring(2, 2 + length),
  
  // Clean up test data
  cleanupTestData: async () => {
    try {
      logger.info('Starting test data cleanup');
      
      // Clean up tracked data first (in reverse order of dependencies)
      const trackedTasks = testDataTracker.getTrackedIds('tasks');
      if (trackedTasks.length > 0) {
        await supabase.from('tasks').delete().in('id', trackedTasks);
      }
      
      const trackedProtocols = testDataTracker.getTrackedIds('protocols');
      if (trackedProtocols.length > 0) {
        await supabase.from('protocols').delete().in('id', trackedProtocols);
      }
      
      const trackedTemplates = testDataTracker.getTrackedIds('templates');
      if (trackedTemplates.length > 0) {
        await supabase.from('protocol_templates')
          .delete()
          .in('id', trackedTemplates)
          .eq('is_default', false);
      }
      
      // Clean up in correct order due to foreign key constraints
      await supabase.from('activity_logs').delete().or('user_id.like.%test_%,details.cs.{"test"}');
      await supabase.from('task_comments').delete().or('comment.like.%test_%,comment.like.%Test%');
      await supabase.from('protocol_comments').delete().or('comment.like.%test_%,comment.like.%Test%');
      await supabase.from('files').delete().or('file_name.like.%test_%,file_name.like.%Test%');
      await supabase.from('tasks').delete().or('title.like.%Test%,description.like.%test%');
      await supabase.from('protocol_attendees').delete().or('notes.like.%test_%,notes.like.%Test%');
      await supabase.from('protocol_versions').delete().or('change_summary.like.%test_%,change_summary.like.%Test%');
      await supabase.from('protocols').delete().or('title.like.%Test%,data.cs.{"test"}');
      await supabase.from('protocol_templates').delete().or('name.like.%Test%,description.like.%test%').eq('is_default', false);
      
      // Use TestAuthHelper for user cleanup
      await TestAuthHelper.cleanupTestUsers();
      
      await supabase.from('groups').delete().or('name.like.%Test%,code.like.TEST%');
      
      testDataTracker.clear();
      logger.info('Test data cleanup completed');
    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  },

  // Create test user using new helper with tracking
  createTestUser: async (overrides = {}) => {
    const user = await TestAuthHelper.createTestUser(overrides);
    testDataTracker.track('users', user.id);
    return user;
  },

  // Create test group with tracking
  createTestGroup: async (overrides = {}) => {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: overrides.name || `Test Group ${Date.now()}`,
        description: overrides.description || 'Test group description',
        code: overrides.code || global.testUtils.randomString(6).toUpperCase()
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Failed to create test group:', error);
      throw error;
    }
    
    testDataTracker.track('groups', data.id);
    return data;
  },

  // Create test protocol with tracking
  createTestProtocol: async (groupId, userId, overrides = {}) => {
    const { data, error } = await supabase
      .from('protocols')
      .insert({
        group_id: groupId,
        created_by: userId,
        meeting_date: overrides.meeting_date || new Date().toISOString().split('T')[0],
        title: overrides.title || 'Test Protocol',
        status: overrides.status || 'draft',
        data: overrides.data || {},
        version: 1
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Failed to create test protocol:', error);
      throw error;
    }
    
    testDataTracker.track('protocols', data.id);
    return data;
  },

  // Create test task with tracking
  createTestTask: async (groupId, userId, overrides = {}) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        group_id: groupId,
        created_by: userId,
        title: overrides.title || 'Test Task',
        description: overrides.description || 'Test task description',
        assigned_to: overrides.assigned_to || userId,
        status: overrides.status || 'todo',
        priority: overrides.priority || 'medium',
        deadline: overrides.deadline
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Failed to create test task:', error);
      throw error;
    }
    
    testDataTracker.track('tasks', data.id);
    return data;
  },
  
  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Get the tracker for advanced usage
  tracker: testDataTracker
};

// Clean up before all tests
beforeAll(async () => {
  logger.info('Running pre-test cleanup');
  await global.testUtils.cleanupTestData();
});

// Clean up after all tests
afterAll(async () => {
  logger.info('Running post-test cleanup');
  await global.testUtils.cleanupTestData();
  
  // Close the logger
  if (logger.close) {
    logger.close();
  }
});