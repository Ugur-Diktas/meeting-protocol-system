const { Resend } = require('resend');

// Initialize Resend client
let resendClient = null;

const initializeResend = () => {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

// Email templates
const templates = {
  weeklyTodos: (user, tasks) => {
    const overdueTasks = tasks.filter(t => 
      t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done'
    );
    const upcomingTasks = tasks.filter(t => 
      t.deadline && new Date(t.deadline) >= new Date() && t.status !== 'done'
    );
    const noDeadlineTasks = tasks.filter(t => !t.deadline && t.status !== 'done');

    const formatTask = (task) => {
      const priority = task.priority === 'urgent' ? '🔴' : 
                      task.priority === 'high' ? '🟡' : 
                      task.priority === 'medium' ? '🟢' : '⚪';
      const deadline = task.deadline ? ` (Due: ${new Date(task.deadline).toLocaleDateString()})` : '';
      return `${priority} ${task.title}${deadline}`;
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
          .content { padding: 30px; }
          .section { margin-bottom: 30px; }
          .section:last-child { margin-bottom: 0; }
          .section h3 { color: #333; margin: 0 0 15px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
          .task-list { list-style: none; padding: 0; margin: 0; }
          .task-item { background: #f8f9fa; padding: 12px 16px; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid #667eea; font-size: 15px; transition: transform 0.2s; }
          .task-item:hover { transform: translateX(4px); }
          .overdue { border-left-color: #e74c3c; background-color: #fff5f5; }
          .stats { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
          .stat-card { flex: 1; min-width: 150px; background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-number { font-size: 32px; font-weight: bold; color: #667eea; margin: 0; }
          .stat-label { font-size: 14px; color: #666; margin: 5px 0 0 0; }
          .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
          .footer a { color: #667eea; text-decoration: none; font-weight: 500; }
          .footer a:hover { text-decoration: underline; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; transition: transform 0.2s, box-shadow 0.2s; }
          .button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
          .empty-state { text-align: center; padding: 40px 0; }
          .empty-state img { width: 120px; opacity: 0.3; }
          .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Weekly Todo Summary</h1>
            <p>Hi ${user.name}, here's what's on your plate this week!</p>
          </div>
          
          <div class="content">
            <div class="stats">
              <div class="stat-card">
                <p class="stat-number">${tasks.filter(t => t.status !== 'done').length}</p>
                <p class="stat-label">Total Tasks</p>
              </div>
              <div class="stat-card">
                <p class="stat-number" style="color: #e74c3c;">${overdueTasks.length}</p>
                <p class="stat-label">Overdue</p>
              </div>
              <div class="stat-card">
                <p class="stat-number" style="color: #27ae60;">${upcomingTasks.length}</p>
                <p class="stat-label">Upcoming</p>
              </div>
            </div>

            <div class="divider"></div>
            
            ${overdueTasks.length > 0 ? `
              <div class="section">
                <h3>⚠️ Overdue Tasks (${overdueTasks.length})</h3>
                <ul class="task-list">
                  ${overdueTasks.map(task => 
                    `<li class="task-item overdue">${formatTask(task)}</li>`
                  ).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${upcomingTasks.length > 0 ? `
              <div class="section">
                <h3>📅 Upcoming Tasks (${upcomingTasks.length})</h3>
                <ul class="task-list">
                  ${upcomingTasks.map(task => 
                    `<li class="task-item">${formatTask(task)}</li>`
                  ).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${noDeadlineTasks.length > 0 ? `
              <div class="section">
                <h3>📋 Tasks Without Deadline (${noDeadlineTasks.length})</h3>
                <ul class="task-list">
                  ${noDeadlineTasks.map(task => 
                    `<li class="task-item">${formatTask(task)}</li>`
                  ).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${tasks.filter(t => t.status !== 'done').length === 0 ? `
              <div class="empty-state">
                <h3>🎉 All caught up!</h3>
                <p>You have no pending tasks. Enjoy your weekend!</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/tasks" class="button">View All Tasks</a>
            </div>
          </div>
          
          <div class="footer">
            <p>You're receiving this because you have email notifications enabled.</p>
            <p><a href="${process.env.FRONTEND_URL}/settings">Manage your notification preferences</a></p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              Sent with ❤️ by your Meeting Protocol System
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${user.name},

Here's your weekly todo summary:

${overdueTasks.length > 0 ? `OVERDUE TASKS (${overdueTasks.length}):\n${overdueTasks.map(formatTask).join('\n')}\n\n` : ''}
${upcomingTasks.length > 0 ? `UPCOMING TASKS (${upcomingTasks.length}):\n${upcomingTasks.map(formatTask).join('\n')}\n\n` : ''}
${noDeadlineTasks.length > 0 ? `TASKS WITHOUT DEADLINE (${noDeadlineTasks.length}):\n${noDeadlineTasks.map(formatTask).join('\n')}\n\n` : ''}
${tasks.filter(t => t.status !== 'done').length === 0 ? 'All caught up! You have no pending tasks.\n\n' : ''}

View all tasks: ${process.env.FRONTEND_URL}/tasks

---
You're receiving this because you have email notifications enabled.
Manage preferences: ${process.env.FRONTEND_URL}/settings
    `;

    return { html, text };
  }
};

// Main email service
class EmailService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured - emails will not be sent');
        this.initialized = false;
        return;
      }

      initializeResend();
      this.initialized = true;
      console.log('Resend email service initialized');
    } catch (error) {
      console.error('Email service initialization failed:', error);
      this.initialized = false;
    }
  }

  async sendWeeklyTodoSummary(user, tasks) {
    await this.initialize();
    
    const client = initializeResend();
    if (!client) {
      console.error('Resend client not available');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const { html, text } = templates.weeklyTodos(user, tasks);
      const pendingTaskCount = tasks.filter(t => t.status !== 'done').length;
      
      const { data, error } = await client.emails.send({
        from: process.env.EMAIL_FROM || 'Meeting Protocol <onboarding@resend.dev>',
        to: user.email,
        subject: `Your Weekly Todo Summary - ${pendingTaskCount} pending task${pendingTaskCount !== 1 ? 's' : ''}`,
        html,
        text,
        tags: [
          { name: 'type', value: 'weekly-summary' },
          { name: 'user-id', value: user.id }
        ]
      });

      if (error) {
        console.error(`Failed to send weekly summary to ${user.email}:`, error);
        return { success: false, error: error.message };
      }

      console.log(`Weekly summary sent to ${user.email}: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error(`Failed to send weekly summary to ${user.email}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Generic email sender for future use
  async sendEmail({ to, subject, html, text, tags = [] }) {
    await this.initialize();
    
    const client = initializeResend();
    if (!client) {
      throw new Error('Email service not configured');
    }

    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM || 'Meeting Protocol <onboarding@resend.dev>',
      to,
      subject,
      html,
      text,
      tags
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Test connection
  async testConnection() {
    await this.initialize();
    
    const client = initializeResend();
    if (!client) {
      return { success: false, error: 'Resend API key not configured' };
    }

    try {
      // Resend doesn't have a specific test endpoint, but we can validate the API key
      // by attempting to retrieve the API key info (this is a lightweight call)
      const { data, error } = await client.emails.send({
        from: process.env.EMAIL_FROM || 'Meeting Protocol <onboarding@resend.dev>',
        to: 'delivered@resend.dev', // Resend's test email that always succeeds
        subject: 'Test Connection',
        html: '<p>Testing Resend connection</p>'
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();