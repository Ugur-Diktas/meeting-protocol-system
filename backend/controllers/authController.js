const { createClient } = require('@supabase/supabase-js');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, name, groupCode } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${process.env.FRONTEND_URL}/login`
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      
      // Handle specific Supabase errors
      if (authError.message?.includes('email') || authError.code === 'email_address_invalid') {
        return res.status(400).json({ 
          error: 'Please use a valid email address. Test emails like "hello@world.com" may not be accepted.' 
        });
      }
      
      return res.status(400).json({ 
        error: authError.message || 'Failed to create account' 
      });
    }

    // Get group if code provided
    let groupId = null;
    if (groupCode) {
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('code', groupCode)
        .single();
      
      if (group) {
        groupId = group.id;
      }
    }

    // Create user profile
    const { data: newUser, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        group_id: groupId,
        role: 'member'
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    // Generate JWT token
    const token = generateToken(newUser.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        group_id: newUser.group_id,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Failed to register user',
      details: error.message 
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        error: 'User profile not found' 
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        group_id: user.group_id,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login',
      details: error.message 
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    // User is already attached by auth middleware
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user information' 
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ 
        name,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        group_id: updatedUser.group_id,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile' 
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    // Verify current password with Supabase Auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword
    });

    if (signInError) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password' 
    });
  }
};

// Logout (optional - mainly for token blacklisting if needed)
const logout = async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token here
    // For now, we'll just return success
    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Failed to logout' 
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};