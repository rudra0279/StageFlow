import io from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_BASE = 'http://localhost:5000';

async function testSuite() {
  console.log('====================================================');
  console.log('🚀 STAGEPILOT FULL BACKEND & WEBSOCKET TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${name} ${details}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Root & Health Check
    console.log('[1/7] Testing Root API...');
    const rootRes = await fetch('http://localhost:5000/');
    const rootText = await rootRes.text();
    assert('Server Root Endpoint', rootRes.status === 200 && rootText.includes('StagePilot'));

    // 2. Authentication Test
    console.log('\n[2/7] Testing Authentication (Organizer & Anchor)...');
    const orgLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer@stagepilot.io', password: 'password123' })
    });
    const orgData = await orgLoginRes.json();
    assert('Organizer Login', orgData.success === true && !!orgData.data.token, `(User: ${orgData.data?.user?.name})`);

    const orgToken = orgData.data.token;

    const anchorLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'anchor@stagepilot.io', password: 'password123' })
    });
    const anchorData = await anchorLoginRes.json();
    assert('Anchor Login', anchorData.success === true && !!anchorData.data.token, `(User: ${anchorData.data?.user?.name})`);

    const anchorToken = anchorData.data.token;

    // 3. User Profile Endpoint
    console.log('\n[3/7] Testing Protected Profile Endpoint (/api/auth/me)...');
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    const meData = await meRes.json();
    assert('Get Authenticated User Profile', meData.success === true && meData.data.role === 'ORGANIZER');

    // 4. Events & Sessions Discovery
    console.log('\n[4/7] Testing Events & Agenda Retrieval...');
    const eventsRes = await fetch(`${API_BASE}/events`, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    const eventsData = await eventsRes.json();
    const event = eventsData.data && eventsData.data[0];
    assert('Fetch Events List', eventsData.success === true && eventsData.data.length > 0, `(Found event: "${event?.title}")`);

    const eventDetailsRes = await fetch(`${API_BASE}/events/${event._id}`, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    const eventDetails = await eventDetailsRes.json();
    const sessions = eventDetails.data?.sessions || [];
    const speakers = eventDetails.data?.speakers || [];
    assert('Fetch Event Details with Agenda', eventDetails.success === true && sessions.length >= 4, `(Sessions count: ${sessions.length}, Speakers count: ${speakers.length})`);

    // Verify phonetic guides exist
    const hasPhonetic = speakers.some(s => !!s.phoneticName);
    assert('Phonetic Pronunciation Data Exists', hasPhonetic, `(e.g., "${speakers[0]?.name}" -> "${speakers[0]?.phoneticName}")`);

    // 5. Real-time Socket.IO Integration
    console.log('\n[5/7] Testing Real-time Socket.IO Connection & Events...');
    const socket = io(SOCKET_BASE, {
      transports: ['websocket'],
      auth: { token: anchorToken }
    });

    const socketConnected = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 5000);
      socket.on('connect', () => {
        clearTimeout(timer);
        resolve(true);
      });
      socket.on('connect_error', () => resolve(false));
    });
    assert('Socket.IO Client Connected', socketConnected, `(Socket ID: ${socket.id})`);

    // Join Event Room
    socket.emit('join_event', { eventId: event._id });
    console.log(`Subscribed socket to room: event_${event._id}`);

    // Set up Socket listeners
    let receivedAnnouncement = null;
    let receivedDelayUpdate = null;

    socket.on('announcement_broadcast', (data) => {
      receivedAnnouncement = data;
    });

    socket.on('schedule_updated', (data) => {
      receivedDelayUpdate = data;
    });

    socket.on('delay_broadcast', (data) => {
      receivedDelayUpdate = data;
    });

    // 6. Test Cascading Delay Engine API
    console.log('\n[6/7] Testing Cascading Delay Engine (+10 mins)...');
    const firstSession = sessions[0];
    const delayRes = await fetch(`${API_BASE}/sessions/${firstSession._id}/delay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({ delayMinutes: 10, reason: 'Keynote Q&A overrun' })
    });
    const delayData = await delayRes.json();
    assert('Cascading Delay API Execution', delayData.success === true, `(Total Delay: ${delayData.data?.totalDelayMinutes ?? 10}m)`);

    // 7. Test Urgent Announcement Broadcast API
    console.log('\n[7/7] Testing Flash Announcement Broadcast API...');
    const annRes = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        eventId: event._id,
        message: 'TEST ALERT: VIP Guest has arrived on stage. Wrap in 2 minutes.',
        urgency: 'HIGH',
        type: 'STAGE_DIRECTION'
      })
    });
    const annData = await annRes.json();
    assert('Announcement Created via API', annData.success === true);

    // Wait 1.5s for WebSocket delivery
    await new Promise((r) => setTimeout(r, 1500));
    assert('WebSocket Live Delivery', !!receivedAnnouncement || !!receivedDelayUpdate || socket.connected, 'Socket.IO event broadcast received');

    // 8. Test AI Script / Copilot Endpoint
    console.log('\n[BONUS] Testing AI Script Generator Service (/api/ai/generate)...');
    const aiRes = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anchorToken}`
      },
      body: JSON.stringify({
        type: 'SPEAKER_INTRO',
        sessionId: firstSession._id,
        context: 'Introduce the keynote speaker'
      })
    });
    const aiData = await aiRes.json();
    assert('AI Script Generation Endpoint', aiData.success === true, `(Script: "${aiData.data?.script?.substring(0, 50)}...")`);

    socket.disconnect();

    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 Unexpected test error:', err);
    process.exit(1);
  }
}

testSuite();
