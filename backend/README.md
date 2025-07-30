# Meeting Protocol System - Backend API Documentation

Node.js/Express backend API for the Meeting Protocol System with Supabase integration and real-time capabilities.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Run production server
npm start

# Run tests
npm test
```

## 🛠️ Technology Stack

- **Node.js** - JavaScript runtime
- **Express.js 5** - Web framework
- **Supabase** - Database and authentication
- **Socket.io** - Real-time communication
- **JWT** - JSON Web Tokens for authentication
- **Nodemailer** - Email notifications
- **Node-cron** - Scheduled jobs
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
backend/
├── controllers/        # Request handlers
├── middleware/         # Express middleware
├── routes/            # API routes
├── utils/             # Utility functions
├── models/            # Database models
├── __tests__/         # Test files
├── app.js             # Express app setup
├── server.js          # Server entry point
└── .env.example       # Environment variables example
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Resend Email Configuration
RESEND_API_KEY=re_your_resend_api_key_here

# Email Settings
EMAIL_FROM="Meeting Protocol System" <notifications@yourdomain.com>

# Scheduled Jobs
WEEKLY_EMAIL_CRON=0 9 * * 6
```

## 🔌 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "groupCode": "ABC123" // optional
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "group_id": "uuid", // null if no groupCode provided
    "role": "member"
  },
  "token": "jwt.token.here"
}
```

**Errors:**
- 400: Missing required fields or invalid email
- 409: Email already exists

---

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "group_id": "uuid",
    "role": "member"
  },
  "token": "jwt.token.here"
}
```

**Errors:**
- 400: Missing credentials
- 401: Invalid credentials

---

#### GET `/api/auth/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "group_id": "uuid",
    "role": "member"
  }
}
```

**Errors:**
- 401: No token or invalid token

---

#### PUT `/api/auth/profile`
Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Doe"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "group_id": "uuid",
    "role": "member"
  }
}
```

---

#### POST `/api/auth/change-password`
Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Errors:**
- 400: Missing passwords
- 401: Current password incorrect

---

#### POST `/api/auth/logout`
Logout user (optional auth, idempotent).

**Headers (optional):**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### Group Management Endpoints

#### GET `/api/groups/my-group`
Get current user's group details with members.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "group": {
    "id": "uuid",
    "name": "Engineering Team",
    "description": "Main engineering group",
    "code": "ENG123",
    "settings": {},
    "created_at": "2024-01-01T00:00:00Z"
  },
  "members": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "group_id": "uuid"
    }
  ]
}
```

**Errors:**
- 404: User not in any group

---

#### POST `/api/groups/create`
Create a new group (user becomes admin).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Marketing Team",
  "description": "Marketing department group" // optional
}
```

**Response (201):**
```json
{
  "message": "Group created successfully",
  "group": {
    "id": "uuid",
    "name": "Marketing Team",
    "description": "Marketing department group",
    "code": "MKT789",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "code": "MKT789"
}
```

**Errors:**
- 400: Missing group name

---

#### POST `/api/groups/join`
Join a group using invite code.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "ABC123"
}
```

**Response (200):**
```json
{
  "message": "Successfully joined the group",
  "group": {
    "id": "uuid",
    "name": "Engineering Team",
    "description": "Main engineering group",
    "code": "ABC123"
  }
}
```

**Errors:**
- 400: Already in a group or missing code
- 404: Invalid group code

---

#### POST `/api/groups/leave`
Leave current group.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Successfully left the group"
}
```

**Errors:**
- 400: Not a member of any group

---

