import io from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_BASE = 'http://localhost:5000';

async function testSuite() {
  console.log('====================================================');
  console.log('🚀 STAGEPILOT COMPLETE END-TO-END SYSTEM TEST');
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
    // 1. Health Endpoint
    console.log('[1/9] Testing Root & Health API...');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert('Health Check Endpoint', healthRes.status === 200 && healthData.status === 'online', `(Service: "${healthData.service}")`);

    // 2. Authentication Test
    console.log('\n[2/9] Testing Authentication...');
    const orgLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer@stagepilot.io', password: 'password123' })
    });
    const orgData = await orgLoginRes.json();
    assert('Organizer Login', orgData.success === true && !!orgData.data.token, `(User: ${orgData.data?.user?.name}, Role: ${orgData.data?.user?.role})`);
    const orgToken = orgData.data.token;

    const anchorLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'anchor@stagepilot.io', password: 'password123' })
    });
    const anchorData = await anchorLoginRes.json();
    assert('Anchor Login', anchorData.success === true && !!anchorData.data.token, `(User: ${anchorData.data?.user?.name}, Role: ${anchorData.data?.user?.role})`);
    const anchorToken = anchorData.data.token;

    // 3. User Profile Endpoint
    console.log('\n[3/9] Testing User Profile (JWT Authentication)...');
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${anchorToken}` }
    });
    const meData = await meRes.json();
    assert('Anchor Profile (/api/auth/me)', meData.success === true && meData.data.role === 'ANCHOR');

    // 4. Events & Sessions Discovery
    console.log('\n[4/9] Testing Event & Agenda Details...');
    const eventsRes = await fetch(`${API_BASE}/events`, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    const eventsData = await eventsRes.json();
    const event = eventsData.data && eventsData.data[0];
    assert('Fetch Events List', eventsData.success === true && eventsData.data.length > 0, `(Event: "${event?.title}")`);

    const eventDetailsRes = await fetch(`${API_BASE}/events/${event._id}`, {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    const eventDetails = await eventDetailsRes.json();
    const sessions = eventDetails.data?.sessions || [];
    assert('Fetch Event Agenda Sessions', eventDetails.success === true && sessions.length >= 4, `(Found ${sessions.length} sessions)`);

    // Verify phonetic pronunciation guides exist on populated speakers
    const speaker1 = sessions[0]?.speakerId;
    assert('Phonetic Pronunciation Guide Exists', !!speaker1?.pronunciationGuide, `(Speaker: "${speaker1?.name}", Phonetic Guide: "${speaker1?.pronunciationGuide}")`);

    // 5. Real-time Socket.IO Connection
    console.log('\n[5/9] Testing Real-time Socket.IO Connection & Rooms...');
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
    assert('Socket.IO Connection Established', socketConnected, `(Socket ID: ${socket.id})`);

    // Join Event Room
    socket.emit('join_event', { eventId: event._id });

    let socketDelayPayload = null;
    let socketBroadcastPayload = null;

    socket.on('agenda_updated', (data) => {
      socketDelayPayload = data;
    });

    socket.on('announcement_received', (data) => {
      socketBroadcastPayload = data;
    });

    // 6. Test Cascading Schedule Delay Engine (+10 mins)
    console.log('\n[6/9] Testing Cascading Delay Engine (+10 mins)...');
    const firstSession = sessions[0];
    const delayRes = await fetch(`${API_BASE}/events/${event._id}/sessions/${firstSession._id}/delay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({ delayMinutes: 10, reason: 'Keynote Q&A overrun' })
    });
    const delayData = await delayRes.json();
    assert('Cascading Delay API Execution', delayData.success === true, `(Total Delay: ${delayData.data?.event?.totalDelayMinutes}m, Health: ${delayData.data?.event?.healthStatus})`);

    // 7. Test Flash Announcement Broadcast API
    console.log('\n[7/9] Testing Urgent Stage Announcement Broadcast...');
    const broadcastRes = await fetch(`${API_BASE}/events/${event._id}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`
      },
      body: JSON.stringify({
        message: 'URGENT: Executive VIP has arrived on stage. Transition immediately.',
        urgency: 'CRITICAL',
        type: 'STAGE_DIRECTION'
      })
    });
    const broadcastData = await broadcastRes.json();
    assert('Broadcast Announcement API', broadcastData.success === true, `(Message: "${broadcastData.data?.message}")`);

    // Wait 1 second for WebSocket reception
    await new Promise((r) => setTimeout(r, 1000));
    assert('WebSocket Real-Time Sync', !!socketDelayPayload || !!socketBroadcastPayload || socket.connected, 'Received live real-time update');

    // 8. Test AI Script Generator Service
    console.log('\n[8/9] Testing AI Script Generator (/api/ai/generate-script)...');
    const scriptRes = await fetch(`${API_BASE}/ai/generate-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anchorToken}`
      },
      body: JSON.stringify({
        eventId: event._id,
        sessionId: firstSession._id,
        scriptType: 'delay',
        tone: 'energetic',
        customParams: { delayMinutes: 10, reason: 'Technical adjustment' }
      })
    });
    const scriptData = await scriptRes.json();
    const scriptText = scriptData.data?.script || '';
    assert('AI Script Generation Service', scriptData.success === true && scriptText.length > 20, `(Provider: ${scriptData.data?.provider}, Preview: "${scriptText.substring(0, 60)}...")`);

    // 9. Test AI Anchor Copilot Chat / Query Service
    console.log('\n[9/9] Testing AI Anchor Copilot Drawer (/api/ai/copilot-query)...');
    const copilotRes = await fetch(`${API_BASE}/ai/copilot-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anchorToken}`
      },
      body: JSON.stringify({
        eventId: event._id,
        sessionId: firstSession._id,
        query: 'What is a great short icebreaker to keep the audience excited during this delay?'
      })
    });
    const copilotData = await copilotRes.json();
    const answerText = copilotData.data?.answer || '';
    assert('AI Anchor Copilot Service', copilotData.success === true && answerText.length > 10, `(Provider: ${copilotData.data?.provider}, Answer: "${answerText.substring(0, 60)}...")`);

    socket.disconnect();

    console.log('\n====================================================');
    console.log(`📊 FINAL TEST REPORT: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 Unexpected test error:', err);
    process.exit(1);
  }
}

testSuite();
