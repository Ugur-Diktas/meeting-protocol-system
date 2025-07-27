# Meeting Protocol System - API Documentation

## Base URL

```
Development: http://localhost:3001
Production: https://your-api-domain.com
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "groupCode": "ABC123" // Optional
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "group_id": "uuid",
    "role": "member"
  },
  "token": "jwt-token"
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
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
  "token": "jwt-token"
}
```

#### Get Current User
```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
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

#### Update Profile
```http
PUT /api/auth/profile
```

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

**Response:**
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

#### Change Password
```http
POST /api/auth/change-password
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### Group Endpoints (To be implemented)

#### List Groups
```http
GET /api/groups
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "Development Team",
      "description": "Main development group",
      "code": "DEV123",
      "member_count": 5
    }
  ]
}
```

#### Create Group
```http
POST /api/groups
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Marketing Team",
  "description": "Marketing department group"
}
```

**Response:**
```json
{
  "message": "Group created successfully",
  "group": {
    "id": "uuid",
    "name": "Marketing Team",
    "description": "Marketing department group",
    "code": "MKT456"
  }
}
```

#### Join Group
```http
POST /api/groups/join
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "DEV123"
}
```

**Response:**
```json
{
  "message": "Successfully joined group",
  "group": {
    "id": "uuid",
    "name": "Development Team"
  }
}
```

### Protocol Endpoints (To be implemented)

#### List Protocols
```http
GET /api/protocols
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Response:**
```json
{
  "protocols": [
    {
      "id": "uuid",
      "title": "Weekly Team Meeting",
      "meeting_date": "2024-01-15",
      "created_by": {
        "id": "uuid",
        "name": "John Doe"
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Create Protocol
```http
POST /api/protocols
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Weekly Team Meeting",
  "meeting_date": "2024-01-15",
  "data": {
    "participants": ["John", "Jane", "Bob"],
    "agenda": ["Item 1", "Item 2"],
    "decisions": [],
    "tasks": []
  }
}
```

**Response:**
```json
{
  "message": "Protocol created successfully",
  "protocol": {
    "id": "uuid",
    "title": "Weekly Team Meeting",
    "meeting_date": "2024-01-15",
    "data": { ... }
  }
}
```

#### Get Protocol
```http
GET /api/protocols/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "protocol": {
    "id": "uuid",
    "title": "Weekly Team Meeting",
    "meeting_date": "2024-01-15",
    "data": {
      "participants": ["John", "Jane", "Bob"],
      "agenda": ["Item 1", "Item 2"],
      "decisions": ["Decision 1"],
      "tasks": [
        {
          "id": "task-1",
          "title": "Complete report",
          "assignee": "John",
          "due_date": "2024-01-20"
        }
      ]
    },
    "created_by": {
      "id": "uuid",
      "name": "John Doe"
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T11:30:00Z"
  }
}
```

#### Update Protocol
```http
PUT /api/protocols/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Meeting Title",
  "data": {
    "participants": ["John", "Jane", "Bob", "Alice"],
    "agenda": ["Item 1", "Item 2", "Item 3"],
    "decisions": ["Decision 1"],
    "tasks": [...]
  }
}
```

**Response:**
```json
{
  "message": "Protocol updated successfully",
  "protocol": { ... }
}
```

#### Generate PDF
```http
GET /api/protocols/:id/pdf
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
- Content-Type: `application/pdf`
- Binary PDF file

### WebSocket Events

#### Connection
```javascript
socket.connect('ws://localhost:3001', {
  auth: {
    token: 'jwt-token'
  }
});
```

#### Join Protocol Room
```javascript
socket.emit('join-protocol', protocolId);
```

#### Protocol Update
```javascript
// Send update
socket.emit('protocol-update', {
  protocolId: 'uuid',
  changes: { ... }
});

// Receive update
socket.on('protocol-updated', (data) => {
  console.log('Protocol updated:', data);
});
```

#### Leave Protocol Room
```javascript
socket.emit('leave-protocol', protocolId);
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute

## Pagination

List endpoints support pagination with these parameters:
- `page`: Page number (starts at 1)
- `limit`: Items per page (max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Versioning

The API uses URL versioning. Current version: v1

Future versions will use: `/api/v2/...`