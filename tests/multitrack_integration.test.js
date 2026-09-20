// tests/multitrack_integration.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const Event = require('../src/models/Event');
const Agenda = require('../src/models/Agenda');
const Speaker = require('../src/models/Speaker');
const User = require('../src/models/User');
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');
require('./setup');

describe('Stage 3: Multi-Track System Backend Integration & QA', () => {
  let eventId;
  let organizerToken;
  let trackASessions = [];
  let trackBSessions = [];
  let trackCSessions = [];

  beforeAll(async () => {
    clearAllMemoryCollections();

    const organizer = await User.create({
      name: 'Elena WarRoom Manager',
      email: 'warroom@stagepilot.io',
      password: 'password123',
      role: 'organizer',
    });

    organizerToken = jwt.sign(
      { id: organizer._id.toString(), role: 'organizer' },
      env.JWT_SECRET
    );

    const event = await Event.create({
      name: 'Global AI & Tech Summit 2026',
      venue: 'Tech Center Complex',
      theme: 'Multi-Track Autonomous Systems',
      audience: '1400 attendees across 3 parallel tracks',
      date: new Date(),
      status: 'LIVE',
      eventHealth: 'ON_TRACK',
      delayTotalMinutes: 0,
      organizerId: organizer._id,
      tracks: [
        { id: 'track_a', name: 'TRACK A — MAIN STAGE', delayMinutes: 0 },
        { id: 'track_b', name: 'TRACK B — WORKSHOP HALL', delayMinutes: 0 },
        { id: 'track_c', name: 'TRACK C — NETWORKING LOUNGE', delayMinutes: 0 },
      ],
    });
    eventId = event._id.toString();

    // Speakers for Tracks
    const spkA = await Speaker.create({
      eventId,
      name: 'Dr. Sophia Chen',
      designation: 'Chief AI Scientist',
      organization: 'NeuralScale',
      topic: 'Generative AI at Scale',
    });

    const spkB = await Speaker.create({
      eventId,
      name: 'David Kumar',
      designation: 'Principal Architect',
      organization: 'VectorData',
      topic: 'Real-Time RAG Pipelines',
    });

    const spkC = await Speaker.create({
      eventId,
      name: 'Alex Morgan',
      designation: 'VC Partner',
      organization: 'Visionary Capital',
      topic: 'AI Founders Speed Pitch',
    });

    // Populate Track A (A1, A2, A3)
    const a1 = await Agenda.create({
      eventId,
      trackId: 'track_a',
      title: 'A1: Keynote Welcome',
      speakerId: spkA._id,
      orderIndex: 0,
      status: 'COMPLETED',
      startTime: new Date('2026-09-19T09:00:00Z'),
      endTime: new Date('2026-09-19T09:15:00Z'),
      durationMinutes: 15,
      delayMinutes: 0,
    });
    const a2 = await Agenda.create({
      eventId,
      trackId: 'track_a',
      title: 'A2: Generative AI at Scale',
      speakerId: spkA._id,
      orderIndex: 1,
      status: 'LIVE',
      startTime: new Date('2026-09-19T09:15:00Z'),
      endTime: new Date('2026-09-19T09:50:00Z'),
      durationMinutes: 35,
      delayMinutes: 0,
    });
    const a3 = await Agenda.create({
      eventId,
      trackId: 'track_a',
      title: 'A3: Panel Ethics & Safety',
      speakerId: spkA._id,
      orderIndex: 2,
      status: 'UPCOMING',
      startTime: new Date('2026-09-19T09:50:00Z'),
      endTime: new Date('2026-09-19T10:35:00Z'),
      durationMinutes: 45,
      delayMinutes: 0,
    });
    trackASessions = [a1, a2, a3];

    // Populate Track B (B1, B2, B3)
    const b1 = await Agenda.create({
      eventId,
      trackId: 'track_b',
      title: 'B1: LLM Fine-Tuning Lab',
      speakerId: spkB._id,
      orderIndex: 0,
      status: 'COMPLETED',
      startTime: new Date('2026-09-19T09:30:00Z'),
      endTime: new Date('2026-09-19T10:30:00Z'),
      durationMinutes: 60,
      delayMinutes: 0,
    });
    const b2 = await Agenda.create({
      eventId,
      trackId: 'track_b',
      title: 'B2: Real-Time RAG Architectures',
      speakerId: spkB._id,
      orderIndex: 1,
      status: 'LIVE',
      startTime: new Date('2026-09-19T10:30:00Z'),
      endTime: new Date('2026-09-19T11:30:00Z'),
      durationMinutes: 60,
      delayMinutes: 0,
    });
    const b3 = await Agenda.create({
      eventId,
      trackId: 'track_b',
      title: 'B3: Edge AI & Embedded Models',
      speakerId: spkB._id,
      orderIndex: 2,
      status: 'UPCOMING',
      startTime: new Date('2026-09-19T11:30:00Z'),
      endTime: new Date('2026-09-19T12:30:00Z'),
      durationMinutes: 60,
      delayMinutes: 0,
    });
    trackBSessions = [b1, b2, b3];

    // Populate Track C (C1, C2)
    const c1 = await Agenda.create({
      eventId,
      trackId: 'track_c',
      title: 'C1: AI Founders Pitch Lounge',
      speakerId: spkC._id,
      orderIndex: 0,
      status: 'LIVE',
      startTime: new Date('2026-09-19T10:00:00Z'),
      endTime: new Date('2026-09-19T11:00:00Z'),
      durationMinutes: 60,
      delayMinutes: 0,
    });
    const c2 = await Agenda.create({
      eventId,
      trackId: 'track_c',
      title: 'C2: Fireside Chat Autonomous Swarms',
      speakerId: spkC._id,
      orderIndex: 1,
      status: 'UPCOMING',
      startTime: new Date('2026-09-19T11:00:00Z'),
      endTime: new Date('2026-09-19T12:00:00Z'),
      durationMinutes: 60,
      delayMinutes: 0,
    });
    trackCSessions = [c1, c2];
  });

  afterAll(() => {
    clearAllMemoryCollections();
  });

  // Test 1: Multi-Track Data Belonging Validation
  test('Verify sessions belong to correct tracks (Track A, B, C)', async () => {
    const res = await request(app).get(`/api/events/${eventId}/agenda`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const allSessions = res.body.data;
    const aItems = allSessions.filter((s) => s.trackId === 'track_a');
    const bItems = allSessions.filter((s) => s.trackId === 'track_b');
    const cItems = allSessions.filter((s) => s.trackId === 'track_c');

    expect(aItems.length).toBe(3);
    expect(bItems.length).toBe(3);
    expect(cItems.length).toBe(2);
  });

  // Test 2: Delay Isolation Test
  test('Track A delay (+10 mins) shifts Track A sessions, leaving Track B & C unaffected', async () => {
    const targetA2 = trackASessions[1]._id.toString();

    const resDelayA = await request(app)
      .post(`/api/events/${eventId}/sessions/${targetA2}/delay`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ delayMinutes: 10 });

    expect(resDelayA.status).toBe(200);
    expect(resDelayA.body.success).toBe(true);

    // Fetch updated agenda
    const resAgenda = await request(app).get(`/api/events/${eventId}/agenda`);
    const allSessions = resAgenda.body.data;

    // Track A session A3 should reflect delay
    const updatedA3 = allSessions.find((s) => s._id.toString() === trackASessions[2]._id.toString());
    expect(updatedA3.delayMinutes).toBe(10);

    // Track B sessions (B1, B2, B3) must remain 0 delay
    const bItems = allSessions.filter((s) => s.trackId === 'track_b');
    bItems.forEach((bSession) => {
      expect(bSession.delayMinutes).toBe(0);
    });

    // Track C sessions (C1, C2) must remain 0 delay
    const cItems = allSessions.filter((s) => s.trackId === 'track_c');
    cItems.forEach((cSession) => {
      expect(cSession.delayMinutes).toBe(0);
    });
  });

  // Test 3: Separate Track B Delay Test
  test('Track B delay (+15 mins) shifts Track B sessions without affecting Track A or C', async () => {
    const targetB2 = trackBSessions[1]._id.toString();

    const resDelayB = await request(app)
      .post(`/api/events/${eventId}/sessions/${targetB2}/delay`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ delayMinutes: 15 });

    expect(resDelayB.status).toBe(200);
    expect(resDelayB.body.success).toBe(true);

    const resAgenda = await request(app).get(`/api/events/${eventId}/agenda`);
    const allSessions = resAgenda.body.data;

    // Track B session B3 must reflect 15 min delay
    const updatedB3 = allSessions.find((s) => s._id.toString() === trackBSessions[2]._id.toString());
    expect(updatedB3.delayMinutes).toBe(15);

    // Track A delay should remain untouched (10 mins)
    const updatedA3 = allSessions.find((s) => s._id.toString() === trackASessions[2]._id.toString());
    expect(updatedA3.delayMinutes).toBe(10);

    // Track C delay should remain 0
    const cItems = allSessions.filter((s) => s.trackId === 'track_c');
    cItems.forEach((cSession) => {
      expect(cSession.delayMinutes).toBe(0);
    });
  });

  // Test 4: AI Track Context Awareness
  test('AI Assistant returns response scoped to specific track context', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        query: 'Who is next on Track B?',
        trackId: 'track_b',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBeDefined();
  });

  // Test 5: Cross-Track Edge Cases
  test('Gracefully handles session query for track without active session', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        query: 'What is the schedule?',
        trackId: 'track_empty',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
