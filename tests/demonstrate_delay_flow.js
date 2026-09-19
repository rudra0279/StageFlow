// tests/demonstrate_delay_flow.js
/**
 * StagePilot - Demonstration of Core Technical Flow:
 * 1. Organizer clicks "Delay +10"
 * 2. Backend updates state (session + cascading agenda + event health)
 * 3. Socket.IO broadcasts to event room
 * 4. Anchor Dashboard receives live payload without page refresh
 * 5. AI receives updated context
 * 6. AI generates an appropriate delay announcement
 */

process.env.USE_IN_MEMORY_DB = 'true';
process.env.NODE_ENV = 'test';

const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../src/app');
const { initSocket } = require('../src/socket/socketServer');
const { delaySession } = require('../src/services/sessionService');
const { buildEventContext } = require('../src/services/ai/contextBuilder');
const { generateScript } = require('../src/services/ai/aiService');
const Event = require('../src/models/Event');
const Agenda = require('../src/models/Agenda');
const User = require('../src/models/User');
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');

async function runDemonstration() {
  console.log('\n===============================================================');
  console.log('  STAGEPILOT: LIVE DELAY +10 REAL-TIME & AI FLOW DEMO');
  console.log('===============================================================\n');

  clearAllMemoryCollections();

  const server = http.createServer(app);
  initSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`[SYSTEM] Server listening on port ${port}`);

  // Step A: Seed Organizer, Event, and Sessions
  const organizer = await User.create({
    name: 'Hackathon Director',
    email: 'director@hacknova.org',
    password: 'secretpassword',
    role: 'organizer',
  });

  const now = new Date();
  const event = await Event.create({
    name: 'HackNova 2026 Grand Finale',
    venue: 'Convention Center, Main Auditorium',
    audience: '400 developers, 50 judges, university faculty',
    date: now,
    startTime: now,
    endTime: new Date(now.getTime() + 8 * 3600 * 1000),
    organizerId: organizer._id,
    status: 'LIVE',
    eventHealth: 'ON_TRACK',
    delayTotalMinutes: 0,
  });

  const session1 = await Agenda.create({
    eventId: event._id,
    title: 'Opening Ceremony & Team Pitches',
    startTime: now,
    endTime: new Date(now.getTime() + 45 * 60 * 1000),
    durationMinutes: 45,
    status: 'LIVE',
    type: 'KEYNOTE',
    orderIndex: 0,
  });

  const session2 = await Agenda.create({
    eventId: event._id,
    title: 'Round 1 Judge Deliberations & Mentor Demos',
    startTime: new Date(now.getTime() + 45 * 60 * 1000),
    endTime: new Date(now.getTime() + 90 * 60 * 1000),
    durationMinutes: 45,
    status: 'UPCOMING',
    type: 'PANEL',
    orderIndex: 1,
  });

  event.currentSessionId = session1._id;
  await event.save();
  console.log(`[EVENT] Initialized Event "${event.name}" with 2 sessions. Health: ${event.eventHealth}`);

  // Step B: Anchor Dashboard connects to Socket.IO and joins room
  const anchorSocket = Client(`http://localhost:${port}`);
  await new Promise((resolve) => {
    anchorSocket.on('connect', () => {
      anchorSocket.emit('joinEvent', { eventId: event._id.toString(), role: 'anchor' });
    });
    anchorSocket.on('joinedEvent', (data) => {
      console.log(`[SOCKET] Anchor Dashboard connected and joined room: ${data.room} (No page refresh needed)`);
      resolve();
    });
  });

  // Step C: Setup Anchor Socket listener for real-time delay broadcast
  const delayReceivedPromise = new Promise((resolve) => {
    anchorSocket.on('sessionDelayed', (payload) => {
      console.log('\n[SOCKET -> ANCHOR DASHBOARD] REAL-TIME EVENT RECEIVED:');
      console.log(`  - Event: ${payload.eventId}`);
      console.log(`  - Delayed Agenda: ${payload.agendaId}`);
      console.log(`  - Delay Added: +${payload.delayMinutes} minutes`);
      console.log(`  - New Event Health: ${payload.eventHealth}`);
      console.log(`  - Total Event Delay: ${payload.delayTotalMinutes} minutes`);
      resolve(payload);
    });
  });

  // Step D: Organizer clicks "Delay +10"
  console.log('\n>>> ACTION: Organizer clicks "Delay +10" on Session 1...');
  const delayResult = await delaySession(event._id.toString(), session1._id.toString(), 10);
  console.log(`[BACKEND] State updated in DB. Session 1 new endTime: ${delayResult.session.endTime.toISOString()}`);
  console.log(`[BACKEND] Subsequent Session 2 shifted forward by +10 min.`);

  // Wait for Socket broadcast to reach Anchor
  await delayReceivedPromise;

  // Step E: AI receives updated context
  console.log('\n>>> Step E: Extracting updated live context for StagePilot AI...');
  const updatedContext = await buildEventContext(event._id.toString(), {
    delayMinutes: 10,
    tone: 'calm and energetic',
    maxLength: 70,
  });
  console.log(`[AI CONTEXT] Event Health: ${updatedContext.eventHealth}`);
  console.log(`[AI CONTEXT] Schedule Changes Detected: ${updatedContext.scheduleChanges.length}`);
  console.log(`[AI CONTEXT] Current Session: "${updatedContext.currentSession ? updatedContext.currentSession.title : ''}"`);

  // Step F: AI generates appropriate delay announcement
  console.log('\n>>> Step F: Generating contextual delay announcement via StagePilot AI...');
  const aiResult = await generateScript('announcement', updatedContext);

  console.log('\n---------------------------------------------------------------');
  console.log('STAGEPILOT AI GENERATED SCRIPT FOR ANCHOR:');
  console.log('---------------------------------------------------------------');
  console.log(`"${aiResult.script}"`);
  console.log('---------------------------------------------------------------');
  console.log(`Provider: ${aiResult.provider}`);
  console.log('===============================================================\n');

  anchorSocket.disconnect();
  server.close();
  clearAllMemoryCollections();
  console.log('Demonstration successfully completed.\n');
}

if (require.main === module) {
  runDemonstration().catch(console.error);
}

module.exports = { runDemonstration };
