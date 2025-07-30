const { db } = require('../models');

// Default user preferences
const DEFAULT_PREFERENCES = {
  notifications: {
    weeklyTodoEmail: true,
    emailTime: '09:00', // 9 AM in user's timezone
    timezone: 'UTC'
  },
  ui: {
    theme: 'light', // light, dark, system
    colorScheme: 'blue', // blue, green, purple, orange
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h' // 12h, 24h
  },
  tasks: {
    defaultView: 'list', // list, kanban, calendar
    showCompletedTasks: true,
    groupByPriority: false
  },
  protocols: {
    autoSave: true,
    autoSaveInterval: 30, // seconds
    showVersionHistory: true
  }
};

// Get user settings
const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with preferences
    const user = await db.users.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Merge with defaults to ensure all settings exist
    const preferences = {
      ...DEFAULT_PREFERENCES,
      ...user.preferences,
      notifications: {
        ...DEFAULT_PREFERENCES.notifications,
        ...(user.preferences?.notifications || {})
      },
      ui: {
        ...DEFAULT_PREFERENCES.ui,
        ...(user.preferences?.ui || {})
      },
      tasks: {
        ...DEFAULT_PREFERENCES.tasks,
        ...(user.preferences?.tasks || {})
      },
      protocols: {
        ...DEFAULT_PREFERENCES.protocols,
        ...(user.preferences?.protocols || {})
      }
    };

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role,
        group_id: user.group_id
      },
      preferences
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ 
      error: 'Failed to get user settings' 
    });
  }
};

// Update user settings
const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences, name, avatar_url } = req.body;

    // Get current user
    const currentUser = await db.users.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Prepare updates
    const updates = {};
    
    // Update basic info if provided
    if (name !== undefined) updates.name = name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    
    // Update preferences if provided
    if (preferences !== undefined) {
      // Start with current preferences or empty object
      const currentPrefs = currentUser.preferences || {};
      
      // Handle empty preferences object - maintain existing preferences
      if (Object.keys(preferences).length === 0) {
        updates.preferences = {
          ...DEFAULT_PREFERENCES,
          ...currentPrefs,
          notifications: {
            ...DEFAULT_PREFERENCES.notifications,
            ...(currentPrefs.notifications || {})
          },
          ui: {
            ...DEFAULT_PREFERENCES.ui,
            ...(currentPrefs.ui || {})
          },
          tasks: {
            ...DEFAULT_PREFERENCES.tasks,
            ...(currentPrefs.tasks || {})
          },
          protocols: {
            ...DEFAULT_PREFERENCES.protocols,
            ...(currentPrefs.protocols || {})
          }
        };
      } else {
        // Deep merge preferences - manually to avoid issues
        updates.preferences = {
          ...DEFAULT_PREFERENCES,
          ...currentPrefs,
          ...preferences,
          notifications: {
            ...DEFAULT_PREFERENCES.notifications,
            ...(currentPrefs.notifications || {}),
            ...(preferences.notifications || {})
          },
          ui: {
            ...DEFAULT_PREFERENCES.ui,
            ...(currentPrefs.ui || {}),
            ...(preferences.ui || {})
          },
          tasks: {
            ...DEFAULT_PREFERENCES.tasks,
            ...(currentPrefs.tasks || {}),
            ...(preferences.tasks || {})
          },
          protocols: {
            ...DEFAULT_PREFERENCES.protocols,
            ...(currentPrefs.protocols || {}),
            ...(preferences.protocols || {})
          }
        };
      }
    }

    // Only update if there are actual changes
    if (Object.keys(updates).length === 0) {
      // No updates, just return current user with merged preferences
      const responsePreferences = currentUser.preferences || {};
      const mergedPreferences = {
        ...DEFAULT_PREFERENCES,
        ...responsePreferences,
        notifications: {
          ...DEFAULT_PREFERENCES.notifications,
          ...(responsePreferences.notifications || {})
        },
        ui: {
          ...DEFAULT_PREFERENCES.ui,
          ...(responsePreferences.ui || {})
        },
        tasks: {
          ...DEFAULT_PREFERENCES.tasks,
          ...(responsePreferences.tasks || {})
        },
        protocols: {
          ...DEFAULT_PREFERENCES.protocols,
          ...(responsePreferences.protocols || {})
        }
      };

      return res.json({
        message: 'Settings updated successfully',
        user: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          avatar_url: currentUser.avatar_url,
          role: currentUser.role,
          group_id: currentUser.group_id
        },
        preferences: mergedPreferences
      });
    }

    // Update user
    const updatedUser = await db.users.update(userId, updates);

    // Log activity if user has a group
    if (req.user.group_id) {
      await db.logActivity(
        req.user.group_id,
        userId,
        'user',
        userId,
        'settings_updated',
        { updated_fields: Object.keys(updates) }
      );
    }

    // Prepare response with merged preferences
    const responsePreferences = updatedUser.preferences || {};
    const mergedPreferences = {
      ...DEFAULT_PREFERENCES,
      ...responsePreferences,
      notifications: {
        ...DEFAULT_PREFERENCES.notifications,
        ...(responsePreferences.notifications || {})
      },
      ui: {
        ...DEFAULT_PREFERENCES.ui,
        ...(responsePreferences.ui || {})
      },
      tasks: {
        ...DEFAULT_PREFERENCES.tasks,
        ...(responsePreferences.tasks || {})
      },
      protocols: {
        ...DEFAULT_PREFERENCES.protocols,
        ...(responsePreferences.protocols || {})
      }
    };

    res.json({
      message: 'Settings updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar_url: updatedUser.avatar_url,
        role: updatedUser.role,
        group_id: updatedUser.group_id
      },
      preferences: mergedPreferences
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ 
      error: 'Failed to update user settings',
      details: process.env.NODE_ENV === 'test' ? error.message : undefined
    });
  }
};

