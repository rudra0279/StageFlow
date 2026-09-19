// tests/speech_teleprompter.test.js
const request = require('supertest');
const app = require('../src/app');
const Event = require('../src/models/Event');
const Agenda = require('../src/models/Agenda');
const Speaker = require('../src/models/Speaker');
const User = require('../src/models/User');
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');
const { analyzeSpeechTracking } = require('../src/services/ai/aiService');
require('./setup');

describe('Stage 1: Live Speech-to-Text Teleprompter Backend Layer', () => {
  let eventId;
  let speakerId;
  let sessionId;

  beforeAll(async () => {
    clearAllMemoryCollections();

    // Create organizer and event
    const organizer = await User.create({
      name: 'Stage Manager',
      email: 'stage@stagepilot.io',
      password: 'password123',
      role: 'organizer',
    });

    const event = await Event.create({
      name: 'Global Tech Horizon Summit 2026',
      venue: 'Grand Stage Auditorium',
      theme: 'Autonomous AI Systems',
      audience: '500 engineers, founders, and keynote anchors',
      date: new Date(),
      status: 'LIVE',
      eventHealth: 'ON_TRACK',
      delayTotalMinutes: 0,
      organizerId: organizer._id,
    });
    eventId = event._id.toString();

    // Create speaker with phonetic pronunciation guide
    const speaker = await Speaker.create({
      eventId,
      name: 'Dr. Elena Rostova',
      designation: 'Chief AI Scientist',
      organization: 'DeepTech Labs',
      topic: 'Autonomous Multi-Agent Swarms',
      pronunciationGuide: 'eh-LEH-nah ross-TOH-vah',
    });
    speakerId = speaker._id.toString();

    // Create active session
    const session = await Agenda.create({
      eventId,
      title: 'Keynote: Autonomous Multi-Agent Swarms',
      speakerId: speaker._id,
      orderIndex: 0,
      status: 'LIVE',
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 60000),
      durationMinutes: 30,
      delayMinutes: 0,
      type: 'KEYNOTE',
      room: 'Grand Stage',
    });
    sessionId = session._id.toString();
  });

  afterAll(() => {
    clearAllMemoryCollections();
  });

  // Test 1: Speaker Pronunciation Guide in Context
  test('AI context includes speaker phonetic pronunciation guide', async () => {
    const res = await request(app)
      .post('/api/ai/introduction')
      .send({
        eventId,
        speakerId,
        tone: 'professional',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.speaker.pronunciationGuide).toBe('eh-LEH-nah ross-TOH-vah');
    expect(res.body.data.script).toContain('Dr. Elena Rostova');
  });

  // Test 2: AI Short Filler Generation
  test('AI generates short filler script for stage anchors', async () => {
    const res = await request(app)
      .post('/api/ai/filler')
      .send({
        eventId,
        durationSeconds: 30,
        tone: 'professional',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.script).toBeDefined();
    expect(res.body.data.script.length).toBeGreaterThan(15);
  });

  // Test 3: AI Emergency Announcement Generation
  test('AI generates emergency / urgent stage broadcast', async () => {
    const res = await request(app)
      .post('/api/ai/emergency')
      .send({
        eventId,
        message: 'A brief pause for stage safety inspection.',
        urgency: 'CRITICAL',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.script).toContain('stage safety inspection');
  });

  // Test 4: Speech Tracking Analysis - Words Per Minute and Cadence
  test('Speech tracking analyzer detects fast, slow, and optimal pace', () => {
    // 160 words in 60s -> optimal pace (~160 WPM)
    const optimalText = new Array(140).fill('word').join(' ');
    const optAnalysis = analyzeSpeechTracking({
      recognizedText: optimalText,
      currentScript: 'This is the expected stage script.',
      elapsedSeconds: 60,
    });
    expect(optAnalysis.wordsPerMinute).toBe(140);
    expect(optAnalysis.paceStatus).toBe('pace_good');

    // 200 words in 60s -> rapid (>165 WPM)
    const fastText = new Array(200).fill('word').join(' ');
    const fastAnalysis = analyzeSpeechTracking({
      recognizedText: fastText,
      currentScript: 'This is the expected stage script.',
      elapsedSeconds: 60,
    });
    expect(fastAnalysis.wordsPerMinute).toBe(200);
    expect(fastAnalysis.paceStatus).toBe('pace_fast');

    // 80 words in 60s -> slow (<115 WPM)
    const slowText = new Array(80).fill('word').join(' ');
    const slowAnalysis = analyzeSpeechTracking({
      recognizedText: slowText,
      currentScript: 'This is the expected stage script.',
      elapsedSeconds: 60,
    });
    expect(slowAnalysis.wordsPerMinute).toBe(80);
    expect(slowAnalysis.paceStatus).toBe('pace_slow');
  });

  // Test 5: Speech Tracking Analysis - Next-Line and Missed-Script Detection
  test('Speech tracking analyzer detects next line and missed phrases', () => {
    const currentScript =
      'Good morning and welcome to Tech Horizon. Today we explore autonomous swarms. Please welcome Dr. Elena Rostova.';
    const recognizedText = 'Good morning and welcome to Tech Horizon.';

    const analysis = analyzeSpeechTracking({
      recognizedText,
      currentScript,
      elapsedSeconds: 15,
    });

    expect(analysis.nextLine).toBe('Today we explore autonomous swarms.');
  });

  // Test 6: Teleprompter Assist Endpoint
  test('AI Teleprompter Assist endpoint returns pace advice and next line', async () => {
    const res = await request(app)
      .post('/api/ai/teleprompter-assist')
      .send({
        eventId,
        assistType: 'pace',
        speechContext: {
          recognizedText: 'Good morning everyone and welcome to our grand opening session today.',
          currentScript:
            'Good morning everyone and welcome to our grand opening session today. Let us give a warm welcome to our speaker.',
          elapsedSeconds: 10,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assistType).toBe('pace');
    expect(res.body.data.analysis).toBeDefined();
    expect(res.body.data.analysis.wordsPerMinute).toBeGreaterThan(0);
    expect(res.body.data.suggestion).toBeDefined();
  });

  // Test 7: AI Assistant responds to live pace query with speechContext
  test('AI Assistant responds with pace guidance when speechContext is provided', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .send({
        eventId,
        query: 'Check my speaking pace.',
        speechContext: {
          recognizedText: 'Hello and welcome everyone.',
          currentScript: 'Hello and welcome everyone to the main stage.',
          elapsedSeconds: 12,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBeDefined();
    expect(res.body.data.speechAnalysis).toBeDefined();
    expect(res.body.data.speechAnalysis.wordsPerMinute).toBeDefined();
  });
});
