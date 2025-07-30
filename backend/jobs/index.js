const cron = require('node-cron');
const { sendWeeklyTodoEmails } = require('./weeklyTodoEmail');

// Store job references
const jobs = {};

// Initialize all scheduled jobs
const initializeJobs = () => {
  // Don't run jobs in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('Skipping job initialization in test environment');
    return;
  }

  console.log('Initializing scheduled jobs...');

  // Weekly todo emails - Every Saturday at 9 AM UTC
  // In production, you'd want to handle timezones properly
  const weeklyEmailCron = process.env.WEEKLY_EMAIL_CRON || '0 9 * * 6';
  
  jobs.weeklyTodoEmail = cron.schedule(weeklyEmailCron, async () => {
    console.log('Running weekly todo email job...');
    try {
      await sendWeeklyTodoEmails();
    } catch (error) {
      console.error('Weekly email job error:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log(`Weekly todo emails scheduled: ${weeklyEmailCron}`);

  // Add more jobs here as needed
  // Example: Daily task reminders, protocol deadline alerts, etc.

  // Cleanup job - Remove old activity logs (older than 90 days)
  jobs.cleanup = cron.schedule('0 2 * * *', async () => {
    console.log('Running cleanup job...');
    try {
      const { db } = require('../models');
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { error } = await db.supabase
        .from('activity_logs')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString());

      if (error) throw error;
      console.log('Cleanup job completed');
    } catch (error) {
      console.error('Cleanup job error:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('All jobs initialized');
};

// Stop all jobs
const stopJobs = () => {
  Object.values(jobs).forEach(job => {
    if (job && job.stop) {
      job.stop();
    }
  });
  console.log('All jobs stopped');
};

// Get job status
const getJobStatus = () => {
  return Object.entries(jobs).reduce((status, [name, job]) => {
    status[name] = {
      running: job && job.running !== undefined ? job.running : false
    };
    return status;
  }, {});
};

// Manual job triggers for admin
const manualTriggers = {
  weeklyTodoEmail: require('./weeklyTodoEmail').triggerWeeklyEmails
};

module.exports = {
  initializeJobs,
  stopJobs,
  getJobStatus,
  manualTriggers
};