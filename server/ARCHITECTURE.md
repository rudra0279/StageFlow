# StagePilot — Backend Foundation & Architecture Guide

> **Version:** 1.0.0 (MVP Foundation)  
> **Platform:** StagePilot — AI-Powered Real-Time Event Management & Anchor Assistance  
> **Target Audience:** Frontend Engineers, AI/ML Engineers, Backend Developers, and QA Testers.

---

## 1. Project Overview

**StagePilot** is a mission-critical, real-time event orchestration platform designed for hackathons, summits, and live stage broadcasts. The platform serves two primary user personas:

1. **Stage Organizers**: Backstage managers who control the master agenda, inject schedule delays (+5, +10, +15m), and broadcast high-urgency alerts to stage crew.
2. **Stage Anchors / MCs**: Stage presenters who consume real-time countdown timers, live speaker intro scripts, phonetic pronunciation guides, and prompt assistance via an AI Co-Pilot drawer.

This backend provides the scalable foundation: Express.js REST APIs, MongoDB database persistence, JWT authentication, and pre-wired hooks for Socket.IO real-time broadcasts and AI generative script pipelines.

---

## 2. Service Boundaries

The backend is strictly divided into decoupled, modular layers to allow parallel team development:

```text
server/
├── src/
│   ├── config/             # Connection singletons (Database, Socket.IO, AI providers, Env)
│   ├── constants/          # Enums for statuses, roles, socket events
│   ├── controllers/        # Request handling, status codes, JSON payload formatting
│   ├── middleware/         # JWT auth (requireAuth), roles (requireOrganizer, requireAnchor), errors
│   ├── models/             # Mongoose schemas (User, Event, Speaker, Session/Agenda, Announcement)
│   ├── prompts/            # AI dynamic prompt templates & offline fallback script library
│   ├── routes/             # Express modular route mounts (/api/auth, /api/events, etc.)
│   ├── services/           # Business logic (Cascading delay engine, AI service, Socket dispatch)
│   ├── sockets/            # Socket.IO connection handlers, room isolation, alert broadcasting
│   ├── utils/              # Calculation helpers, seeders, loggers, test suites
│   ├── validators/         # Input schema validation (Joi)
│   ├── app.js              # Express app setup, CORS, Helmet security, global error routing
│   └── server.js           # HTTP + Socket.IO server listener & graceful termination
├── .env.example
├── package.json
└── ARCHITECTURE.md
```

### Boundary Responsibilities:
- **Controllers** never execute database queries directly; they invoke models or services and return standard JSON.
- **Services** encapsulate complex business logic (e.g. cascading delay recalculation).
- **Socket Handlers** reuse database models and broadcast real-time events scoped by event room (`event_${eventId}`).
- **AI Engine** runs asynchronously with graceful fallback templates so the API never crashes if an external LLM rate-limits or fails.

---

## 3. Request Flow

```
[ Client Request ]
       │
       ▼
[ Security Middleware: Helmet & CORS ]
       │
       ▼
[ Body Parsers: express.json() & express.urlencoded() ]
       │
       ▼
[ Route Dispatcher: /api/* ]
       │
       ├──► Public Routes (/api/health, /api/auth/register, /api/auth/login)
       │
       └──► Protected Routes
               │
               ▼
         [ requireAuth: JWT Verification (Bearer token) ]
               │
               ▼
         [ Role Guard: requireOrganizer / requireAnchor ]
               │
               ▼
         [ Validator Middleware (Joi) ]
               │
               ▼
         [ Controller ] ──► [ Service / Model Layer ] ──► [ MongoDB Atlas ]
               │                                                  │
               │                                                  ▼
               ├──► [ Socket.IO Dispatch (Optional) ] ──► [ WebSocket Broadcast ]
               │
               ▼
         [ Standardized JSON Response (200 / 201) ]
               │
               ▼ (On Exception)
         [ Centralized Error Handler (400 / 401 / 403 / 404 / 500) ]
```

---

## 4. Database Schema Overview & Design Decisions

