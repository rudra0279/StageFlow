# StagePilot Socket.IO Real-Time Architecture & Event Catalog

StagePilot utilizes Socket.IO to enable bidirectional, low-latency communication between organizers, stage managers, and the Anchor Live Dashboard.

When an organizer adjusts the live agenda, delays a session, or issues an urgent stage alert, connected anchor dashboards update **immediately without requiring any page reload**.

---

## 1. Room Architecture & Lifecycle

All real-time communications are strictly scoped to event rooms to prevent cross-event noise.

```
Room Pattern: event:<eventId>
Example:      event:654a9f3b890a2c418ef01234
```

### Joining an Event Room
When an anchor opens an event dashboard or an organizer enters the control room:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

// Join the isolated event room
socket.emit('joinEvent', {
  eventId: '654a9f3b890a2c418ef01234',
  role: 'anchor', // 'anchor' | 'organizer' | 'viewer'
});

// Acknowledged by server
socket.on('joinedEvent', ({ eventId, room, success }) => {
  console.log(`Connected to room: ${room}`);
});
```

### Leaving an Event Room
```javascript
socket.emit('leaveEvent', {
  eventId: '654a9f3b890a2c418ef01234',
});
```

---

## 2. Server-Emitted Real-Time Events

All events are broadcast **exclusively** to the room `event:<eventId>`.

### A. `agendaUpdated`
Emitted whenever the agenda schedule is modified, reordered, or recalculated after a delay.

**Payload:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "agenda": [
    {
      "_id": "654a9f4c890a2c418ef01240",
      "title": "Keynote: Next-Gen AI",
      "status": "LIVE",
      "type": "KEYNOTE",
      "room": "Main Stage",
      "startTime": "2026-10-15T09:30:00.000Z",
      "endTime": "2026-10-15T10:40:00.000Z",
      "durationMinutes": 70,
      "delayMinutes": 10,
      "orderIndex": 0,
      "speakerId": {
        "_id": "654a9f40890a2c418ef01238",
        "name": "Dr. Sarah Connor",
        "designation": "VP of AI"
      }
    }
  ],
  "timestamp": "2026-10-15T09:45:00.000Z"
}
```

---

### B. `sessionStarted`
Emitted when the organizer clicks **"START SESSION"**.

**Payload:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "session": {
    "_id": "654a9f4c890a2c418ef01240",
    "title": "Keynote: Next-Gen AI",
    "status": "LIVE",
    "startTime": "2026-10-15T09:30:00.000Z",
    "endTime": "2026-10-15T10:30:00.000Z"
  },
  "currentSession": { ... },
  "nextSession": { ... },
  "timestamp": "2026-10-15T09:30:02.000Z"
}
```

---

### C. `sessionCompleted`
Emitted when the organizer clicks **"COMPLETE SESSION"**.

**Payload:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "session": {
    "_id": "654a9f4c890a2c418ef01240",
    "title": "Keynote: Next-Gen AI",
    "status": "COMPLETED"
  },
  "currentSession": null,
  "nextSession": { ... },
  "timestamp": "2026-10-15T10:30:00.000Z"
}
```

---

### D. `sessionDelayed`
Emitted when the organizer clicks **"DELAY +5"**, **"DELAY +10"**, or **"DELAY +15"**.

**Payload:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "agendaId": "654a9f4c890a2c418ef01240",
  "delayMinutes": 10,
  "currentSession": {
    "_id": "654a9f4c890a2c418ef01240",
    "title": "Keynote: Next-Gen AI",
    "endTime": "2026-10-15T10:40:00.000Z"
  },
  "nextSession": {
    "_id": "654a9f50890a2c418ef01245",
    "title": "Hackathon API Workshop",
    "startTime": "2026-10-15T10:40:00.000Z"
  },
  "eventHealth": "SLIGHT_DELAY",
  "delayTotalMinutes": 10,
  "timestamp": "2026-10-15T09:50:00.000Z"
}
```

---

### E. `sessionSkipped`
Emitted when the organizer clicks **"SKIP SESSION"**.

**Payload:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "session": {
    "_id": "654a9f50890a2c418ef01245",
    "title": "Unscheduled Intermission",
    "status": "SKIPPED"
  },
  "timestamp": "2026-10-15T10:00:00.000Z"
}
```

---

### F. `announcementCreated`
Emitted when an organizer creates an announcement or unexpected stage alert.

**Payload:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "announcement": {
    "_id": "654a9f65890a2c418ef01255",
    "message": "Lunch is now served in the west cafeteria on the 2nd floor.",
    "formattedSpeech": "Attention all hackers and attendees! Delicious lunch is now served in the west cafeteria on the second floor. Please take your meal vouchers with you!",
    "type": "FOOD",
    "priority": "NORMAL",
    "createdAt": "2026-10-15T13:00:00.000Z"
  },
  "timestamp": "2026-10-15T13:00:01.000Z"
}
```

---

### G. `eventStateChanged`
Emitted whenever the event's high-level state, active session, or health transitions.

**Payload:**
```json
{
  "eventId": "654a9f3b890a2c418ef01234",
  "state": "LIVE",
  "eventHealth": "SLIGHT_DELAY",
  "currentSession": { ... },
  "nextSession": { ... },
  "delayTotalMinutes": 10,
  "timestamp": "2026-10-15T10:00:00.000Z"
}
```

---

## 3. Client Implementation Example (React)

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useStagePilotSocket(eventId) {
  const [eventHealth, setEventHealth] = useState('ON_TRACK');
  const [currentSession, setCurrentSession] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (!eventId) return;

    const socket = io('http://localhost:5000');

    socket.emit('joinEvent', { eventId, role: 'anchor' });

    socket.on('sessionStarted', ({ session, nextSession }) => {
      setCurrentSession(session);
      setNextSession(nextSession);
    });

    socket.on('sessionDelayed', ({ delayMinutes, currentSession, nextSession, eventHealth }) => {
      setCurrentSession(currentSession);
      setNextSession(nextSession);
      setEventHealth(eventHealth);
    });

    socket.on('announcementCreated', ({ announcement }) => {
      setAnnouncements(prev => [announcement, ...prev]);
    });

    socket.on('eventStateChanged', (state) => {
      setEventHealth(state.eventHealth);
      setCurrentSession(state.currentSession);
      setNextSession(state.nextSession);
    });

    return () => {
      socket.emit('leaveEvent', { eventId });
      socket.disconnect();
    };
  }, [eventId]);

  return { eventHealth, currentSession, nextSession, announcements };
}
```
