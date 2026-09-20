# StageFlow / StagePilot

> **Real-time event orchestration and AI co-pilot platform for anchors, organizers, and audiences.**

StageFlow is a full-stack web application that powers live events from a single dashboard. Anchors get a live teleprompter, AI-generated scripts, and Q&A feeds. Organizers control the agenda, moderate questions, and broadcast alerts — all synchronized in real time via Socket.IO.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1 — Clone the Repository](#1--clone-the-repository)
  - [2 — Configure Environment Variables](#2--configure-environment-variables)
  - [3 — Install Dependencies](#3--install-dependencies)
  - [4 — Run in Development](#4--run-in-development)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Socket Events](#socket-events)
- [Roles & Access Control](#roles--access-control)
- [AI Integration](#ai-integration)
- [Environment Variables Reference](#environment-variables-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|---|---|
| 🎙 **Live Teleprompter** | Real-time script streaming to the anchor view |
| 🤖 **AI Script Generator** | Gemini / OpenAI powered opening, transition, and closing scripts |
| 💬 **Q&A Moderation** | Audience submits questions; organizer approves/rejects; anchor sees feed live |
| 📋 **Agenda Manager** | Drag-and-order agenda with live status tracking |
| 📡 **Broadcast Alerts** | Urgent announcements pushed to all connected clients instantly |
| ⏱ **Stage Timer** | Countdown and delay management per session |
| 📊 **Event Health Dashboard** | Automated schedule health score with delay detection |
| 🧑‍💼 **Committee Directory** | Speaker profiles and committee member listing |
| 🔒 **Role-Based Access** | Separate views for `organizer`, `anchor`, and `audience` |
| 📜 **Script Logs** | Persistent log of every AI-generated script per event |

---

## Tech Stack

### Frontend (`client/`)
- **React 18** + **Vite** — lightning-fast dev server and HMR
- **Tailwind CSS** — utility-first styling
- **Socket.IO Client** — real-time bi-directional communication
- **Axios** — HTTP client with JWT interceptors
- **React Router v6** — client-side routing

### Backend (`server/`)
- **Node.js** + **Express** — REST API server
- **Socket.IO** — real-time event engine
- **MongoDB** + **Mongoose** — data persistence
- **JWT** — stateless authentication
- **Google Gemini / OpenAI** — AI script generation (with offline fallback)
- **PDFKit** — PDF export for scripts and reports

---

## Project Structure

```
StageFlow/
├── package.json              # Root scripts — delegates to client/ and server/
├── .gitignore
│
├── client/                   # React + Vite frontend
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx          # App entry point
│       ├── App.jsx           # Route definitions
│       ├── index.css         # Global styles
│       ├── api/              # Axios API modules
│       │   ├── axiosClient.js
│       │   ├── authApi.js
│       │   ├── eventApi.js
│       │   ├── sessionApi.js
│       │   ├── speakerApi.js
│       │   ├── aiApi.js
│       │   └── questionApi.js
│       ├── components/
│       │   ├── ai/           # AI-powered components
│       │   │   ├── AnchorCopilotDrawer.jsx
│       │   │   ├── CueCardGenerator.jsx
│       │   │   ├── ScriptGeneratorModal.jsx
│       │   │   └── SentimentIndicator.jsx
│       │   ├── anchor/       # Anchor-facing components
│       │   │   ├── AnchorQAFeed.jsx
│       │   │   ├── CurrentSessionCard.jsx
│       │   │   ├── LiveTeleprompter.jsx
│       │   │   ├── NextUpCard.jsx
│       │   │   ├── ScriptViewer.jsx
│       │   │   ├── SpeechAssistant.jsx
│       │   │   ├── StageTimer.jsx
│       │   │   └── UrgentAlertBanner.jsx
│       │   ├── organizer/    # Organizer-facing components
│       │   │   ├── AgendaManager.jsx
│       │   │   ├── BroadcastModal.jsx
│       │   │   ├── CommitteeDirectory.jsx
│       │   │   ├── DelayModal.jsx
│       │   │   ├── EventCommandChat.jsx
│       │   │   ├── EventHealthCard.jsx
│       │   │   ├── OrganizerQAModeration.jsx
│       │   │   ├── SessionItem.jsx
│       │   │   └── TaskBoard.jsx
│       │   ├── common/       # Shared UI primitives
│       │   │   ├── Badge.jsx
│       │   │   ├── Button.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Loader.jsx
│       │   │   └── Modal.jsx
│       │   └── layout/
│       │       ├── Navbar.jsx
│       │       └── ProtectedRoute.jsx
│       ├── context/          # React context providers
│       │   ├── AuthContext.jsx
│       │   ├── EventContext.jsx
│       │   └── SocketContext.jsx
│       ├── hooks/            # Custom React hooks
│       │   ├── useAuth.js
│       │   ├── useCountdown.js
│       │   ├── useLiveEvent.js
│       │   ├── useSocket.js
│       │   └── useSpeechFollower.js
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── NotFoundPage.jsx
│       │   ├── AudienceQAView.jsx
│       │   ├── anchor/
│       │   │   └── LiveAnchorView.jsx
│       │   └── organizer/
│       │       ├── EventDashboard.jsx
│       │       └── EventsListPage.jsx
│       ├── constants/
│       │   ├── roles.js
│       │   └── socketEvents.js
│       └── utils/
│           ├── exportUtils.js
│           ├── healthUtils.js
│           ├── sound.js
│           └── timeUtils.js
│
└── server/                   # Node.js + Express backend
    ├── .env.example
    ├── package.json
    └── src/
        ├── server.js         # Entry point — HTTP + Socket.IO
        ├── app.js            # Express app configuration
        ├── config/
        │   ├── ai.js         # AI provider initialization
        │   ├── db.js         # MongoDB connection
        │   ├── env.js        # Environment variable loader (dotenv)
        │   └── socket.js     # Socket.IO setup
        ├── constants/
        │   ├── eventStatus.js
        │   ├── roles.js
        │   └── socketEvents.js
        ├── controllers/      # Route handlers
        │   ├── authController.js
        │   ├── eventController.js
        │   ├── sessionController.js
        │   ├── speakerController.js
        │   ├── aiController.js
        │   ├── agendaController.js
        │   ├── announcementController.js
        │   ├── organizerOperationsController.js
        │   └── questionController.js
        ├── middleware/
        │   ├── authMiddleware.js
        │   ├── roleMiddleware.js
        │   ├── validateMiddleware.js
        │   └── errorMiddleware.js
        ├── models/           # Mongoose schemas
        │   ├── User.js
        │   ├── Event.js
        │   ├── Session.js
        │   ├── Speaker.js
        │   ├── Agenda.js
        │   ├── Question.js
        │   ├── Announcement.js
        │   ├── ChatMessage.js
        │   ├── InviteCode.js
        │   ├── ScriptLog.js
        │   └── Task.js
        ├── prompts/          # AI prompt templates
        │   ├── promptBuilder.js
        │   ├── openingPrompt.js
        │   ├── closingPrompt.js
        │   ├── transitionPrompt.js
        │   ├── delayPrompt.js
        │   ├── fillerPrompt.js
        │   ├── emergencyPrompt.js
        │   ├── speakerIntroPrompt.js
        │   ├── speechAssistPrompt.js
        │   ├── copilotPrompt.js
        │   └── fallbackScripts.json
        ├── routes/
        │   ├── index.js
        │   ├── authRoutes.js
        │   ├── eventRoutes.js
        │   ├── sessionRoutes.js
        │   ├── speakerRoutes.js
        │   ├── aiRoutes.js
        │   ├── agendaRoutes.js
        │   ├── announcementRoutes.js
        │   └── questionRoutes.js
        ├── services/
        │   ├── aiService.js
        │   ├── authService.js
        │   ├── eventService.js
        │   ├── questionService.js
        │   ├── sessionService.js
        │   └── socketService.js
        ├── sockets/          # Socket.IO event handlers
        │   ├── index.js
        │   ├── agendaHandlers.js
        │   ├── broadcastHandlers.js
        │   ├── questionHandlers.js
        │   ├── teleprompterHandlers.js
        │   └── roomManager.js
        ├── utils/
        │   ├── calculateScheduleHealth.js
        │   ├── logger.js
        │   ├── pdfGenerator.js
        │   ├── seedData.js
        │   └── timeCalculators.js
        └── validators/
            ├── authValidator.js
            ├── eventValidator.js
            ├── questionValidator.js
            └── sessionValidator.js
```

---

## Getting Started

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| MongoDB | 6.x (local or Atlas) |

> **MongoDB Atlas**: You can use a free-tier cluster at [cloud.mongodb.com](https://cloud.mongodb.com). Paste the connection string in `server/.env` as `MONGODB_URI`.

---

### 1 — Clone the Repository

```bash
git clone https://github.com/your-username/StageFlow.git
cd StageFlow
```

---

### 2 — Configure Environment Variables

**Server** (required):

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/stagepilot
JWT_SECRET=your_strong_random_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=          # Optional — AI fallback activates if empty
OPENAI_API_KEY=          # Optional
AI_PROVIDER=gemini
```

**Client** (optional — defaults already work locally):

```bash
cp client/.env.example client/.env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> ⚠️ **Never commit `.env` files.** They are excluded by `.gitignore`. Only `.env.example` templates are committed.

---

### 3 — Install Dependencies

Install all packages from the project root with a single command:

```bash
npm run install:all
```

Or install them individually:

```bash
cd client && npm install
cd ../server && npm install
```

---

### 4 — Run in Development

Start both the frontend and backend from the project root:

```bash
npm run dev
```

This runs:
- **Frontend**: `http://localhost:5173` (Vite HMR)
- **Backend**: `http://localhost:5000` (Express + Socket.IO)

To run them separately:

```bash
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend
npm run dev:client
```

---

## Available Scripts

Run from the **project root**:

| Script | Description |
|---|---|
| `npm run dev` | Start both client and server in development mode |
| `npm run dev:client` | Start Vite dev server only |
| `npm run dev:server` | Start Express server with nodemon only |
| `npm run build` | Build the client for production |
| `npm start` | Start the production Express server |

---

## API Overview

All API routes are prefixed with `/api`.

| Route | Description |
|---|---|
| `GET  /api/health` | Server health check |
| `POST /api/auth/register` | Register a new user |
| `POST /api/auth/login` | Log in and receive a JWT |
| `GET  /api/auth/me` | Get the current user profile |
| `GET  /api/events` | List all events |
| `POST /api/events` | Create a new event (organizer) |
| `GET  /api/events/:id` | Get event details |
| `PATCH /api/events/:id/start` | Start an event |
| `PATCH /api/events/:id/end` | End an event |
| `GET  /api/sessions` | List sessions for an event |
| `POST /api/sessions` | Create a session |
| `PATCH /api/sessions/:id/start` | Mark session as live |
| `GET  /api/speakers` | List speakers |
| `POST /api/speakers` | Add a speaker |
| `POST /api/questions` | Submit an audience question |
| `GET  /api/questions/:eventId` | Get questions for an event |
| `PATCH /api/questions/:id/approve` | Approve a question |
| `PATCH /api/questions/:id/reject` | Reject a question |
| `POST /api/ai/generate` | Generate an AI script |
| `POST /api/ai/copilot` | Run the anchor co-pilot |
| `GET  /api/agenda/:eventId` | Get event agenda |
| `POST /api/announcements` | Broadcast an announcement |

---

## Socket Events

The server uses Socket.IO rooms keyed by `eventId`. Key events:

| Event | Direction | Description |
|---|---|---|
| `join_event` | Client → Server | Join an event room |
| `agenda:update` | Server → Client | Agenda order changed |
| `session:started` | Server → Client | A session went live |
| `session:ended` | Server → Client | A session ended |
| `question:new` | Server → Client | New audience question submitted |
| `question:approved` | Server → Client | Question approved for anchor |
| `teleprompter:update` | Server → Client | Script text streamed to anchor |
| `broadcast:alert` | Server → Client | Urgent announcement pushed |
| `delay:reported` | Server → Client | Delay logged with duration |
| `timer:sync` | Server → Client | Stage timer synchronization |

---

## Roles & Access Control

| Role | Access |
|---|---|
| `organizer` | Create events, manage agenda, moderate Q&A, broadcast alerts, view health dashboard |
| `anchor` | View live teleprompter, see approved Q&A, use AI co-pilot, manage stage timer |
| `audience` | Submit questions, view public session info |

Roles are assigned at registration and enforced on both API routes (`roleMiddleware.js`) and the client (`ProtectedRoute.jsx`).

---

## AI Integration

StageFlow connects to **Google Gemini** (default) or **OpenAI** for AI script generation.

- Scripts are generated for: opening, closing, transition, speaker intro, filler, emergency, and delay scenarios.
- If no API key is provided, the **offline fallback engine** (`fallbackScripts.json`) automatically activates — the app remains fully functional without AI keys.
- All generated scripts are persisted to the `ScriptLog` collection for history and replay.

To switch AI providers, set `AI_PROVIDER=openai` in `server/.env`.

---

## Environment Variables Reference

### `server/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Express server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `CLIENT_URL` | Yes | — | Frontend URL for CORS |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret (keep strong) |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token lifetime |
| `GEMINI_API_KEY` | No | — | Google Gemini API key |
| `OPENAI_API_KEY` | No | — | OpenAI API key |
| `AI_PROVIDER` | No | `gemini` | `gemini` or `openai` |

### `client/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:5000/api` | Backend API base URL |
| `VITE_SOCKET_URL` | No | `http://localhost:5000` | Socket.IO server URL |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow the existing code style and ensure all routes are validated with the existing Joi validators in `server/src/validators/`.

---

## License

This project was created for hackathon purposes. All rights reserved © 2026 StageFlow / StagePilot.
