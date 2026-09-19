// tests/qa_assistant.test.js
require('./setup');
const http = require('http');
const request = require('supertest');
const ioClient = require('socket.io-client');
const app = require('../src/app');
const Event = require('../src/models/Event');
const Agenda = require('../src/models/Agenda');
const Speaker = require('../src/models/Speaker');
const User = require('../src/models/User');
const Question = require('../src/models/Question');
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');
const { initSocket } = require('../src/socket/socketServer');

describe('Stage 4: Real-Time Live Audience Q&A + AI Assistance Test Suite', () => {
  let server;
  let port;
  let eventId;
  let organizerUser;
  let speakerA, speakerB;
  let sessionA, sessionB;
  let socketOrganizer;
  let socketAnchorA;
  let socketAnchorB;
  let socketAudience;

  const baseTime = new Date('2026-10-15T09:00:00.000Z');

  beforeAll(async () => {
    clearAllMemoryCollections();

    // Start Socket.IO test server
    server = http.createServer(app);
    initSocket(server);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;

    // Create organizer
    organizerUser = await User.create({
      name: 'Stage Director',
      email: 'director@stagepilot.io',
      password: 'password123',
      role: 'organizer',
    });

    // Create event
    const event = await Event.create({
      name: 'Global Tech Horizon Summit 2026',
      venue: 'Metropolitan Convention Center',
      audience: 'Engineers, founders, and stage anchors',
      date: baseTime,
      startTime: baseTime,
      endTime: new Date(baseTime.getTime() + 8 * 3600000),
      organizerId: organizerUser._id,
      status: 'UPCOMING',
      eventHealth: 'ON_TRACK',
      delayTotalMinutes: 0,
    });
    eventId = event._id.toString();

    // Create speakers
    speakerA = await Speaker.create({
      eventId,
      name: 'Dr. Aris Thorne',
      designation: 'VP of Distributed Infrastructure',
      organization: 'Aether Cloud Systems',
      topic: 'Scalable Microservice Meshes',
      pronunciationGuide: 'AH-ris THORN',
      bio: 'Pioneer of high-throughput resilient systems',
    });

    speakerB = await Speaker.create({
      eventId,
      name: 'Elena Rostova',
      designation: 'Principal Security Architect',
      organization: 'CyberCore Defense',
      topic: 'Zero-Trust Mesh Security',
      pronunciationGuide: 'eh-LEH-nah ross-TOE-vah',
      bio: 'Specialist in hardened cloud deployments',
    });

    // Create sessions
    sessionA = await Agenda.create({
      eventId,
      title: 'High-Throughput Distributed Meshes',
      speakerId: speakerA._id,
      track: 'Track A',
      room: 'Track A',
      orderIndex: 0,
      startTime: new Date(baseTime.getTime()),
      endTime: new Date(baseTime.getTime() + 30 * 60000),
      durationMinutes: 30,
      status: 'LIVE',
      description: 'Architectural strategies for scaling microservice meshes under extreme peak load.',
    });

    sessionB = await Agenda.create({
      eventId,
      title: 'Zero-Trust Mesh Defense Lab',
      speakerId: speakerB._id,
      track: 'Track B',
      room: 'Track B',
      orderIndex: 0,
      startTime: new Date(baseTime.getTime()),
      endTime: new Date(baseTime.getTime() + 45 * 60000),
      durationMinutes: 45,
      status: 'LIVE',
      description: 'Hands-on techniques for securing service-to-service communications.',
    });

    // Connect test sockets
    const socketOptions = {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    };

    socketOrganizer = ioClient(`http://localhost:${port}`, socketOptions);
    socketAnchorA = ioClient(`http://localhost:${port}`, socketOptions);
    socketAnchorB = ioClient(`http://localhost:${port}`, socketOptions);
    socketAudience = ioClient(`http://localhost:${port}`, socketOptions);

    await Promise.all([
      new Promise((resolve) => socketOrganizer.on('connect', resolve)),
      new Promise((resolve) => socketAnchorA.on('connect', resolve)),
      new Promise((resolve) => socketAnchorB.on('connect', resolve)),
      new Promise((resolve) => socketAudience.on('connect', resolve)),
    ]);

    // Join rooms with roles and tracks
    socketOrganizer.emit('joinEvent', { eventId, role: 'ORGANIZER' });
    socketAnchorA.emit('joinEvent', { eventId, role: 'ANCHOR', track: 'Track A' });
    socketAnchorB.emit('joinEvent', { eventId, role: 'ANCHOR', track: 'Track B' });
    socketAudience.emit('joinEvent', { eventId, role: 'AUDIENCE' });

    await Promise.all([
      new Promise((resolve) => socketOrganizer.once('joinedEvent', resolve)),
      new Promise((resolve) => socketAnchorA.once('joinedEvent', resolve)),
      new Promise((resolve) => socketAnchorB.once('joinedEvent', resolve)),
      new Promise((resolve) => socketAudience.once('joinedEvent', resolve)),
    ]);
  });

  afterAll((done) => {
    if (socketOrganizer) socketOrganizer.disconnect();
    if (socketAnchorA) socketAnchorA.disconnect();
    if (socketAnchorB) socketAnchorB.disconnect();
    if (socketAudience) socketAudience.disconnect();
    if (server) server.close(done);
    else done();
  });

  // ==================================================
  // 1. QUESTION SUBMISSION & INITIAL STATE
  // ==================================================
  test('Audience submits question -> initial state is PENDING, emits questionSubmitted to Organizer only', async () => {
    let organizerReceived = null;
    let anchorReceived = null;

    const orgPromise = new Promise((resolve) => {
      socketOrganizer.once('questionSubmitted', (data) => {
        organizerReceived = data;
        resolve(data);
      });
    });

    socketAnchorA.once('questionSubmitted', (data) => {
      anchorReceived = data;
    });

    const res = await request(app)
      .post(`/api/events/${eventId}/questions`)
      .send({
        sessionId: sessionA._id,
        track: 'Track A',
        question: 'How do you handle cross-region replication lag during traffic spikes?',
        authorName: 'Alex Rivera',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.upvotes).toBe(0);
    expect(res.body.data.isAnswered).toBe(false);
    expect(res.body.data.track).toBe('Track A');

    await orgPromise;
    expect(organizerReceived).toBeDefined();
    expect(organizerReceived.question.question).toContain('cross-region replication lag');
    expect(organizerReceived.status).toBe('PENDING');

    // Anchor station MUST NOT receive submitted question before moderation
    expect(anchorReceived).toBeNull();
  });

  // ==================================================
  // 2. ORGANIZER APPROVAL & DISPATCH TO ANCHOR STATION
  // ==================================================
  test('Organizer approves question -> state becomes APPROVED, pushed immediately to Anchor Station', async () => {
    // Find the pending question
    const pendingQuestions = await Question.find({ eventId, status: 'PENDING' });
    expect(pendingQuestions.length).toBeGreaterThan(0);
    const questionToApprove = pendingQuestions[0];

    const anchorApprovedPromise = new Promise((resolve) => {
      socketAnchorA.once('questionApproved', resolve);
    });

    const res = await request(app)
      .patch(`/api/events/${eventId}/questions/${questionToApprove._id}/approve`)
      .send({ moderatorId: organizerUser._id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');

    const approvedEvent = await anchorApprovedPromise;
    expect(approvedEvent).toBeDefined();
    expect(approvedEvent.questionId.toString()).toBe(questionToApprove._id.toString());
    expect(approvedEvent.status).toBe('APPROVED');

    // Verify Anchor feed endpoint returns approved question
    const anchorFeedRes = await request(app)
      .get(`/api/events/${eventId}/questions/anchor?track=Track+A`);

    expect(anchorFeedRes.status).toBe(200);
    expect(anchorFeedRes.body.success).toBe(true);
    const found = anchorFeedRes.body.data.find(q => q._id.toString() === questionToApprove._id.toString());
    expect(found).toBeDefined();
    expect(found.status).toBe('APPROVED');
  });

  // ==================================================
  // 3. ORGANIZER REJECTION ISOLATION
  // ==================================================
  test('Organizer rejects question -> state becomes REJECTED, NEVER appears in Anchor Station feed', async () => {
    // Submit a disruptive question
    const subRes = await request(app)
      .post(`/api/events/${eventId}/questions`)
      .send({
        sessionId: sessionA._id,
        track: 'Track A',
        question: 'Where is the free lunch and can I get two boxes?',
        authorName: 'Hungry Attendee',
      });

    const rejectedId = subRes.body.data._id;
    let anchorReceivedRejected = null;
    socketAnchorA.once('questionRejected', (data) => {
      anchorReceivedRejected = data;
    });

    const orgRejectedPromise = new Promise((resolve) => {
      socketOrganizer.once('questionRejected', resolve);
    });

    const res = await request(app)
      .patch(`/api/events/${eventId}/questions/${rejectedId}/reject`)
      .send({ moderatorId: organizerUser._id });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REJECTED');

    const orgEvent = await orgRejectedPromise;
    expect(orgEvent).toBeDefined();
    expect(orgEvent.questionId.toString()).toBe(rejectedId.toString());

    // Anchor MUST NOT receive questionRejected event
    expect(anchorReceivedRejected).toBeNull();

    // Verify Anchor feed DOES NOT contain the rejected question
    const anchorFeedRes = await request(app)
      .get(`/api/events/${eventId}/questions/anchor?track=Track+A`);

    const rejectedInFeed = anchorFeedRes.body.data.find(q => q._id.toString() === rejectedId.toString());
    expect(rejectedInFeed).toBeUndefined();
  });

  // ==================================================
  // 4. REAL-TIME UPVOTING & DEDUPLICATION
  // ==================================================
  test('Upvoting updates tally in real-time, deduplicates same voter, and questions sort by upvotes', async () => {
    // Create an approved question
    const qDoc = await Question.create({
      eventId,
      sessionId: sessionA._id,
      track: 'Track A',
      question: 'What are the trade-offs between gRPC and REST in distributed systems?',
      authorName: 'Sara Chen',
      status: 'APPROVED',
      upvotes: 0,
      upvoters: [],
    });

    let tallyUpdate = null;
    const upvotePromise = new Promise((resolve) => {
      socketAnchorA.once('questionUpvoted', (data) => {
        tallyUpdate = data;
        resolve(data);
      });
    });

    // 1st Upvote from User 1
    const res1 = await request(app)
      .post(`/api/events/${eventId}/questions/${qDoc._id}/upvote`)
      .send({ voterId: 'attendee_user_1' });

    expect(res1.status).toBe(200);
    expect(res1.body.data.upvotes).toBe(1);

    await upvotePromise;
    expect(tallyUpdate.upvotes).toBe(1);

    // 2nd Upvote from User 2
    const res2 = await request(app)
      .post(`/api/events/${eventId}/questions/${qDoc._id}/upvote`)
      .send({ voterId: 'attendee_user_2' });

    expect(res2.body.data.upvotes).toBe(2);

    // Duplicate upvote attempt from User 1 -> count stays 2
    const resDup = await request(app)
      .post(`/api/events/${eventId}/questions/${qDoc._id}/upvote`)
      .send({ voterId: 'attendee_user_1' });

    expect(resDup.body.data.upvotes).toBe(2);

    // Verify sorting by upvotes
    const sortedRes = await request(app)
      .get(`/api/events/${eventId}/questions?sortBy=upvotes`);

    expect(sortedRes.status).toBe(200);
    const topQuestion = sortedRes.body.data[0];
    expect(topQuestion.upvotes).toBeGreaterThanOrEqual(2);
  });

  // ==================================================
  // 5. QUESTION ANSWERED STATUS
  // ==================================================
  test('Anchor marks question answered -> status becomes ANSWERED and broadcasted', async () => {
    const qDoc = await Question.create({
      eventId,
      sessionId: sessionA._id,
      track: 'Track A',
      question: 'How do you monitor service health in production?',
      authorName: 'DevOps Lead',
      status: 'APPROVED',
      upvotes: 5,
    });

    const answeredPromise = new Promise((resolve) => {
      socketAnchorA.once('questionAnswered', resolve);
    });

    const res = await request(app)
      .patch(`/api/events/${eventId}/questions/${qDoc._id}/answer`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ANSWERED');
    expect(res.body.data.isAnswered).toBe(true);

    const answeredEvent = await answeredPromise;
    expect(answeredEvent.questionId.toString()).toBe(qDoc._id.toString());
    expect(answeredEvent.status).toBe('ANSWERED');
  });

  // ==================================================
  // 6. MULTI-TRACK AWARENESS & ISOLATION
  // ==================================================
  test('Track isolation: Track B approved question appears in Track B anchor feed, NOT Track A feed', async () => {
    const qTrackB = await Question.create({
      eventId,
      sessionId: sessionB._id,
      track: 'Track B',
      question: 'How do you rotate mTLS certificates without zero-downtime drops?',
      authorName: 'Security Engineer',
      status: 'APPROVED',
      upvotes: 3,
    });

    // Anchor A requests feed
    const feedA = await request(app)
      .get(`/api/events/${eventId}/questions/anchor?track=Track+A`);

    const inFeedA = feedA.body.data.find(q => q._id.toString() === qTrackB._id.toString());
    expect(inFeedA).toBeUndefined();

    // Anchor B requests feed
    const feedB = await request(app)
      .get(`/api/events/${eventId}/questions/anchor?track=Track+B`);

    const inFeedB = feedB.body.data.find(q => q._id.toString() === qTrackB._id.toString());
    expect(inFeedB).toBeDefined();
    expect(inFeedB.track).toBe('Track B');
  });

  // ==================================================
  // 7. AI QUESTION ASSISTANCE ACTIONS
  // ==================================================
  describe('AI Anchor Co-Pilot Question Assistance Actions', () => {
    const sampleQuestion = 'Hi there, I was wondering if Dr. Aris Thorne could explain how we can handle massive sudden traffic spikes without causing cascading microservice database timeouts?';

    test('AI Action: summarize -> Shortens long question into 1 concise sentence', async () => {
      const res = await request(app)
        .post('/api/ai/question-assist')
        .send({
          eventId,
          question: sampleQuestion,
          action: 'summarize',
          track: 'Track A',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('summarize');
      expect(res.body.data.result).toBeDefined();
      expect(res.body.data.result).toContain('traffic spikes');
    });

    test('AI Action: shorten / teleprompter -> Formats into teleprompter-friendly reading rhythm', async () => {
      const res = await request(app)
        .post('/api/ai/question-assist')
        .send({
          eventId,
          question: sampleQuestion,
          action: 'shorten',
          track: 'Track A',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result).toBeDefined();
      // Expect teleprompter breathing pauses
      expect(res.body.data.result).toContain('...');
    });

    test('AI Action: response_structure -> Generates bullet points suggesting response framework', async () => {
      const res = await request(app)
        .post('/api/ai/question-assist')
        .send({
          eventId,
          question: sampleQuestion,
          action: 'response_structure',
          track: 'Track A',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result).toContain('Suggested Response Structure:');
      expect(res.body.data.result).toContain('•');
    });

    test('AI Action: transition -> Generates natural stage anchor transition introducing question to speaker', async () => {
      const res = await request(app)
        .post('/api/ai/question-assist')
        .send({
          eventId,
          question: sampleQuestion,
          action: 'transition',
          track: 'Track A',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result).toContain('We have a great question from the audience');
      expect(res.body.data.result).toContain('Dr. Aris Thorne');
    });

    test('AI Action: relevance -> Evaluates relevance to current speaker and topic', async () => {
      const res = await request(app)
        .post('/api/ai/question-assist')
        .send({
          eventId,
          question: sampleQuestion,
          action: 'relevance',
          track: 'Track A',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result).toContain('Relevance Score:');
    });
  });

  // ==================================================
  // 8. AI SAFETY & GROUNDING GUARDRAIL
  // ==================================================
  test('AI Guardrail: Refuses to hallucinate unmentioned private facts, instructs anchor to defer to speaker', async () => {
    const res = await request(app)
      .post('/api/ai/question-assist')
      .send({
        eventId,
        question: 'What is the internal secret algorithm and exact revenue numbers for Aether Cloud Systems?',
        action: 'summarize',
        track: 'Track A',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Must match the required safety deferral guideline
    expect(res.body.data.result).toBe(
      'This question asks for specific details not covered in the session notes. I recommend directing this directly to Dr. Aris Thorne for an expert answer.'
    );
  });

  // ==================================================
  // 9. EDGE CASES & ERROR HANDLING
  // ==================================================
  describe('Edge Cases and Input Validation', () => {
    test('Submission fails with 400 when question text is missing', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/questions`)
        .send({
          track: 'Track A',
          question: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Approving non-existent question returns 404', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .patch(`/api/events/${eventId}/questions/${fakeId}/approve`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('Socket client reconnects and maintains Q&A room subscription', async () => {
      const newClient = ioClient(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
      });

      await new Promise((resolve) => newClient.on('connect', resolve));
      newClient.emit('joinEvent', { eventId, role: 'ANCHOR', track: 'Track A' });
      await new Promise((resolve) => newClient.once('joinedEvent', resolve));

      let receivedOnReconnected = null;
      newClient.once('questionApproved', (data) => {
        receivedOnReconnected = data;
      });

      // Submit and approve new question
      const newQ = await Question.create({
        eventId,
        track: 'Track A',
        question: 'How do you handle schema migrations across distributed clusters?',
        status: 'PENDING',
      });

      await request(app)
        .patch(`/api/events/${eventId}/questions/${newQ._id}/approve`);

      await new Promise((r) => setTimeout(r, 100));
      expect(receivedOnReconnected).toBeDefined();
      expect(receivedOnReconnected.questionId.toString()).toBe(newQ._id.toString());

      newClient.disconnect();
    });
  });

  // ==================================================
  // 10. COMPLETE 9-STEP END-TO-END FLOW (REQUIREMENT 10)
  // ==================================================
  test('Complete 9-Step E2E Simulation: Audience Submit -> Moderate -> Anchor Feed -> Upvote -> AI Assist -> Answer', async () => {
    // 1. Audience member submits question
    const step1 = await request(app)
      .post(`/api/events/${eventId}/questions`)
      .send({
        sessionId: sessionA._id,
        track: 'Track A',
        question: 'Could Dr. Thorne elaborate on how backpressure is propagated across services during traffic storms?',
        authorName: 'Maya Lin',
      });

    expect(step1.status).toBe(201);
    const qId = step1.body.data._id;

    // 2. Question appears in organizer moderation queue (status: PENDING)
    const step2 = await request(app)
      .get(`/api/events/${eventId}/questions?status=PENDING`);
    expect(step2.status).toBe(200);
    const inQueue = step2.body.data.find(q => q._id.toString() === qId.toString());
    expect(inQueue).toBeDefined();
    expect(inQueue.status).toBe('PENDING');

    // 3. Organizer approves question
    const step3 = await request(app)
      .patch(`/api/events/${eventId}/questions/${qId}/approve`)
      .send({ moderatorId: organizerUser._id });
    expect(step3.status).toBe(200);
    expect(step3.body.data.status).toBe('APPROVED');

    // 4. Question appears in Anchor Station feed
    const step4 = await request(app)
      .get(`/api/events/${eventId}/questions/anchor?track=Track+A`);
    expect(step4.status).toBe(200);
    const inAnchorFeed = step4.body.data.find(q => q._id.toString() === qId.toString());
    expect(inAnchorFeed).toBeDefined();
    expect(inAnchorFeed.status).toBe('APPROVED');

    // 5. Audience members upvote question (vote count increases)
    const step5a = await request(app)
      .post(`/api/events/${eventId}/questions/${qId}/upvote`)
      .send({ voterId: 'attendee_1' });
    const step5b = await request(app)
      .post(`/api/events/${eventId}/questions/${qId}/upvote`)
      .send({ voterId: 'attendee_2' });
    const step5c = await request(app)
      .post(`/api/events/${eventId}/questions/${qId}/upvote`)
      .send({ voterId: 'attendee_3' });

    expect(step5c.body.data.upvotes).toBe(3);

    // 6. Anchor requests AI assistance:
    // 6a: Shorten question for teleprompter
    const step6a = await request(app)
      .post('/api/ai/question-assist')
      .send({
        eventId,
        questionId: qId,
        action: 'shorten',
        track: 'Track A',
      });
    expect(step6a.status).toBe(200);
    expect(step6a.body.data.result).toContain('...');

    // 6b: Suggest response points
    const step6b = await request(app)
      .post('/api/ai/question-assist')
      .send({
        eventId,
        questionId: qId,
        action: 'response_structure',
        track: 'Track A',
      });
    expect(step6b.status).toBe(200);
    expect(step6b.body.data.result).toContain('Suggested Response Structure:');

    // 7. Anchor reads question on stage (simulated by fetching question details)
    const step7 = await request(app)
      .get(`/api/events/${eventId}/questions/${qId}`);
    expect(step7.status).toBe(200);
    expect(step7.body.data.question).toContain('backpressure');

    // 8. Anchor marks question as ANSWERED
    const step8 = await request(app)
      .patch(`/api/events/${eventId}/questions/${qId}/answer`);
    expect(step8.status).toBe(200);
    expect(step8.body.data.status).toBe('ANSWERED');
    expect(step8.body.data.isAnswered).toBe(true);
    expect(step8.body.data.answeredAt).toBeDefined();

    // 9. Question moves to completed / answered section
    const step9 = await request(app)
      .get(`/api/events/${eventId}/questions?status=ANSWERED`);
    expect(step9.status).toBe(200);
    const answeredItem = step9.body.data.find(q => q._id.toString() === qId.toString());
    expect(answeredItem).toBeDefined();
    expect(answeredItem.status).toBe('ANSWERED');
  });
});