### 4.1 User Model (`models/User.js`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `name` | String | required, trim | Full display name |
| `email` | String | required, unique, lowercase, index | User login email |
| `password` | String | required, min 6, `select: false` | Bcrypt hashed password |
| `role` | String | enum: `['ORGANIZER', 'ANCHOR']`, default: `ANCHOR` | Role-based permission level |
| `avatarUrl` | String | default: `''` | Profile picture URL |

### 4.2 Event Model (`models/Event.js`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `name` / `title` | String | required, trim | Event title (dual alias supported) |
| `description` | String | default: `''` | Event summary and description |
| `date` | Date | required | Date of the event |
| `startTime` / `endTime` | Date | optional | Scheduled overall window |
| `venue` | String | default: `'Main Stage'` | Location or physical venue |
| `category` | String | enum: `hackathon`, `workshop`, etc. | Event taxonomy |
| `organizerId` | ObjectId | ref: `'User'`, required | Creator/lead organizer |
| `currentSessionId` | ObjectId | ref: `'Session'`, default: `null` | Active live session on stage |
| `totalDelayMinutes` | Number | default: `0` | Cumulative schedule drift |
| `healthStatus` | String | `ON_SCHEDULE`, `RUNNING_LATE`, `DISRUPTED` | Computed schedule status |
| `status` | String | `DRAFT`, `LIVE`, `PAUSED`, `COMPLETED` | Event lifecycle state |

### 4.3 Speaker Model (`models/Speaker.js`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `eventId` | ObjectId | ref: `'Event'`, required, index | Parent event |
| `name` | String | required, trim | Speaker's full name |
| `title` / `designation` | String | trim, dual-alias | Professional designation |
| `company` / `organization` | String | default: `''`, dual-alias | Company or institute |
| `topic` | String | default: `''` | Key presentation topic |
| `bio` / `biography` | String | default: `''` | Biographical background |
| `pronunciationGuide` / `phoneticName` | String | default: `''` | Phonetic guide for anchor (e.g., `eh-LEH-nah ross-TOH-vah`) |
| `avatarUrl` / `profilePhoto` | String | default: `''` | Headshot image URL |
| `keyAchievements` | [String] | default: `[]` | Bullet points for anchor intro |

### 4.4 Agenda / Session Model (`models/Session.js` & alias `models/Agenda.js`)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `eventId` | ObjectId | ref: `'Event'`, required, index | Associated event |
| `title` | String | required, trim | Session/talk title |
| `description` | String | default: `''` | Detailed description |
| `speakerId` | ObjectId | ref: `'Speaker'`, default: `null` | Assigned speaker |
| `orderIndex` | Number | required, default: `0` | Sequence ordering in schedule |
| `scheduledStartTime` / `startTime` | Date | required | Original planned start time |
| `calculatedStartTime` | Date | required | Time shifted by cumulative delays |
| `endTime` | Date | optional | Target session completion time |
| `durationMinutes` | Number | min: 1, default: `30` | Duration in minutes |
| `delayOffsetMinutes` | Number | default: `0` | Direct delay added to this session |
| `room` | String | default: `'Main Stage'` | Room or stage name |
| `type` | String | default: `'presentation'` | Session type (`keynote`, `panel`, etc.) |
| `status` | String | `UPCOMING`, `LIVE`, `COMPLETED`, `DELAYED`, `CANCELLED` | Stage lifecycle status |
| `aiScripts` | Object | `{ opening, introduction, transition, closing, delay }` | Pre-cached AI generated scripts |
| `stageNotes` | String | default: `''` | Private notes for anchor/AV desk |

### 4.5 Schema Design Decisions
1. **Dual Aliases (`title`/`name`, `company`/`organization`, `bio`/`biography`, `pronunciationGuide`/`phoneticName`)**:
   - Implemented with pre-validation schema hooks. Any developer can POST either nomenclature without schema rejection.
2. **Dynamic Cascading Delay Engine**:
   - Adding +10m delay to session *N* automatically recalculates `calculatedStartTime` for sessions *N+1, N+2...* and updates the event's `totalDelayMinutes` and `healthStatus`.
