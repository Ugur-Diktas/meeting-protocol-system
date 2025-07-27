# Meeting Protocol System - Database Schema Documentation

## Overview
This document describes the complete database structure for the Meeting Protocol Management System. The database is designed to support multi-group organizations with comprehensive protocol management, task tracking, and real-time collaboration features.

## Core Tables

### 1. **groups**
Represents organizations using the system.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| name | VARCHAR(255) | Organization name | NOT NULL |
| description | TEXT | Organization description | |
| code | VARCHAR(6) | Unique join code | UNIQUE, NOT NULL |
| settings | JSONB | Group-specific settings | DEFAULT '{}' |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT NOW() |
| updated_at | TIMESTAMP | Last update timestamp | AUTO-UPDATE |

### 2. **users**
System users belonging to groups.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| email | VARCHAR(255) | User email | UNIQUE, NOT NULL |
| name | VARCHAR(255) | Display name | NOT NULL |
| group_id | UUID | Associated group | FK → groups(id) |
| role | VARCHAR(50) | User role | DEFAULT 'member' |
| avatar_url | TEXT | Profile picture URL | |
| preferences | JSONB | User preferences | DEFAULT '{}' |
| last_active | TIMESTAMP | Last activity time | |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT NOW() |
| updated_at | TIMESTAMP | Last update timestamp | AUTO-UPDATE |

### 3. **protocol_templates**
Reusable protocol structures for meetings.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| group_id | UUID | Owning group | FK → groups(id) |
| name | VARCHAR(255) | Template name | NOT NULL |
| description | TEXT | Template description | |
| structure | JSONB | Template structure | NOT NULL |
| is_default | BOOLEAN | Default template flag | DEFAULT false |
| created_by | UUID | Creator user | FK → users(id) |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT NOW() |
| updated_at | TIMESTAMP | Last update timestamp | AUTO-UPDATE |

### 4. **protocols**
Meeting protocols - the core entity.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| group_id | UUID | Owning group | FK → groups(id), NOT NULL |
| template_id | UUID | Used template | FK → protocol_templates(id) |
| meeting_date | DATE | Meeting date | NOT NULL |
| title | VARCHAR(255) | Protocol title | NOT NULL |
| status | VARCHAR(50) | Protocol status | CHECK IN ('draft', 'active', 'finalized', 'archived') |
| data | JSONB | Protocol content | NOT NULL, DEFAULT '{}' |
| version | INTEGER | Version number | DEFAULT 1 |
| locked_sections | JSONB | Locked section IDs | DEFAULT '[]' |
| pdf_url | TEXT | Generated PDF URL | |
| created_by | UUID | Creator user | FK → users(id) |
| finalized_by | UUID | Finalizing user | FK → users(id) |
| finalized_at | TIMESTAMP | Finalization time | |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT NOW() |
| updated_at | TIMESTAMP | Last update timestamp | AUTO-UPDATE |

### 5. **protocol_versions**
Version history for protocols.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| protocol_id | UUID | Parent protocol | FK → protocols(id), NOT NULL |
| version | INTEGER | Version number | NOT NULL |
| data | JSONB | Full protocol data | NOT NULL |
| changes | JSONB | Change details | DEFAULT '{}' |
| changed_by | UUID | User who made changes | FK → users(id) |
| change_summary | TEXT | Summary of changes | |
| created_at | TIMESTAMP | Version timestamp | DEFAULT NOW() |

### 6. **protocol_attendees**
Meeting attendance tracking.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| protocol_id | UUID | Associated protocol | FK → protocols(id), NOT NULL |
| user_id | UUID | Attendee | FK → users(id), NOT NULL |
| attendance_type | VARCHAR(20) | Attendance type | CHECK IN ('present', 'online', 'absent', 'excused') |
| arrival_time | TIME | Arrival time | |
| departure_time | TIME | Departure time | |
| capacity_tasks | INTEGER | Task capacity % | DEFAULT 100 |
| capacity_responsibilities | INTEGER | Responsibility capacity % | DEFAULT 100 |
| notes | TEXT | Attendance notes | |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT NOW() |
| updated_at | TIMESTAMP | Last update timestamp | AUTO-UPDATE |

**Constraint**: UNIQUE(protocol_id, user_id)

### 7. **tasks**
Task management system.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| protocol_id | UUID | Origin protocol | FK → protocols(id) |
| group_id | UUID | Owning group | FK → groups(id), NOT NULL |
| parent_task_id | UUID | Parent task (subtasks) | FK → tasks(id) |
| title | TEXT | Task title | NOT NULL |
| description | TEXT | Task description | |
| assigned_to | UUID | Assigned user | FK → users(id) |
| created_by | UUID | Creator user | FK → users(id) |
| deadline | DATE | Due date | |
| reminder_date | DATE | Reminder date | |
| status | VARCHAR(50) | Task status | CHECK IN ('todo', 'in_progress', 'done', 'cancelled', 'delegated') |
| priority | VARCHAR(20) | Task priority | CHECK IN ('low', 'medium', 'high', 'urgent') |
| category | VARCHAR(100) | Task category | |
| tags | TEXT[] | Task tags | |
| attachments | JSONB | File attachments | DEFAULT '[]' |
| completion_notes | TEXT | Completion notes | |
| completed_at | TIMESTAMP | Completion timestamp | |
| recurring_pattern | JSONB | Recurrence settings | |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT NOW() |
| updated_at | TIMESTAMP | Last update timestamp | AUTO-UPDATE |

