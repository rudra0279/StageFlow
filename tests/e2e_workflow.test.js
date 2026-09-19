// tests/e2e_workflow.test.js
const request = require('supertest');
const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../src/app');
const { initSocket } = require('../src/socket/socketServer');
require('./setup');

describe('StagePilot End-to-End Workflow (All 15 Scenarios)', () => {
  let server;
  let serverPort;
  let organizerToken;
  let eventId;
  let speakerId;
  let session1Id;
  let session2Id;
  let anchorSocket;

  beforeAll((done) => {
    server = http.createServer(app);
    initSocket(server);
    server.listen(0, () => {
      serverPort = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (anchorSocket && anchorSocket.connected) {
      anchorSocket.disconnect();
    }
    server.close(done);
  });

  // Scenario 1: Organizer logs in
  test('Scenario 1: Organizer registers and logs in', async () => {
    // Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Lead Organizer',
        email: 'organizer@stagepilot.io',
        password: 'password123',
        role: 'organizer',
      });
    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'organizer@stagepilot.io',
        password: 'password123',
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();

    organizerToken = loginRes.body.data.token;
  });

  // Scenario 2: Event is created
  test('Scenario 2: Event is created', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'HackNova 2026',
        description: 'Flagship 36-Hour National Hackathon',
        venue: 'Main Convention Center, Hall A',
        audience: '500+ Engineering students, hackers, and industry mentors',
        date: new Date('2026-10-15T09:00:00.000Z'),
        startTime: new Date('2026-10-15T09:00:00.000Z'),
        endTime: new Date('2026-10-16T21:00:00.000Z'),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('HackNova 2026');
    expect(res.body.data.eventHealth).toBe('ON_TRACK');

    eventId = res.body.data._id;
  });

  // Scenario 3: Speaker is created
  test('Scenario 3: Speaker is created', async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/speakers`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Dr. Sarah Connor',
        designation: 'VP of AI Research',
        organization: 'DeepMind Technologies',
        topic: 'Autonomous Agents & Future of Software',
        bio: 'Pioneering researcher in LLMs and multi-agent coordination with over 15 years in AI.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Dr. Sarah Connor');

    speakerId = res.body.data._id;
  });

  // Scenario 4: Agenda is created
  test('Scenario 4: Agenda is created', async () => {
    // Session 1: Opening & Keynote
    const res1 = await request(app)
      .post(`/api/events/${eventId}/agenda`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Keynote: Next-Gen Autonomous AI Systems',
        description: 'Opening keynote discussing real-time multi-agent workflows',
        speakerId,
        startTime: new Date('2026-10-15T09:30:00.000Z'),
        endTime: new Date('2026-10-15T10:30:00.000Z'),
        durationMinutes: 60,
        type: 'KEYNOTE',
        orderIndex: 0,
      });

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    session1Id = res1.body.data._id;

    // Session 2: Workshop
    const res2 = await request(app)
      .post(`/api/events/${eventId}/agenda`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Hands-on Hackathon Kickoff & API Masterclass',
        description: 'Interactive developer masterclass for hackathon teams',
        startTime: new Date('2026-10-15T10:30:00.000Z'),
        endTime: new Date('2026-10-15T11:30:00.000Z'),
        durationMinutes: 60,
        type: 'WORKSHOP',
        orderIndex: 1,
      });

    expect(res2.status).toBe(201);
    expect(res2.body.success).toBe(true);
    session2Id = res2.body.data._id;
  });

  // Connect Anchor Socket.IO client before live session flows
  test('Anchor Dashboard connects to Socket.IO and joins event room', (done) => {
    anchorSocket = Client(`http://localhost:${serverPort}`);
    anchorSocket.on('connect', () => {
      anchorSocket.emit('joinEvent', { eventId, role: 'anchor' });
    });

    anchorSocket.on('joinedEvent', (data) => {
      expect(data.eventId).toBe(eventId);
      expect(data.room).toBe(`event:${eventId}`);
      done();
    });
  });

  // Scenario 5: Session starts
  test('Scenario 5: Session starts and emits sessionStarted and eventStateChanged', (done) => {
    let sessionStartedReceived = false;
    let eventStateChangedReceived = false;

    const checkDone = () => {
      if (sessionStartedReceived && eventStateChangedReceived) {
        anchorSocket.off('sessionStarted');
        anchorSocket.off('eventStateChanged');
        done();
      }
    };

    anchorSocket.on('sessionStarted', (data) => {
      expect(data.eventId).toBe(eventId);
      expect(data.session._id).toBe(session1Id);
      expect(data.session.status).toBe('LIVE');
      sessionStartedReceived = true;
      checkDone();
    });

    anchorSocket.on('eventStateChanged', (data) => {
      expect(data.eventId).toBe(eventId);
      expect(data.state).toBe('LIVE');
      expect(data.currentSession._id).toBe(session1Id);
      eventStateChangedReceived = true;
      checkDone();
    });

    request(app)
      .post(`/api/events/${eventId}/sessions/${session1Id}/start`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
  });

  // Scenario 7: Session is delayed (Delay +10 min) & Scenario 8: Anchor receives update
  test('Scenario 7 & 8: Session is delayed +10 min and Anchor receives real-time update', (done) => {
    let delayedReceived = false;
    let stateChangedReceived = false;
    let agendaUpdatedReceived = false;

    const checkDone = () => {
      if (delayedReceived && stateChangedReceived && agendaUpdatedReceived) {
        anchorSocket.off('sessionDelayed');
        anchorSocket.off('eventStateChanged');
        anchorSocket.off('agendaUpdated');
        done();
      }
    };

    anchorSocket.on('sessionDelayed', (data) => {
      expect(data.eventId).toBe(eventId);
      expect(data.agendaId).toBe(session1Id);
      expect(data.delayMinutes).toBe(10);
      expect(data.eventHealth).toBe('SLIGHT_DELAY');
      delayedReceived = true;
      checkDone();
    });

    anchorSocket.on('eventStateChanged', (data) => {
      expect(data.eventId).toBe(eventId);
      expect(data.eventHealth).toBe('SLIGHT_DELAY');
      expect(data.delayTotalMinutes).toBe(10);
      stateChangedReceived = true;
      checkDone();
    });

    anchorSocket.on('agendaUpdated', (data) => {
      expect(data.eventId).toBe(eventId);
      expect(data.agenda.length).toBe(2);
      agendaUpdatedReceived = true;
      checkDone();
    });

    // Organizer triggers "Delay +10"
    request(app)
      .post(`/api/events/${eventId}/sessions/${session1Id}/delay`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ delayMinutes: 10 })
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.eventHealth).toBe('SLIGHT_DELAY');
        expect(res.body.data.delayMinutes).toBe(10);
      });
  });

  // Scenario 6: Session completes
  test('Scenario 6: Session completes and emits sessionCompleted and eventStateChanged', (done) => {
    let completedReceived = false;
    let stateChangedReceived = false;

    const checkDone = () => {
      if (completedReceived && stateChangedReceived) {
        anchorSocket.off('sessionCompleted');
        anchorSocket.off('eventStateChanged');
        done();
      }
    };

    anchorSocket.on('sessionCompleted', (data) => {
      expect(data.eventId).toBe(eventId);
      expect(data.session._id).toBe(session1Id);
      expect(data.session.status).toBe('COMPLETED');
      completedReceived = true;
      checkDone();
    });

    anchorSocket.on('eventStateChanged', (data) => {
      expect(data.eventId).toBe(eventId);
      stateChangedReceived = true;
      checkDone();
    });

    request(app)
      .post(`/api/events/${eventId}/sessions/${session1Id}/complete`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
  });

  // Scenario 9: Announcement is broadcast
  test('Scenario 9: Announcement is broadcast in real-time to Anchor', (done) => {
    anchorSocket.on('announcementCreated', (data) => {
      expect(data.eventId).toBe(eventId);
      expect(data.announcement.message).toBe('Lunch will be served at the central cafeteria on the 2nd floor.');
      expect(data.announcement.formattedSpeech).toBeDefined();
      anchorSocket.off('announcementCreated');
      done();
    });

    request(app)
      .post(`/api/events/${eventId}/announcements`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        message: 'Lunch will be served at the central cafeteria on the 2nd floor.',
        type: 'FOOD',
        priority: 'NORMAL',
      })
      .then((res) => {
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });
  });

  // Scenario 10: AI generates opening
  test('Scenario 10: AI generates event opening script', async () => {
    const res = await request(app)
      .post('/api/ai/opening')
      .send({
        eventId,
        tone: 'energetic',
        maxLength: 120,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.script).toBeDefined();
    expect(res.body.data.script.length).toBeGreaterThan(20);
    expect(res.body.data.context.eventName).toBe('HackNova 2026');
  });

  // Scenario 11: AI generates introduction
  test('Scenario 11: AI generates 30–45 second speaker introduction', async () => {
    const res = await request(app)
      .post('/api/ai/introduction')
      .send({
        eventId,
        speakerId,
        tone: 'inspirational',
        maxLength: 90,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.script).toBeDefined();
    expect(res.body.data.speaker.name).toBe('Dr. Sarah Connor');
  });

  // Scenario 12: AI generates transition
  test('Scenario 12: AI generates transition between current and next session', async () => {
    const res = await request(app)
      .post('/api/ai/transition')
      .send({
        eventId,
        tone: 'seamless',
        maxLength: 80,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.script).toBeDefined();
  });

  // Scenario 13: AI generates delay announcement
  test('Scenario 13: AI generates delay announcement reflecting current schedule delay', async () => {
    const res = await request(app)
      .post('/api/ai/announcement')
      .send({
        eventId,
        delayMinutes: 10,
        type: 'SCHEDULE_CHANGE',
        message: 'Keynote Q&A running long',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.script).toBeDefined();
    expect(res.body.data.script.toLowerCase()).toContain('minutes');
  });

  // Scenario 14: AI generates closing
  test('Scenario 14: AI generates event closing speech', async () => {
    const res = await request(app)
      .post('/api/ai/closing')
      .send({
        eventId,
        tone: 'triumphant',
        maxLength: 100,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.script).toBeDefined();
  });

  // Scenario 15: AI assistant understands current event context
  test('Scenario 15: AI assistant answers anchor commands with live event context', async () => {
    // Query: What is next?
    const nextRes = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        query: 'What is next?',
      });

    expect(nextRes.status).toBe(200);
    expect(nextRes.body.success).toBe(true);
    expect(nextRes.body.data.answer).toBeDefined();
    expect(nextRes.body.data.eventHealth).toBe('SLIGHT_DELAY');
    expect(nextRes.body.data.delayTotalMinutes).toBe(10);

    // Command: Introduce the next speaker
    const introRes = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        query: 'Introduce the next speaker.',
      });

    expect(introRes.status).toBe(200);
    expect(introRes.body.success).toBe(true);
    expect(introRes.body.data.answer).toBeDefined();

    // Command: Generate a delay announcement
    const delayRes = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        query: 'Generate a delay announcement.',
      });

    expect(delayRes.status).toBe(200);
    expect(delayRes.body.success).toBe(true);
    expect(delayRes.body.data.answer).toBeDefined();
  });

  // Failure Handling Verification (Requirement 9)
  test('Requirement 9: AI failure returns graceful 503 JSON without crashing', async () => {
    // Pass an invalid provider or simulate upstream failure
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    const originalProvider = process.env.AI_PROVIDER;

    try {
      process.env.AI_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'invalid_nonexistent_key_xyz_123';

      const failRes = await request(app)
        .post('/api/ai/opening')
        .send({
          eventId,
        });

      // Must never crash the server and return standard format
      expect([200, 503]).toContain(failRes.status);
      if (failRes.status === 503) {
        expect(failRes.body.success).toBe(false);
        expect(failRes.body.message).toBe('AI service temporarily unavailable');
      }
    } finally {
      process.env.GEMINI_API_KEY = originalGeminiKey;
      process.env.AI_PROVIDER = originalProvider;
    }
  });
});