3. **Password Security**:
   - `password` uses `{ select: false }`. Calling `User.find()` or `User.findById()` never exposes the password hash unless explicitly requested via `.select('+password')`.

---

## 5. Authentication Flow

```
1. Client POSTs credentials:
   POST /api/auth/login { email, password }
         │
2. Backend verifies bcrypt hash:
   await user.comparePassword(candidatePassword)
         │
3. Signed JWT generated:
   jwt.sign({ id: user._id, role: user.role }, ENV.JWT_SECRET, { expiresIn: '7d' })
         │
4. Response returns:
   {
     "success": true,
     "data": {
       "user": { "id": "...", "name": "...", "email": "...", "role": "ORGANIZER" },
       "token": "eyJhbGciOiJIUzI1NiIsIn..."
     }
   }
         │
5. Client supplies token on protected endpoints:
   Authorization: Bearer <token>
         │
6. Middleware validation:
   - requireAuth: Verifies JWT signature and extracts req.user
   - requireOrganizer: Validates req.user.role === 'ORGANIZER'
   - requireAnchor: Validates req.user.role === 'ANCHOR'
```

---

## 6. Initial API Contract

All successful endpoints return `{ success: true, data: ... }`.  
Errors return `{ success: false, message: "...", errors?: [...] }`.

### 6.1 System & Health

#### `GET /api/health`
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "StagePilot backend is running",
  "status": "online",
  "service": "StagePilot Real-Time API Engine",
  "uptime": 124.5
}
```

---

### 6.2 Authentication

#### `POST /api/auth/register`
- **Auth**: None
- **Body**:
```json
{
  "name": "Sarah Connor",
  "email": "organizer@stagepilot.io",
  "password": "password123",
  "role": "organizer"
}
```
- **Response**: `201 Created` with `{ success: true, data: { user, token } }`
- **Errors**: `400 Bad Request` (Email already registered, missing fields)

#### `POST /api/auth/login`
- **Auth**: None
- **Body**:
```json
{
  "email": "organizer@stagepilot.io",
  "password": "password123"
}
```
- **Response**: `200 OK` with `{ success: true, data: { user, token } }`
- **Errors**: `401 Unauthorized` (Invalid email or password)

#### `GET /api/auth/me`
- **Auth**: `requireAuth`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "6aae3707877322f3d6a0bf60",
    "name": "Sarah Connor",
    "email": "organizer@stagepilot.io",
    "role": "ORGANIZER"
  }
}
```
- **Errors**: `401 Unauthorized` (Missing or expired Bearer token)

---

### 6.3 Events

#### `GET /api/events`
- **Auth**: `requireAuth`
- **Response**: `200 OK` with `{ success: true, count: N, data: [ ...events ] }`

#### `POST /api/events`
- **Auth**: `requireOrganizer`
- **Body**:
```json
{
  "title": "Global Tech Horizon Summit 2026",
  "description": "Annual frontier tech summit",
  "date": "2026-10-15T09:00:00.000Z",
  "venue": "Main Stage",
  "theme": "AI & Frontier Systems"
}
```
- **Response**: `201 Created` with `{ success: true, data: event }`

