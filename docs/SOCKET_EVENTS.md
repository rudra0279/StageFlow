# StagePilot Real-Time WebSocket Specifications (Socket.IO)

Connected URL: `ws://localhost:5000` (or `http://localhost:5000`)

## Room Strategy
- Every client viewing an event joins `event_${eventId}`.
- Stage anchors additionally join `event_${eventId}_anchors`.

---

## Client to Server Events

### `join_event`
Joins the event real-time room.
```javascript
socket.emit('join_event', {
  eventId: '65e3170a4b...',
  role: 'ANCHOR' // or 'ORGANIZER'
});
```

### `trigger_delay`
Direct socket-driven delay trigger.
```javascript
socket.emit('trigger_delay', {
  eventId: '65e3170a4b...',
  sessionId: '65e3170a4c...',
  delayMinutes: 10,
  reason: 'Speaker arrived late'
});
```

### `start_session`
Switches active stage session.
```javascript
socket.emit('start_session', {
  eventId: '65e3170a4b...',
  sessionId: '65e3170a4c...'
});
```

### `send_stage_alert`
Emits an urgent notice to the stage screen.
```javascript
socket.emit('send_stage_alert', {
  eventId: '65e3170a4b...',
  message: 'Cut Q&A short, fire alarm test in 10 mins',
  urgency: 'CRITICAL',
  type: 'EMERGENCY'
});
```

---

## Server to Client Broadcasts

### `agenda_updated`
Emitted whenever sessions change, delays are added, or order updates.
```javascript
socket.on('agenda_updated', ({ eventId, sessions, totalDelayMinutes, healthStatus }) => {
  // Replaces sessions list and updates health status indicator
});
```

### `delay_broadcast`
Emitted when an organizer adds a delay. Prompts the anchor with sound chime and sticky toast.
```javascript
socket.on('delay_broadcast', ({ eventId, sessionId, delayMinutes, reason, healthStatus, targetSessionTitle }) => {
  // Plays alertChime() and displays delay notification toast
});
```

### `session_started`
Emitted when organizer clicks "Go LIVE".
```javascript
socket.on('session_started', ({ activeSession, nextSession }) => {
  // Auto-switches anchor teleprompter to new speaker
});
```

### `stage_alert`
Emitted when organizer broadcasts an urgent notice.
```javascript
socket.on('stage_alert', ({ id, message, urgency, type, timestamp }) => {
  // Plays alertChime() and flashes urgent banner across teleprompter
});
```

### `ai_script_ready`
Emitted when background AI completes generating a script.
```javascript
socket.on('ai_script_ready', ({ sessionId, scriptType, content }) => {
  // Automatically updates script card on anchor screen
});
```
