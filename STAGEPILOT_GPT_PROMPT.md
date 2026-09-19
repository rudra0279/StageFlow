# 🚀 STAGEPILOT (STAGEFLOW) — GPT HANDOVER & PROJECT PROMPT

## 📌 Project Overview
- **Project Name**: StagePilot (StageFlow)
- **Repository**: `https://github.com/rudra0279/StageFlow.git`
- **Branch**: `main`

---

## 🛠️ Technology Stack
- **Frontend**: React (v18), Vite (`port 5173 / 5175`), Web Speech API, Web Audio API, Socket.IO Client, Axios
- **Backend**: Node.js, Express, Socket.IO Server (`port 5001`), MongoDB (In-Memory fallback for local dev), JWT Auth
- **AI Integration**: Google Gemini AI API (`script generator`, `Stage Co-Pilot`, `announcement helper`)

---

## ✅ Completed Implementation Summary

### 1. Stage 1: Anchor Teleprompter & Live Speech Follower
- Stage-ready Teleprompter interface with high contrast.
- Horizontal mirror mode (for physical beam-splitter glass).
- Auto-scroll with variable speed controls and font size adjusters.
- Pronunciation guide for complex speaker names.
- Urgent Flash Banner & Web Audio alert chime.
- Browser Web Speech API for real-time speech tracking & teleprompter auto-follow.

### 2. Stage 2: Organizer War Room & AI Co-Pilot
- Real-time Organizer War Room control dashboard.
- Cascading Delay Engine: auto-recalculates downstream session start times.
- AI Stage Co-Pilot (Gemini API) for live delay mitigation and announcements.
- Real-time multi-user WebSocket synchronization via Socket.IO.

### 3. Stage 3: Multi-Track System & QA Integration
- Support for concurrent tracks (Track A — Main Stage, Track B — Workshop Hall, Track C — Networking).
- Track-isolated delay management.
- Anchor Station track selector.
- 13/13 automated integration tests passing.

### 4. Infrastructure & Server Fixes
- Backend server moved to **Port 5001** (resolving macOS AirPlay/ControlCenter port 5000 conflict).
- Vite proxy (`/api` and `/socket.io`) configured targeting `http://localhost:5001`.
- All changes committed and pushed to `https://github.com/rudra0279/StageFlow.git`.

---

## 📋 Copy & Paste Prompt for GPT

```text
Hi GPT! I am working on StagePilot (StageFlow), a real-time multi-track stage management and live teleprompter application.

Here is the current status of the project:
1. GitHub Repository: https://github.com/rudra0279/StageFlow.git (main branch up to date).
2. Stack: React + Vite, Node.js + Express, Socket.IO, MongoDB, Web Speech API, Gemini AI.
3. Features Implemented:
   - Teleprompter with mirror mode, speech tracking, auto-scroll, and pronunciation guide.
   - Organizer War Room with Cascading Delay Engine and AI Stage Co-Pilot.
   - Multi-Track Event handling (Track A, B, C) with track-isolated delay management.
   - Server running on Port 5001 with Vite proxy fully configured.

I need help with my next task:
[INSERT YOUR NEXT FEATURE OR TASK HERE, e.g., "Add PDF schedule exporter", "Create speaker stats dashboard", or "Add notification webhooks"]

Please analyze my current architecture and provide a detailed technical implementation plan with code examples.
```
