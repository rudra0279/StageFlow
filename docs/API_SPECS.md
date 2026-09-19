# StagePilot REST API Specifications

Base URL: `http://localhost:5000/api`

## Authentication

### 1. Register User
- **POST** `/auth/register`
- **Body:**
```json
{
  "name": "Sarah Connor",
  "email": "organizer@stagepilot.io",
  "password": "password123",
  "role": "ORGANIZER"
}
```
- **Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "ORGANIZER" },
    "token": "eyJhbGciOi..."
  }
}
```

### 2. Login User
- **POST** `/auth/login`
- **Body:**
```json
{
  "email": "organizer@stagepilot.io",
  "password": "password123"
}
```

---

## Events & Agendas

### 3. Get Event with Agenda and Announcements
- **GET** `/events/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "...",
      "title": "Global Tech Horizon Summit 2026",
      "healthStatus": "ON_SCHEDULE",
      "totalDelayMinutes": 0
    },
    "sessions": [...],
    "announcements": [...]
  }
}
```

### 4. Inject Delay to Session (Cascades Schedule)
- **POST** `/events/:eventId/sessions/:sessionId/delay`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "delayMinutes": 10,
  "reason": "AV technical calibration on podium"
}
```
- **Response (200):**
```json
{
  "success": true,
  "message": "Delay of 10 mins successfully applied and cascaded",
  "data": {
    "event": { "totalDelayMinutes": 10, "healthStatus": "RUNNING_LATE" },
    "sessions": [...]
  }
}
```

### 5. Switch Live Session on Stage
- **PATCH** `/events/:eventId/sessions/:sessionId/activate`
- **Headers:** `Authorization: Bearer <token>`
- **Triggers:** WebSocket `session_started` & `agenda_updated`

### 6. Broadcast Flash Alert to Anchor
- **POST** `/events/:id/broadcast`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "message": "Wrap up talk in 2 minutes, VIP arrived early",
  "urgency": "CRITICAL",
  "type": "STAGE_DIRECTION"
}
```

---

## AI Generation & Co-Pilot

### 7. Generate Stage Script
- **POST** `/ai/generate-script`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "eventId": "...",
  "sessionId": "...",
  "scriptType": "introduction",
  "tone": "energetic"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "script": "Get ready for a powerhouse session! Please welcome...",
    "scriptType": "introduction",
    "provider": "gemini",
    "tone": "energetic"
  }
}
```

### 8. Anchor Co-Pilot Query
- **POST** `/ai/copilot-query`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "eventId": "...",
  "sessionId": "...",
  "query": "Give me an icebreaker for this audience"
}
```
