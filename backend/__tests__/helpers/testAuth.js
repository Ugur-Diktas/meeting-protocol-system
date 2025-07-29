// __tests__/helpers/testAuth.js - Test Auth Helper
const crypto = require('crypto');
const { supabase } = require('../../models');

// Generate UUID v4 without external dependency
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class TestAuthHelper {
  // Create user directly in database for testing (bypass Supabase Auth)
  static async createTestUserDirect(userData = {}) {
    const userId = userData.id || generateUUID();
    const email = userData.email || `test_${Date.now()}_${Math.random().toString(36).substring(7)}@test.local`;
    
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        return existingUser;
      }
      
      // Insert directly into users table
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          name: userData.name || 'Test User',
          group_id: userData.group_id || null,
          role: userData.role || 'member',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating test user directly:', error);
        throw error;
      }
      
      return user;
      
    } catch (error) {
      console.error('Failed to create test user directly:', error);
      throw error;
    }
  }

  // Enhanced user creation with multiple fallback strategies
  static async createTestUser(userData = {}) {
    const email = userData.email || `test_${Date.now()}_${Math.random().toString(36).substring(7)}@testmail.app`;
    const password = userData.password || 'TestPass123!';
    
    // Strategy 1: Try Supabase Auth with valid test email domain
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name: userData.name || 'Test User',
            skip_confirmation: true
          },
          emailRedirectTo: null // Don't send redirect emails in tests
        }
      });

      if (!authError && authData.user) {
        // Create user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email,
            name: userData.name || 'Test User',
            group_id: userData.group_id || null,
            role: userData.role || 'member'
          })
          .select()
          .single();
        
        if (!profileError && profile) {
          return profile;
        }
        
        // If profile creation failed, try to get existing profile
        const { data: existingProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (existingProfile) {
          return existingProfile;
        }
      }
    } catch (authError) {
      // Auth strategy failed, continue to next strategy
    }

    // Strategy 2: Direct database insert with valid UUID
    try {
      const directUser = await this.createTestUserDirect({
        ...userData,
        email
      });
      
      if (directUser) {
        return directUser;
      }
    } catch (directError) {
      // Direct insert failed, continue
    }

    // Strategy 3: Use existing user if email already exists
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        return existingUser;
      }
    } catch (error) {
      // User doesn't exist, continue to final strategy
    }

    // Final strategy: Force create with new email
    const fallbackEmail = `fallback_${Date.now()}_${generateUUID().substring(0, 8)}@test.local`;
    const fallbackUser = await this.createTestUserDirect({
      ...userData,
      email: fallbackEmail
    });
    
    return fallbackUser;
  }

  // Batch user creation for performance
  static async createTestUsers(count, groupId = null) {
    const users = [];
    const errors = [];
    
    // Create users in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < count; i += batchSize) {
      const batch = [];
      
      for (let j = 0; j < batchSize && i + j < count; j++) {
        batch.push(
          this.createTestUser({
            name: `Test User ${i + j + 1}`,
            group_id: groupId
          }).catch(error => {
            errors.push({ index: i + j, error: error.message });
            return null;
          })
        );
      }
      
      const results = await Promise.all(batch);
      users.push(...results.filter(Boolean));
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < count) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return { users, errors };
  }

  // Enhanced cleanup with better error handling
  static async cleanupTestUsers() {
    const patterns = [
      'email.like.%test_%',
      'email.like.%@testmail.app%',
      'email.like.%@test.local%',
      'email.like.%fallback_%',
      'name.like.%Test User%'
    ];
    
    try {
      // Get all test users first
      const { data: testUsers } = await supabase
        .from('users')
        .select('id, email')
        .or(patterns.join(','));
      
      if (!testUsers || testUsers.length === 0) {
        return;
      }
      
      console.log(`Cleaning up ${testUsers.length} test users`);
      
      // Delete in batches to avoid timeout
      const batchSize = 50;
      for (let i = 0; i < testUsers.length; i += batchSize) {
        const batch = testUsers.slice(i, i + batchSize);
        const ids = batch.map(u => u.id);
        
        const { error } = await supabase
          .from('users')
          .delete()
          .in('id', ids);
        
        if (error) {
          console.error(`Error deleting user batch ${i / batchSize + 1}:`, error);
        }
      }
      
      // Try to clean up from Supabase Auth (if we have admin access)
      await this.cleanupAuthUsers(testUsers);
      
    } catch (error) {
      console.error('User cleanup error:', error);
      // Don't throw - cleanup should not fail tests
    }
  }
  
  // Clean up from Supabase Auth (requires admin API)
  static async cleanupAuthUsers(users) {
    try {
      // This requires SUPABASE_SERVICE_ROLE_KEY with proper permissions
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      
      if (!authUsers) return;
      
      const testAuthUsers = authUsers.filter(u => 
        users.some(testUser => testUser.email === u.email)
      );
      
      for (const authUser of testAuthUsers) {
        try {
          await supabase.auth.admin.deleteUser(authUser.id);
        } catch (error) {
          // Ignore individual deletion errors
        }
      }
      
    } catch (error) {
      // Admin API might not be available, this is not critical
    }
  }
  
  // Helper to create a test user with a specific role in a group
  static async createGroupMember(groupId, role = 'member', userData = {}) {
    return this.createTestUser({
      ...userData,
      group_id: groupId,
      role
    });
  }
  
  // Helper to create admin user
  static async createAdminUser(groupId, userData = {}) {
    return this.createGroupMember(groupId, 'admin', userData);
  }
}

module.exports = TestAuthHelper;