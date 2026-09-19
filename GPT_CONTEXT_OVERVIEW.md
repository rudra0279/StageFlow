# StagePilot (StageFlow) – GPT Context & Next-Prompt Guide 🤖📋

> **Instructions for the User:**  
> Copy and paste the sections below into ChatGPT, Claude, or any LLM as your system context. At the bottom of this file, you will find pre-crafted **"Next Prompts"** that you can choose from based on what you want to build or enhance next!

---

## 📌 PART 1: COPY-PASTE SYSTEM CONTEXT FOR GPT

```text
=== PROJECT CONTEXT: STAGEPILOT (STAGEFLOW) ===

1. WHAT IS STAGEPILOT?
StagePilot is a real-time event orchestration and AI-assisted live anchor teleprompter platform built for tech conferences, summits, and hackathons. It bridges backstage event organizers and front-of-house stage anchors with zero page refreshes.

2. CORE FEATURES (ALREADY BUILT & TESTED):
- Cascading Schedule Delay Engine: When an organizer adds +5, +10, or +15 mins to an agenda session, all subsequent sessions automatically shift their start and end times forward, and cumulative event drift is recalculated.
- Stage Anchor Teleprompter: Dark-mode high-contrast view with Beam Splitter Glass Mirror Mode (scaleX(-1)), adjustable font size, and variable-speed auto-scrolling.
- Phonetic Pronunciation Guide: International speaker names and complex terms display phonetic spellings prominently on the anchor's cue card (e.g., "Dr. Elena Rostova" -> "[eh-LEH-nah ross-TOH-vah]").
- Zero-Refresh Emergency Flash Broadcasts: Organizers can inject instant flash messages (e.g., "Wrap in 2 mins", "VIP arrived") that pop up on the anchor's screen with a synthesized two-tone audio alert (Web Audio API).
- AI Stage Co-Pilot & Script Generation: Instant contextual generation of speaker intros, bridge transitions, delay fillers, closing remarks, and audience icebreakers using Gemini/OpenAI SDKs with an offline-resilient smart fallback engine.

3. TECH STACK:
- Frontend: React 18, Vite 5, Tailwind CSS, Lucide Icons, Recharts, Socket.IO Client. (Runs on Port 5173).
- Backend: Node.js, Express.js (ESM), Socket.IO, Mongoose, JWT & Bcrypt. (Runs on Port 5000).
- Database: MongoDB with automatic MongoMemoryServer fallback for zero-config plug-and-play development.
- Real-time: Socket.IO bi-directional communication using rooms (event_:id).

4. KEY DIRECTORY MAP:
- /client/src/pages: LandingPage.jsx, LoginPage.jsx, OrganizerDashboard.jsx, AnchorView.jsx
- /client/src/components/organizer: AgendaManager.jsx, DelayModal.jsx, BroadcastModal.jsx, HealthCard.jsx
- /client/src/components/anchor: Teleprompter.jsx, StageTimer.jsx, CurrentSession.jsx, UrgentBanner.jsx
- /client/src/components/ai: AnchorCopilotDrawer.jsx, ScriptGeneratorModal.jsx
- /server/src/models: User.js, Event.js, Session.js, Speaker.js, Announcement.js
- /server/src/services: eventService.js (cascading delay logic), aiService.js (AI prompts & fallback), socketService.js
- /server/src/controllers: authController.js, eventController.js, sessionController.js, aiController.js
- /server/src/routes: authRoutes.js, eventRoutes.js, sessionRoutes.js, aiRoutes.js

5. RECENT STATUS:
All backend APIs (13/13 tests passed), WebSocket real-time delivery, and browser UI flows for both Organizer and Anchor dashboards have been verified working.
==============================================
```

---

## 🎯 PART 2: READY-TO-USE "NEXT PROMPTS" FOR GPT

Pick any of the prompts below and paste it into GPT along with the context block above:

---

### Option A: Feature Expansion – Live Speech-to-Text & Automatic Word Tracking
> **Prompt to copy into GPT:**
> *"I have an active project called StagePilot (context provided above). I want to add a real-time Speech-to-Text (STT) tracking feature to the Stage Anchor Teleprompter using the browser's Web Speech API or Whisper. As the anchor speaks into their microphone, the teleprompter should highlight spoken words in real time and automatically scroll to match their reading pace. Provide a step-by-step implementation plan with React component code, custom hook (`useSpeechTracker`), and visual styling."*

---

### Option B: Multi-Track / Multi-Stage Support
> **Prompt to copy into GPT:**
> *"StagePilot currently manages a single main stage schedule. I want to extend it to support Multi-Track / Multi-Stage conferences (e.g., Track A: Main Auditorium, Track B: Workshop Hall, Track C: Demo Stage). How should I modify the Mongoose schemas (`Event`, `Session`), backend delay cascade service (`eventService.js`), and frontend Organizer War-Room so directors can view all stage timelines simultaneously and route anchor views per stage?"*

---

### Option C: Audience Interactive Q&A & Live Polls Integration
> **Prompt to copy into GPT:**
> *"I want to integrate a live Audience Q&A and Polls module into StagePilot. Attendees scan a QR code on the landing page to submit questions and upvote in real time. The backstage organizer curates top questions, and approved questions flash directly onto the anchor's teleprompter cue card. Please design the database schema, Socket.IO events, and the React UI for the anchor cue card overlay."*

---

### Option D: PDF / Google Calendar / CalDAV Schedule Export
> **Prompt to copy into GPT:**
> *"I want to add an 'Export Run-of-Show' feature to the StagePilot Organizer Dashboard. Organizers should be able to click a button to export the live updated schedule (including all delays and speaker phonetic guides) into: (1) a beautifully styled, printable PDF Run-of-Show cheat sheet, and (2) an `.ics` CalDAV calendar feed. Provide the backend and frontend code to implement this."*

---

### Option E: Production Hardening, Dockerization & Cloud Deployment
> **Prompt to copy into GPT:**
> *"I need to deploy StagePilot to production (e.g. AWS ECS / Render / Google Cloud Run with MongoDB Atlas). Provide a complete `Dockerfile` and `docker-compose.yml` that packages both the React client and Node.js Socket.IO server, configures CORS/WSS reverse proxies with Nginx, and adds production rate-limiting and logging middleware."*

---

### Option F: Hackathon Pitch & Judge Demo Strategy
> **Prompt to copy into GPT:**
> *"I am presenting StagePilot at a hackathon demo. What is the most impactful 3-minute live presentation script and dual-screen demo strategy (organizer laptop on the left, anchor iPad on the right) to wow the judges? Include exact stage moments to demonstrate the cascading delay engine, audio chime, and AI co-pilot."*

---

## 📂 File Location
This file has been created at:  
[`d:/BIT N BUILD/BNB/StageFlow/GPT_CONTEXT_OVERVIEW.md`](file:///d:/BIT%20N%20BUILD/BNB/StageFlow/GPT_CONTEXT_OVERVIEW.md)
