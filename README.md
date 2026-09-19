# StagePilot – AI Co-Pilot for Live Events 🎙️⚡

> Real-time event management and AI-assisted live anchor teleprompter platform.

StagePilot synchronizes event organizers and stage anchors in real-time. It features zero-refresh agenda updates, intelligent cascading delay engines (+5, +10, +15 mins), emergency flash alerts, phonetic pronunciation guides, and context-aware AI script generation (introductions, transitions, delay fillers, and live backstage co-piloting).

---

## 🚀 Quick Start (Under 2 Minutes)

### 1. Install Dependencies
In the repository root:
```bash
npm run install:all
```
*(Or run `npm install` in root, then `npm install` in `/server` and `/client`)*

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in both folders:

- **Server:**
```bash
cp server/.env.example server/.env
```
*(Optional: add `GEMINI_API_KEY` or `OPENAI_API_KEY`. If omitted, the Smart Fallback Engine automatically serves contextual scripts).*

- **Client:**
```bash
cp client/.env.example client/.env
```

### 3. Seed Realistic Demo Data
Populates the database with a 4-session tech conference, complete with speakers, bios, and phonetic guides:
```bash
npm run seed
```

### 4. Start Development Servers
Runs both the Express/Socket.IO backend (Port 5000) and the React/Vite client (Port 5173) concurrently:
```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## 🔑 Demo Accounts (1-Click Login Available)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Organizer** | `organizer@stagepilot.io` | `password123` |
| **Stage Anchor** | `anchor@stagepilot.io` | `password123` |

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **React 18 + Vite** – Instant HMR & fast builds
- **Tailwind CSS** – Custom dark stage aesthetic (`#05070e`) with high-contrast teleprompter typography
- **Socket.IO Client** – Real-time event subscription (`room_joined`, `agenda_updated`, `delay_broadcast`)
- **Recharts** – Live schedule drift and session duration visualizer
- **Lucide React** – Modern iconography
- **Web Audio API** – Pure synthesized two-tone alert chime (zero external audio dependencies)

### Backend
- **Node.js & Express.js** – REST API & modular controllers
- **Socket.IO** – Event-driven room communication (`event_${id}`)
- **MongoDB & Mongoose** – Schemas for Users, Events, Sessions, Speakers, and Announcements
- **JWT & Bcrypt** – Role-Based Access Control (`ORGANIZER` vs `ANCHOR`)
- **AI Engine (Gemini / OpenAI / Smart-Fallback)** – Dynamic context assembler with resilient offline fallbacks

---

## 📁 Project Structure

```text
stagepilot/
├── client/                     # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── api/                # Axios API services
│   │   ├── components/
│   │   │   ├── common/         # Button, Input, Modal, Badge, Card, Loader
│   │   │   ├── organizer/      # AgendaManager, DelayModal, BroadcastModal, HealthCard
│   │   │   ├── anchor/         # StageTimer, Teleprompter, CurrentSession, UrgentBanner
│   │   │   └── ai/             # ScriptGeneratorModal, AnchorCopilotDrawer
│   │   ├── context/            # AuthContext, SocketContext, EventContext
│   │   ├── hooks/              # useLiveEvent, useCountdown, useSocket, useAuth
│   │   └── pages/              # Landing, Login, Register, Organizer, Anchor
├── server/                     # Backend (Node.js + Express + Socket.IO)
│   ├── src/
│   │   ├── config/             # DB, Socket, AI, and Env configs
│   │   ├── constants/          # Socket events, roles, health statuses
│   │   ├── controllers/        # Auth, Event, Session, Speaker, AI controllers
│   │   ├── middleware/         # JWT auth, role validation, error handling
│   │   ├── models/             # Mongoose schemas (User, Event, Session, Speaker)
│   │   ├── prompts/            # Dynamic prompt templates & fallback scripts
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Cascading schedule engine & AI service
│   │   └── sockets/            # Socket room manager & agenda handlers
├── docs/                       # Hackathon Documentation
│   ├── API_SPECS.md            # REST API specs
│   ├── SOCKET_EVENTS.md        # WebSocket schemas
│   └── DEMO_SCRIPT.md          # 3-minute hackathon demo script
└── package.json                # Root concurrent scripts
```

---

## 🏆 Key Features Demonstrated in Hackathon

1. **Dual-Dashboard Real-Time Sync**: Open two windows side-by-side to witness real-time WebSocket communication without page reloads.
2. **Cascading Schedule Delays**: When an organizer adds +10 mins to Session 1, start times for Sessions 2, 3, and 4 shift forward automatically.
3. **Stage Teleprompter**: Fullscreen high-contrast view with variable auto-scroll and mirror mode for beamsplitter glass.
4. **Phonetic Pronunciation Guides**: Prominently highlights difficult speaker names for the anchor.
5. **AI Stage Co-Pilot**: Backstage drawer answering questions, providing icebreakers, and generating delay announcements in under 1 second.
