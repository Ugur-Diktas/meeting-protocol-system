const { db } = require('../models');
const emailService = require('../utils/email');

// Convert time string (HH:MM) to cron expression for Saturday
const timeToCron = (timeStr, timezone = 'UTC') => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  // Cron format: minute hour day month weekday
  // 6 = Saturday
  return `${minutes} ${hours} * * 6`;
};

// Check if user should receive email now based on their timezone and preferences
const shouldSendEmail = (user, currentTime) => {
  const prefs = user.preferences?.notifications || {};
  
  // Check if weekly emails are enabled
  if (!prefs.weeklyTodoEmail) return false;
  
  // Get user's preferred time and timezone
  const emailTime = prefs.emailTime || '09:00';
  const timezone = prefs.timezone || 'UTC';
  
  // For simplicity in this implementation, we'll send emails to all users
  // In production, you'd want to properly handle timezones
  // This is a simplified check that assumes the job runs at the correct time
  return true;
};

// Send weekly summary to a single user
const sendWeeklySummaryToUser = async (user) => {
  try {
    // Skip if user doesn't want emails
    if (!shouldSendEmail(user)) {
      return { userId: user.id, status: 'skipped', reason: 'disabled' };
    }

    // Get user's pending tasks
    const tasks = await db.tasks.findByGroupId(user.group_id, {
      assignedTo: user.id
    });

    // Filter out completed tasks
    const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');

    // Skip if no pending tasks (unless user wants empty summaries)
    if (pendingTasks.length === 0) {
      // You might want to still send "all caught up" emails
      // For now, we'll send them
    }

    // Send email
    const result = await emailService.sendWeeklyTodoSummary(user, pendingTasks);

    // Log the email send
    await db.logActivity(
      user.group_id,
      user.id,
      'email',
      user.id,
      'weekly_summary_sent',
      { 
        taskCount: pendingTasks.length,
        success: result.success,
        messageId: result.messageId 
      }
    );

    return {
      userId: user.id,
      status: result.success ? 'sent' : 'failed',
      taskCount: pendingTasks.length,
      error: result.error
    };
  } catch (error) {
    console.error(`Failed to send weekly summary to user ${user.id}:`, error);
    return {
      userId: user.id,
      status: 'error',
      error: error.message
    };
  }
};

// Main job function
const sendWeeklyTodoEmails = async () => {
  console.log('Starting weekly todo email job...');
  const startTime = Date.now();
  
  try {
    // Initialize email service
    await emailService.initialize();

    // Get all users with email notifications enabled
    // In production, you'd want to batch this for large numbers of users
    const { data: users, error } = await db.supabase
      .from('users')
      .select('*')
      .not('group_id', 'is', null) // Only users in groups
      .eq('preferences->notifications->weeklyTodoEmail', true);

    if (error) {
      throw error;
    }

    if (!users || users.length === 0) {
      console.log('No users to send weekly emails to');
      return { sent: 0, failed: 0, skipped: 0 };
    }

    console.log(`Found ${users.length} users with weekly emails enabled`);

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(user => sendWeeklySummaryToUser(user))
      );
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calculate summary
    const summary = {
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
      duration: Date.now() - startTime
    };

    console.log('Weekly todo email job completed:', summary);
    
    // Log job completion
    await db.supabase
      .from('activity_logs')
      .insert({
        group_id: null, // System-level activity
        user_id: null,
        entity_type: 'system',
        entity_id: '00000000-0000-0000-0000-000000000000',
        action: 'weekly_email_job_completed',
        details: summary
      });

    return summary;
  } catch (error) {
    console.error('Weekly todo email job failed:', error);
    
    // Log job failure
    await db.supabase
      .from('activity_logs')
      .insert({
        group_id: null,
        user_id: null,
        entity_type: 'system',
        entity_id: '00000000-0000-0000-0000-000000000000',
        action: 'weekly_email_job_failed',
        details: { error: error.message, duration: Date.now() - startTime }
      });
    
    throw error;
  }
};

// Manual trigger function for testing
const triggerWeeklyEmails = async (req, res) => {
  try {
    // Check if user is admin or if it's a system call
    if (req && req.user && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required' 
      });
    }

    const summary = await sendWeeklyTodoEmails();
    
    if (res) {
      res.json({
        message: 'Weekly email job completed',
        summary
      });
    }
    
    return summary;
  } catch (error) {
    if (res) {
      res.status(500).json({
        error: 'Weekly email job failed',
        details: error.message
      });
    }
    throw error;
  }
};

module.exports = {
  sendWeeklyTodoEmails,
  triggerWeeklyEmails,
  sendWeeklySummaryToUser
};