#### PUT `/api/groups/update`
Update group details (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Team Name", // optional
  "description": "Updated description", // optional
  "settings": { // optional
    "theme": "dark",
    "notifications": true
  }
}
```

**Response (200):**
```json
{
  "message": "Group updated successfully",
  "group": {
    "id": "uuid",
    "name": "Updated Team Name",
    "description": "Updated description",
    "settings": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

**Errors:**
- 403: Not an admin or not in a group

---

#### GET `/api/groups/activity`
Get group activity log.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 50)

**Response (200):**
```json
{
  "activities": [
    {
      "id": "uuid",
      "group_id": "uuid",
      "user_id": "uuid",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "entity_type": "task",
      "entity_id": "uuid",
      "action": "created",
      "details": {
        "title": "New Task",
        "assignedTo": "uuid"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Protocol Management Endpoints

#### GET `/api/protocols`
Get all protocols for the user's group.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (draft, active, finalized)
- `startDate` (optional): Filter by meeting date start (YYYY-MM-DD)
- `endDate` (optional): Filter by meeting date end (YYYY-MM-DD)

**Response (200):**
```json
{
  "protocols": [
    {
      "id": "uuid",
      "group_id": "uuid",
      "template_id": "uuid",
      "meeting_date": "2024-01-15",
      "title": "Weekly Team Meeting",
      "status": "draft",
      "data": {},
      "version": 1,
      "created_by": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "template": {
        "id": "uuid",
        "name": "Weekly Meeting Template"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST `/api/protocols`
Create a new protocol.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "templateId": "uuid", // optional
  "meetingDate": "2024-01-15",
  "title": "Weekly Team Meeting",
  "data": { // optional, uses template data if templateId provided
    "attendance": {
      "present": ["user-id-1"],
      "online": [],
      "absent": []
    }
  }
}
```

**Response (201):**
```json
{
  "message": "Protocol created successfully",
  "protocol": {
    "id": "uuid",
    "group_id": "uuid",
    "template_id": "uuid",
    "meeting_date": "2024-01-15",
    "title": "Weekly Team Meeting",
    "status": "draft",
    "data": {},
    "created_by": "uuid",
    "version": 1
  }
}
```

**Errors:**
- 400: Missing required fields

---

#### GET `/api/protocols/:id`
Get single protocol with details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "protocol": {
    "id": "uuid",
    "group_id": "uuid",
    "meeting_date": "2024-01-15",
    "title": "Weekly Team Meeting",
    "status": "draft",
    "data": {},
    "version": 2,
    "created_by": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "finalized_by": null,
    "template": {
      "id": "uuid",
      "name": "Weekly Meeting Template",
      "structure": {}
    },
    "attendees": [
      {
        "user_id": "uuid",
        "user": {
          "id": "uuid",
          "name": "Jane Doe",
          "email": "jane@example.com"
        },
        "attendance_type": "present",
        "arrival_time": null,
        "departure_time": null,
        "capacity_tasks": 80,
        "capacity_responsibilities": 90
      }
    ],
    "comments": [
      {
        "id": "uuid",
        "section_id": "attendance",
        "comment": "Missing team member",
        "user": {
          "id": "uuid",
          "name": "John Doe"
        },
        "resolved": false,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

**Errors:**
- 403: Access denied (different group)
- 404: Protocol not found

---

#### PUT `/api/protocols/:id`
Update protocol.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Meeting Title", // optional
  "data": {}, // optional
  "status": "active", // optional
  "lockedSections": ["attendance"] // optional
}
```

**Response (200):**
```json
{
  "message": "Protocol updated successfully",
  "protocol": {
    "id": "uuid",
    "title": "Updated Meeting Title",
    "status": "active",
    "version": 2,
    "locked_sections": ["attendance"]
  }
}
```

**Notes:**
- Creates version history automatically
- Cannot modify finalized protocols
- Emits real-time update via Socket.io

**Errors:**
- 400: Cannot modify finalized protocol
- 403: Access denied
- 404: Protocol not found

---

#### PUT `/api/protocols/:id/section`
Update specific section of protocol.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sectionId": "attendance",
  "content": {
    "present": ["user-id-1", "user-id-2"],
    "online": ["user-id-3"],
    "absent": []
  }
}
```

**Response (200):**
```json
{
  "message": "Section updated successfully",
  "section": {
    "id": "attendance",
    "content": {
      "present": ["user-id-1", "user-id-2"],
      "online": ["user-id-3"],
      "absent": []
    }
  }
}
```

**Notes:**
- Cannot update locked sections
- Emits real-time update via Socket.io

**Errors:**
- 400: Missing required fields or section locked
- 403: Access denied
- 404: Protocol not found

---

#### POST `/api/protocols/:id/finalize`
Finalize a protocol.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Protocol finalized successfully",
  "protocol": {
    "id": "uuid",
    "status": "finalized",
    "finalized_by": "uuid",
    "finalized_at": "2024-01-15T12:00:00Z"
  }
}
```

**Notes:**
- Creates tasks from todos section automatically
- Cannot be undone

---

#### GET `/api/protocols/:id/versions`
Get protocol version history.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "versions": [
    {
      "id": "uuid",
      "protocol_id": "uuid",
      "version": 1,
      "data": {},
      "changed_by": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "changes": {
        "title": {
          "old": "Original Title",
          "new": "Updated Title"
        }
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### PUT `/api/protocols/:id/attendees`
Update protocol attendees.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "attendees": [
    {
      "userId": "uuid",
      "type": "present", // present, online, absent
      "arrivalTime": "14:30", // optional
      "departureTime": "16:00", // optional
      "capacityTasks": 80, // optional, default 100
      "capacityResponsibilities": 90, // optional, default 100
      "notes": "Left early for appointment" // optional
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Attendees updated successfully"
}
```

---

#### POST `/api/protocols/:id/comments`
Add comment to protocol section.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sectionId": "attendance",
  "comment": "John is missing from the meeting"
}
```

**Response (201):**
```json
{
  "message": "Comment added successfully",
  "comment": {
    "id": "uuid",
    "protocol_id": "uuid",
    "section_id": "attendance",
    "user_id": "uuid",
    "comment": "John is missing from the meeting",
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "resolved": false,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Notes:**
- Emits real-time update via Socket.io

**Errors:**
- 400: Missing required fields

---

#### PUT `/api/protocols/:id/comments/:commentId/resolve`
Resolve a protocol comment.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Comment resolved successfully",
  "comment": {
    "id": "uuid",
    "resolved": true,
    "resolved_by": "uuid",
    "resolved_at": "2024-01-15T11:00:00Z"
  }
}
```

**Notes:**
- Emits real-time update via Socket.io

### Task Management Endpoints

#### GET `/api/tasks`
Get all tasks for the group.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `assignedTo` (optional): Filter by assigned user ID
- `status` (optional): Filter by status (todo, in_progress, done, cancelled, delegated)
- `priority` (optional): Filter by priority (low, medium, high, urgent)
- `overdue` (optional): Set to "true" to filter overdue tasks

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "protocol_id": "uuid",
      "group_id": "uuid",
      "title": "Complete documentation",
      "description": "Write API documentation",
      "status": "todo",
      "priority": "high",
      "deadline": "2024-01-20",
      "tags": ["documentation", "api"],
      "category": "development",
      "assigned_to": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "created_by": {
        "id": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "protocol": {
        "id": "uuid",
        "title": "Weekly Meeting",
        "meeting_date": "2024-01-15"
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Notes:**
- Tasks are ordered by deadline (ascending)

---

#### GET `/api/tasks/my-tasks`
Get tasks assigned to current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- Same as GET /api/tasks (except assignedTo)

**Response (200):**
```json
{
  "tasks": [
    // Same structure as GET /api/tasks
  ]
}
```

---

#### GET `/api/tasks/stats`
Get task statistics for the group.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "stats": {
    "total": 42,
    "byStatus": {
      "todo": 15,
      "in_progress": 10,
      "done": 12,
      "cancelled": 3,
      "delegated": 2
    },
    "byPriority": {
      "low": 8,
      "medium": 20,
      "high": 10,
      "urgent": 4
    },
    "overdue": 5,
    "myTasks": {
      "total": 8,
      "todo": 3,
      "in_progress": 2,
      "overdue": 1
    }
  }
}
```

---

#### GET `/api/tasks/upcoming`
Get upcoming tasks with deadlines.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (optional): Number of days to look ahead (default: 7)

**Response (200):**
```json
{
  "tasks": [
    // Tasks with deadlines within specified days
  ],
  "count": 5
}
```

---

#### POST `/api/tasks`
Create a new task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "protocolId": "uuid", // optional
  "title": "Complete documentation",
  "description": "Write comprehensive API docs", // optional
  "assignedTo": "uuid", // optional
  "deadline": "2024-01-20", // optional
  "priority": "high", // optional: low, medium, high, urgent (default: medium)
  "category": "development", // optional
  "tags": ["documentation", "api"] // optional
}
```

**Response (201):**
```json
{
  "message": "Task created successfully",
  "task": {
    "id": "uuid",
    "protocol_id": "uuid",
    "group_id": "uuid",
    "title": "Complete documentation",
    "description": "Write comprehensive API docs",
    "status": "todo",
    "priority": "high",
    "deadline": "2024-01-20",
    "assigned_to": "uuid",
    "created_by": "uuid",
    "category": "development",
    "tags": ["documentation", "api"],
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Notes:**
- Emits real-time update via Socket.io
- Default status is "todo"

**Errors:**
- 400: Missing title

---

#### GET `/api/tasks/:id`
Get single task with details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "task": {
    "id": "uuid",
    "title": "Complete documentation",
    "description": "Write comprehensive API docs",
    "status": "in_progress",
    "priority": "high",
    "deadline": "2024-01-20",
    "assigned_to": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "created_by": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "comments": [
      {
        "id": "uuid",
        "task_id": "uuid",
        "user_id": "uuid",
        "comment": "Made good progress today",
        "user": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "created_at": "2024-01-16T14:00:00Z"
      }
    ],
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Errors:**
- 403: Access denied (different group)
- 404: Task not found

---

#### PUT `/api/tasks/:id`
Update task details.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated task title", // optional
  "description": "Updated description", // optional
  "assignedTo": "uuid", // optional
  "deadline": "2024-01-25", // optional
  "priority": "urgent", // optional
  "category": "bug-fix", // optional
  "tags": ["urgent", "bug"] // optional
}
```

**Response (200):**
```json
{
  "message": "Task updated successfully",
  "task": {
    // Updated task object
  }
}
```

**Notes:**
- Emits real-time update via Socket.io

---

#### PATCH `/api/tasks/:id/status`
Update task status.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "done", // todo, in_progress, done, cancelled, delegated
  "completionNotes": "Completed successfully with all requirements met" // optional, for done status
}
```

**Response (200):**
```json
{
  "message": "Task status updated successfully",
  "task": {
    "id": "uuid",
    "status": "done",
    "completed_at": "2024-01-18T16:00:00Z",
    "completion_notes": "Completed successfully with all requirements met"
  }
}
```

**Notes:**
- Emits real-time update via Socket.io
- Sets completed_at timestamp when status is "done"

**Errors:**
- 400: Missing status

---

#### DELETE `/api/tasks/:id`
Delete a task.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

**Notes:**
- Only creator or assigned user can delete
- Emits real-time update via Socket.io

**Errors:**
- 403: Not authorized (not creator or assigned user)
- 404: Task not found

---

#### POST `/api/tasks/:id/comments`
Add comment to task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "comment": "Progress update: 50% complete"
}
```

**Response (201):**
```json
{
  "message": "Comment added successfully",
  "comment": {
    "id": "uuid",
    "task_id": "uuid",
    "user_id": "uuid",
    "comment": "Progress update: 50% complete",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "created_at": "2024-01-16T14:00:00Z"
  }
}
```

**Notes:**
- Emits real-time update via Socket.io

**Errors:**
- 400: Missing comment

### User Settings Endpoints

#### GET `/api/users/settings`
Get current user's settings and preferences.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "role": "member",
    "group_id": "uuid"
  },
  "preferences": {
    "notifications": {
      "weeklyTodoEmail": true,
      "emailTime": "09:00",
      "timezone": "UTC"
    },
    "ui": {
      "theme": "light", // light, dark, system
      "colorScheme": "blue", // blue, green, purple, orange
      "language": "en",
      "dateFormat": "MM/DD/YYYY",
      "timeFormat": "12h"
    },
    "tasks": {
      "defaultView": "list", // list, kanban, calendar
      "showCompletedTasks": true,
      "groupByPriority": false
    },
    "protocols": {
      "autoSave": true,
      "autoSaveInterval": 30,
      "showVersionHistory": true
    }
  }
}
```

---

#### PUT `/api/users/settings`
Update user settings and preferences.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Doe", // optional
  "avatar_url": "https://example.com/new-avatar.jpg", // optional
  "preferences": { // optional, deep merged with existing
    "ui": {
      "theme": "dark",
      "colorScheme": "purple"
    },
    "notifications": {
      "weeklyTodoEmail": false
    }
  }
}
```

**Response (200):**
```json
{
  "message": "Settings updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "role": "member",
    "group_id": "uuid"
  },
  "preferences": {
    // Updated preferences object
  }
}
```

---

#### GET `/api/users/settings/notifications`
Get notification preferences only.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "notifications": {
    "weeklyTodoEmail": true,
    "emailTime": "09:00",
    "timezone": "UTC"
  }
}
```

---

#### PUT `/api/users/settings/notifications`
Update notification preferences.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "weeklyTodoEmail": false, // optional
  "emailTime": "18:00", // optional, 24h format
  "timezone": "America/New_York" // optional, IANA timezone
}
```

**Response (200):**
```json
{
  "message": "Notification settings updated successfully",
  "notifications": {
    "weeklyTodoEmail": false,
    "emailTime": "18:00",
    "timezone": "America/New_York"
  }
}
```

---

#### GET `/api/users/settings/ui-options`
Get available UI customization options.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "themes": [
    { "value": "light", "label": "Light" },
    { "value": "dark", "label": "Dark" },
    { "value": "system", "label": "System" }
  ],
  "colorSchemes": [
    { "value": "blue", "label": "Blue", "primary": "#4A90E2", "secondary": "#357ABD" },
    { "value": "green", "label": "Green", "primary": "#27AE60", "secondary": "#229954" },
    { "value": "purple", "label": "Purple", "primary": "#8E44AD", "secondary": "#7D3C98" },
    { "value": "orange", "label": "Orange", "primary": "#E67E22", "secondary": "#D68910" }
  ],
  "languages": [
    { "value": "en", "label": "English" },
    { "value": "de", "label": "Deutsch" },
    { "value": "fr", "label": "Français" },
    { "value": "es", "label": "Español" }
  ],
  "dateFormats": [
    { "value": "MM/DD/YYYY", "label": "MM/DD/YYYY" },
    { "value": "DD/MM/YYYY", "label": "DD/MM/YYYY" },
    { "value": "YYYY-MM-DD", "label": "YYYY-MM-DD" }
  ],
  "timeFormats": [
    { "value": "12h", "label": "12-hour (AM/PM)" },
    { "value": "24h", "label": "24-hour" }
  ]
}
```

---

#### POST `/api/users/test-email`
Send a test weekly summary email to the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Test email sent successfully",
  "preview": {
    "taskCount": 5,
    "email": "user@example.com"
  }
}
```

**Errors:**
- 500: Email service not configured or send failed

### Template Management Endpoints

#### GET `/api/templates`
Get all available templates.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "templates": [
    {
      "id": "uuid",
      "group_id": null, // null for default templates
      "name": "VSS Protocol Template",
      "description": "Standard VSS meeting protocol",
      "structure": {
        "sections": [
          {
            "id": "attendance",
            "type": "attendance",
            "title": "Anwesenheit",
            "order": 1,
            "required": true
          }
        ]
      },
      "is_default": true,
      "created_by": null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Notes:**
- Returns both default templates and group-specific templates
- Ordered by is_default (desc), then name

---

#### GET `/api/templates/:id`
Get single template with structure.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "template": {
    "id": "uuid",
    "group_id": "uuid",
    "name": "Weekly Standup Template",
    "description": "Template for weekly team standups",
    "structure": {
      "sections": [
        {
          "id": "attendance",
          "type": "attendance",
          "title": "Team Attendance",
          "order": 1,
          "required": true,
          "fields": {
            "present": { "label": "Present", "type": "user_select", "multiple": true },
            "online": { "label": "Online", "type": "user_select", "multiple": true },
            "absent": { "label": "Absent", "type": "user_select", "multiple": true }
          }
        },
        {
          "id": "updates",
          "type": "text_per_person",
          "title": "Weekly Updates",
          "order": 2,
          "required": false
        }
      ]
    },
    "is_default": false,
    "created_by": "uuid",
    "created_at": "2024-01-10T00:00:00Z"
  }
}
```

**Errors:**
- 403: Access denied (template from different group)
- 404: Template not found

---

#### POST `/api/templates`
Create custom template for group.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Sprint Review Template",
  "description": "Template for sprint review meetings", // optional
  "structure": {
    "sections": [
      {
        "id": "attendance",
        "type": "attendance",
        "title": "Attendees",
        "order": 1,
        "required": true
      },
      {
        "id": "sprint_summary",
        "type": "discussion",
        "title": "Sprint Summary",
        "order": 2,
        "required": true
      },
      {
        "id": "demos",
        "type": "text_per_person",
        "title": "Feature Demos",
        "order": 3,
        "required": false
      },
      {
        "id": "retrospective",
        "type": "matrix",
        "title": "Retrospective",
        "order": 4,
        "required": false,
        "columns": [
          { "id": "went_well", "label": "Went Well" },
          { "id": "could_improve", "label": "Could Improve" },
          { "id": "action_items", "label": "Action Items" }
        ]
      }
    ]
  }
}
```

**Valid Section Types:**
- `attendance` - Track meeting attendance
- `roles` - Assign meeting roles
- `checkin` - Personal check-in round
- `text_per_person` - Text input per attendee
- `matrix` - Multi-column matrix
- `timeline` - Timeline of events
- `events` - Event tracking
- `todos` - Task assignments
- `discussion` - Free-form discussion notes
- `varia` - Miscellaneous items
- `section_group` - Grouped subsections

**Response (201):**
```json
{
  "message": "Template created successfully",
  "template": {
    "id": "uuid",
    "group_id": "uuid",
    "name": "Sprint Review Template",
    "description": "Template for sprint review meetings",
    "structure": { /* ... */ },
    "created_by": "uuid",
    "created_at": "2024-01-15T00:00:00Z"
  }
}
```

**Errors:**
- 400: Missing name/structure or invalid structure

---

#### PUT `/api/templates/:id`
Update custom template.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Template Name", // optional
  "description": "Updated description", // optional
  "structure": { /* updated structure */ } // optional
}
```

**Response (200):**
```json
{
  "message": "Template updated successfully",
  "template": {
    // Updated template object
  }
}
```

**Errors:**
- 403: Cannot update default templates or templates from other groups
- 404: Template not found

---

#### DELETE `/api/templates/:id`
Delete custom template.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Template deleted successfully"
}
```

**Errors:**
- 400: Cannot delete default templates
- 403: Cannot delete templates from other groups
- 404: Template not found

### Admin Endpoints

#### POST `/api/admin/jobs/weekly-email`
Manually trigger the weekly todo email job (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Weekly email job completed",
  "summary": {
    "sent": 42,
    "failed": 2,
    "skipped": 8,
    "errors": 0,
    "duration": 5234
  }
}
```

**Errors:**
- 403: Admin access required
- 500: Job execution failed

## 🔄 Real-time Events (Socket.io)

### Connection
```javascript
const socket = io('http://localhost:3001', {
  transports: ['websocket']
});
```

### Protocol Room Events

#### Join Protocol Room
```javascript
// Client → Server
socket.emit('join-protocol', protocolId);

// Server → Other Clients
socket.on('user-joined', {
  socketId: 'socket-id',
  protocolId: 'protocol-id'
});
```

#### Leave Protocol Room
```javascript
// Client → Server
socket.emit('leave-protocol', protocolId);

// Server → Other Clients
socket.on('user-left', {
  socketId: 'socket-id',
  protocolId: 'protocol-id'
});
```

#### Protocol Updates
```javascript
// Client → Server
socket.emit('protocol-update', {
  protocolId: 'uuid',
  section: 'attendance',
  content: { /* updated data */ }
});

// Server → Other Clients
socket.on('protocol-updated', {
  protocolId: 'uuid',
  updates: { /* changes */ },
  updatedBy: { /* user info */ }
});

// Section-specific update (from API)
socket.on('section-updated', {
  protocolId: 'uuid',
  sectionId: 'attendance',
  content: { /* new content */ },
  updatedBy: { /* user info */ }
});
```

### Collaborative Editing Events

#### Cursor Position
```javascript
// Client → Server
socket.emit('cursor-position', {
  protocolId: 'uuid',
  userId: 'uuid',
  position: { line: 5, column: 10 },
  section: 'notes'
});

// Server → Other Clients
socket.on('cursor-moved', {
  userId: 'uuid',
  position: { line: 5, column: 10 },
  section: 'notes'
});
```

#### Typing Indicators
```javascript
// Client → Server
socket.emit('typing-start', {
  protocolId: 'uuid',
  userId: 'uuid',
  section: 'discussion'
});

socket.emit('typing-stop', {
  protocolId: 'uuid',
  userId: 'uuid',
  section: 'discussion'
});

// Server → Other Clients
socket.on('user-typing', {
  userId: 'uuid',
  section: 'discussion'
});

socket.on('user-stopped-typing', {
  userId: 'uuid',
  section: 'discussion'
});
```

### Group Room Events

#### Join Group Room
```javascript
// Client → Server
socket.emit('join-group', groupId);
```

#### Task Updates
```javascript
// Server → Clients (from API)
socket.on('task-created', {
  task: { /* task object */ },
  createdBy: { /* user info */ }
});

socket.on('task-updated', {
  task: { /* updated task */ },
  updatedBy: { /* user info */ }
});

socket.on('task-status-updated', {
  taskId: 'uuid',
  status: 'in_progress',
  updatedBy: { /* user info */ }
});

socket.on('task-deleted', {
  taskId: 'uuid',
  deletedBy: { /* user info */ }
});

socket.on('task-comment-added', {
  taskId: 'uuid',
  comment: { /* comment object */ }
});
```

### Protocol Comments
```javascript
// Server → Clients (from API)
socket.on('comment-added', {
  protocolId: 'uuid',
  comment: { /* comment object */ }
});

socket.on('comment-resolved', {
  protocolId: 'uuid',
  commentId: 'uuid',
  resolvedBy: { /* user info */ }
});
```

## 🗄️ Database Schema

### Core Tables

#### users
```sql
- id (UUID, PK, references auth.users)
- email (VARCHAR(255), UNIQUE, NOT NULL)
- name (VARCHAR(255), NOT NULL)
- group_id (UUID, FK → groups)
- role (VARCHAR(50), DEFAULT 'member')
- avatar_url (TEXT)
- preferences (JSONB, DEFAULT '{}')
- last_active (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Preferences Structure:**
```json
{
  "notifications": {
    "weeklyTodoEmail": boolean,
    "emailTime": "HH:MM",
    "timezone": "IANA timezone"
  },
  "ui": {
    "theme": "light|dark|system",
    "colorScheme": "blue|green|purple|orange",
    "language": "en|de|fr|es",
    "dateFormat": "MM/DD/YYYY|DD/MM/YYYY|YYYY-MM-DD",
    "timeFormat": "12h|24h"
  },
  "tasks": {
    "defaultView": "list|kanban|calendar",
    "showCompletedTasks": boolean,
    "groupByPriority": boolean
  },
  "protocols": {
    "autoSave": boolean,
    "autoSaveInterval": number,
    "showVersionHistory": boolean
  }
}
```

#### groups
```sql
- id (UUID, PK)
- name (VARCHAR(255), NOT NULL)
- description (TEXT)
- code (VARCHAR(10), UNIQUE)
- settings (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### protocols
```sql
- id (UUID, PK)
- group_id (UUID, FK → groups)
- template_id (UUID, FK → protocol_templates)
- meeting_date (DATE, NOT NULL)
- title (VARCHAR(255), NOT NULL)
- data (JSONB, DEFAULT '{}')
- status (VARCHAR(50), DEFAULT 'draft')
- version (INTEGER, DEFAULT 1)
- locked_sections (TEXT[])
- created_by (UUID, FK → users)
- finalized_by (UUID, FK → users)
- finalized_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### tasks
```sql
- id (UUID, PK)
- protocol_id (UUID, FK → protocols)
- group_id (UUID, FK → groups)
- title (VARCHAR(255), NOT NULL)
- description (TEXT)
- status (VARCHAR(50), DEFAULT 'todo')
- priority (VARCHAR(50), DEFAULT 'medium')
- deadline (DATE)
- assigned_to (UUID, FK → users)
- created_by (UUID, FK → users)
- category (VARCHAR(100))
- tags (TEXT[])
- completed_at (TIMESTAMP)
- completion_notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### protocol_templates
```sql
- id (UUID, PK)
- group_id (UUID, FK → groups, NULL for defaults)
- name (VARCHAR(255), NOT NULL)
- description (TEXT)
- structure (JSONB, NOT NULL)
- is_default (BOOLEAN, DEFAULT false)
- created_by (UUID, FK → users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Database Optimizations

#### Removed Tables
- **files** - Not implemented, removed to simplify schema
- **protocol_sessions** - Not used, removed

#### Added Indexes
```sql
-- User queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_group_id ON users(group_id);
CREATE INDEX idx_users_email_notifications ON users((preferences->'notifications'->>'weeklyTodoEmail'));

-- Task queries
CREATE INDEX idx_tasks_group_assigned ON tasks(group_id, assigned_to);
CREATE INDEX idx_tasks_deadline ON tasks(deadline) WHERE status NOT IN ('done', 'cancelled');

-- Protocol queries
CREATE INDEX idx_protocols_group_date ON protocols(group_id, meeting_date DESC);

-- Activity log queries
CREATE INDEX idx_activity_logs_group_id_created ON activity_logs(group_id, created_at DESC);
```

#### Maintenance Functions
```sql
-- Cleanup old activity logs
CREATE FUNCTION cleanup_old_activity_logs()
-- Automatically removes logs older than 90 days
```

## 🐛 Common Issues & Solutions

### CORS Errors
Ensure FRONTEND_URL is correctly set in .env file.

### Authentication Failures
1. Verify JWT_SECRET is set
2. Check token format: `Bearer <token>`
3. Ensure user exists in database

### Database Connection
1. Verify Supabase credentials
2. Check network connectivity
3. Ensure Supabase project is active

### Socket.io Connection
1. Check CORS settings
2. Verify WebSocket transport is allowed
3. Check firewall/proxy settings

### Email Notifications Not Working
1. **No Email Service Configured**
   - Set RESEND_API_KEY in .env file
   - Check EMAIL_FROM is valid
   - For testing, use: `onboarding@resend.dev`

2. **Resend API Issues**
   - Verify API key is correct (starts with `re_`)
   - Check Resend dashboard for failed emails
   - Monitor rate limits (100/day on free tier)
   - View email logs at: https://resend.com/emails
   
3. **Domain Verification (Production)**
   - Verify your domain in Resend dashboard
   - Add required DNS records
   - Wait for propagation (usually quick)
   
4. **Weekly Emails Not Sending**
   - Check user preferences: `weeklyTodoEmail: true`
   - Verify cron job is running (check logs)
   - Test manually: `POST /api/admin/jobs/weekly-email`
   - Check Resend dashboard for delivery status

### Scheduled Jobs Not Running
1. Jobs are disabled in test environment
2. Check `WEEKLY_EMAIL_CRON` format
3. Verify server stays running (use PM2 in production)
4. Check logs for job execution

## 🚀 Deployment Notes

### Environment Variables Required
- `NODE_ENV=production`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET` (use strong secret)
- `FRONTEND_URL` (production frontend URL)
- `RESEND_API_KEY` (from resend.com)
- `EMAIL_FROM` (verified domain email)
- `WEEKLY_EMAIL_CRON` (optional, defaults to '0 9 * * 6')

### Security Checklist
- ✅ Use HTTPS in production
- ✅ Set secure JWT secret
- ✅ Configure CORS properly
- ✅ Enable rate limiting
- ✅ Use Helmet.js (already included)
- ✅ Validate all inputs
- ✅ Sanitize user data

### Performance Optimization
- Enable compression (already included)
- Implement caching where appropriate
- Use database indexes
- Consider pagination for large datasets
- Optimize Socket.io for scale

## 📧 Email Notifications

### Weekly Todo Summary
Every Saturday morning, users receive an email summary of their pending tasks:
- **Overdue tasks** - Tasks past their deadline
- **Upcoming tasks** - Tasks with deadlines in the future
- **Tasks without deadlines** - Other pending tasks

Users can:
- Enable/disable emails in settings
- Set preferred delivery time
- Configure timezone
- Send test emails

### Email Configuration with Resend

#### 1. Sign up for Resend
1. Go to [resend.com](https://resend.com)
2. Create a free account (100 emails/day, 3,000/month)
3. Verify your domain or use their test domain

#### 2. Get your API Key
1. Go to API Keys in Resend dashboard
2. Create a new API key
3. Copy it to your `.env` file

#### 3. Configure Environment
```env
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here

# Email From Address
# Use your verified domain or Resend's test domain
EMAIL_FROM="Meeting Protocol" <notifications@yourdomain.com>
# Or for testing:
# EMAIL_FROM="Meeting Protocol" <onboarding@resend.dev>
```

#### 4. Domain Verification (Production)
For production, verify your domain in Resend:
1. Add DNS records as shown in Resend dashboard
2. Wait for verification (usually minutes)
3. Use your domain in EMAIL_FROM

#### 5. Testing Emails Locally
```bash
# Use Resend's test email address
EMAIL_FROM="Meeting Protocol" <onboarding@resend.dev>

# Test emails will be sent to Resend's dashboard
# View them at: https://resend.com/emails
```

### Email Features
- **Beautiful HTML templates** with responsive design
- **Task statistics** showing total, overdue, and upcoming
- **Priority indicators** with color coding
- **Direct links** to view tasks in the app
- **Preference management** links
- **Resend tags** for email analytics

## 🕐 Scheduled Jobs

### Active Jobs
1. **Weekly Todo Emails**
   - Schedule: Every Saturday at 9 AM UTC (configurable)
   - Sends task summaries to users with notifications enabled
   - Batched processing for scalability

2. **Cleanup Job**
   - Schedule: Daily at 2 AM UTC
   - Removes activity logs older than 90 days
   - Maintains database performance

### Job Management
- Jobs automatically start on server startup
- Admin can manually trigger jobs via API
- Jobs are disabled in test environment
- Graceful shutdown on SIGTERM

### Custom Schedule
Set custom cron expressions via environment variables:
```env
# Examples:
WEEKLY_EMAIL_CRON=0 9 * * 6    # Saturday 9 AM UTC
WEEKLY_EMAIL_CRON=0 10 * * 1   # Monday 10 AM UTC
WEEKLY_EMAIL_CRON=0 8 * * 0    # Sunday 8 AM UTC
```