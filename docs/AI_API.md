# StagePilot AI Service & Assistant API Documentation

StagePilot powers an intelligent, context-aware AI Co-Pilot specifically tuned for live event anchors and MCs.

Instead of generating generic boilerplate, StagePilot dynamically extracts real-time event status, active speakers, upcoming sessions, and schedule delays before composing stage-ready spoken scripts.

---

## 1. Architecture & Context Engine

```
       +-----------------------+
       |   Anchor / Organizer  |
       +-----------+-----------+
                   | HTTP POST /api/ai/*
                   v
       +-----------------------+
       |     aiController      |
       +-----------+-----------+
                   |
                   v
       +-----------------------+
       |    contextBuilder     | <--- Fetches live Event, Agenda, Speaker & Delay status
       +-----------+-----------+
                   |
                   v
       +-----------------------+
       |     promptBuilder     | <--- Formats stage directions & constraints (tone, maxLength)
       +-----------+-----------+
                   |
       +-----------v-----------+
       |       aiService       |
       +---+---------------+---+
           |               |
           v               v
     [Google Gemini]   [OpenAI]
           |               |
           +-------+-------+
                   |
         Spoken Anchor Script
```

### Context Schema
```json
{
  "eventName": "TechSprint 2026",
  "venue": "Main Auditorium",
  "audience": "College students & developers",
  "currentSession": {
    "title": "Keynote: Scalable Cloud Systems",
    "status": "LIVE"
  },
  "currentSpeaker": {
    "name": "Dr. Sarah Connor",
    "designation": "AI Lead",
    "organization": "DeepMind"
  },
  "nextSession": {
    "title": "Hands-on Workshop",
    "speakerName": "Alex Chen"
  },
  "scheduleChanges": [
    { "type": "DELAY", "minutes": 10, "sessionTitle": "Keynote: Scalable Cloud Systems" }
  ],
  "tone": "energetic and inspiring",
  "maxLength": 100
}
```

---

## 2. API Endpoints

### A. Event Opening Script
`POST /api/ai/opening`

Generates an anchor-ready opening speech welcoming attendees and setting the event's tone.

**Request Body:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "tone": "energetic",
  "maxLength": 150
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "script": "Good morning, innovators, creators, and future tech leaders! Welcome to HackNova 2026 here at the Main Convention Center. Over the next 36 hours, you will push boundaries and turn ideas into reality. [Pause, smile] Let's make history!",
    "provider": "gemini",
    "context": { "eventName": "HackNova 2026", "venue": "Main Convention Center" }
  }
}
```

---

### B. Speaker Introduction (30–45s)
`POST /api/ai/introduction`

Generates a prestigious 30–45 second spoken introduction for the current or designated speaker.

**Request Body:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "speakerId": "654a9f40890a2c418ef01238",
  "tone": "inspirational",
  "maxLength": 90
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "script": "It is our distinct honor to welcome Dr. Sarah Connor, VP of AI Research at DeepMind Technologies. With over 15 years pioneering autonomous systems, she joins us today to unveil the future of software engineering. Please put your hands together and welcome Dr. Sarah Connor to the stage!",
    "speaker": { "name": "Dr. Sarah Connor" },
    "session": { "title": "Keynote: Autonomous Systems" },
    "provider": "gemini"
  }
}
```

---

### C. Session Transition Bridge
`POST /api/ai/transition`

Builds a bridge between the just-concluded session and the incoming session.

**Request Body:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "tone": "seamless",
  "maxLength": 80
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "script": "A big round of applause once again for Dr. Connor! Up next, we dive right into action with our Hands-on Hackathon Kickoff & API Masterclass. Take your seats and open up your IDEs—things are about to get exciting!",
    "currentSession": { "title": "Keynote" },
    "nextSession": { "title": "Hackathon Kickoff" },
    "provider": "gemini"
  }
}
```

---

### D. Event Closing Speech
`POST /api/ai/closing`

Produces the final closing speech for the event.

**Request Body:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "tone": "triumphant",
  "maxLength": 120
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "script": "What an unbelievable 36 hours! To our participants, mentors, judges, and sponsors: you made HackNova 2026 unforgettable. Keep building, keep solving, and we will see you next year. Travel safe everyone!",
    "provider": "gemini"
  }
}
```

---

### E. Spoken Announcement Converter
`POST /api/ai/announcement`

Converts raw organizer messages or delay notifications into smooth, spoken announcements.

**Request Body:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "message": "Keynote Q&A running long",
  "delayMinutes": 10,
  "type": "SCHEDULE_CHANGE",
  "tone": "calm and professional"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "script": "Ladies and gentlemen, a brief schedule update: our keynote session is having such an engaging Q&A that we've extended it by 10 minutes. Please take this time to grab a coffee or network. We'll resume promptly!",
    "originalMessage": "Keynote Q&A running long",
    "type": "SCHEDULE_CHANGE",
    "provider": "gemini"
  }
}
```

---

### F. AI Anchor Assistant
`POST /api/ai/assistant`

Context-aware co-pilot answering live queries from the anchor on stage.

**Supported Queries & Commands:**
- `"What is next?"`
- `"Introduce the next speaker."`
- `"Generate a transition."`
- `"Generate a delay announcement."`
- `"Give me a short announcement."`
- `"Give me the closing speech."`

**Request Body:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "query": "What is next?"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "query": "What is next?",
    "answer": "Next up is 'Hands-on Hackathon Kickoff & API Masterclass' with Alex Chen on Main Stage. The event is currently running with a +10 minute slight delay.",
    "currentSession": { "title": "Keynote" },
    "nextSession": { "title": "Hands-on Hackathon Kickoff" },
    "eventHealth": "SLIGHT_DELAY",
    "delayTotalMinutes": 10,
    "provider": "gemini"
  }
}
```

---

## 3. Failure Handling Guarantee (Requirement 9)

If an external AI provider (Gemini or OpenAI) fails, times out, or triggers rate-limits:
- The backend **never crashes**.
- Returns HTTP `503 Service Unavailable`:
```json
{
  "success": false,
  "message": "AI service temporarily unavailable"
}
```
- A tagged log `[AI]` is recorded with the specific upstream error details without exposing credentials.
