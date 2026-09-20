// tests/multi_track.test.js
require('./setup');
const http = require('http');
const request = require('supertest');
const ioClient = require('socket.io-client');
const app = require('../src/app');
const Event = require('../src/models/Event');
const Agenda = require('../src/models/Agenda');
const Speaker = require('../src/models/Speaker');
const User = require('../src/models/User');
const Announcement = require('../src/models/Announcement');
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');
const { initSocket } = require('../src/socket/socketServer');
const sessionService = require('../src/services/sessionService');

describe('Stage 3: Multi-Track Real-Time + AI Support Test Suite', () => {
  let server;
  let port;
  let eventId;
  let user;
  let speakerA1, speakerA2, speakerA3;
  let speakerB1, speakerB2, speakerB3;
  let sessionA1, sessionA2, sessionA3;
  let sessionB1, sessionB2, sessionB3;
  let socketAnchorA;
  let socketAnchorB;
  let socketEventWide;

  const baseTime = new Date('2026-10-15T09:00:00.000Z');

  beforeAll(async () => {
    clearAllMemoryCollections();

    // Start Socket.IO test server
    server = http.createServer(app);
    initSocket(server);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;

    // Create organizer
    user = await User.create({
      name: 'Stage Director',
      email: 'director@stagepilot.io',
      password: 'password123',
      role: 'organizer',
    });

    // Create multi-track event
    const event = await Event.create({
      name: 'Global Tech Horizon Summit 2026',
      venue: 'Metropolitan Convention Center',
      audience: 'Engineers, founders, and stage anchors',
      date: baseTime,
      startTime: baseTime,
      endTime: new Date(baseTime.getTime() + 8 * 3600000),
      organizerId: user._id,
      status: 'UPCOMING',
      eventHealth: 'ON_TRACK',
      delayTotalMinutes: 0,
    });
    eventId = event._id.toString();

    // Create speakers for Track A (Main Stage)
    speakerA1 = await Speaker.create({
      eventId,
      name: 'Dr. Elena Rostova',
      designation: 'Chief AI Scientist',
      organization: 'DeepTech Labs',
      topic: 'Autonomous Multi-Agent Swarms',
      pronunciationGuide: 'eh-LEH-nah ross-TOH-vah',
    });
    speakerA2 = await Speaker.create({
      eventId,
      name: 'Marcus Vance',
      designation: 'VP of Infrastructure',
      organization: 'NextGen Systems',
      topic: 'High-Scale Cloud Orchestration',
      pronunciationGuide: 'MAR-kus VANS',
    });
    speakerA3 = await Speaker.create({
      eventId,
      name: 'Sophia Chen',
      designation: 'Principal Architect',
      organization: 'Quantum AI',
      topic: 'Future of Neural Compute',
      pronunciationGuide: 'soh-FEE-ah CHEN',
    });

    // Create speakers for Track B (Workshop Hall)
    speakerB1 = await Speaker.create({
      eventId,
      name: 'David Kim',
      designation: 'Staff Engineer',
      organization: 'Kubernetes Core',
      topic: 'Hands-on Production Microservices',
      pronunciationGuide: 'DAY-vid KIM',
    });
    speakerB2 = await Speaker.create({
      eventId,
      name: 'Priya Patel',
      designation: 'Lead Security Researcher',
      organization: 'CyberSafe',
      topic: 'Zero-Trust Protocol Workshop',
      pronunciationGuide: 'PREE-yah pah-TEL',
    });
    speakerB3 = await Speaker.create({
      eventId,
      name: 'Liam O’Connor',
      designation: 'Head of DevOps',
      organization: 'CloudForge',
      topic: 'Edge Compute Pipelines',
      pronunciationGuide: 'LEE-um oh-KON-ner',
    });

    // Seed Track A Sessions (A1 -> A2 -> A3)
    sessionA1 = await Agenda.create({
      eventId,
      title: 'Track A Keynote: Autonomous Swarms',
      speakerId: speakerA1._id,
      track: 'Track A',
      room: 'Track A',
      orderIndex: 0,
      startTime: new Date(baseTime.getTime()),
      endTime: new Date(baseTime.getTime() + 30 * 60000),
      durationMinutes: 30,
      status: 'UPCOMING',
      delayMinutes: 0,
    });
    sessionA2 = await Agenda.create({
      eventId,
      title: 'Track A Talk: Cloud Orchestration',
      speakerId: speakerA2._id,
      track: 'Track A',
      room: 'Track A',
      orderIndex: 1,
      startTime: new Date(baseTime.getTime() + 30 * 60000),
      endTime: new Date(baseTime.getTime() + 60 * 60000),
      durationMinutes: 30,
      status: 'UPCOMING',
      delayMinutes: 0,
    });
    sessionA3 = await Agenda.create({
      eventId,
      title: 'Track A Panel: Neural Compute',
      speakerId: speakerA3._id,
      track: 'Track A',
      room: 'Track A',
      orderIndex: 2,
      startTime: new Date(baseTime.getTime() + 60 * 60000),
      endTime: new Date(baseTime.getTime() + 90 * 60000),
      durationMinutes: 30,
      status: 'UPCOMING',
      delayMinutes: 0,
    });

    // Seed Track B Sessions (B1 -> B2 -> B3)
    sessionB1 = await Agenda.create({
      eventId,
      title: 'Track B Lab: Production Microservices',
      speakerId: speakerB1._id,
      track: 'Track B',
      room: 'Track B',
      orderIndex: 0,
      startTime: new Date(baseTime.getTime()),
      endTime: new Date(baseTime.getTime() + 45 * 60000),
      durationMinutes: 45,
      status: 'UPCOMING',
      delayMinutes: 0,
    });
    sessionB2 = await Agenda.create({
      eventId,
      title: 'Track B Workshop: Zero-Trust Security',
      speakerId: speakerB2._id,
      track: 'Track B',
      room: 'Track B',
      orderIndex: 1,
      startTime: new Date(baseTime.getTime() + 45 * 60000),
      endTime: new Date(baseTime.getTime() + 90 * 60000),
      durationMinutes: 45,
      status: 'UPCOMING',
      delayMinutes: 0,
    });
    sessionB3 = await Agenda.create({
      eventId,
      title: 'Track B Deep Dive: Edge Pipelines',
      speakerId: speakerB3._id,
      track: 'Track B',
      room: 'Track B',
      orderIndex: 2,
      startTime: new Date(baseTime.getTime() + 90 * 60000),
      endTime: new Date(baseTime.getTime() + 135 * 60000),
      durationMinutes: 45,
      status: 'UPCOMING',
      delayMinutes: 0,
    });

    // Connect test sockets
    const socketOptions = {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    };

    socketAnchorA = ioClient(`http://localhost:${port}`, socketOptions);
    socketAnchorB = ioClient(`http://localhost:${port}`, socketOptions);
    socketEventWide = ioClient(`http://localhost:${port}`, socketOptions);

    await Promise.all([
      new Promise((resolve) => socketAnchorA.on('connect', resolve)),
      new Promise((resolve) => socketAnchorB.on('connect', resolve)),
      new Promise((resolve) => socketEventWide.on('connect', resolve)),
    ]);

    // Join rooms
    socketAnchorA.emit('joinEvent', { eventId, role: 'ANCHOR', track: 'Track A' });
    socketAnchorB.emit('joinEvent', { eventId, role: 'ANCHOR', track: 'Track B' });
    socketEventWide.emit('joinEvent', { eventId, role: 'AUDIENCE' });

    // Wait for room confirmations
    await Promise.all([
      new Promise((resolve) => socketAnchorA.once('joinedEvent', resolve)),
      new Promise((resolve) => socketAnchorB.once('joinedEvent', resolve)),
      new Promise((resolve) => socketEventWide.once('joinedEvent', resolve)),
    ]);
  });

  afterAll((done) => {
    if (socketAnchorA) socketAnchorA.disconnect();
    if (socketAnchorB) socketAnchorB.disconnect();
    if (socketEventWide) socketEventWide.disconnect();
    if (server) server.close(done);
    else done();
  });

  // ==================================================
  // 1. REAL-TIME INDEPENDENCE: SESSION ACTIVATION
  // ==================================================
  test('Track A and Track B sessions can be LIVE concurrently without terminating each other', async () => {
    // Start Track A session A1
    const resA = await sessionService.startSession(eventId, sessionA1._id);
    expect(resA.session.status).toBe('LIVE');
    expect(resA.track).toBe('Track A');

    // Start Track B session B1 independently
    const resB = await sessionService.startSession(eventId, sessionB1._id);
    expect(resB.session.status).toBe('LIVE');
    expect(resB.track).toBe('Track B');

    // Verify both are concurrently LIVE
    const liveA1 = await Agenda.findById(sessionA1._id);
    const liveB1 = await Agenda.findById(sessionB1._id);
    expect(liveA1.status).toBe('LIVE');
    expect(liveB1.status).toBe('LIVE');
  });

  // ==================================================
  // 2. REAL-TIME INDEPENDENCE: DELAY ISOLATION
  // ==================================================
  test('Delaying Track A (A1 +10m) shifts A1, A2, A3 while Track B (B1, B2, B3) remains strictly unchanged', async () => {
    const b1OriginalStart = (await Agenda.findById(sessionB1._id)).startTime.toISOString();
    const b2OriginalStart = (await Agenda.findById(sessionB2._id)).startTime.toISOString();
    const b3OriginalStart = (await Agenda.findById(sessionB3._id)).startTime.toISOString();

    const a1OriginalEnd = (await Agenda.findById(sessionA1._id)).endTime.getTime();
    const a2OriginalStart = (await Agenda.findById(sessionA2._id)).startTime.getTime();
    const a3OriginalStart = (await Agenda.findById(sessionA3._id)).startTime.getTime();

    // Listen for socket events
    const delayPromise = new Promise((resolve) => {
      socketAnchorA.once('sessionDelayed', resolve);
    });

    // Delay A1 by +10 minutes
    const delayRes = await sessionService.delaySession(eventId, sessionA1._id, 10);
    expect(delayRes.track).toBe('Track A');
    expect(delayRes.delayMinutes).toBe(10);
    expect(delayRes.trackDelayMinutes).toBe(10);

    const socketPayload = await delayPromise;
    expect(socketPayload.track).toBe('Track A');
    expect(socketPayload.delayMinutes).toBe(10);
    expect(socketPayload.affectedSessions).toBeDefined();
    expect(socketPayload.affectedSessions.length).toBe(3); // A1, A2, A3

    // Verify Track A shifted by +10 minutes (600,000 ms)
    const updatedA1 = await Agenda.findById(sessionA1._id);
    const updatedA2 = await Agenda.findById(sessionA2._id);
    const updatedA3 = await Agenda.findById(sessionA3._id);

    expect(new Date(updatedA1.endTime).getTime()).toBe(a1OriginalEnd + 600000);
    expect(new Date(updatedA2.startTime).getTime()).toBe(a2OriginalStart + 600000);
    expect(new Date(updatedA3.startTime).getTime()).toBe(a3OriginalStart + 600000);

    // Verify Track B remained 100% UNCHANGED
    const currentB1 = await Agenda.findById(sessionB1._id);
    const currentB2 = await Agenda.findById(sessionB2._id);
    const currentB3 = await Agenda.findById(sessionB3._id);

    expect(currentB1.startTime.toISOString()).toBe(b1OriginalStart);
    expect(currentB2.startTime.toISOString()).toBe(b2OriginalStart);
    expect(currentB3.startTime.toISOString()).toBe(b3OriginalStart);
    expect(currentB1.delayMinutes).toBe(0);
    expect(currentB2.delayMinutes).toBe(0);
  });

  // ==================================================
  // 3. MULTI-TRACK AI CONTEXT: SAME-TRACK SELECTION
  // ==================================================
  test('AI resolves correct next session within Track A and does NOT confuse with Track B', async () => {
    const resA = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        track: 'Track A',
        query: 'Who is next on this track?',
      });

    expect(resA.status).toBe(200);
    expect(resA.body.success).toBe(true);
    expect(resA.body.data.track).toBe('Track A');
    expect(resA.body.data.nextSession).toBeDefined();
    expect(resA.body.data.nextSession.title).toBe('Track A Talk: Cloud Orchestration');
    expect(resA.body.data.nextSession.speakerName).toBe('Marcus Vance');
    expect(resA.body.data.answer).toContain('Cloud Orchestration');
    expect(resA.body.data.answer).not.toContain('Zero-Trust Security'); // Must not pick Track B!
  });

  test('AI resolves correct next session within Track B and does NOT confuse with Track A', async () => {
    const resB = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        track: 'Track B',
        query: 'Who is next on this track?',
      });

    expect(resB.status).toBe(200);
    expect(resB.body.success).toBe(true);
    expect(resB.body.data.track).toBe('Track B');
    expect(resB.body.data.nextSession).toBeDefined();
    expect(resB.body.data.nextSession.title).toBe('Track B Workshop: Zero-Trust Security');
    expect(resB.body.data.nextSession.speakerName).toBe('Priya Patel');
    expect(resB.body.data.answer).toContain('Zero-Trust Security');
    expect(resB.body.data.answer).not.toContain('Cloud Orchestration'); // Must not pick Track A!
  });

  // ==================================================
  // 4. AI COPILOT SCENARIOS
  // ==================================================
  test('AI scenario: "Introduce the next speaker on this track" provides phonetic pronunciation', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        track: 'Track A',
        query: 'Introduce the next speaker on this track.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toContain('Marcus Vance');
    expect(res.body.data.nextSession.speakerPronunciation).toBe('MAR-kus VANS');
  });

  test('AI scenario: "How delayed is this track?" distinguishes track delay from event delay', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        track: 'Track A',
        query: 'How delayed is this track?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trackDelayMinutes).toBe(10);
    expect(res.body.data.answer).toContain('10 minutes');
  });

  test('AI scenario: "What is happening on the other stages?" provides summary of concurrent tracks', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        track: 'Track A',
        query: 'What is happening on the other stages?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.otherTracks).toBeDefined();
    expect(res.body.data.otherTracks.length).toBeGreaterThan(0);
    expect(res.body.data.answer).toContain('Track B');
  });

  test('AI scenario: "Give me a transition to the next session" builds smooth bridge', async () => {
    const res = await request(app)
      .post('/api/ai/transition')
      .send({
        eventId,
        track: 'Track A',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.track).toBe('Track A');
    expect(res.body.data.script).toContain('Track A');
  });

  // ==================================================
  // 5. ANNOUNCEMENTS: EVENT-WIDE vs TRACK-SPECIFIC
  // ==================================================
  test('Announcements correctly differentiate EVENT-WIDE from TRACK-SPECIFIC', async () => {
    // Event-wide announcement
    const resEventWide = await request(app)
      .post('/api/ai/announcement')
      .send({
        eventId,
        message: 'Lunch is now served in the main dining pavilion.',
        type: 'FOOD',
      });

    expect(resEventWide.status).toBe(200);
    expect(resEventWide.body.data.scope).toBe('EVENT-WIDE');
    expect(resEventWide.body.data.targetTrack).toBeNull();

    // Track-specific announcement
    const resTrackA = await request(app)
      .post('/api/ai/announcement')
      .send({
        eventId,
        targetTrack: 'Track A',
        message: 'Please take your seats for the upcoming keynote.',
        type: 'GENERAL',
      });

    expect(resTrackA.status).toBe(200);
    expect(resTrackA.body.data.scope).toBe('TRACK-SPECIFIC');
    expect(resTrackA.body.data.targetTrack).toBe('Track A');
  });

  // ==================================================
  // 6. SOCKET RECONNECT AND TRACK SWITCHING
  // ==================================================
  test('Socket reconnect and track room switching', async () => {
    const reconnectSocket = ioClient(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });

    await new Promise((resolve) => reconnectSocket.on('connect', resolve));

    // Join Track B
    reconnectSocket.emit('joinEvent', { eventId, role: 'ANCHOR', track: 'Track B' });
    const joinedB = await new Promise((resolve) => reconnectSocket.once('joinedEvent', resolve));
    expect(joinedB.track).toBe('Track B');

    // Switch to Track A
    reconnectSocket.emit('joinTrack', { eventId, track: 'Track A' });
    const joinedA = await new Promise((resolve) => reconnectSocket.once('joinedTrack', resolve));
    expect(joinedA.track).toBe('Track A');

    reconnectSocket.disconnect();
  });

  // ==================================================
  // 7. COMPLETE END-TO-END SCENARIO (REQUIREMENT 9)
  // ==================================================
  test('Full E2E Scenario: Tracks active -> Independent starts -> Track A +10m delay -> Track B untouched -> Track A AI Transition', async () => {
    // Step 1: Both Track A and Track B exist and have sessions
    const stateA = await sessionService.getEventState(eventId, 'Track A');
    const stateB = await sessionService.getEventState(eventId, 'Track B');
    expect(stateA.currentTrack).toBe('Track A');
    expect(stateB.currentTrack).toBe('Track B');

    // Step 2 & 3: Anchor is on Track A, session A1 is LIVE
    expect(stateA.currentSession.title).toContain('Autonomous Swarms');

    // Step 4: Track B session B1 starts independently
    expect(stateB.currentSession.title).toContain('Production Microservices');

    // Step 5 & 6: Track A receives delay
    const initialB2Start = (await Agenda.findById(sessionB2._id)).startTime.getTime();
    await sessionService.delaySession(eventId, sessionA1._id, 5);

    // Step 7: Track B remains completely unchanged
    const currentB2Start = (await Agenda.findById(sessionB2._id)).startTime.getTime();
    expect(currentB2Start).toBe(initialB2Start);

    // Step 8 & 9: AI Co-Pilot accurately identifies next Track A session
    const aiCheck = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        track: 'Track A',
        query: 'Who is next on this track?',
      });
    expect(aiCheck.body.data.nextSession.title).toBe('Track A Talk: Cloud Orchestration');

    // Step 10: AI generates track-specific transition
    const transitionCheck = await request(app)
      .post('/api/ai/transition')
      .send({
        eventId,
        track: 'Track A',
      });
    expect(transitionCheck.body.data.script).toContain('Track A');
    expect(transitionCheck.body.data.nextSession.title).toBe('Track A Talk: Cloud Orchestration');
  });
});
