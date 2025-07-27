const APITestHelper = require('./helpers/api');
const { db } = require('../models');

describe('Protocol Management API', () => {
  let api;
  let testGroup;
  let testUser;
  
  beforeEach(async () => {
    api = new APITestHelper();
    testGroup = await global.testUtils.createTestGroup();
    const authData = await api.createAuthenticatedUser({ groupCode: testGroup.code });
    testUser = authData.user;
  });

  describe('POST /api/protocols', () => {
    it('should create a new protocol successfully', async () => {
      const protocolData = {
        meetingDate: '2024-01-15',
        title: 'Weekly Team Meeting',
        data: {
          attendance: {
            present: [testUser.id],
            online: [],
            absent: []
          }
        }
      };

      const res = await api.post('/api/protocols', protocolData);

      expect(res.status).toBe(201);
      expect(res.body.protocol).toMatchObject({
        meeting_date: protocolData.meetingDate,
        title: protocolData.title,
        status: 'draft',
        group_id: testGroup.id,
        created_by: testUser.id
      });
    });

    it('should create protocol from template', async () => {
      // Get default template
      const templatesRes = await api.get('/api/templates');
      const template = templatesRes.body.templates[0];

      const res = await api.post('/api/protocols', {
        templateId: template.id,
        meetingDate: '2024-01-20',
        title: 'Meeting from Template'
      });

      expect(res.status).toBe(201);
      expect(res.body.protocol.template_id).toBe(template.id);
    });

    it('should fail without required fields', async () => {
      const res = await api.post('/api/protocols', {
        title: 'Missing Date'
        // missing meetingDate
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should fail without group membership', async () => {
      // Create user without group
      const api2 = new APITestHelper();
      await api2.createAuthenticatedUser();
      
      const res = await api2.post('/api/protocols', {
        meetingDate: '2024-01-15',
        title: 'No Group Protocol'
      });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('group');
    });
  });

  describe('GET /api/protocols', () => {
    beforeEach(async () => {
      // Create multiple test protocols
      for (let i = 0; i < 5; i++) {
        await global.testUtils.createTestProtocol(testGroup.id, testUser.id, {
          title: `Protocol ${i}`,
          meeting_date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
          status: i % 2 === 0 ? 'draft' : 'finalized'
        });
      }
    });

    it('should get all protocols for the group', async () => {
      const res = await api.get('/api/protocols');

      expect(res.status).toBe(200);
      expect(res.body.protocols).toHaveLength(5);
      expect(res.body.protocols[0]).toHaveProperty('created_by');
      expect(res.body.protocols[0]).toHaveProperty('template');
    });

    it('should filter by status', async () => {
      const res = await api.get('/api/protocols?status=draft');

      expect(res.status).toBe(200);
      expect(res.body.protocols.every(p => p.status === 'draft')).toBe(true);
    });

    it('should filter by date range', async () => {
      const res = await api.get('/api/protocols?startDate=2024-01-03&endDate=2024-01-04');

      expect(res.status).toBe(200);
      expect(res.body.protocols).toHaveLength(2);
    });

    it('should sort by meeting date descending', async () => {
      const res = await api.get('/api/protocols');

      expect(res.status).toBe(200);
      const dates = res.body.protocols.map(p => p.meeting_date);
      expect(dates).toEqual([...dates].sort().reverse());
    });
  });

  describe('GET /api/protocols/:id', () => {
    let testProtocol;

    beforeEach(async () => {
      testProtocol = await global.testUtils.createTestProtocol(
        testGroup.id, 
        testUser.id,
        { title: 'Test Protocol' }
      );
    });

    it('should get single protocol with details', async () => {
      const res = await api.get(`/api/protocols/${testProtocol.id}`);

      expect(res.status).toBe(200);
      expect(res.body.protocol).toMatchObject({
        id: testProtocol.id,
        title: testProtocol.title
      });
      expect(res.body.protocol).toHaveProperty('attendees');
      expect(res.body.protocol).toHaveProperty('comments');
    });

    it('should fail with non-existent protocol', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await api.get(`/api/protocols/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should fail accessing protocol from another group', async () => {
      // Create another group and protocol
      const otherGroup = await global.testUtils.createTestGroup();
      const otherUser = await global.testUtils.createTestUser({ group_id: otherGroup.id });
      const otherProtocol = await global.testUtils.createTestProtocol(
        otherGroup.id,
        otherUser.user.id
      );

      const res = await api.get(`/api/protocols/${otherProtocol.id}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });
  });

  describe('PUT /api/protocols/:id', () => {
    let testProtocol;

    beforeEach(async () => {
      testProtocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id,
        { status: 'draft' }
      );
    });

    it('should update protocol successfully', async () => {
      const updates = {
        title: 'Updated Title',
        data: { notes: 'Updated notes' },
        status: 'active'
      };

      const res = await api.put(`/api/protocols/${testProtocol.id}`, updates);

      expect(res.status).toBe(200);
      expect(res.body.protocol.title).toBe(updates.title);
      expect(res.body.protocol.status).toBe(updates.status);
      expect(res.body.protocol.version).toBe(2); // Version incremented
    });

    it('should create version history on update', async () => {
      await api.put(`/api/protocols/${testProtocol.id}`, {
        title: 'Version 2'
      });

      const versions = await db.protocolVersions.findByProtocolId(testProtocol.id);
      expect(versions).toHaveLength(1);
      expect(versions[0].version).toBe(1);
    });

    it('should fail updating finalized protocol', async () => {
      // Finalize the protocol
      await db.protocols.finalize(testProtocol.id, testUser.id);

      const res = await api.put(`/api/protocols/${testProtocol.id}`, {
        title: 'Try to update'
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('finalized');
    });

    it('should fail updating non-existent protocol', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await api.put(`/api/protocols/${fakeId}`, {
        title: 'Update'
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/protocols/:id/section', () => {
    let testProtocol;

    beforeEach(async () => {
      testProtocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id,
        { 
          data: { 
            attendance: { present: [], online: [], absent: [] },
            notes: 'Original notes'
          }
        }
      );
    });

    it('should update specific section', async () => {
      const res = await api.put(`/api/protocols/${testProtocol.id}/section`, {
        sectionId: 'attendance',
        content: {
          present: [testUser.id],
          online: [],
          absent: []
        }
      });

      expect(res.status).toBe(200);
      expect(res.body.section).toMatchObject({
        id: 'attendance',
        content: {
          present: [testUser.id],
          online: [],
          absent: []
        }
      });
    });

    it('should fail with locked section', async () => {
      // Lock a section
      await db.protocols.update(testProtocol.id, {
        locked_sections: ['attendance']
      });

      const res = await api.put(`/api/protocols/${testProtocol.id}/section`, {
        sectionId: 'attendance',
        content: { present: [testUser.id] }
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('locked');
    });

    it('should fail without required fields', async () => {
      const res = await api.put(`/api/protocols/${testProtocol.id}/section`, {
        sectionId: 'attendance'
        // missing content
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });
  });

  describe('POST /api/protocols/:id/finalize', () => {
    let testProtocol;

    beforeEach(async () => {
      testProtocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id,
        {
          data: {
            todos: {
              [testUser.id]: [
                { title: 'Task 1', deadline: '2024-02-01' },
                { title: 'Task 2', priority: 'high' }
              ]
            }
          }
        }
      );
    });

    it('should finalize protocol and create tasks', async () => {
      const res = await api.post(`/api/protocols/${testProtocol.id}/finalize`);

      expect(res.status).toBe(200);
      expect(res.body.protocol.status).toBe('finalized');
      expect(res.body.protocol.finalized_by).toBe(testUser.id);
      expect(res.body.protocol.finalized_at).toBeTruthy();

      // Check tasks were created
      const tasks = await db.tasks.findByGroupId(testGroup.id);
      expect(tasks).toHaveLength(2);
      expect(tasks[0].protocol_id).toBe(testProtocol.id);
    });

    it('should fail finalizing already finalized protocol', async () => {
      await api.post(`/api/protocols/${testProtocol.id}/finalize`);
      const res = await api.post(`/api/protocols/${testProtocol.id}/finalize`);

      expect(res.status).toBe(500); // Already finalized
    });
  });

  describe('PUT /api/protocols/:id/attendees', () => {
    let testProtocol;
    let otherUser;

    beforeEach(async () => {
      testProtocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id
      );
      
      // Create another user in the group
      otherUser = await global.testUtils.createTestUser({ 
        group_id: testGroup.id,
        name: 'Other User'
      });
    });

    it('should update attendees successfully', async () => {
      const attendees = [
        {
          userId: testUser.id,
          type: 'present',
          capacityTasks: 80,
          capacityResponsibilities: 90
        },
        {
          userId: otherUser.user.id,
          type: 'online',
          arrivalTime: '14:30',
          departureTime: '16:00'
        }
      ];

      const res = await api.put(`/api/protocols/${testProtocol.id}/attendees`, {
        attendees
      });

      expect(res.status).toBe(200);

      // Verify attendees were saved
      const saved = await db.protocolAttendees.findByProtocolId(testProtocol.id);
      expect(saved).toHaveLength(2);
    });
  });

  describe('Protocol Comments', () => {
    let testProtocol;

    beforeEach(async () => {
      testProtocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id
      );
    });

    describe('POST /api/protocols/:id/comments', () => {
      it('should add comment to protocol section', async () => {
        const res = await api.post(`/api/protocols/${testProtocol.id}/comments`, {
          sectionId: 'attendance',
          comment: 'Who is missing?'
        });

        expect(res.status).toBe(201);
        expect(res.body.comment).toMatchObject({
          section_id: 'attendance',
          comment: 'Who is missing?',
          user_id: testUser.id
        });
      });

      it('should fail without required fields', async () => {
        const res = await api.post(`/api/protocols/${testProtocol.id}/comments`, {
          comment: 'Missing section ID'
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('required');
      });
    });

    describe('PUT /api/protocols/:id/comments/:commentId/resolve', () => {
      let testComment;

      beforeEach(async () => {
        testComment = await db.protocolComments.create({
          protocol_id: testProtocol.id,
          section_id: 'test',
          user_id: testUser.id,
          comment: 'Test comment'
        });
      });

      it('should resolve comment', async () => {
        const res = await api.put(
          `/api/protocols/${testProtocol.id}/comments/${testComment.id}/resolve`
        );

        expect(res.status).toBe(200);
        expect(res.body.comment.resolved).toBe(true);
        expect(res.body.comment.resolved_by).toBe(testUser.id);
      });
    });
  });

  describe('GET /api/protocols/:id/versions', () => {
    let testProtocol;

    beforeEach(async () => {
      testProtocol = await global.testUtils.createTestProtocol(
        testGroup.id,
        testUser.id
      );

      // Create some versions
      for (let i = 1; i <= 3; i++) {
        await api.put(`/api/protocols/${testProtocol.id}`, {
          title: `Version ${i + 1}`
        });
      }
    });

    it('should get protocol version history', async () => {
      const res = await api.get(`/api/protocols/${testProtocol.id}/versions`);

      expect(res.status).toBe(200);
      expect(res.body.versions).toHaveLength(3);
      expect(res.body.versions[0].version).toBe(3); // Most recent first
    });
  });
});