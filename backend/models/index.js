require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Database models with helpful methods
const db = {
  // Groups
  groups: {
    async findById(id) {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async findByCode(code) {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('code', code)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async create(groupData) {
      const { data, error } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Users
  users: {
    async findById(id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async findByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async findByGroupId(groupId) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('group_id', groupId)
        .order('name');
      if (error) throw error;
      return data;
    },

    async create(userData) {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async updateLastActive(id) {
      const { data, error } = await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return data;
    }
  },

  // Protocol Templates
  protocolTemplates: {
    async findByGroupId(groupId) {
      const { data, error } = await supabase
        .from('protocol_templates')
        .select('*')
        .or(`group_id.eq.${groupId},group_id.is.null`)
        .order('is_default', { ascending: false })
        .order('name');
      if (error) throw error;
      return data;
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('protocol_templates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(templateData) {
      const { data, error } = await supabase
        .from('protocol_templates')
        .insert(templateData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('protocol_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('protocol_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Protocols
  protocols: {
    async findByGroupId(groupId, filters = {}) {
      let query = supabase
        .from('protocols')
        .select(`
          *,
          created_by:users!created_by(id, name, email),
          template:protocol_templates(id, name)
        `)
        .eq('group_id', groupId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('meeting_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('meeting_date', filters.endDate);
      }

      query = query.order('meeting_date', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('protocols')
        .select(`
          *,
          created_by:users!created_by(id, name, email),
          finalized_by:users!finalized_by(id, name, email),
          template:protocol_templates(id, name, structure),
          attendees:protocol_attendees(
            *,
            user:users(id, name, email)
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(protocolData) {
      const { data, error } = await supabase
        .from('protocols')
        .insert(protocolData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      // Save current version before updating
      const current = await this.findById(id);
      if (current) {
        await db.protocolVersions.create({
          protocol_id: id,
          version: current.version,
          data: current.data,
          changed_by: updates.updated_by || null,
          changes: updates.changes || {}
        });
      }

      // Increment version
      updates.version = (current?.version || 1) + 1;

      const { data, error } = await supabase
        .from('protocols')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async finalize(id, userId) {
      const { data, error } = await supabase
        .from('protocols')
        .update({
          status: 'finalized',
          finalized_by: userId,
          finalized_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Protocol Versions
  protocolVersions: {
    async findByProtocolId(protocolId) {
      const { data, error } = await supabase
        .from('protocol_versions')
        .select(`
          *,
          changed_by:users(id, name, email)
        `)
        .eq('protocol_id', protocolId)
        .order('version', { ascending: false });
      if (error) throw error;
      return data;
    },

    async create(versionData) {
      const { data, error } = await supabase
        .from('protocol_versions')
        .insert(versionData)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Protocol Attendees
  protocolAttendees: {
    async upsert(attendeeData) {
      const { data, error } = await supabase
        .from('protocol_attendees')
        .upsert(attendeeData, {
          onConflict: 'protocol_id,user_id'
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async findByProtocolId(protocolId) {
      const { data, error } = await supabase
        .from('protocol_attendees')
        .select(`
          *,
          user:users(id, name, email, avatar_url)
        `)
        .eq('protocol_id', protocolId);
      if (error) throw error;
      return data;
    },

    async bulkUpsert(attendees) {
      const { data, error } = await supabase
        .from('protocol_attendees')
        .upsert(attendees, {
          onConflict: 'protocol_id,user_id'
        })
        .select();
      if (error) throw error;
      return data;
    }
  },

  // Tasks
  tasks: {
    async findByGroupId(groupId, filters = {}) {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:users!assigned_to(id, name, email),
          created_by:users!created_by(id, name, email),
          protocol:protocols(id, title, meeting_date)
        `)
        .eq('group_id', groupId);

      // Apply filters
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.overdue) {
        query = query.lt('deadline', new Date().toISOString().split('T')[0])
          .neq('status', 'done')
          .neq('status', 'cancelled');
      }

      query = query.order('deadline', { ascending: true, nullsFirst: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:users!assigned_to(id, name, email),
          created_by:users!created_by(id, name, email),
          protocol:protocols(id, title, meeting_date),
          comments:task_comments(
            *,
            user:users(id, name, email)
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(taskData) {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async updateStatus(id, status, completionNotes = null) {
      const updates = { status };
      if (status === 'done') {
        updates.completed_at = new Date().toISOString();
        if (completionNotes) {
          updates.completion_notes = completionNotes;
        }
      }

      return this.update(id, updates);
    },

    async delete(id) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Task Comments
  taskComments: {
    async create(commentData) {
      const { data, error } = await supabase
        .from('task_comments')
        .insert(commentData)
        .select(`
          *,
          user:users(id, name, email)
        `)
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Protocol Comments
  protocolComments: {
    async findByProtocolId(protocolId) {
      const { data, error } = await supabase
        .from('protocol_comments')
        .select(`
          *,
          user:users(id, name, email),
          resolved_by:users!resolved_by(id, name, email)
        `)
        .eq('protocol_id', protocolId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async create(commentData) {
      const { data, error } = await supabase
        .from('protocol_comments')
        .insert(commentData)
        .select(`
          *,
          user:users(id, name, email)
        `)
        .single();
      if (error) throw error;
      return data;
    },

    async resolve(id, userId) {
      const { data, error } = await supabase
        .from('protocol_comments')
        .update({
          resolved: true,
          resolved_by: userId,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Files
  files: {
    async create(fileData) {
      const { data, error } = await supabase
        .from('files')
        .insert(fileData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async findByProtocolId(protocolId) {
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          uploaded_by:users(id, name, email)
        `)
        .eq('protocol_id', protocolId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async findByTaskId(taskId) {
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          uploaded_by:users(id, name, email)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  },

  // Activity Logs
  activityLogs: {
    async create(logData) {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert(logData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async findByGroupId(groupId, limit = 50) {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user:users(id, name, email)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    }
  },

  // Helper function to log activity
  async logActivity(groupId, userId, entityType, entityId, action, details = {}) {
    return db.activityLogs.create({
      group_id: groupId,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      details: details
    });
  }
};

module.exports = { supabase, db };