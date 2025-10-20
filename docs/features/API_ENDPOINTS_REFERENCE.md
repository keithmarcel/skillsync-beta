# Employer Invitations API Reference

Complete API documentation for the employer invitation system.

---

## Candidate Side - User Invitation Management

### GET /api/invitations
Get all active invitations for the current user.

**Query Parameters:**
- `status` (optional): Filter by status (All, Pending, Applied, Declined)
- `readiness` (optional): Filter by readiness (All, Ready, Building Skills)
- `search` (optional): Search company name or job title

**Response:**
```json
{
  "invitations": [
    {
      "id": "uuid",
      "company": { "name": "Power Design", "logo_url": "..." },
      "job": { "title": "Mechanical Assistant Project Manager", "soc_code": "..." },
      "proficiency_pct": 99,
      "status": "sent",
      "is_read": false,
      "invited_at": "2025-10-02T...",
      ...
    }
  ]
}
```

---

### GET /api/invitations/archived
Get archived invitations for the current user.

**Response:**
```json
{
  "invitations": [...]
}
```

---

### GET /api/invitations/notifications
Get recent invitations for notification dropdown.

**Query Parameters:**
- `limit` (optional): Number of invitations to return (default: 12)

**Response:**
```json
{
  "unreadCount": 3,
  "invitations": [...]
}
```

---

### POST /api/invitations/notifications/mark-read
Mark all invitations as read.

**Response:**
```json
{
  "success": true
}
```

---

### PATCH /api/invitations/[id]
Update invitation status (candidate actions).

**Body:**
```json
{
  "action": "view" | "apply" | "decline" | "archive" | "reopen"
}
```

**Actions:**
- `view` - Mark as viewed (when clicking "View Application")
- `apply` - Mark as applied
- `decline` - Mark as declined
- `archive` - Move to archived
- `reopen` - Reopen from archived

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/invitations/bulk
Bulk actions on invitations.

**Body:**
```json
{
  "action": "archive",
  "invitationIds": ["uuid1", "uuid2", ...]
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Employer Side - Candidate Management

### GET /api/employer/candidates
Get all candidates for employer's company.

**Query Parameters:**
- `role` (optional): Filter by specific role/job_id
- `readiness` (optional): Filter by readiness (All, Ready, Building Skills)
- `status` (optional): Filter by status (All, Pending, Sent, Applied, Declined, Hired, Unqualified)
- `search` (optional): Search candidate name or job title

**Response:**
```json
{
  "candidates": [
    {
      "id": "uuid",
      "user": { "first_name": "Naomi", "last_name": "Blake", "avatar_url": "..." },
      "job": { "title": "Mechanical Assistant Project Manager", "soc_code": "..." },
      "proficiency_pct": 99,
      "status": "pending",
      "created_at": "2025-10-02T...",
      ...
    }
  ]
}
```

---

### GET /api/employer/candidates/archived
Get archived candidates for employer.

**Response:**
```json
{
  "candidates": [...]
}
```

---

### PATCH /api/employer/candidates/[id]
Update candidate status (employer actions).

**Body:**
```json
{
  "action": "invite" | "hire" | "unqualified" | "archive" | "reopen",
  "message": "Optional custom message for invite action"
}
```

**Actions:**
- `invite` - Send invitation to candidate (pending → sent)
- `hire` - Mark candidate as hired
- `unqualified` - Mark candidate as unqualified
- `archive` - Move to archived
- `reopen` - Reopen from archived

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/employer/candidates/bulk
Bulk actions on candidates.

**Body:**
```json
{
  "action": "archive",
  "candidateIds": ["uuid1", "uuid2", ...]
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Status Values

### Candidate View
- `sent` - Invitation received, awaiting action
- `applied` - Marked as applied
- `declined` - Declined invitation
- `archived` - Archived by candidate

### Employer View
- `pending` - Candidate qualified, not yet invited
- `sent` - Invitation sent, awaiting response
- `applied` - Candidate marked as applied
- `declined` - Candidate declined
- `hired` - Marked as hired by employer
- `unqualified` - Marked as unqualified by employer
- `archived` - Archived by employer

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message"
}
```

**Common Status Codes:**
- `200` - Success
- `400` - Bad request (invalid parameters)
- `401` - Not authenticated
- `403` - Not authorized (wrong role)
- `500` - Internal server error