// Get user's notification preferences
const getNotificationSettings = async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    
    const notificationSettings = {
      ...DEFAULT_PREFERENCES.notifications,
      ...(user.preferences?.notifications || {})
    };

    res.json({
      notifications: notificationSettings
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ 
      error: 'Failed to get notification settings' 
    });
  }
};

// Update notification preferences
const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { weeklyTodoEmail, emailTime, timezone } = req.body;

    // Get current user
    const currentUser = await db.users.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    // Get current preferences
    const currentPreferences = currentUser.preferences || {};
    const currentNotifications = {
      ...DEFAULT_PREFERENCES.notifications,
      ...(currentPreferences.notifications || {})
    };
    
    // Update only provided notification settings
    const updatedNotifications = {
      ...currentNotifications,
      ...(weeklyTodoEmail !== undefined && { weeklyTodoEmail }),
      ...(emailTime !== undefined && { emailTime }),
      ...(timezone !== undefined && { timezone })
    };
    
    // Update user preferences
    const updatedPreferences = {
      ...currentPreferences,
      notifications: updatedNotifications
    };

    await db.users.update(userId, {
      preferences: updatedPreferences
    });

    res.json({
      message: 'Notification settings updated successfully',
      notifications: updatedNotifications
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ 
      error: 'Failed to update notification settings',
      details: process.env.NODE_ENV === 'test' ? error.message : undefined
    });
  }
};

// Get available themes and color schemes
const getUIOptions = async (req, res) => {
  res.json({
    themes: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' }
    ],
    colorSchemes: [
      { value: 'blue', label: 'Blue', primary: '#4A90E2', secondary: '#357ABD' },
      { value: 'green', label: 'Green', primary: '#27AE60', secondary: '#229954' },
      { value: 'purple', label: 'Purple', primary: '#8E44AD', secondary: '#7D3C98' },
      { value: 'orange', label: 'Orange', primary: '#E67E22', secondary: '#D68910' }
    ],
    languages: [
      { value: 'en', label: 'English' },
      { value: 'de', label: 'Deutsch' },
      { value: 'fr', label: 'Français' },
      { value: 'es', label: 'Español' }
    ],
    dateFormats: [
      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
    ],
    timeFormats: [
      { value: '12h', label: '12-hour (AM/PM)' },
      { value: '24h', label: '24-hour' }
    ]
  });
};

// Test email notification
const testEmailNotification = async (req, res) => {
  try {
    const emailService = require('../utils/email');
    
    // Get user's tasks for preview
    const tasks = await db.tasks.findByGroupId(req.user.group_id, {
      assignedTo: req.user.id
    });

    // Send test email
    const result = await emailService.sendWeeklyTodoSummary(req.user, tasks);

    if (result.success) {
      res.json({
        message: 'Test email sent successfully',
        preview: {
          taskCount: tasks.filter(t => t.status !== 'done').length,
          email: req.user.email
        }
      });
    } else {
      res.status(500).json({
        error: 'Failed to send test email',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email' 
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getUIOptions,
  testEmailNotification
};