### 8. **task_comments**
Comments on tasks.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| task_id | UUID | Parent task | FK → tasks(id), NOT NULL |
| user_id | UUID | Comment author | FK → users(id) |
| comment | TEXT | Comment text | NOT NULL |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT NOW() |

### 9. **protocol_comments**
Discussion threads on protocol sections.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| protocol_id | UUID | Parent protocol | FK → protocols(id), NOT NULL |
| section_id | VARCHAR(100) | Protocol section ID | NOT NULL |
| user_id | UUID | Comment author | FK → users(id) |
| comment | TEXT | Comment text | NOT NULL |
| resolved | BOOLEAN | Resolution status | DEFAULT false |
| resolved_by | UUID | Resolver user | FK → users(id) |
| resolved_at | TIMESTAMP | Resolution timestamp | |
| created_at | TIMESTAMP | Creation timestamp | DEFAULT NOW() |

### 10. **files**
File attachments for protocols and tasks.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| group_id | UUID | Owning group | FK → groups(id), NOT NULL |
| protocol_id | UUID | Associated protocol | FK → protocols(id) |
| task_id | UUID | Associated task | FK → tasks(id) |
| uploaded_by | UUID | Uploader user | FK → users(id) |
| file_name | VARCHAR(255) | Original filename | NOT NULL |
| file_type | VARCHAR(100) | MIME type | |
| file_size | INTEGER | File size in bytes | |
| file_url | TEXT | Storage URL | NOT NULL |
| created_at | TIMESTAMP | Upload timestamp | DEFAULT NOW() |

### 11. **activity_logs**
Audit trail for all actions.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | PK, auto-generated |
| group_id | UUID | Group context | FK → groups(id), NOT NULL |
| user_id | UUID | Acting user | FK → users(id) |
| entity_type | VARCHAR(50) | Entity type | NOT NULL |
| entity_id | UUID | Entity ID | NOT NULL |
| action | VARCHAR(50) | Action performed | NOT NULL |
| details | JSONB | Action details | DEFAULT '{}' |
| ip_address | INET | User IP address | |
| user_agent | TEXT | User agent string | |
| created_at | TIMESTAMP | Action timestamp | DEFAULT NOW() |

## Indexes

### Performance Indexes
- `idx_users_group_id` - Quick group member lookups
- `idx_users_email` - Email-based authentication
- `idx_protocols_group_id` - Group protocol listings
- `idx_protocols_meeting_date` - Date-sorted protocols
- `idx_protocols_status` - Status filtering
- `idx_tasks_group_id` - Group task listings
- `idx_tasks_assigned_to` - User task assignments
- `idx_tasks_deadline` - Deadline-based queries
- `idx_tasks_status` - Status filtering
- `idx_protocol_attendees_protocol_id` - Attendance lookups
- `idx_activity_logs_group_id` - Group activity history
- `idx_activity_logs_created_at` - Time-based activity queries

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access data from their own group:

1. **View Policies**: Users can only SELECT data where group_id matches their group
2. **Insert Policies**: Users can only INSERT data with their group_id
3. **Update Policies**: Users can only UPDATE data in their group
4. **Delete Policies**: Restricted based on user role and ownership

## JSONB Structure Examples

### Protocol Data Structure
```json
{
  "attendance": {
    "present": ["user-id-1", "user-id-2"],
    "online": ["user-id-3"],
    "absent": ["user-id-4"]
  },
  "roles": {
    "leitung": "user-id-1",
    "protokoll": "user-id-2",
    "todos": "user-id-3",
    "zeitkontrolle": "user-id-4"
  },
  "checkin": [
    {
      "userId": "user-id-1",
      "status": "Gut, aber müde",
      "capacityTasks": 80,
      "capacityResponsibilities": 60
    }
  ],
  "sections": {
    "since_last_meeting": {
      "user-id-1": "Completed project X",
      "user-id-2": "Prepared presentation"
    },
    "review_updates": [
      {
        "time": "14:00",
        "who": "user-id-1",
        "protocol": "Discussion about budget",
        "takeouts": "Need to reduce costs"
      }
    ]
  },
  "customSections": []
}
```

### Template Structure
```json
{
  "sections": [
    {
      "id": "attendance",
      "type": "attendance",
      "title": "Anwesenheit",
      "required": true,
      "order": 1
    },
    {
      "id": "checkin",
      "type": "checkin",
      "title": "Check-In",
      "required": false,
      "order": 2,
      "fields": ["status", "capacityTasks", "capacityResponsibilities"]
    }
  ],
  "settings": {
    "requireApproval": false,
    "autoArchiveAfterDays": 365,
    "allowGuestAccess": false
  }
}
```

## Maintenance Notes

1. **Backups**: Supabase handles automatic backups
2. **Migrations**: Use Supabase migrations for schema changes
3. **Performance**: Monitor query performance using Supabase dashboard
4. **Cleanup**: Implement periodic cleanup of old activity logs
5. **Storage**: Files are stored in Supabase Storage, URLs in database

## Security Considerations

1. All user inputs are parameterized to prevent SQL injection
2. RLS policies ensure data isolation between groups
3. Sensitive actions are logged in activity_logs
4. File uploads are validated for type and size
5. JWT tokens expire and require renewal