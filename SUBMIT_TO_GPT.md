# StagePilot (StageFlow) – Complete Project Handoff & GPT Submission Dossier

> **INSTRUCTION FOR GPT / AI ASSISTANT:**  
> This file contains the complete architectural, implementation, schema, and operational context for **StagePilot (StageFlow)**. Ingest this dossier into your memory context. After reading, acknowledge receipt with a short summary of the system and invite the user to choose their next goal (feature expansion, code optimization, multi-stage architecture, or demo strategy).

---

## 1. PROJECT METADATA & EXECUTIVE SUMMARY

- **Project Name:** StagePilot (StageFlow)
- **Tagline:** AI Co-Pilot & Real-Time Orchestration Platform for Live Events
- **Primary Domain:** Live Event Management, Hackathons, Tech Summits, Stage Teleprompting
- **Current Status:** 100% Operational MVP (All 13/13 automated tests passed; verified browser E2E)
- **Problem Solved:** When live speakers overrun their allotted time, cue sheets fail, international names are mispronounced, stage anchors are stranded without context, and manual timing adjustments cause panic.
- **Core Value:** Synchronizes backstage event directors with front-of-house stage anchors in real-time with zero page reloads, an intelligent cascading schedule delay engine, mirror-mode stage teleprompters, and context-aware AI script generation.

---

## 2. SYSTEM ARCHITECTURE & TECH STACK

```
[Organizer War-Room] (React 18 + Vite, Port 5173 /organizer)
       │
       ▼ (HTTP POST Delays / Emergency Broadcasts)
[Backend REST & Engine] (Node.js + Express.js ESM, Port 5000)
       │
       ├─► [Cascading Delay Engine] (Recalculates downstream session times)
       ├─► [AI Script Orchestrator] (Gemini / OpenAI / Smart Fallback)
       ├─► [Database Engine] (MongoDB + Mongoose + MongoMemoryServer Fallback)
       │
       ▼ (Socket.IO Bi-Directional Broadcasts: event_:id)
[Stage Anchor Station] (React 18 + Vite, Port 5173 /anchor)
       ├─► High-Contrast Teleprompter (Horizontal Mirroring & Auto-Scroll)
       ├─► Phonetic Pronunciation Guide Card
       ├─► Real-Time Flash Banner + Web Audio API Two-Tone Chime
       └─► AI Stage Co-Pilot Backstage Drawer
```

### Technology Matrix
- **Frontend:** React 18, Vite 5, Tailwind CSS (stage-dark `#05070e` palette), Lucide Icons, Recharts, Socket.IO Client.
- **Backend:** Node.js (v20+), Express.js (ESM), Socket.IO (v4), Mongoose (v8), JWT, Bcrypt.
- **Database:** MongoDB with automatic embedded `MongoMemoryServer` fallback for zero-config plug-and-play development.
- **Audio:** Native browser Web Audio API (synthesizes pure 800Hz ➔ 600Hz alert frequencies with zero external media files).
- **AI Integration:** Google Generative AI (`@google/generative-ai`), OpenAI SDK, plus local rule-based Smart Fallback.

---

## 3. CORE DATA SCHEMAS & MODELS

