// tests/stage5_pdf_export.test.js
const request = require('supertest');
const app = require('../src/app');
const Event = require('../src/models/Event');
const Agenda = require('../src/models/Agenda');
const User = require('../src/models/User');
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');
require('./setup');

describe('Stage 5: Run-of-Show PDF Exporter API & Contract', () => {
  let organizerToken;
  let eventId;

  beforeAll(async () => {
    clearAllMemoryCollections();

    // 1. Create Organizer
    const orgRes = await request(app).post('/api/auth/register').send({
      name: 'Organizer Stage5',
      email: 'organizer_s5@stagepilot.io',
      password: 'password123',
      role: 'organizer',
    });
    organizerToken = orgRes.body.data?.token;

    // 2. Create Event
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Stage 5 Global Tech Conference',
        venue: 'Main Auditorium Hall A',
        audience: '500 Tech Enthusiasts',
        date: new Date().toISOString(),
        startTime: '2026-09-20T09:00:00.000Z',
        endTime: '2026-09-20T17:00:00.000Z',
        theme: 'Autonomous Systems & PDF Export'
      });
    eventId = eventRes.body.data?._id;

    // 3. Create Multi-Track Sessions
    await request(app)
      .post(`/api/events/${eventId}/agenda`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Keynote: Next-Gen Stage Management',
        speakerName: 'Dr. Sarah Connor',
        startTime: '09:00 AM',
        endTime: '09:45 AM',
        durationMinutes: 45,
        track: 'Track A',
        orderIndex: 1
      });

    await request(app)
      .post(`/api/events/${eventId}/agenda`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Track B: Real-Time Audio AI',
        speakerName: 'David Sterling',
        startTime: '10:00 AM',
        endTime: '10:45 AM',
        durationMinutes: 45,
        track: 'Track B',
        orderIndex: 2
      });

    await request(app)
      .post(`/api/events/${eventId}/agenda`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Track C: Distributed Socket Mesh',
        speakerName: 'Elena Vance',
        startTime: '11:00 AM',
        endTime: '11:45 AM',
        durationMinutes: 45,
        track: 'Track C',
        orderIndex: 3
      });
  });

  test('1. GET /api/events/:id/run-of-show returns 200 and application/pdf content type', async () => {
    const res = await request(app)
      .get(`/api/events/${eventId}/run-of-show?format=pdf`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);

    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="Run-Of-Show-/);
    
    // Binary buffer validation
    const pdfBuf = Buffer.isBuffer(res.body) ? res.body : Buffer.from(res.text || '');
    expect(pdfBuf.toString('utf8', 0, 8)).toContain('%PDF-1.4');
  });

  test('2. PDF output contains multi-track details (Track A, B, C)', async () => {
    const res = await request(app)
      .get(`/api/events/${eventId}/run-of-show?format=pdf`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);

    const pdfContent = Buffer.isBuffer(res.body) ? res.body.toString('utf8') : res.text;
    expect(pdfContent).toContain('Stage 5 Global Tech Conference');
    expect(pdfContent).toContain('TRACK: Track A');
    expect(pdfContent).toContain('TRACK: Track B');
    expect(pdfContent).toContain('TRACK: Track C');
    expect(pdfContent).toContain('Keynote: Next-Gen Stage Management');
  });

  test('3. Returns 404 for invalid event ID', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .get(`/api/events/${fakeId}/run-of-show?format=pdf`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Event not found');
  });
});