#### `GET /api/events/:id`
- **Auth**: `requireAuth`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "event": { ...eventDetails },
    "sessions": [ ...populatedSessionsWithSpeakers ],
    "speakers": [ ...eventSpeakers ],
    "announcements": [ ...activeAnnouncements ]
  }
}
```

#### `PUT /api/events/:id` or `PATCH /api/events/:id`
- **Auth**: `requireOrganizer`
- **Body**: `{ "title": "Updated Title", "venue": "Auditorium B" }`
- **Response**: `200 OK` with `{ success: true, message: "Event updated successfully", data: event }`

#### `DELETE /api/events/:id`
- **Auth**: `requireOrganizer`
- **Response**: `200 OK` with `{ success: true, message: "Event deleted successfully" }`

---

### 6.4 Speakers

#### `GET /api/speakers` or `GET /api/speakers/:eventId`
- **Auth**: `requireAuth`
- **Parameters**: `:eventId` path param OR `?eventId=...` query param
- **Response**: `200 OK` with `{ success: true, count: N, data: [ ...speakers ] }`

#### `POST /api/speakers`
- **Auth**: `requireOrganizer`
- **Body**:
```json
{
  "eventId": "6aae3707877322f3d6a0bf64",
  "name": "Dr. Elena Rostova",
  "designation": "VP of Autonomous Systems",
  "organization": "NeuroScale AI",
  "topic": "Autonomous Agent Swarms",
  "pronunciationGuide": "eh-LEH-nah ross-TOH-vah",
  "bio": "Pioneer in multi-agent generative systems."
}
```
- **Response**: `201 Created` with `{ success: true, data: speaker }`

#### `PUT /api/speakers/:id` or `PATCH /api/speakers/:id`
- **Auth**: `requireOrganizer`
- **Response**: `200 OK` with `{ success: true, data: speaker }`

#### `DELETE /api/speakers/:id`
- **Auth**: `requireOrganizer`
- **Response**: `200 OK` with `{ success: true, message: "Speaker deleted successfully" }`

---

### 6.5 Agenda / Sessions

#### `GET /api/agenda` or `GET /api/agenda/:eventId`
- **Auth**: `requireAuth`
- **Parameters**: `:eventId` path param OR `?eventId=...` query param
- **Response**: `200 OK` with `{ success: true, count: N, data: [ ...sessions ] }`

#### `POST /api/agenda` or `POST /api/events/:eventId/sessions`
- **Auth**: `requireOrganizer`
- **Body**:
```json
{
  "eventId": "6aae3707877322f3d6a0bf64",
  "title": "Commercial Quantum Supremacy",
  "speakerId": "6aae3707877322f3d6a0bf65",
  "startTime": "2026-10-15T10:00:00.000Z",
  "durationMinutes": 45,
  "orderIndex": 1
}
```
- **Response**: `201 Created` with populated `speakerId`

#### `POST /api/sessions/:sessionId/delay` or `POST /api/events/:eventId/sessions/:sessionId/delay`
- **Auth**: `requireOrganizer`
- **Body**: `{ "delayMinutes": 10, "reason": "Speaker running late" }`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Delay of 10 mins successfully applied and cascaded",
  "data": {
    "totalDelayMinutes": 10,
    "healthStatus": "RUNNING_LATE",
    "sessions": [ ...updatedSessionsWithNewCalculatedTimes ]
  }
}
```

#### `PATCH /api/sessions/:sessionId/activate`
- **Auth**: `requireOrganizer`
- **Action**: Switches the active live session on stage. Broadcasts instant update to teleprompter and anchor views.

#### `PUT /api/agenda/:id` or `PATCH /api/agenda/:id`
- **Auth**: `requireOrganizer`
- **Response**: `200 OK` with `{ success: true, message: "Agenda item updated successfully", data: session }`

#### `DELETE /api/agenda/:id`
- **Auth**: `requireOrganizer`
- **Response**: `200 OK` with `{ success: true, message: "Agenda item deleted successfully" }`

---

### 6.6 AI Integration Endpoints

#### `GET /api/ai`
- **Auth**: None
- **Response**: `200 OK` (Discovery & capability status)

#### `POST /api/ai/generate` or `POST /api/ai/generate-script`
- **Auth**: `requireAuth`
- **Body**:
```json
{
  "type": "SPEAKER_INTRO",
  "sessionId": "6aae3707877322f3d6a0bf66",
  "tone": "energetic"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "script": "Ladies and gentlemen, please welcome Dr. Elena Rostova...",
    "provider": "gemini",
    "cached": false
  }
}
```

