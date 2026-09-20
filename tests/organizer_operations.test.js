// tests/organizer_operations.test.js
const request = require('supertest');
const app = require('../src/app');
const Event = require('../src/models/Event');
const User = require('../src/models/User');
const InviteCode = require('../src/models/InviteCode');
const Task = require('../src/models/Task');
const ChatMessage = require('../src/models/ChatMessage');
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');
const { ORGANIZER_WORK_ROLES } = require('../src/constants/organizerRoles');
require('./setup');

describe('Organizer Operations System (Feature Expansion)', () => {
  let orgToken;
  let orgUser;
  let otherOrgToken;
  let otherOrgUser;
  let anchorToken;
  let anchorUser;
  let eventId;
  let otherEventId;

  beforeAll(async () => {
    clearAllMemoryCollections();

    // 1. Create Primary Organizer
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'Operations Lead',
      email: 'lead@stageflow.io',
      password: 'password123',
      role: 'organizer',
    });
    orgToken = res1.body.data?.token;
    orgUser = res1.body.data?.user;

    // 2. Create Second Organizer (for cross-event isolation tests)
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'Unrelated Organizer',
      email: 'unrelated@stageflow.io',
      password: 'password123',
      role: 'organizer',
    });
    otherOrgToken = res2.body.data?.token;
    otherOrgUser = res2.body.data?.user;

    // 3. Create Anchor
    const res3 = await request(app).post('/api/auth/register').send({
      name: 'Stage Anchor',
      email: 'anchor@stageflow.io',
      password: 'password123',
      role: 'anchor',
    });
    anchorToken = res3.body.data?.token;
    anchorUser = res3.body.data?.user;

    // 4. Create Primary Event
    const ev1 = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({
        name: 'StageFlow National Tech Expo 2026',
        venue: 'Grand Convention Hall',
        date: '2026-11-20',
        startTime: '2026-11-20T09:00:00.000Z',
        endTime: '2026-11-20T18:00:00.000Z',
      });
    eventId = ev1.body.data?._id?.toString() || ev1.body.data?.id;

    // 5. Create Secondary Event for isolation
    const ev2 = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${otherOrgToken}`)
      .send({
        name: 'Another Event for Isolation Testing',
        venue: 'Secondary Hall',
        date: '2026-11-25',
        startTime: '2026-11-25T10:00:00.000Z',
        endTime: '2026-11-25T17:00:00.000Z',
      });
    otherEventId = ev2.body.data?._id?.toString() || ev2.body.data?.id;
  });

  describe('1. Registration with Entry / Invite Code & Authoritative Role Assignment', () => {
    let validOrgCode = 'ORG-TEST99';
    let validAnchCode = 'ANCH-TEST99';
    let expiredCode = 'ORG-EXPIRED1';
    let disabledCode = 'ORG-DISABLED1';
    let exhaustedCode = 'ORG-EXHAUST1';

    beforeAll(async () => {
      // Seed invite codes
      await InviteCode.create({
        code: validOrgCode,
        registrationType: 'ORGANIZER',
        role: 'organizer',
        workRole: 'STAGE_MANAGER',
        maxUses: 5,
        currentUses: 0,
        isActive: true,
      });

      await InviteCode.create({
        code: validAnchCode,
        registrationType: 'ANCHOR',
        role: 'anchor',
        workRole: 'OPERATIONS',
        maxUses: 2,
        currentUses: 0,
        isActive: true,
      });

      await InviteCode.create({
        code: expiredCode,
        registrationType: 'ORGANIZER',
        role: 'organizer',
        expiresAt: new Date(Date.now() - 60000), // 1 min in the past
        maxUses: 5,
        currentUses: 0,
        isActive: true,
      });

      await InviteCode.create({
        code: disabledCode,
        registrationType: 'ORGANIZER',
        role: 'organizer',
        maxUses: 5,
        currentUses: 0,
        isActive: false, // disabled
      });

      await InviteCode.create({
        code: exhaustedCode,
        registrationType: 'ORGANIZER',
        role: 'organizer',
        maxUses: 1,
        currentUses: 1, // exhausted
        isActive: true,
      });
    });

    it('validates a valid invite code successfully (200 OK)', async () => {
      const res = await request(app)
        .post('/api/auth/validate-invite')
        .send({ code: validOrgCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(validOrgCode);
      expect(res.body.data.role).toBe('organizer');
      expect(res.body.data.registrationType).toBe('ORGANIZER');
      expect(res.body.data.workRole).toBe('STAGE_MANAGER');
    });

    it('rejects an invalid invite code (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/validate-invite')
        .send({ code: 'DOES-NOT-EXIST' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('rejects an expired invite code (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/validate-invite')
        .send({ code: expiredCode });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('rejects a disabled invite code (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/validate-invite')
        .send({ code: disabledCode });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/disabled/i);
    });

    it('rejects an exhausted invite code (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/validate-invite')
        .send({ code: exhaustedCode });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/maximum uses/i);
    });

    it('authoritatively assigns role from invite code and ignores client-supplied role tampering', async () => {
      // Client maliciously supplies role: "admin", but uses validOrgCode (which specifies role: "organizer")
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Tamper Tester',
          email: 'tamper@stageflow.io',
          password: 'password123',
          inviteCode: validOrgCode,
          role: 'admin', // Tamper attempt!
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('organizer'); // Must be organizer!
      expect(res.body.data.user.role).not.toBe('admin');
      expect(res.body.data.user.workRole).toBe('STAGE_MANAGER');

      // Verify DB persistence
      const savedUser = await User.findOne({ email: 'tamper@stageflow.io' });
      expect(savedUser.role).toBe('organizer');
    });

    it('authoritatively assigns anchor role when anchor invite code is used', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Anchor',
          email: 'newanchor@stageflow.io',
          password: 'password123',
          inviteCode: validAnchCode,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('anchor');
    });

    it('increments currentUses counter upon successful registration', async () => {
      const codeRecord = await InviteCode.findOne({ code: validOrgCode });
      expect(codeRecord.currentUses).toBeGreaterThanOrEqual(1);
    });

    it('rejects registration when invalid or expired code is supplied', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Failing User',
          email: 'fail@stageflow.io',
          password: 'password123',
          inviteCode: expiredCode,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('allows organizers to create and list invite codes', async () => {
      const createRes = await request(app)
        .post('/api/auth/invites')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          registrationType: 'ORGANIZER',
          workRole: 'TECHNICAL',
          maxUses: 3,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.code).toMatch(/^ORG-/);
      expect(createRes.body.data.workRole).toBe('TECHNICAL');

      const listRes = await request(app)
        .get('/api/auth/invites')
        .set('Authorization', `Bearer ${orgToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('2. Organizer Committee & Work Roles', () => {
    let addedMemberId;

    it('automatically ensures event creator is present in committee as EVENT_LEAD', async () => {
      const res = await request(app)
        .get(`/api/events/${eventId}/committee`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const lead = res.body.data.find(m => m.workRole === ORGANIZER_WORK_ROLES.EVENT_LEAD);
      expect(lead).toBeDefined();
      expect(lead.email).toBe(orgUser.email);
    });

    it('does not expose passwords or sensitive credentials in committee responses', async () => {
      const res = await request(app)
        .get(`/api/events/${eventId}/committee`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(member => {
        expect(member.password).toBeUndefined();
        expect(member.token).toBeUndefined();
      });
    });

    it('allows adding a committee member with a specific work role and responsibilities', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/committee`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          name: 'Alex AV Specialist',
          email: 'alex.av@stageflow.io',
          workRole: ORGANIZER_WORK_ROLES.TECHNICAL,
          assignedResponsibilities: ['Microphone checks', 'Audio alert system'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workRole).toBe(ORGANIZER_WORK_ROLES.TECHNICAL);
      expect(res.body.data.assignedResponsibilities).toContain('Microphone checks');
      addedMemberId = res.body.data.id || res.body.data._id;
    });

    it('allows updating a committee member role and responsibilities', async () => {
      const res = await request(app)
        .patch(`/api/events/${eventId}/committee/${addedMemberId}`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          workRole: ORGANIZER_WORK_ROLES.STAGE_MANAGER,
          assignedResponsibilities: ['Stage pacing', 'Confidence monitor cues'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.workRole).toBe(ORGANIZER_WORK_ROLES.STAGE_MANAGER);
      expect(res.body.data.assignedResponsibilities).toContain('Stage pacing');
    });

    it('allows removing a committee member', async () => {
      const removeRes = await request(app)
        .delete(`/api/events/${eventId}/committee/${addedMemberId}`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(removeRes.status).toBe(200);

      // Verify removal
      const listRes = await request(app)
        .get(`/api/events/${eventId}/committee`)
        .set('Authorization', `Bearer ${orgToken}`);

      const found = listRes.body.data.find(m => m.id === addedMemberId || m._id === addedMemberId);
      expect(found).toBeUndefined();
    });
  });

  describe('3. Event Work Types Configuration', () => {
    it('returns the catalog of available work types', async () => {
      const res = await request(app).get('/api/events/work-types/available');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(12);

      const ids = res.body.data.map(wt => wt.id);
      expect(ids).toContain('STAGE_MANAGEMENT');
      expect(ids).toContain('SPEAKER_MANAGEMENT');
      expect(ids).toContain('TECHNICAL_AV');
      expect(ids).toContain('REGISTRATION');
    });

    it('initializes new events with appropriate default checkboxes (defaults ON)', async () => {
      const res = await request(app)
        .get(`/api/events/${eventId}/work-types`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).toBe(200);
      const workTypes = res.body.data;
      expect(workTypes.length).toBe(12);

      const stageMgmt = workTypes.find(w => w.id === 'STAGE_MANAGEMENT');
      const technical = workTypes.find(w => w.id === 'TECHNICAL_AV');
      const logistics = workTypes.find(w => w.id === 'LOGISTICS');

      expect(stageMgmt.enabled).toBe(true);
      expect(technical.enabled).toBe(true);
      expect(logistics.enabled).toBe(false);
    });

    it('allows organizer to configure and persist event work types', async () => {
      const updatedTypes = [
        { id: 'STAGE_MANAGEMENT', name: 'Stage Management', enabled: true },
        { id: 'SPEAKER_MANAGEMENT', name: 'Speaker Management', enabled: true },
        { id: 'TECHNICAL_AV', name: 'Technical/AV', enabled: true },
        { id: 'LOGISTICS', name: 'Logistics', enabled: true }, // Toggled ON!
        { id: 'REGISTRATION', name: 'Registration', enabled: false }, // Toggled OFF!
      ];

      const res = await request(app)
        .put(`/api/events/${eventId}/work-types`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({ workTypes: updatedTypes });

      expect(res.status).toBe(200);
      expect(res.body.data.find(w => w.id === 'LOGISTICS').enabled).toBe(true);
      expect(res.body.data.find(w => w.id === 'REGISTRATION').enabled).toBe(false);

      // Verify persistence in DB
      const getRes = await request(app)
        .get(`/api/events/${eventId}/work-types`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(getRes.body.data.find(w => w.id === 'LOGISTICS').enabled).toBe(true);
    });
  });

  describe('4. Event Task Management & Assignment', () => {
    let createdTaskId;

    it('allows creating an event task assigned to a specific organizer', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/tasks`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          title: 'Confirm Keynote Speaker Arrival',
          description: 'Meet speaker at green room door.',
          workType: 'SPEAKER_MANAGEMENT',
          assignedTo: orgUser.id || orgUser._id,
          priority: 'HIGH',
          status: 'TODO',
          dueDate: '2026-11-20T08:30:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Confirm Keynote Speaker Arrival');
      expect(res.body.data.priority).toBe('HIGH');
      createdTaskId = res.body.data._id || res.body.data.id;
    });

    it('allows creating an event task assigned by work role', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/tasks`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          title: 'Test Stage Handheld Microphones',
          description: 'Perform audio soundcheck on podium.',
          workType: 'TECHNICAL_AV',
          assignedRole: 'TECHNICAL',
          priority: 'URGENT',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.assignedRole).toBe('TECHNICAL');
      expect(res.body.data.priority).toBe('URGENT');
    });

    it('identifies eligible committee members for a work role', async () => {
      // Add a technical committee member
      await request(app)
        .post(`/api/events/${eventId}/committee`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          name: 'Sound Engineer Sam',
          email: 'sam@sound.io',
          workRole: 'TECHNICAL',
        });

      const res = await request(app)
        .get(`/api/events/${eventId}/tasks/eligible-assignees?role=TECHNICAL`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].workRole).toBe('TECHNICAL');
    });

    it('lists tasks with status, priority, and role filters', async () => {
      const res = await request(app)
        .get(`/api/events/${eventId}/tasks?priority=URGENT`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach(t => expect(t.priority).toBe('URGENT'));
    });

    it('updates task status and records completion timestamp', async () => {
      const res = await request(app)
        .patch(`/api/events/${eventId}/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          status: 'COMPLETED',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.completedAt).toBeDefined();
    });

    it('deletes a task successfully', async () => {
      const res = await request(app)
        .delete(`/api/events/${eventId}/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });
  });

  describe('5. Automated Task Suggestions from Work Types', () => {
    it('generates suggested tasks derived from active event work types', async () => {
      const res = await request(app)
        .get(`/api/events/${eventId}/tasks/suggestions`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify that suggestions match active work types
      const titles = res.body.data.map(t => t.title);
      expect(titles.some(t => t.includes('Microphones') || t.includes('Speaker'))).toBe(true);
    });

    it('allows organizers to confirm and bulk-create selected task suggestions', async () => {
      const suggestionsToConfirm = [
        {
          title: 'Suggested: Test Speech Follower Synchronization',
          description: 'Validate teleprompter auto-scroll with anchor voice.',
          workType: 'TECHNICAL_AV',
          priority: 'HIGH',
          suggestedRole: 'TECHNICAL',
        },
        {
          title: 'Suggested: Distribute Green Room Schedule',
          description: 'Hand out printed Run-of-Show copies.',
          workType: 'SPEAKER_MANAGEMENT',
          priority: 'MEDIUM',
          suggestedRole: 'SPEAKER_COORDINATOR',
        },
      ];

      const res = await request(app)
        .post(`/api/events/${eventId}/tasks/suggestions/confirm`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({ suggestions: suggestionsToConfirm });

      expect(res.status).toBe(201);
      expect(res.body.count).toBe(2);
      expect(res.body.data[0].title).toBe('Suggested: Test Speech Follower Synchronization');

      // Verify tasks now exist in event task list
      const listRes = await request(app)
        .get(`/api/events/${eventId}/tasks`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(listRes.body.data.some(t => t.title === 'Suggested: Test Speech Follower Synchronization')).toBe(true);
    });
  });

  describe('6. Organizer Event Chat & Event-Scoped Isolation', () => {
    it('allows an authorized committee member to send a chat message (201 Created)', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/chat`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          message: 'Stage is ready. Keynote speaker is in the green room.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Stage is ready. Keynote speaker is in the green room.');
      expect(res.body.data.senderName).toBe('Operations Lead');
      expect(res.body.data.eventId).toBe(eventId);
    });

    it('allows authorized committee member to retrieve event chat history', async () => {
      const res = await request(app)
        .get(`/api/events/${eventId}/chat`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].message).toContain('Stage is ready');
    });

    it('strictly isolates chat: messages from Event A do NOT appear in Event B', async () => {
      const resB = await request(app)
        .get(`/api/events/${otherEventId}/chat`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      expect(resB.status).toBe(200);
      // Event B has 0 messages
      expect(resB.body.data.length).toBe(0);
    });

    it('rejects unauthorized users and anchors from accessing organizer chat (403 Forbidden)', async () => {
      // Anchor attempting to read organizer team internal chat
      const resAnchor = await request(app)
        .get(`/api/events/${eventId}/chat`)
        .set('Authorization', `Bearer ${anchorToken}`);

      expect(resAnchor.status).toBe(403);
      expect(resAnchor.body.success).toBe(false);
      expect(resAnchor.body.message).toMatch(/Forbidden|authorized/i);

      // Unrelated organizer from another event attempting to read Event A's chat
      const resOtherOrg = await request(app)
        .get(`/api/events/${eventId}/chat`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      expect(resOtherOrg.status).toBe(403);
      expect(resOtherOrg.body.success).toBe(false);
    });

    it('rejects posting chat message without token (401 Unauthorized)', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/chat`)
        .send({ message: 'Unauthenticated message' });

      expect(res.status).toBe(401);
    });
  });
});
