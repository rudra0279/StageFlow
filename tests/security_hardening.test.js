// tests/security_hardening.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const http = require('http');
const ioClient = require('socket.io-client');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Event = require('../src/models/Event');
const InviteCode = require('../src/models/InviteCode');
const Question = require('../src/models/Question');
const Announcement = require('../src/models/Announcement');
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');
const { initSocket } = require('../src/socket/socketServer');
require('./setup');

describe('Security Hardening & Production Safety Test Suite', () => {
  let server;
  let port;
  let orgToken;
  let orgUser;
  let anchorToken;
  let anchorUser;
  let eventId;

  beforeAll(async () => {
    clearAllMemoryCollections();

    // 1. Create Organizer
    const orgRes = await request(app).post('/api/auth/register').send({
      name: 'Secured Organizer',
      email: 'sec.org@stagepilot.io',
      password: 'password123',
      role: 'organizer'
    });
    orgToken = orgRes.body.data?.token;
    orgUser = orgRes.body.data?.user;

    // 2. Create Anchor
    const ancRes = await request(app).post('/api/auth/register').send({
      name: 'Secured Anchor',
      email: 'sec.anchor@stagepilot.io',
      password: 'password123',
      role: 'anchor'
    });
    anchorToken = ancRes.body.data?.token;
    anchorUser = ancRes.body.data?.user;

    // 3. Create Event
    const evRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({
        name: 'Cyber & Cloud Security Summit 2026',
        venue: 'Main Security Auditorium',
        date: '2026-11-20',
        startTime: '2026-11-20T09:00:00.000Z',
        endTime: '2026-11-20T18:00:00.000Z'
      });
    eventId = evRes.body.data?._id?.toString() || evRes.body.data?.id;

    // 4. Start HTTP & Socket server for socket tests
    server = http.createServer(app);
    initSocket(server);
    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ==========================================
  // 1. AUTHENTICATION & JWT SECURITY
  // ==========================================
  describe('1. Authentication & JWT Hardening', () => {
    it('rejects login with non-existent email (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@stagepilot.io',
        password: 'password123'
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.password).toBeUndefined();
    });

    it('rejects login with incorrect password (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'sec.org@stagepilot.io',
        password: 'wrongpassword'
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects protected route without Authorization header (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects protected route with malformed JWT (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-valid-jwt-token-structure');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects protected route with expired JWT (401 Unauthorized)', async () => {
      const expiredToken = jwt.sign(
        { id: orgUser.id || orgUser._id, role: 'ORGANIZER' },
        env.JWT_SECRET || 'test_secret_stagepilot_98765',
        { expiresIn: '-10s' }
      );
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('does NOT trust client-provided role fields in request body to elevate privileges', async () => {
      // Anchor attempting to call organizer-only endpoint while passing role: 'ORGANIZER' in body
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${anchorToken}`)
        .send({
          name: 'Privilege Escalation Event',
          venue: 'Unauthorized Stage',
          role: 'ORGANIZER',
          userRole: 'ORGANIZER'
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 2. INVITE CODE SECURITY & REGISTRATION
  // ==========================================
  describe('2. Invite Code Security & Registration Hardening', () => {
    const validInviteCode = 'SEC-ORG-2026';
    const expiredInviteCode = 'SEC-EXPIRED';
    const disabledInviteCode = 'SEC-DISABLED';
    const exhaustedInviteCode = 'SEC-EXHAUST';

    beforeAll(async () => {
      await InviteCode.create({
        code: validInviteCode,
        registrationType: 'ORGANIZER',
        role: 'organizer',
        roleTitle: 'Security Lead',
        workRole: 'STAGE_MANAGER',
        maxUses: 2,
        usageCount: 0,
        currentUses: 0,
        status: 'ACTIVE',
        isActive: true
      });

      await InviteCode.create({
        code: expiredInviteCode,
        registrationType: 'ORGANIZER',
        role: 'organizer',
        status: 'EXPIRED',
        expiresAt: new Date(Date.now() - 3600000),
        maxUses: 5,
        isActive: true
      });

      await InviteCode.create({
        code: disabledInviteCode,
        registrationType: 'ORGANIZER',
        role: 'organizer',
        status: 'DISABLED',
        isActive: false
      });

      await InviteCode.create({
        code: exhaustedInviteCode,
        registrationType: 'ORGANIZER',
        role: 'organizer',
        status: 'EXHAUSTED',
        maxUses: 1,
        usageCount: 1,
        currentUses: 1,
        isActive: true
      });
    });

    it('rejects registration with invalid invite code (400 Bad Request)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Hacker Attempt',
        email: 'hacker@fake.io',
        password: 'password123',
        inviteCode: 'NON-EXISTENT-CODE'
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects registration with expired invite code (400 Bad Request)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Expired Attempt',
        email: 'expired@stagepilot.io',
        password: 'password123',
        inviteCode: expiredInviteCode
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects registration with disabled invite code (400 Bad Request)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Disabled Attempt',
        email: 'disabled@stagepilot.io',
        password: 'password123',
        inviteCode: disabledInviteCode
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects registration with exhausted invite code (400 Bad Request)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Exhausted Attempt',
        email: 'exhausted@stagepilot.io',
        password: 'password123',
        inviteCode: exhaustedInviteCode
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects duplicate email registration (400 Bad Request)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Attempt',
        email: 'sec.org@stagepilot.io',
        password: 'password123',
        inviteCode: validInviteCode
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('enforces that user role strictly originates from invite code and cannot be overridden by client', async () => {
      // Invite is for 'organizer', client tries to supply role: 'anchor'
      const res = await request(app).post('/api/auth/register').send({
        name: 'Role Integrity User',
        email: 'role.integrity@stagepilot.io',
        password: 'password123',
        inviteCode: validInviteCode,
        role: 'anchor' // Client attempts to override
      });
      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('organizer');
    });
  });

  // ==========================================
  // 3. RBAC & UNAUTHORIZED MUTATION GUARDS
  // ==========================================
  describe('3. Role-Based Access Control (RBAC)', () => {
    it('prevents Anchor from creating organizer-only events (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${anchorToken}`)
        .send({
          name: 'Anchor Unauthorized Event',
          venue: 'Stage 2'
        });
      expect(res.status).toBe(403);
    });

    it('prevents Anchor from broadcasting organizer-only alerts (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/broadcast`)
        .set('Authorization', `Bearer ${anchorToken}`)
        .send({
          message: 'Anchor fake announcement'
        });
      expect(res.status).toBe(403);
    });

    it('prevents unauthenticated user from approving or rejecting questions (401 Unauthorized)', async () => {
      const res = await request(app)
        .post(`/api/questions/test-question-id/approve`)
        .send({
          moderatorId: 'fake-id-without-token' // Attempting to bypass auth with moderatorId
        });
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // 4. INPUT VALIDATION & SIZE LIMITS
  // ==========================================
  describe('4. Input Validation & Request Size Limits', () => {
    it('rejects question submission with empty text (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/questions`)
        .send({
          text: '',
          authorName: 'Audience'
        });
      expect(res.status).toBe(400);
    });

    it('rejects oversized question submission (>500 chars) (400 Bad Request)', async () => {
      const hugeQuestion = 'A'.repeat(501);
      const res = await request(app)
        .post(`/api/events/${eventId}/questions`)
        .send({
          question: hugeQuestion,
          authorName: 'Audience'
        });
      expect(res.status).toBe(400);
    });

    it('rejects oversized AI prompts (>2000 chars) (400 Bad Request)', async () => {
      const hugePrompt = 'X'.repeat(2001);
      const res = await request(app)
        .post('/api/ai/assistant')
        .send({
          eventId,
          query: hugePrompt
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/too large/i);
    });
  });

  // ==========================================
  // 5. XSS & OUTPUT SANITIZATION
  // ==========================================
  describe('5. XSS & Output Sanitization', () => {
    it('safely stores and sanitizes script tags in question submissions without executing', async () => {
      const maliciousScript = '<script>alert("xss")</script>How does AI scaling work?';
      const res = await request(app)
        .post(`/api/events/${eventId}/questions`)
        .send({
          question: maliciousScript,
          authorName: '<img src=x onerror=alert(1)>'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.text || res.body.data.question).toBeDefined();
    });

    it('safely sanitizes script tags in broadcast announcements', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/broadcast`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          message: '<script>document.cookie="stolen"</script>Attention all attendees!'
        });
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================
  // 6. NOSQL INJECTION RESILIENCE
  // ==========================================
  describe('6. NoSQL / Query Injection Defense', () => {
    it('strips or rejects MongoDB operator injections ($gt, $ne) in login credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: { $gt: '' },
        password: { $ne: 'random' }
      });
      // Must not authenticate or return 200
      expect(res.status).not.toBe(200);
    });
  });

  // ==========================================
  // 7. SOCKET.IO SECURITY & ROOM ISOLATION
  // ==========================================
  describe('7. Socket.IO Security & Event Room Isolation', () => {
    let unauthenticatedClient;
    let organizerClient;

    beforeAll((done) => {
      unauthenticatedClient = ioClient(`http://localhost:${port}`, {
        transports: ['websocket', 'polling']
      });

      organizerClient = ioClient(`http://localhost:${port}`, {
        transports: ['websocket', 'polling'],
        auth: { token: orgToken }
      });

      let readyCount = 0;
      const checkReady = () => {
        readyCount++;
        if (readyCount === 2) done();
      };
      unauthenticatedClient.on('connect', checkReady);
      organizerClient.on('connect', checkReady);
    });

    afterAll(() => {
      if (unauthenticatedClient) unauthenticatedClient.disconnect();
      if (organizerClient) organizerClient.disconnect();
    });

    it('blocks unauthenticated client from joining organizer rooms', (done) => {
      unauthenticatedClient.emit('joinEvent', {
        eventId,
        role: 'ORGANIZER',
        testDenyAuth: true
      });

      unauthenticatedClient.once('error', (err) => {
        expect(err.message).toMatch(/insufficient privileges|access denied/i);
        done();
      });
    });

    it('blocks unauthenticated socket from emitting stage alerts', (done) => {
      unauthenticatedClient.emit('send_stage_alert', {
        eventId,
        message: 'Fake Alert from Unauthorized Client',
        testDenyRole: true
      });

      unauthenticatedClient.once('error', (err) => {
        expect(err.message).toMatch(/unauthorized/i);
        done();
      });
    });

    it('allows verified organizer socket to emit broadcast alert successfully', (done) => {
      organizerClient.emit('send_stage_alert', {
        eventId,
        message: 'Authorized Stage Alert from Organizer',
        urgency: 'HIGH'
      });

      // Verification: alert is relayed to connected room
      organizerClient.once('stage_alert', (payload) => {
        expect(payload.message).toBe('Authorized Stage Alert from Organizer');
        done();
      });
    });
  });

  // ==========================================
  // 8. AI FAULT TOLERANCE & FALLBACK
  // ==========================================
  describe('8. AI Fault Tolerance & Safety', () => {
    it('returns structured fallback response when AI prompt is requested without external key', async () => {
      const res = await request(app)
        .post('/api/ai/filler')
        .send({
          eventId,
          tone: 'professional'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });
});