#### `POST /api/ai/query` or `POST /api/ai/copilot-query`
- **Auth**: `requireAuth`
- **Body**:
```json
{
  "sessionId": "6aae3707877322f3d6a0bf66",
  "query": "Give me a quick 1-sentence icebreaker about quantum computing"
}
```
- **Response**: `200 OK` with `{ success: true, data: { answer, query, provider } }`

---

## 7. Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | HTTP & WebSocket server port |
| `NODE_ENV` | `development` | Environment (`development` or `production`) |
| `CLIENT_URL` | `http://localhost:5173` | Allowed frontend origin for CORS & Socket.IO |
| `MONGODB_URI` / `MONGO_URI` | `mongodb://localhost:27017/stagepilot` | MongoDB Atlas or local connection string |
| `JWT_SECRET` | `stagepilot_jwt_secret_key_2026` | Secret key for signing authorization tokens |
| `JWT_EXPIRES_IN` | `7d` | Token validity period |
| `AI_PROVIDER` | `gemini` | AI Provider selection (`gemini` or `openai`) |
| `GEMINI_API_KEY` | `""` | Optional Google Gemini API Key |
| `OPENAI_API_KEY` | `""` | Optional OpenAI API Key |

*Note: If AI keys are omitted, the backend automatically uses the built-in deterministic fallback prompt engine so the server never crashes or blocks development.*

---

## 8. Real-Time Socket.IO Integration Points

Socket.IO is mounted onto the same HTTP server on port `5000`.

### 8.1 Room Hierarchy
- `event_${eventId}`: General room for all participants, organizers, and audience monitors.
- `event_${eventId}_anchors`: Dedicated backstage channel for anchors.

### 8.2 WebSocket Events Catalog
| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join_event` | Client ➔ Server | `{ eventId }` | Subscribes socket to event room |
| `leave_event` | Client ➔ Server | `{ eventId }` | Unsubscribes socket |
| `stage_alert` | Server ➔ Client | `{ id, message, urgency, type, timestamp }` | Urgent flash alert on teleprompter/screen |
| `dismiss_alert` | Server ➔ Client | `{ alertId }` | Dismisses flash banner |
| `agenda_updated` | Server ➔ Client | `{ eventId, sessions, totalDelayMinutes, healthStatus }` | Schedule refresh after change |
| `delay_broadcast` | Server ➔ Client | `{ sessionId, delayMinutes, reason, totalDelayMinutes }` | Toast alert: delay added |
| `health_status_changed` | Server ➔ Client | `{ eventId, status, healthStatus }` | Status badge update |

---

## 9. AI Subsystem Integration Points

Located in `server/src/services/aiService.js` and `server/src/prompts/`.

- **Providers**: Supports Google Gemini (`@google/generative-ai`) and OpenAI GPT-4o (`openai`).
- **Prompt Types**:
  1. `opening`: Event welcoming and theme introduction.
  2. `introduction`: Speaker bio, achievements, topic, and phonetic name intro.
  3. `transition`: Bridging speaker *A* to speaker *B*.
  4. `delay`: Polite on-stage announcement explaining delay without inducing panic.
  5. `closing`: Event wrap-up and takeaways.
  6. `copilot`: Backstage Q&A chat for the anchor.
- **Fail-Safe Mechanism**:
  - Automatically activates pre-written templates in `server/src/prompts/fallbackScripts.json` if LLM keys are absent, rate-limited, or slow.

---

## 10. Instructions for Other Developers

### Frontend Developers (React / Vite)
- The base API is available at `http://localhost:5000/api`.
- Connect your Socket.IO client to `http://localhost:5000` using `transports: ['websocket']`.
- Store the token received from `POST /api/auth/login` in `localStorage` and include `Authorization: Bearer <token>` in Axios headers.

### AI / Prompt Engineers
- Dynamic prompt generators live in `server/src/prompts/`. Modify templates there to improve script tone, constraints, and length without touching Express controllers.

### QA Engineers
- A comprehensive end-to-end test suite is included in `server/src/utils/test_live_api.js`.
- Run: `node server/src/utils/test_live_api.js` to test all authentication, events, delays, sockets, and AI endpoints in under 5 seconds.
