// tests/stage4_qa.test.js
const request = require('supertest');
const app = require('../src/app');
const Event = require('../src/models/Event');
const Agenda = require('../src/models/Agenda');
const User = require('../src/models/User');
const Question = require('../src/models/Question');
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');
require('./setup');

describe('Stage 4: Live Audience Q&A Backend Layer', () => {
  let organizerToken;
  let anchorToken;
  let attendeeToken;
  let eventId;
  let sessionAId;
  let sessionBId;

  beforeAll(async () => {
    clearAllMemoryCollections();

    // 1. Create Organizer
    const orgRes = await request(app).post('/api/auth/register').send({
      name: 'Sarah Connor',
      email: 'organizer@stagepilot.io',
      password: 'password123',
      role: 'organizer',
    });
    organizerToken = orgRes.body.data?.token;

    // 2. Create Anchor
    const anchorRes = await request(app).post('/api/auth/register').send({
      name: 'David Sterling',
      email: 'anchor@stagepilot.io',
      password: 'password123',
      role: 'anchor',
    });
    anchorToken = anchorRes.body.data?.token;

    // 3. Create Attendee / Audience Member
    const attendeeRes = await request(app).post('/api/auth/register').send({
      name: 'Alice Audience',
      email: 'alice@stagepilot.io',
      password: 'password123',
      role: 'attendee',
    });
    attendeeToken = attendeeRes.body.data?.token;

    // 4. Create Event
    const event = await Event.create({
      name: 'Global AI Summit 2026',
      title: 'Global AI Summit 2026',
      venue: 'Metropolis Hall',
      theme: 'Next-Gen Agentic Intelligence',
      date: new Date(),
      status: 'LIVE',
      organizerId: 'org_123',
    });
    eventId = event._id.toString();

    // 5. Create Sessions on different Tracks
    const sessA = await Agenda.create({
      eventId,
      title: 'Track A Keynote: LLM Orchestration',
      trackId: 'Track_A',
      orderIndex: 0,
      scheduledStartTime: new Date(),
      durationMinutes: 45,
    });
    sessionAId = sessA._id.toString();

    const sessB = await Agenda.create({
      eventId,
      title: 'Track B Workshop: Edge Computing',
      trackId: 'Track_B',
      orderIndex: 1,
      scheduledStartTime: new Date(),
      durationMinutes: 30,
    });
    sessionBId = sessB._id.toString();
  });

  afterAll(async () => {
    clearAllMemoryCollections();
  });

  // ==========================================
  // 1. QUESTION SUBMISSION & VALIDATION
  // ==========================================
  describe('Audience Submission & Validation', () => {
    test('Audience submits a valid question without requiring organizer auth', async () => {
      const res = await request(app)
        .post('/api/questions')
        .send({
          eventId,
          sessionId: sessionAId,
          trackId: 'Track_A',
          question: 'How do multi-agent systems resolve synchronization latency?',
          authorName: 'Dr. John Doe'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.question).toBe('How do multi-agent systems resolve synchronization latency?');
      expect(res.body.data.authorName).toBe('Dr. John Doe');
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.upvotes).toBe(0);
      expect(res.body.data.trackId).toBe('Track_A');
    });

    test('Audience submits anonymous question when authorName is omitted', async () => {
      const res = await request(app)
        .post('/api/questions')
        .send({
          eventId,
          question: 'What are the hardware prerequisites for local model fine-tuning?'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.authorName).toBe('Anonymous');
      expect(res.body.data.status).toBe('PENDING');
    });

    test('Validation rejects empty question text with 400', async () => {
      const res = await request(app)
        .post('/api/questions')
        .send({
          eventId,
          question: '   '
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/empty/i);
    });

    test('Validation rejects question exceeding 500 characters with 400', async () => {
      const longQuestion = 'A'.repeat(505);
      const res = await request(app)
        .post('/api/questions')
        .send({
          eventId,
          question: longQuestion
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/500 characters/i);
    });

    test('Validation rejects non-existent eventId with 404', async () => {
      const res = await request(app)
        .post('/api/questions')
        .send({
          eventId: '507f1f77bcf86cd799439011',
          question: 'Valid question but invalid event?'
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Event not found/i);
    });
  });

  // ==========================================
  // 2. TRACK & SESSION ISOLATION
  // ==========================================
  describe('Event / Session / Track Relationship & Scoping', () => {
    let qTrackAId;
    let qTrackBId;

    beforeAll(async () => {
      const resA = await request(app)
        .post('/api/questions')
        .send({
          eventId,
          sessionId: sessionAId,
          trackId: 'Track_A',
          question: 'Question exclusive to Track A'
        });
      qTrackAId = resA.body.data._id;

      const resB = await request(app)
        .post('/api/questions')
        .send({
          eventId,
          sessionId: sessionBId,
          trackId: 'Track_B',
          question: 'Question exclusive to Track B'
        });
      qTrackBId = resB.body.data._id;
    });

    test('Track A query returns Track A questions and strictly excludes Track B', async () => {
      const res = await request(app)
        .get(`/api/questions?eventId=${eventId}&trackId=Track_A`);

      expect(res.status).toBe(200);
      const questions = res.body.data;
      const ids = questions.map(q => q._id);
      expect(ids).toContain(qTrackAId);
      expect(ids).not.toContain(qTrackBId);
      questions.forEach(q => {
        expect(q.trackId).toBe('Track_A');
      });
    });

    test('Track B query returns Track B questions and strictly excludes Track A', async () => {
      const res = await request(app)
        .get(`/api/questions?eventId=${eventId}&trackId=Track_B`);

      expect(res.status).toBe(200);
      const questions = res.body.data;
      const ids = questions.map(q => q._id);
      expect(ids).toContain(qTrackBId);
      expect(ids).not.toContain(qTrackAId);
      questions.forEach(q => {
        expect(q.trackId).toBe('Track_B');
      });
    });
  });

  // ==========================================
  // 3. MODERATION WORKFLOW & AUTHORIZATION
  // ==========================================
  describe('Moderation Workflow & Role Authorization', () => {
    let targetQId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/questions')
        .send({
          eventId,
          question: 'Question for moderation lifecycle verification'
        });
      targetQId = res.body.data._id;
    });

    test('Unauthenticated user cannot moderate question (401)', async () => {
      const res = await request(app)
        .patch(`/api/questions/${targetQId}/approve`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Attendee role is forbidden from moderating question (403)', async () => {
      const res = await request(app)
        .patch(`/api/questions/${targetQId}/approve`)
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('Organizer can approve question: PENDING -> APPROVED', async () => {
      const res = await request(app)
        .patch(`/api/questions/${targetQId}/approve`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });

    test('Approved question appears in the Anchor-facing approved feed', async () => {
      // 1. Approve it
      await request(app)
        .patch(`/api/questions/${targetQId}/approve`)
        .set('Authorization', `Bearer ${organizerToken}`);

      // 2. Fetch approved feed
      const feedRes = await request(app)
        .get(`/api/questions/approved?eventId=${eventId}`);

      expect(feedRes.status).toBe(200);
      const approvedIds = feedRes.body.data.map(q => q._id);
      expect(approvedIds).toContain(targetQId);
    });

    test('Organizer can reject a pending question: PENDING -> REJECTED', async () => {
      const res = await request(app)
        .patch(`/api/questions/${targetQId}/reject`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
    });

    test('Cannot approve an already rejected question (400)', async () => {
      // Reject first
      await request(app)
        .patch(`/api/questions/${targetQId}/reject`)
        .set('Authorization', `Bearer ${organizerToken}`);

      // Attempt to approve
      const res = await request(app)
        .patch(`/api/questions/${targetQId}/approve`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/rejected/i);
    });

    test('Anchor can mark approved question as answered: APPROVED -> ANSWERED', async () => {
      // Approve first
      await request(app)
        .patch(`/api/questions/${targetQId}/approve`)
        .set('Authorization', `Bearer ${organizerToken}`);

      // Mark answered
      const res = await request(app)
        .patch(`/api/questions/${targetQId}/answer`)
        .set('Authorization', `Bearer ${anchorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ANSWERED');
    });

    test('Cannot re-moderate an already answered question (400)', async () => {
      // Approve then Answer
      await request(app)
        .patch(`/api/questions/${targetQId}/approve`)
        .set('Authorization', `Bearer ${organizerToken}`);
      await request(app)
        .patch(`/api/questions/${targetQId}/answer`)
        .set('Authorization', `Bearer ${anchorToken}`);

      // Attempt to reject
      const res = await request(app)
        .patch(`/api/questions/${targetQId}/reject`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already answered/i);
    });

    test('Redundant approval of already approved question returns 400', async () => {
      await request(app)
        .patch(`/api/questions/${targetQId}/approve`)
        .set('Authorization', `Bearer ${organizerToken}`);

      const res = await request(app)
        .patch(`/api/questions/${targetQId}/approve`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already approved/i);
    });
  });

  // ==========================================
  // 4. UPVOTING & ANTI-ABUSE
  // ==========================================
  describe('Upvoting & Prioritization', () => {
    let qId1;
    let qId2;

    beforeAll(async () => {
      const res1 = await request(app).post('/api/questions').send({
        eventId,
        question: 'First approved question for upvote testing'
      });
      qId1 = res1.body.data._id;
      await request(app).patch(`/api/questions/${qId1}/approve`).set('Authorization', `Bearer ${organizerToken}`);

      const res2 = await request(app).post('/api/questions').send({
        eventId,
        question: 'Second approved question with higher upvotes'
      });
      qId2 = res2.body.data._id;
      await request(app).patch(`/api/questions/${qId2}/approve`).set('Authorization', `Bearer ${organizerToken}`);
    });

    test('Audience member can upvote a question', async () => {
      const res = await request(app)
        .post(`/api/questions/${qId2}/upvote`)
        .set('x-client-id', 'voter_client_1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upvotes).toBe(1);
    });

    test('Repeated upvote from the same client is prevented with 400', async () => {
      const res = await request(app)
        .post(`/api/questions/${qId2}/upvote`)
        .set('x-client-id', 'voter_client_1');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already upvoted/i);
    });

    test('Different client can successfully upvote the question to 2 upvotes', async () => {
      const res = await request(app)
        .post(`/api/questions/${qId2}/upvote`)
        .set('x-client-id', 'voter_client_2');

      expect(res.status).toBe(200);
      expect(res.body.data.upvotes).toBe(2);
    });

    test('Approved feed orders questions by upvotes descending', async () => {
      const res = await request(app).get(`/api/questions/approved?eventId=${eventId}`);
      expect(res.status).toBe(200);
      const questions = res.body.data;
      const idx2 = questions.findIndex(q => q._id === qId2);
      const idx1 = questions.findIndex(q => q._id === qId1);

      // Question 2 (2 upvotes) must appear before Question 1 (0 upvotes)
      expect(idx2).toBeLessThan(idx1);
    });
  });

  // ==========================================
  // 5. ANCHOR AI ASSIST FOR APPROVED QUESTION
  // ==========================================
  describe('Anchor AI Co-Pilot Assistance', () => {
    test('Anchor asks AI assistant for talking points on approved question', async () => {
      const qRes = await request(app).post('/api/questions').send({
        eventId,
        question: 'What is the real-world performance impact of zero-shot reasoning in production?'
      });
      const qId = qRes.body.data._id;
      await request(app).patch(`/api/questions/${qId}/approve`).set('Authorization', `Bearer ${organizerToken}`);

      const assistRes = await request(app)
        .post(`/api/questions/${qId}/ai-assist`)
        .set('Authorization', `Bearer ${anchorToken}`)
        .send({ tone: 'direct' });

      expect(assistRes.status).toBe(200);
      expect(assistRes.body.success).toBe(true);
      expect(assistRes.body.data.aiAnswerSuggestion).toBeDefined();
      expect(assistRes.body.data.aiAnswerSuggestion.length).toBeGreaterThan(10);
    });
  });
});
