const Client = require('socket.io-client');
const APITestHelper = require('./helpers/api');
const { db } = require('../models');
const { httpServer } = require('../app');
const logger = require('./helpers/logger');

describe('Socket.io Real-time Features', () => {
  let api;
  let clientSocket1;
  let clientSocket2;
  let serverURL;
  let testGroup;
  let testUser;
  let testProtocol;

  beforeAll(async () => {
    // Start the server for socket.io tests
    await new Promise((resolve) => {
      const PORT = process.env.PORT || 3002;
      httpServer.listen(PORT, () => {
        serverURL = `http://localhost:${PORT}`;
        logger.info('Test server started for Socket.io tests', { port: PORT });
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Close the server
    await new Promise((resolve) => {
      httpServer.close(() => {
        logger.info('Test server closed');
        resolve();
      });
    });
  });

  beforeEach(async () => {
    api = new APITestHelper();
    
    // Create test data
    testGroup = await global.testUtils.createTestGroup();
    const authData = await api.createAuthenticatedUser({ groupCode: testGroup.code });
    testUser = authData.user;
    testProtocol = await global.testUtils.createTestProtocol(
      testGroup.id,
      testUser.id
    );

    // Create socket clients
    clientSocket1 = Client(serverURL, {
      transports: ['websocket'],
      forceNew: true
    });

    clientSocket2 = Client(serverURL, {
      transports: ['websocket'],
      forceNew: true
    });

    // Wait for connections
    await Promise.all([
      new Promise(resolve => clientSocket1.on('connect', resolve)),
      new Promise(resolve => clientSocket2.on('connect', resolve))
    ]);
  });

  afterEach(() => {
    if (clientSocket1) clientSocket1.close();
    if (clientSocket2) clientSocket2.close();
  });

  describe('Protocol Room Management', () => {
    it('should join protocol room', (done) => {
      clientSocket1.on('user-joined', (data) => {
        expect(data).toHaveProperty('socketId');
        expect(data.protocolId).toBe(testProtocol.id);
        done();
      });

      // Client 2 joins first
      clientSocket2.emit('join-protocol', testProtocol.id);
      
      // Client 1 joins and should notify client 2
      setTimeout(() => {
        clientSocket1.emit('join-protocol', testProtocol.id);
      }, 100);
    });

    it('should leave protocol room', (done) => {
      clientSocket1.on('user-left', (data) => {
        expect(data).toHaveProperty('socketId');
        expect(data.protocolId).toBe(testProtocol.id);
        done();
      });

      // Both join the room
      clientSocket1.emit('join-protocol', testProtocol.id);
      clientSocket2.emit('join-protocol', testProtocol.id);

      // Client 2 leaves
      setTimeout(() => {
        clientSocket2.emit('leave-protocol', testProtocol.id);
      }, 100);
    });
  });

  describe('Protocol Updates', () => {
    beforeEach(() => {
      // Both clients join the protocol room
      clientSocket1.emit('join-protocol', testProtocol.id);
      clientSocket2.emit('join-protocol', testProtocol.id);
    });

    it('should broadcast protocol updates to other users', (done) => {
      const updateData = {
        protocolId: testProtocol.id,
        section: 'attendance',
        content: { present: [testUser.id] }
      };

      clientSocket2.on('protocol-updated', (data) => {
        expect(data).toMatchObject(updateData);
        done();
      });

      // Client 1 sends update
      setTimeout(() => {
        clientSocket1.emit('protocol-update', updateData);
      }, 100);
    });

    it('should handle section updates via API', (done) => {
      clientSocket2.on('section-updated', (data) => {
        expect(data.protocolId).toBe(testProtocol.id);
        expect(data.sectionId).toBe('notes');
        expect(data.content).toBe('Updated notes');
        expect(data.updatedBy).toHaveProperty('name');
        done();
      });

      // Update via API (which should emit to sockets)
      setTimeout(async () => {
        await api.put(`/api/protocols/${testProtocol.id}/section`, {
          sectionId: 'notes',
          content: 'Updated notes'
        });
      }, 100);
    });
  });

  describe('Collaborative Editing Features', () => {
    beforeEach(() => {
      clientSocket1.emit('join-protocol', testProtocol.id);
      clientSocket2.emit('join-protocol', testProtocol.id);
    });

    it('should broadcast cursor positions', (done) => {
      const cursorData = {
        protocolId: testProtocol.id,
        userId: testUser.id,
        position: { line: 5, column: 10 },
        section: 'notes'
      };

      clientSocket2.on('cursor-moved', (data) => {
        expect(data).toMatchObject({
          userId: cursorData.userId,
          position: cursorData.position,
          section: cursorData.section
        });
        done();
      });

      setTimeout(() => {
        clientSocket1.emit('cursor-position', cursorData);
      }, 100);
    });

    it('should handle typing indicators', (done) => {
      const typingData = {
        protocolId: testProtocol.id,
        userId: testUser.id,
        section: 'discussion'
      };

      let typingStartReceived = false;

      clientSocket2.on('user-typing', (data) => {
        expect(data).toMatchObject({
          userId: typingData.userId,
          section: typingData.section
        });
        typingStartReceived = true;
      });

      clientSocket2.on('user-stopped-typing', (data) => {
        expect(typingStartReceived).toBe(true);
        expect(data).toMatchObject({
          userId: typingData.userId,
          section: typingData.section
        });
        done();
      });

      setTimeout(() => {
        clientSocket1.emit('typing-start', typingData);
      }, 100);

      setTimeout(() => {
        clientSocket1.emit('typing-stop', typingData);
      }, 200);
    });
  });

  describe('Group Room for Tasks', () => {
    beforeEach(() => {
      clientSocket1.emit('join-group', testGroup.id);
      clientSocket2.emit('join-group', testGroup.id);
    });

    it('should broadcast task creation', (done) => {
      clientSocket2.on('task-created', (data) => {
        expect(data.task).toHaveProperty('title', 'New Task');
        expect(data.createdBy).toHaveProperty('name');
        done();
      });

      // Create task via API
      setTimeout(async () => {
        await api.post('/api/tasks', {
          title: 'New Task',
          assignedTo: testUser.id
        });
      }, 100);
    });

    it('should broadcast task status updates', (done) => {
      global.testUtils.createTestTask(testGroup.id, testUser.id).then(task => {
        clientSocket2.on('task-status-updated', (data) => {
          expect(data.taskId).toBe(task.id);
          expect(data.status).toBe('in_progress');
          expect(data.updatedBy).toHaveProperty('name');
          done();
        });

        // Update task status via API
        setTimeout(async () => {
          await api.patch(`/api/tasks/${task.id}/status`, {
            status: 'in_progress'
          });
        }, 100);
      });
    });

    it('should broadcast task deletion', (done) => {
      global.testUtils.createTestTask(testGroup.id, testUser.id).then(task => {
        clientSocket2.on('task-deleted', (data) => {
          expect(data.taskId).toBe(task.id);
          expect(data.deletedBy).toHaveProperty('name');
          done();
        });

        // Delete task via API
        setTimeout(async () => {
          await api.delete(`/api/tasks/${task.id}`);
        }, 100);
      });
    });
  });

  describe('Protocol Comments Real-time', () => {
    beforeEach(() => {
      clientSocket1.emit('join-protocol', testProtocol.id);
      clientSocket2.emit('join-protocol', testProtocol.id);
    });

    it('should broadcast new comments', (done) => {
      clientSocket2.on('comment-added', (data) => {
        expect(data.protocolId).toBe(testProtocol.id);
        expect(data.comment).toHaveProperty('comment', 'Test comment');
        expect(data.comment).toHaveProperty('section_id', 'discussion');
        done();
      });

      // Add comment via API
      setTimeout(async () => {
        await api.post(`/api/protocols/${testProtocol.id}/comments`, {
          sectionId: 'discussion',
          comment: 'Test comment'
        });
      }, 100);
    });

    it('should broadcast comment resolution', (done) => {
      // First create a comment
      db.protocolComments.create({
        protocol_id: testProtocol.id,
        section_id: 'test',
        user_id: testUser.id,
        comment: 'To be resolved'
      }).then(comment => {
        clientSocket2.on('comment-resolved', (data) => {
          expect(data.protocolId).toBe(testProtocol.id);
          expect(data.commentId).toBe(comment.id);
          expect(data.resolvedBy).toHaveProperty('name');
          done();
        });

        // Resolve comment via API
        setTimeout(async () => {
          await api.put(`/api/protocols/${testProtocol.id}/comments/${comment.id}/resolve`);
        }, 100);
      });
    });
  });

  describe('Connection Handling', () => {
    it('should handle multiple rapid connections', async () => {
      const sockets = [];
      
      // Create 5 sockets rapidly
      for (let i = 0; i < 5; i++) {
        const socket = Client(serverURL, {
          transports: ['websocket'],
          forceNew: true
        });
        sockets.push(socket);
      }

      // Wait for all to connect
      await Promise.all(
        sockets.map(socket => 
          new Promise(resolve => socket.on('connect', resolve))
        )
      );

      // All should be connected
      expect(sockets.every(s => s.connected)).toBe(true);

      // Clean up
      sockets.forEach(s => s.close());
    });

    it('should handle reconnection', (done) => {
      let disconnectCount = 0;
      let reconnectCount = 0;

      clientSocket1.on('disconnect', () => {
        disconnectCount++;
      });

      clientSocket1.on('connect', () => {
        reconnectCount++;
        if (reconnectCount === 2) { // Initial + reconnect
          expect(disconnectCount).toBe(1);
          done();
        }
      });

      // Force disconnect
      setTimeout(() => {
        clientSocket1.disconnect();
      }, 100);

      // Reconnect
      setTimeout(() => {
        clientSocket1.connect();
      }, 200);
    });
  });
});