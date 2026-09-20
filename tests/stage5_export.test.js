// tests/stage5_export.test.js
const request = require('supertest');
const app = require('../src/app');
const Event = require('../src/models/Event');
const Agenda = require('../src/models/Agenda');
const Speaker = require('../src/models/Speaker');
const User = require('../src/models/User');
const { delaySession } = require('../src/services/sessionService');
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');
require('./setup');

describe('Stage 5: Run-of-Show PDF Exporter Backend & Data Contract', () => {
  let primaryOrgUser;
  let primaryOrgToken;
  let secondaryOrgToken;
  let anchorToken;
  let adminToken;
  let mainEventId;
  let speakerId;

  beforeAll(async () => {
    clearAllMemoryCollections();

    // 1. Create Primary Organizer
    const orgRes1 = await request(app).post('/api/auth/register').send({
      name: 'Primary Organizer',
      email: 'primary.organizer@stagepilot.io',
      password: 'password123',
      role: 'organizer',
    });
    primaryOrgToken = orgRes1.body.data?.token;
    primaryOrgUser = orgRes1.body.data?.user;

    // 2. Create Secondary Organizer (for ownership authorization testing)
    const orgRes2 = await request(app).post('/api/auth/register').send({
      name: 'Secondary Organizer',
      email: 'secondary.organizer@stagepilot.io',
      password: 'password123',
      role: 'organizer',
    });
    secondaryOrgToken = orgRes2.body.data?.token;

    // 3. Create Anchor (non-organizer role)
    const anchorRes = await request(app).post('/api/auth/register').send({
      name: 'Stage Anchor',
      email: 'anchor.stage5@stagepilot.io',
      password: 'password123',
      role: 'anchor',
    });
    anchorToken = anchorRes.body.data?.token;

    // 4. Create Admin
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'System Admin',
      email: 'admin.stage5@stagepilot.io',
      password: 'password123',
      role: 'admin',
    });
    adminToken = adminRes.body.data?.token;

    // 5. Create Speaker with rich metadata
    const sp = await Speaker.create({
      name: 'Dr. Jane Doe',
      designation: 'VP of Distributed AI',
      organization: 'Hyperscale Dynamics & Quantum Labs',
      topic: 'Autonomous Agent Infrastructure',
      bio: 'Leading researcher in multi-agent orchestration and low-latency systems.',
      pronunciationGuide: 'JAYN DOH (she/her)',
      photo: 'https://cdn.example.com/speakers/jane.jpg',
      linkedin: 'https://linkedin.com/in/drjanedoe',
      eventId: '000000000000000000000001',
    });
    speakerId = sp._id.toString();

    // 6. Create Primary Event owned by primary organizer
    const baseDate = new Date('2026-10-15T09:00:00.000Z');
    const endDate = new Date('2026-10-15T18:00:00.000Z');
    const event = await Event.create({
      name: 'Global Tech Summit 2026: Future of Agents & Systems <Special & "Chars">',
      description: 'Comprehensive annual conference covering multi-track distributed computing.',
      venue: 'San Francisco Convention Center, Grand Ballroom',
      date: baseDate,
      startTime: baseDate,
      endTime: endDate,
      organizerId: primaryOrgUser._id || primaryOrgUser.id,
      status: 'UPCOMING',
      eventHealth: 'ON_TRACK',
      delayTotalMinutes: 0,
    });
    mainEventId = event._id.toString();

    // 7. Seed Multi-Track Sessions across Track A, Track B, Track C
    // Track A Sessions
    await Agenda.create({
      eventId: mainEventId,
      title: 'Track A - Keynote: The Agentic Revolution',
      description: 'Opening keynote by industry leader.',
      speakerId: speakerId,
      startTime: new Date('2026-10-15T09:00:00.000Z'),
      endTime: new Date('2026-10-15T10:00:00.000Z'),
      durationMinutes: 60,
      status: 'LIVE',
      type: 'KEYNOTE',
      room: 'Grand Auditorium',
      orderIndex: 0,
      track: 'Track A',
    });

    await Agenda.create({
      eventId: mainEventId,
      title: 'Track A - Deep Dive: High Throughput LLM Pipelines',
      description: 'Technical session on low-latency streaming.',
      speakerId: null, // Test session without speaker
      startTime: new Date('2026-10-15T10:15:00.000Z'),
      endTime: new Date('2026-10-15T11:15:00.000Z'),
      durationMinutes: 60,
      status: 'UPCOMING',
      type: 'PRESENTATION',
      room: 'Grand Auditorium',
      orderIndex: 1,
      track: 'Track A',
    });

    // Track B Sessions
    await Agenda.create({
      eventId: mainEventId,
      title: 'Track B - Workshop: Building Resilient Edge Workers',
      description: 'Hands-on edge worker programming.',
      speakerId: null,
      startTime: new Date('2026-10-15T09:30:00.000Z'),
      endTime: new Date('2026-10-15T11:00:00.000Z'),
      durationMinutes: 90,
      status: 'UPCOMING',
      type: 'WORKSHOP',
      room: 'Room 201',
      orderIndex: 0,
      track: 'Track B',
    });

    await Agenda.create({
      eventId: mainEventId,
      title: 'Track B - Panel: Cloud-Native Observability in 2026',
      description: 'Panel discussion with SRE leaders.',
      speakerId: speakerId,
      startTime: new Date('2026-10-15T11:15:00.000Z'),
      endTime: new Date('2026-10-15T12:15:00.000Z'),
      durationMinutes: 60,
      status: 'UPCOMING',
      type: 'PANEL',
      room: 'Room 201',
      orderIndex: 1,
      track: 'Track B',
    });

    // Track C Session
    await Agenda.create({
      eventId: mainEventId,
      title: 'Track C - Startup Pitch & Showcase',
      description: 'Fast-paced lightning talks.',
      speakerId: null,
      startTime: new Date('2026-10-15T13:00:00.000Z'),
      endTime: new Date('2026-10-15T14:30:00.000Z'),
      durationMinutes: 90,
      status: 'UPCOMING',
      type: 'PRESENTATION',
      room: 'Exhibition Stage',
      orderIndex: 0,
      track: 'Track C',
    });
  });

  describe('1. Endpoint & Authorization Verification', () => {
    it('allows authorized Organizer to export Run-of-Show (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/events/${mainEventId}/run-of-show`)
        .set('Authorization', `Bearer ${primaryOrgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.event).toBeDefined();
      expect(res.body.data.tracks).toBeInstanceOf(Array);
      expect(res.body.data.sessions).toBeInstanceOf(Array);
      expect(res.body.data.summary).toBeDefined();
    });

    it('supports the export alias endpoint /api/events/:id/export (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/events/${mainEventId}/export`)
        .set('Authorization', `Bearer ${primaryOrgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event.id).toBe(mainEventId);
    });

    it('rejects unauthorized request without token (401 Unauthorized)', async () => {
      const res = await request(app).get(`/api/events/${mainEventId}/run-of-show`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-organizer role like anchor (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/events/${mainEventId}/run-of-show`)
        .set('Authorization', `Bearer ${anchorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unrelated organizer who does not own the event (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/events/${mainEventId}/run-of-show`)
        .set('Authorization', `Bearer ${secondaryOrgToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden|permission/i);
    });

    it('allows admin role to export any event (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/events/${mainEventId}/run-of-show`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 Bad Request for malformed event ID format', async () => {
      const res = await request(app)
        .get('/api/events/invalid-id-format/run-of-show')
        .set('Authorization', `Bearer ${primaryOrgToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid.*format/i);
    });

    it('returns 404 Not Found for nonexistent event', async () => {
      const nonExistentId = '111111111111111111111111';
      const res = await request(app)
        .get(`/api/events/${nonExistentId}/run-of-show`)
        .set('Authorization', `Bearer ${primaryOrgToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  describe('2. Stage 5 Run-of-Show Data Contract Conformance', () => {
    let exportData;

    beforeAll(async () => {
      const res = await request(app)
        .get(`/api/events/${mainEventId}/run-of-show`)
        .set('Authorization', `Bearer ${primaryOrgToken}`);
      exportData = res.body.data;
    });

    it('provides all mandatory EVENT fields with accurate types', () => {
      const { event } = exportData;
      expect(event.title).toBeDefined();
      expect(event.title).toContain('Global Tech Summit 2026');
      expect(event.description).toBeDefined();
      expect(event.date).toBeDefined();
      expect(event.venue).toBe('San Francisco Convention Center, Grand Ballroom');
      expect(event.status).toBe('UPCOMING');
      expect(event.healthStatus || event.eventHealth).toBe('ON_TRACK');
      expect(typeof event.currentTotalDelay).toBe('number');
      expect(typeof event.delayTotalMinutes).toBe('number');
      expect(event.exportTimestamp).toBeDefined();
      // Verifies ISO date format
      expect(new Date(event.exportTimestamp).toString()).not.toBe('Invalid Date');
    });

    it('provides TRACK fields preserving track identification and ordering', () => {
      const { tracks } = exportData;
      expect(tracks.length).toBe(3);

      const trackNames = tracks.map(t => t.trackName);
      expect(trackNames).toContain('Track A');
      expect(trackNames).toContain('Track B');
      expect(trackNames).toContain('Track C');

      tracks.forEach((track, index) => {
        expect(track.trackIdentifier).toBeDefined();
        expect(track.trackName).toBeDefined();
        expect(track.trackOrdering).toBe(index + 1);
        expect(typeof track.sessionCount).toBe('number');
        expect(track.sessions).toBeInstanceOf(Array);
        expect(track.sessionCount).toBe(track.sessions.length);
      });
    });

    it('provides SESSION fields with scheduled and adjusted times', () => {
      const { sessions } = exportData;
      expect(sessions.length).toBe(5);

      sessions.forEach(session => {
        expect(session.sessionId).toBeDefined();
        expect(session.title).toBeDefined();
        expect(session.scheduledStart).toBeDefined();
        expect(session.scheduledEnd).toBeDefined();
        expect(session.adjustedStart).toBeDefined();
        expect(session.adjustedEnd).toBeDefined();
        expect(typeof session.duration).toBe('number');
        expect(typeof session.delayOffset).toBe('number');
        expect(session.status).toBeDefined();
        expect(typeof session.orderIndex).toBe('number');
        expect(session.track).toBeDefined();
      });
    });

    it('provides SPEAKER fields without exposing private user credentials', () => {
      const { sessions } = exportData;
      const sessionWithSpeaker = sessions.find(s => s.speaker !== null);
      expect(sessionWithSpeaker).toBeDefined();

      const { speaker } = sessionWithSpeaker;
      expect(speaker.name).toBe('Dr. Jane Doe');
      expect(speaker.title).toBe('VP of Distributed AI');
      expect(speaker.company).toBe('Hyperscale Dynamics & Quantum Labs');
      expect(speaker.pronunciationGuide).toBe('JAYN DOH (she/her)');
      expect(speaker.pronunciation).toBe('JAYN DOH (she/her)');

      // Critical Security Check: Ensure zero private credentials exposed
      expect(speaker.password).toBeUndefined();
      expect(speaker.token).toBeUndefined();
      expect(speaker.secret).toBeUndefined();
    });
  });

  describe('3. Authoritative Delay Handling (No Double Counting)', () => {
    let delayedEventId;
    let sessA1Id;
    let sessA2Id;

    beforeAll(async () => {
      // Create dedicated event for delay verification
      const baseDate = new Date('2026-11-01T10:00:00.000Z');
      const ev = await Event.create({
        name: 'Delay Authority Verification Event',
        description: 'Testing authoritative cascading delay export integration.',
        venue: 'Hall 4',
        date: baseDate,
        startTime: baseDate,
        endTime: new Date('2026-11-01T14:00:00.000Z'),
        organizerId: primaryOrgUser._id || primaryOrgUser.id,
        status: 'LIVE',
        eventHealth: 'ON_TRACK',
        delayTotalMinutes: 0,
      });
      delayedEventId = ev._id.toString();

      // Session 1: 10:00 - 10:30 (order 0)
      const s1 = await Agenda.create({
        eventId: delayedEventId,
        title: 'Opening Session',
        startTime: new Date('2026-11-01T10:00:00.000Z'),
        endTime: new Date('2026-11-01T10:30:00.000Z'),
        durationMinutes: 30,
        status: 'LIVE',
        orderIndex: 0,
        track: 'Track A',
      });
      sessA1Id = s1._id.toString();

      // Session 2: 10:30 - 11:30 (order 1)
      const s2 = await Agenda.create({
        eventId: delayedEventId,
        title: 'Subsequent Session Affected by Cascade',
        startTime: new Date('2026-11-01T10:30:00.000Z'),
        endTime: new Date('2026-11-01T11:30:00.000Z'),
        durationMinutes: 60,
        status: 'UPCOMING',
        orderIndex: 1,
        track: 'Track A',
      });
      sessA2Id = s2._id.toString();

      // Apply authoritative 10-minute delay using the existing service
      await delaySession(delayedEventId, sessA1Id, 10);
    });

    it('reflects authoritative delay without double-counting', async () => {
      const res = await request(app)
        .get(`/api/events/${delayedEventId}/run-of-show`)
        .set('Authorization', `Bearer ${primaryOrgToken}`);

      expect(res.status).toBe(200);
      const { event, tracks, sessions } = res.body.data;

      // Event-level delay
      expect(event.currentTotalDelay).toBe(10);
      expect(event.delayTotalMinutes).toBe(10);
      expect(event.eventHealth).toBe('SLIGHT_DELAY');

      // First session: live session delayed
      const s1Export = sessions.find(s => s.sessionId === sessA1Id);
      expect(s1Export).toBeDefined();
      expect(s1Export.delayOffset).toBe(10);
      expect(s1Export.status).toBe('LIVE');
      expect(s1Export.scheduledStart).toBe(new Date('2026-11-01T10:00:00.000Z').toISOString());
      expect(s1Export.scheduledEnd).toBe(new Date('2026-11-01T10:30:00.000Z').toISOString());
      expect(s1Export.adjustedEnd).toBe(new Date('2026-11-01T10:40:00.000Z').toISOString());

      // Second session: subsequent session cascaded
      const s2Export = sessions.find(s => s.sessionId === sessA2Id);
      expect(s2Export).toBeDefined();
      expect(s2Export.delayOffset).toBe(10);
      expect(s2Export.scheduledStart).toBe(new Date('2026-11-01T10:30:00.000Z').toISOString());
      expect(s2Export.adjustedStart).toBe(new Date('2026-11-01T10:40:00.000Z').toISOString());

      // Track-level delay
      const trackA = tracks.find(t => t.trackName === 'Track A');
      expect(trackA.trackDelayMinutes).toBe(10);
    });
  });

  describe('4. Multi-Track Separation & Zero Cross-Track Leakage', () => {
    it('guarantees complete track isolation and session ordering', async () => {
      const res = await request(app)
        .get(`/api/events/${mainEventId}/run-of-show`)
        .set('Authorization', `Bearer ${primaryOrgToken}`);

      expect(res.status).toBe(200);
      const { tracks, sessions } = res.body.data;

      const trackA = tracks.find(t => t.trackName === 'Track A');
      const trackB = tracks.find(t => t.trackName === 'Track B');
      const trackC = tracks.find(t => t.trackName === 'Track C');

      expect(trackA.sessions.length).toBe(2);
      expect(trackB.sessions.length).toBe(2);
      expect(trackC.sessions.length).toBe(1);

      // Verify no cross-track leakage: all sessions inside Track A have track === 'Track A'
      trackA.sessions.forEach(s => expect(s.track).toBe('Track A'));
      trackB.sessions.forEach(s => expect(s.track).toBe('Track B'));
      trackC.sessions.forEach(s => expect(s.track).toBe('Track C'));

      // Verify intra-track session ordering (orderIndex ascending)
      expect(trackA.sessions[0].orderIndex).toBeLessThanOrEqual(trackA.sessions[1].orderIndex);
      expect(trackB.sessions[0].orderIndex).toBeLessThanOrEqual(trackB.sessions[1].orderIndex);

      // Verify no duplicate sessions across tracks
      const allSessionIdsInTracks = tracks.flatMap(t => t.sessions.map(s => s.sessionId));
      const uniqueSessionIds = new Set(allSessionIdsInTracks);
      expect(allSessionIdsInTracks.length).toBe(uniqueSessionIds.size);
      expect(allSessionIdsInTracks.length).toBe(sessions.length);
    });
  });

  describe('5. Comprehensive Edge Cases', () => {
    it('handles event with ZERO sessions gracefully', async () => {
      const emptyEvent = await Event.create({
        name: 'Empty Event Without Sessions',
        venue: 'Virtual Room',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        organizerId: primaryOrgUser._id || primaryOrgUser.id,
      });

      const res = await request(app)
        .get(`/api/events/${emptyEvent._id}/run-of-show`)
        .set('Authorization', `Bearer ${primaryOrgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tracks).toEqual([]);
      expect(res.body.data.sessions).toEqual([]);
      expect(res.body.data.summary.totalSessions).toBe(0);
      expect(res.body.data.summary.totalTracks).toBe(0);
    });

    it('handles event with ONE single session', async () => {
      const singleEvent = await Event.create({
        name: 'Single Session Event',
        venue: 'Room 1',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        organizerId: primaryOrgUser._id || primaryOrgUser.id,
      });

      await Agenda.create({
        eventId: singleEvent._id.toString(),
        title: 'Only Session',
        startTime: new Date(),
        endTime: new Date(),
        durationMinutes: 30,
        status: 'UPCOMING',
        orderIndex: 0,
        track: 'Track 1',
      });

      const res = await request(app)
        .get(`/api/events/${singleEvent._id}/run-of-show`)
        .set('Authorization', `Bearer ${primaryOrgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tracks.length).toBe(1);
      expect(res.body.data.sessions.length).toBe(1);
      expect(res.body.data.tracks[0].sessions[0].title).toBe('Only Session');
    });

    it('handles missing optional fields and special characters safely', async () => {
      const specialTitle = 'Extreme: <script>alert("test")</script> & 特殊文字 / 🚀 100% Guaranteed!';
      const specialEvent = await Event.create({
        name: specialTitle,
        description: '', // Empty optional field
        venue: 'Main Stage',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        organizerId: primaryOrgUser._id || primaryOrgUser.id,
      });

      await Agenda.create({
        eventId: specialEvent._id.toString(),
        title: 'Special & Characters Session: "Quotes" & <Tags>',
        description: '', // Missing description
        speakerId: null, // Missing speaker
        startTime: new Date(),
        endTime: new Date(),
        durationMinutes: 45,
        status: 'UPCOMING',
        track: 'Main Track',
      });

      const res = await request(app)
        .get(`/api/events/${specialEvent._id}/run-of-show`)
        .set('Authorization', `Bearer ${primaryOrgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.event.title).toBe(specialTitle);
      expect(res.body.data.sessions[0].speaker).toBeNull();
      expect(res.body.data.sessions[0].description).toBe('');
    });

    it('handles multiple pages worth of sessions across multiple tracks (stress check)', async () => {
      const largeEvent = await Event.create({
        name: 'Mega Conference 2026',
        venue: 'Expo Arena',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        organizerId: primaryOrgUser._id || primaryOrgUser.id,
      });

      const tracks = ['Track A', 'Track B', 'Track C', 'Track D'];
      const promises = [];
      let totalCreated = 0;

      for (let t = 0; t < tracks.length; t++) {
        for (let s = 0; s < 10; s++) {
          totalCreated++;
          promises.push(
            Agenda.create({
              eventId: largeEvent._id.toString(),
              title: `Session ${totalCreated}: ${tracks[t]} Item #${s + 1}`,
              startTime: new Date(),
              endTime: new Date(),
              durationMinutes: 30,
              orderIndex: s,
              track: tracks[t],
              status: s === 0 ? 'COMPLETED' : (s === 1 ? 'LIVE' : 'UPCOMING'),
            })
          );
        }
      }
      await Promise.all(promises);

      const res = await request(app)
        .get(`/api/events/${largeEvent._id}/run-of-show`)
        .set('Authorization', `Bearer ${primaryOrgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tracks.length).toBe(4);
      expect(res.body.data.sessions.length).toBe(40);
      expect(res.body.data.summary.totalSessions).toBe(40);

      // Verify that each track has exactly 10 sessions
      res.body.data.tracks.forEach(track => {
        expect(track.sessionCount).toBe(10);
        expect(track.sessions.length).toBe(10);
      });
    });
  });
});