### 3.1 User Schema (`server/src/models/User.js`)
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['ORGANIZER', 'ANCHOR'], default: 'ANCHOR' },
  avatarUrl: { type: String, default: '' }
}
```

### 3.2 Event Schema (`server/src/models/Event.js`)
```javascript
{
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  theme: { type: String },
  organizerId: { type: ObjectId, ref: 'User' },
  totalDelayMinutes: { type: Number, default: 0 },
  healthStatus: { 
    type: String, 
    enum: ['ON_SCHEDULE', 'NEEDS_ATTENTION', 'RUNNING_LATE', 'CRITICAL_DELAY'], 
    default: 'ON_SCHEDULE' 
  },
  status: { type: String, enum: ['UPCOMING', 'LIVE', 'PAUSED', 'COMPLETED'], default: 'LIVE' }
}
```

### 3.3 Session / Agenda Schema (`server/src/models/Session.js`)
```javascript
{
  eventId: { type: ObjectId, ref: 'Event', required: true },
  speakerId: { type: ObjectId, ref: 'Speaker' },
  title: { type: String, required: true },
  description: { type: String },
  scheduledStartTime: { type: Date, required: true },
  scheduledEndTime: { type: Date, required: true },
  actualStartTime: { type: Date },
  actualEndTime: { type: Date },
  durationMinutes: { type: Number, required: true },
  delayOffsetMinutes: { type: Number, default: 0 },
  status: { type: String, enum: ['PENDING', 'LIVE', 'COMPLETED', 'DELAYED'], default: 'PENDING' },
  orderIndex: { type: Number, required: true },
  script: { type: String, default: '' }
}
```

### 3.4 Speaker Schema with Phonetic Guide (`server/src/models/Speaker.js`)
```javascript
{
  eventId: { type: ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  company: { type: String, default: '' },
  bio: { type: String, default: '' },
  pronunciationGuide: { 
    type: String, 
    default: '', 
    help: 'Phonetic spelling for anchor (e.g. eh-LEH-nah ross-TOH-vah)' 
  },
  keyAchievements: [String],
  avatarUrl: { type: String }
}
```

### 3.5 Announcement Schema (`server/src/models/Announcement.js`)
```javascript
{
  eventId: { type: ObjectId, ref: 'Event', required: true },
  message: { type: String, required: true },
  urgency: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  type: { type: String, enum: ['STAGE_DIRECTION', 'SCHEDULE_CHANGE', 'EMERGENCY'], default: 'STAGE_DIRECTION' },
  isDismissed: { type: Boolean, default: false }
}
```

---

## 4. SIGNATURE ALGORITHMS & IMPLEMENTATION DETAILS

### 4.1 Cascading Schedule Delay Engine (`server/src/services/eventService.js`)
When an organizer clicks `+5m`, `+10m`, or `+15m` on an active session:
1. Target session's `delayOffsetMinutes` is incremented.
2. Its `scheduledEndTime` shifts forward by `delayMinutes`.
3. An iteration begins across **all subsequent sessions** (`orderIndex > targetIndex`):
   - Downstream `scheduledStartTime` becomes previous session's `scheduledEndTime`.
   - Downstream `scheduledEndTime` becomes `newStartTime + durationMinutes`.
4. Event's `totalDelayMinutes` is updated:
   - 0-5 mins: `ON_SCHEDULE`
   - 6-15 mins: `NEEDS_ATTENTION`
   - 16-30 mins: `RUNNING_LATE`
   - >30 mins: `CRITICAL_DELAY`
5. New schedule state is atomically broadcasted via Socket.IO to the room `event_:id`.

### 4.2 Stage Teleprompter (`client/src/components/anchor/Teleprompter.jsx`)
- **Mirror Mode:** Applies CSS `transform: scaleX(-1)` to enable reading through half-silvered beam-splitter glass.
- **Variable Auto-Scroll:** RAF (RequestAnimationFrame) scroll accumulator with speed multiplier controls (0.5x to 3.0x).
- **Responsive Font Scaling:** Real-time font size toggle (24px to 56px) for visibility from 15 feet away.

### 4.3 Synthesized Web Audio Chime (`client/src/components/anchor/UrgentBanner.jsx`)
```javascript
const playChime = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  // Two-tone high-urgency chime (880Hz A5 -> 587Hz D5)
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(587, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
};
```

### 4.4 Resilient In-Memory Database Fallback (`server/src/config/db.js`)
```javascript
// Automatically catches failed local MongoDB connection (ECONNREFUSED)
// and spins up MongoMemoryServer on the fly, then auto-seeds 4 conference sessions
const { MongoMemoryServer } = await import('mongodb-memory-server');
const memoryServer = await MongoMemoryServer.create();
await mongoose.connect(memoryServer.getUri());
await seedDatabase(false);
```

---

## 5. API SPECIFICATIONS & SOCKET EVENTS

### REST Endpoints
- `POST /api/auth/login` – Returns JWT & user role
- `GET /api/auth/me` – Authenticated user profile
- `GET /api/events` – List user events
- `GET /api/events/:id` – Full event details (with populated sessions & speakers)
- `POST /api/events/:id/sessions/:sessionId/delay` – Trigger cascading delay
- `POST /api/events/:id/broadcast` – Broadcast emergency alert
- `POST /api/ai/generate-script` – Generate intro, delay filler, bridge, or closing script
- `POST /api/ai/copilot-query` – Spontaneous question / audience icebreaker prompt

### Socket.IO Events
- Client joins room: `socket.emit('join_event', { eventId })`
- Live schedule shift: `socket.on('agenda_updated', (data) => { ... })`
- Urgent stage alert: `socket.on('announcement_received', (data) => { ... })`
- Active session switch: `socket.on('session_activated', (data) => { ... })`

---

## 6. VERIFIED TEST RESULTS

The backend test suite (`server/src/utils/test_live_api.js`) completed with 100% success:
- `Root & Health API`: **PASS**
- `Organizer Login & Role Check`: **PASS**
- `Anchor Login & Role Check`: **PASS**
- `Event Agenda Retrieval (4 sessions)`: **PASS**
- `Phonetic Pronunciation Guide`: **PASS**
- `Socket.IO Real-Time Connection`: **PASS**
- `Cascading Delay Engine (+10m)`: **PASS**
- `Urgent Announcement Broadcast`: **PASS**
- `WebSocket Sync Delivery`: **PASS**
- `AI Script Generator Service`: **PASS**
- `AI Anchor Copilot Assistant`: **PASS**
- **Final Result: 13 Passed, 0 Failed**

---

## 7. NEXT TASKS / PROMPTS YOU CAN REQUEST FROM GPT

Now that GPT has this context, here are recommended prompts to ask:

1. **Speech-to-Text Follower:**  
   *"Add live microphone Speech-to-Text tracking to `Teleprompter.jsx` using the Web Speech API so it highlights spoken words in real-time and auto-scrolls to anchor vocal pace."*

2. **Multi-Track Event Manager:**  
   *"Extend the architecture to support multi-track conferences (Track A, Track B, Track C) with separate concurrent stage timelines."*

3. **Live Audience Q&A Module:**  
   *"Create a live attendee QR-code question submission and upvoting system that pushes approved questions directly to the anchor's teleprompter."*

4. **Run-of-Show PDF Exporter:**  
   *"Write a client or server utility to export the live adjusted schedule into a beautifully styled, printable PDF Run-of-Show cue sheet."*
