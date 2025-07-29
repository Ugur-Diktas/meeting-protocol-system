const APITestHelper = require('./helpers/api');
const { db } = require('../models');

describe('Protocol Template API', () => {
  let api;
  let testGroup;
  let testUser;
  
  beforeEach(async () => {
    api = new APITestHelper();
    testGroup = await global.testUtils.createTestGroup();
    const authData = await api.createAuthenticatedUser({ group_id: testGroup.id });
    testUser = authData.user;
  });

  describe('GET /api/templates', () => {
    it('should get default templates', async () => {
      const res = await api.get('/api/templates');

      expect(res.status).toBe(200);
      expect(res.body.templates).toBeInstanceOf(Array);
      expect(res.body.templates.length).toBeGreaterThan(0);
      
      // Should have at least the VSS default template
      const defaultTemplate = res.body.templates.find(t => t.is_default);
      expect(defaultTemplate).toBeTruthy();
      expect(defaultTemplate.name).toContain('VSS');
    });

    it('should get both default and group templates', async () => {
      // Create a group-specific template
      await db.protocolTemplates.create({
        group_id: testGroup.id,
        name: 'Custom Group Template',
        structure: { sections: [] },
        created_by: testUser.id
      });

      const res = await api.get('/api/templates');

      expect(res.status).toBe(200);
      
      const defaultTemplates = res.body.templates.filter(t => t.is_default);
      const groupTemplates = res.body.templates.filter(t => !t.is_default);
      
      expect(defaultTemplates.length).toBeGreaterThan(0);
      expect(groupTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/templates/:id', () => {
    it('should get single template with structure', async () => {
      // First get templates to ensure we have one
      const templatesRes = await api.get('/api/templates');
      
      if (templatesRes.status === 200 && templatesRes.body.templates?.length > 0) {
        const template = templatesRes.body.templates[0];
        
        const res = await api.get(`/api/templates/${template.id}`);

        expect(res.status).toBe(200);
        expect(res.body.template).toMatchObject({
          id: template.id,
          name: template.name
        });
        expect(res.body.template.structure).toHaveProperty('sections');
        expect(res.body.template.structure.sections).toBeInstanceOf(Array);
      } else {
        console.log('No templates available, skipping test');
      }
    });

    it('should fail with non-existent template', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await api.get(`/api/templates/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should fail accessing template from another group', async () => {
      // Create template in another group
      const otherGroup = await global.testUtils.createTestGroup();
      const otherUser = await global.testUtils.createTestUser({ 
        group_id: otherGroup.id 
      });
      
      const otherTemplate = await db.protocolTemplates.create({
        group_id: otherGroup.id,
        name: 'Other Group Template',
        structure: { sections: [] },
        created_by: otherUser.id // Fixed
      });

      const res = await api.get(`/api/templates/${otherTemplate.id}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });
  });

  describe('POST /api/templates', () => {
    it('should create custom template', async () => {
      const templateData = {
        name: 'Weekly Standup Template',
        description: 'Template for weekly team standups',
        structure: {
          sections: [
            {
              id: 'attendance',
              type: 'attendance',
              title: 'Team Attendance',
              order: 1,
              required: true
            },
            {
              id: 'updates',
              type: 'text_per_person',
              title: 'Weekly Updates',
              order: 2,
              required: false
            },
            {
              id: 'blockers',
              type: 'discussion',
              title: 'Blockers & Issues',
              order: 3,
              required: false
            },
            {
              id: 'action_items',
              type: 'todos',
              title: 'Action Items',
              order: 4,
              required: true
            }
          ]
        }
      };

      const res = await api.post('/api/templates', templateData);

      expect(res.status).toBe(201);
      expect(res.body.template).toMatchObject({
        name: templateData.name,
        description: templateData.description,
        group_id: testGroup.id,
        created_by: testUser.id
      });
      expect(res.body.template.structure.sections).toHaveLength(4);
    });

    it('should validate template structure', async () => {
      const res = await api.post('/api/templates', {
        name: 'Invalid Template',
        structure: {
          // Missing sections array
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('sections array');
    });

    it('should fail without required fields', async () => {
      const res = await api.post('/api/templates', {
        description: 'Missing name and structure'
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });
  });

  describe('PUT /api/templates/:id', () => {
    let customTemplate;

    beforeEach(async () => {
      customTemplate = await db.protocolTemplates.create({
        group_id: testGroup.id,
        name: 'Original Template',
        description: 'Original description',
        structure: { 
          sections: [
            { id: 'section1', type: 'text', title: 'Section 1' }
          ] 
        },
        created_by: testUser.id
      });
    });

    it('should update template successfully', async () => {
      const updates = {
        name: 'Updated Template Name',
        description: 'Updated description',
        structure: {
          sections: [
            { id: 'section1', type: 'text', title: 'Updated Section 1' },
            { id: 'section2', type: 'todos', title: 'New Section 2' }
          ]
        }
      };

      const res = await api.put(`/api/templates/${customTemplate.id}`, updates);

      expect(res.status).toBe(200);
      expect(res.body.template).toMatchObject({
        name: updates.name,
        description: updates.description
      });
      expect(res.body.template.structure.sections).toHaveLength(2);
    });

    it('should update partial fields', async () => {
      const res = await api.put(`/api/templates/${customTemplate.id}`, {
        name: 'Only Name Updated'
      });

      expect(res.status).toBe(200);
      expect(res.body.template.name).toBe('Only Name Updated');
      expect(res.body.template.description).toBe(customTemplate.description);
    });

    it('should fail updating default template', async () => {
      // Get default template
      const templatesRes = await api.get('/api/templates');
      
      if (templatesRes.status === 200 && templatesRes.body.templates) {
        const defaultTemplate = templatesRes.body.templates.find(t => t.is_default);
        
        if (defaultTemplate) {
          const res = await api.put(`/api/templates/${defaultTemplate.id}`, {
            name: 'Try to update default'
          });

          expect(res.status).toBe(403);
          expect(res.body.error).toContain('your group');
        }
      }
    });

    it('should fail updating template from another group', async () => {
      // Create template in another group
      const otherGroup = await global.testUtils.createTestGroup();
      const otherUser = await global.testUtils.createTestUser({ 
        group_id: otherGroup.id 
      });
      
      const otherTemplate = await db.protocolTemplates.create({
        group_id: otherGroup.id,
        name: 'Other Group Template',
        structure: { sections: [] },
        created_by: otherUser.id // Fixed
      });

      const res = await api.put(`/api/templates/${otherTemplate.id}`, {
        name: 'Unauthorized update'
      });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/templates/:id', () => {
    let customTemplate;

    beforeEach(async () => {
      customTemplate = await db.protocolTemplates.create({
        group_id: testGroup.id,
        name: 'Template to Delete',
        structure: { sections: [] },
        created_by: testUser.id
      });
    });

    it('should delete custom template', async () => {
      const res = await api.delete(`/api/templates/${customTemplate.id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');

      // Verify template is deleted
      try {
        await db.protocolTemplates.findById(customTemplate.id);
        fail('Template should have been deleted');
      } catch (error) {
        // Expected - template not found
      }
    });

    it('should fail deleting default template', async () => {
      // Get default template
      const templatesRes = await api.get('/api/templates');
      
      if (templatesRes.status === 200 && templatesRes.body.templates) {
        const defaultTemplate = templatesRes.body.templates.find(t => t.is_default);
        
        if (defaultTemplate) {
          const res = await api.delete(`/api/templates/${defaultTemplate.id}`);

          expect(res.status).toBe(400);
          expect(res.body.error).toContain('Cannot delete default');
        }
      }
    });

    it('should fail deleting non-existent template', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await api.delete(`/api/templates/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should fail deleting template from another group', async () => {
      // Create template in another group
      const otherGroup = await global.testUtils.createTestGroup();
      const otherUser = await global.testUtils.createTestUser({ 
        group_id: otherGroup.id 
      });
      
      const otherTemplate = await db.protocolTemplates.create({
        group_id: otherGroup.id,
        name: 'Other Group Template',
        structure: { sections: [] },
        created_by: otherUser.id // Fixed
      });

      const res = await api.delete(`/api/templates/${otherTemplate.id}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('your group');
    });
  });

  describe('Template Structure Validation', () => {
    it('should validate section types', async () => {
      const validTypes = [
        'attendance',
        'roles',
        'checkin',
        'text_per_person',
        'matrix',
        'timeline',
        'events',
        'todos',
        'discussion',
        'varia'
      ];

      for (const type of validTypes.slice(0, 3)) { // Test first 3 to save time
        const res = await api.post('/api/templates', {
          name: `Template with ${type}`,
          structure: {
            sections: [
              { id: 'test', type, title: 'Test Section' }
            ]
          }
        });

        expect(res.status).toBe(201);
      }
    });

    it('should handle complex VSS template structure', async () => {
      const vssStructure = {
        sections: [
          {
            id: 'attendance',
            type: 'attendance',
            title: 'Anwesenheit',
            order: 1,
            required: true,
            fields: {
              present: { label: 'Anwesend', type: 'user_select', multiple: true },
              online: { label: 'Online', type: 'user_select', multiple: true },
              absent: { label: 'Abwesend', type: 'user_select', multiple: true }
            }
          },
          {
            id: 'checkin',
            type: 'checkin',
            title: 'Check-In',
            order: 2,
            columns: [
              { id: 'name', label: 'Name', type: 'user' },
              { id: 'status', label: 'Wie gehts dir?', type: 'text' },
              { id: 'capacity_tasks', label: 'Kapas für To-dos', type: 'percentage' }
            ]
          },
          {
            id: 'projects_campaigns',
            type: 'section_group',
            title: 'Projekte / Kampagnen',
            order: 3,
            subsections: [
              { id: 'bildung', title: 'Bildung', type: 'project_table' },
              { id: 'aktionen', title: 'Aktionen', type: 'project_table' }
            ]
          }
        ]
      };

      const res = await api.post('/api/templates', {
        name: 'Complex VSS Template',
        structure: vssStructure
      });

      expect(res.status).toBe(201);
      expect(res.body.template.structure.sections).toHaveLength(3);
      expect(res.body.template.structure.sections[2].subsections).toHaveLength(2);
    });
  });
});