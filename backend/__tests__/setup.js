// Simple test setup without complex logging
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const { supabase } = require('../models');
const TestAuthHelper = require('./helpers/testAuth');

// Simplified test utilities
global.testUtils = {
  // Generate random email
  randomEmail: () => `test_${Date.now()}_${Math.random().toString(36).substring(7)}@test.local`,
  
  // Generate random string
  randomString: (length = 10) => Math.random().toString(36).substring(2, 2 + length),
  
  // Create test user
  createTestUser: async (overrides = {}) => {
    return TestAuthHelper.createTestUser(overrides);
  },

  // Create test group
  createTestGroup: async (overrides = {}) => {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: overrides.name || `Test Group ${Date.now()}`,
        description: overrides.description || 'Test group',
        code: overrides.code || global.testUtils.randomString(6).toUpperCase()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create test protocol
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
    
    if (error) throw error;
    return data;
  },

  // Create test task
  createTestTask: async (groupId, userId, overrides = {}) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        group_id: groupId,
        created_by: userId,
        title: overrides.title || 'Test Task',
        description: overrides.description || 'Test description',
        assigned_to: overrides.assigned_to || userId,
        status: overrides.status || 'todo',
        priority: overrides.priority || 'medium',
        deadline: overrides.deadline
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Clean up test data before all tests
beforeAll(async () => {
  console.log('🧹 Cleaning up test data...');
  await TestAuthHelper.cleanupTestUsers();
});

// Clean up after all tests
afterAll(async () => {
  console.log('🧹 Final cleanup...');
  await TestAuthHelper.cleanupTestUsers();
});