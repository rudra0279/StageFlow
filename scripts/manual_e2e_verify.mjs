import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:5001';
const EVENT_ID = '6aae3924608558863f360ae1';

async function runManualE2E() {
  console.log('====================================================');
  console.log('STARTING STAGE 4 BACKEND MANUAL E2E VERIFICATION');
  console.log('====================================================\n');

  // Step 0: Auth setup
  console.log('[Setup] Logging in Organizer and Anchor...');
  const orgLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'organizer@stagepilot.io', password: 'password123' })
  });
  const orgData = await orgLoginRes.json();
  const organizerToken = orgData.data.token;
  console.log('✓ Organizer logged in successfully');

  const anchorLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'anchor@stagepilot.io', password: 'password123' })
  });
  const anchorData = await anchorLoginRes.json();
  const anchorToken = anchorData.data.token;
  console.log('✓ Anchor logged in successfully');

  // Setup Sockets
  console.log('\n[Setup] Connecting Organizer & Anchor Sockets...');
  const socketOrganizer = io(BASE_URL, { transports: ['websocket'] });
  const socketAnchor = io(BASE_URL, { transports: ['websocket'] });

  await Promise.all([
    new Promise(res => socketOrganizer.once('connect', res)),
    new Promise(res => socketAnchor.once('connect', res))
  ]);

  socketOrganizer.emit('join_event', { eventId: EVENT_ID, role: 'ORGANIZER' });
  socketAnchor.emit('join_event', { eventId: EVENT_ID, role: 'ANCHOR', track: 'Track A' });

  await new Promise(r => setTimeout(r, 600));
  console.log('✓ Sockets joined event rooms (Organizer in :organizers, Anchor in :anchors:Track A)');

  // Track socket events
  let organizerReceivedSubmitted = null;
  let anchorReceivedSubmitted = null;
  let anchorReceivedApproved = null;
  let organizerReceivedRejected = null;
  let anchorReceivedRejected = null;
  let anchorReceivedUpvoted = null;
  let anchorReceivedAnswered = null;

  socketOrganizer.on('questionSubmitted', data => {
    organizerReceivedSubmitted = data;
    console.log('   -> [Socket] Organizer received questionSubmitted:', data.question?.question || data.questionId);
  });
  socketAnchor.on('questionSubmitted', data => {
    anchorReceivedSubmitted = data;
    console.log('   -> [Socket ERROR] Anchor received questionSubmitted! (Should not happen)');
  });
  socketAnchor.on('questionApproved', data => {
    anchorReceivedApproved = data;
    console.log('   -> [Socket] Anchor received questionApproved:', data.questionId);
  });
  socketOrganizer.on('questionRejected', data => {
    organizerReceivedRejected = data;
    console.log('   -> [Socket] Organizer received questionRejected:', data.questionId);
  });
  socketAnchor.on('questionRejected', data => {
    anchorReceivedRejected = data;
    console.log('   -> [Socket ERROR] Anchor received questionRejected! (Should not happen)');
  });
  socketAnchor.on('questionUpvoted', data => {
    anchorReceivedUpvoted = data;
    console.log('   -> [Socket] Anchor received questionUpvoted: ID', data.questionId, 'Count', data.upvotes);
  });
  socketAnchor.on('questionAnswered', data => {
    anchorReceivedAnswered = data;
    console.log('   -> [Socket] Anchor received questionAnswered:', data.questionId);
  });

  // STEP 1 & 2: Audience submits question -> verify PENDING
  console.log('\n--- Step 1 & 2: Audience submits question & verify PENDING ---');
  const subRes = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      track: 'Track A',
      question: 'How do you prevent event loop starvation under high concurrency?',
      authorName: 'Alex Rivera'
    })
  });
  const subData = await subRes.json();
  const q1 = subData.data;
  console.log('Submission Response:', subRes.status, 'Question ID:', q1._id, 'Status:', q1.status);
  if (subRes.status !== 201 || q1.status !== 'PENDING') {
    throw new Error(`Step 1/2 Failed: Status is ${q1.status}, HTTP ${subRes.status}`);
  }
  console.log('✓ Step 1 & 2 PASSED: Question created with status PENDING');

  // STEP 3: Verify Organizer receives it
  console.log('\n--- Step 3: Verify Organizer receives it via socket ---');
  await new Promise(r => setTimeout(r, 600));
  if (!organizerReceivedSubmitted) {
    throw new Error('Step 3 Failed: Organizer did not receive questionSubmitted socket event');
  }
  console.log('✓ Step 3 PASSED: Organizer received questionSubmitted event');

  // STEP 4: Verify Anchor does NOT receive it
  console.log('\n--- Step 4: Verify Anchor does NOT receive it ---');
  if (anchorReceivedSubmitted !== null) {
    throw new Error('Step 4 Failed: Anchor received questionSubmitted event (leak!)');
  }
  console.log('✓ Step 4 PASSED: Anchor station did NOT receive pending question');

  // STEP 5 & 6: Organizer approves -> Verify Anchor receives it
  console.log('\n--- Step 5 & 6: Organizer approves & Anchor receives it ---');
  const appRes = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/questions/${q1._id}/approve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${organizerToken}`
    }
  });
  const appData = await appRes.json();
  console.log('Approval Response:', appRes.status, 'Status:', appData.data.status);
  await new Promise(r => setTimeout(r, 600));

  if (appRes.status !== 200 || appData.data.status !== 'APPROVED') {
    throw new Error(`Step 5 Failed: Approval failed with status ${appRes.status}`);
  }
  if (!anchorReceivedApproved || anchorReceivedApproved.questionId !== q1._id) {
    throw new Error('Step 6 Failed: Anchor did not receive questionApproved socket event');
  }
  console.log('✓ Step 5 & 6 PASSED: Question approved and received by Anchor station');

  // STEP 7: Upvote
  console.log('\n--- Step 7: Upvote question ---');
  const upvote1Res = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/questions/${q1._id}/upvote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': 'client_voter_alpha'
    }
  });
  const upvote1Data = await upvote1Res.json();
  console.log('First Upvote Response:', upvote1Res.status, 'Upvotes:', upvote1Data.data.upvotes);
  if (upvote1Res.status !== 200 || upvote1Data.data.upvotes !== 1) {
    throw new Error(`Step 7 Failed: Expected 1 upvote, got ${upvote1Data.data.upvotes}`);
  }
  console.log('✓ Step 7 PASSED: First upvote recorded, count is 1');

  // STEP 8 & 9: Attempt duplicate upvote -> Verify count does not increase
  console.log('\n--- Step 8 & 9: Attempt duplicate upvote & verify count ---');
  const upvote2Res = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/questions/${q1._id}/upvote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': 'client_voter_alpha'
    }
  });
  const upvote2Data = await upvote2Res.json();
  console.log('Duplicate Upvote Response:', upvote2Res.status, 'Success:', upvote2Data.success, 'Message:', upvote2Data.message, 'Current Upvotes:', upvote2Data.data?.upvotes);
  if (upvote2Res.status !== 400 || upvote2Data.data?.upvotes !== 1) {
    throw new Error(`Step 8/9 Failed: Duplicate upvote was not prevented or count changed`);
  }
  console.log('✓ Step 8 & 9 PASSED: Duplicate upvote rejected (HTTP 400), count remains 1');

  // STEP 10 & 11: Anchor marks answered -> Verify ANSWERED
  console.log('\n--- Step 10 & 11: Anchor marks answered & verify ANSWERED ---');
  const ansRes = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/questions/${q1._id}/answer`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anchorToken}`
    }
  });
  const ansData = await ansRes.json();
  console.log('Answer Response:', ansRes.status, 'Status:', ansData.data.status, 'isAnswered:', ansData.data.isAnswered);
  await new Promise(r => setTimeout(r, 600));

  if (ansRes.status !== 200 || ansData.data.status !== 'ANSWERED') {
    throw new Error(`Step 10/11 Failed: Answer status is ${ansData.data?.status}`);
  }
  if (!anchorReceivedAnswered || anchorReceivedAnswered.questionId !== q1._id) {
    throw new Error('Step 10/11 Failed: Anchor did not receive questionAnswered socket event');
  }
  console.log('✓ Step 10 & 11 PASSED: Question marked ANSWERED and broadcasted via socket');

  // STEP 12, 13 & 14: Submit second question, Organizer rejects it, Anchor never receives it
  console.log('\n--- Step 12, 13 & 14: Submit second question, Organizer rejects, Anchor never receives ---');
  const sub2Res = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      track: 'Track A',
      question: 'Can you tell us when the free swag t-shirts will be handed out?',
      authorName: 'Swag Hunter'
    })
  });
  const sub2Data = await sub2Res.json();
  const q2 = sub2Data.data;
  console.log('Question 2 Created:', q2._id, 'Status:', q2.status);

  const rejRes = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/questions/${q2._id}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${organizerToken}`
    }
  });
  const rejData = await rejRes.json();
  console.log('Rejection Response:', rejRes.status, 'Status:', rejData.data.status);
  await new Promise(r => setTimeout(r, 600));

  if (rejRes.status !== 200 || rejData.data.status !== 'REJECTED') {
    throw new Error('Step 13 Failed: Question 2 was not rejected');
  }
  if (!organizerReceivedRejected || organizerReceivedRejected.questionId !== q2._id) {
    throw new Error('Step 13 Failed: Organizer did not receive questionRejected socket event');
  }
  if (anchorReceivedRejected !== null) {
    throw new Error('Step 14 Failed: Anchor received questionRejected socket event (leak!)');
  }

  // Also check anchor feed does not contain rejected question
  const anchorFeedRes = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/questions/anchor?track=Track+A`, {
    headers: { 'Authorization': `Bearer ${anchorToken}` }
  });
  const anchorFeed = await anchorFeedRes.json();
  const rejectedInFeed = anchorFeed.data.find(q => q._id === q2._id);
  if (rejectedInFeed) {
    throw new Error('Step 14 Failed: Rejected question appeared in anchor feed!');
  }
  console.log('✓ Step 12, 13 & 14 PASSED: Second question submitted, rejected by Organizer, hidden from Anchor feed and socket');

  // STEP 15: Test AI summarize
  console.log('\n--- Step 15: Test AI summarize ---');
  const aiSumRes = await fetch(`${BASE_URL}/api/ai/question-assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: EVENT_ID,
      question: 'How do you handle cross-region replication lag during extreme traffic spikes without data loss?',
      action: 'summarize',
      track: 'Track A'
    })
  });
  const aiSumData = await aiSumRes.json();
  console.log('AI Summarize:', aiSumData.status || aiSumRes.status, 'Result:', aiSumData.data.result);
  if (aiSumRes.status !== 200 || !aiSumData.data.result) {
    throw new Error('Step 15 Failed: AI summarize failed');
  }
  console.log('✓ Step 15 PASSED: AI summarize generated concise summary');

  // STEP 16: Test AI shorten
  console.log('\n--- Step 16: Test AI shorten ---');
  const aiShortRes = await fetch(`${BASE_URL}/api/ai/question-assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: EVENT_ID,
      question: 'How do you handle cross-region replication lag during extreme traffic spikes without data loss?',
      action: 'shorten',
      track: 'Track A'
    })
  });
  const aiShortData = await aiShortRes.json();
  console.log('AI Shorten:', aiShortRes.status, 'Result:', aiShortData.data.result);
  if (aiShortRes.status !== 200 || !aiShortData.data.result) {
    throw new Error('Step 16 Failed: AI shorten failed');
  }
  console.log('✓ Step 16 PASSED: AI shorten generated teleprompter reading rhythm');

  // STEP 17: Test AI response structure
  console.log('\n--- Step 17: Test AI response structure ---');
  const aiStructRes = await fetch(`${BASE_URL}/api/ai/question-assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: EVENT_ID,
      question: 'How do you handle cross-region replication lag during extreme traffic spikes without data loss?',
      action: 'response_structure',
      track: 'Track A'
    })
  });
  const aiStructData = await aiStructRes.json();
  console.log('AI Response Structure:', aiStructRes.status, 'Result:', aiStructData.data.result);
  if (aiStructRes.status !== 200 || !aiStructData.data.result.includes('Suggested Response Structure:')) {
    throw new Error('Step 17 Failed: AI response_structure failed');
  }
  console.log('✓ Step 17 PASSED: AI response_structure generated structured bullets');

  // STEP 18: Test AI transition
  console.log('\n--- Step 18: Test AI transition ---');
  const aiTransRes = await fetch(`${BASE_URL}/api/ai/question-assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: EVENT_ID,
      question: 'How do you handle cross-region replication lag during extreme traffic spikes without data loss?',
      action: 'transition',
      track: 'Track A'
    })
  });
  const aiTransData = await aiTransRes.json();
  console.log('AI Transition:', aiTransRes.status, 'Result:', aiTransData.data.result);
  if (aiTransRes.status !== 200 || !aiTransData.data.result.includes('audience')) {
    throw new Error('Step 18 Failed: AI transition failed');
  }
  console.log('✓ Step 18 PASSED: AI transition generated anchor speaking bridge');

  // STEP 19: Test AI relevance
  console.log('\n--- Step 19: Test AI relevance ---');
  const aiRelRes = await fetch(`${BASE_URL}/api/ai/question-assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: EVENT_ID,
      question: 'How do you handle cross-region replication lag during extreme traffic spikes without data loss?',
      action: 'relevance',
      track: 'Track A'
    })
  });
  const aiRelData = await aiRelRes.json();
  console.log('AI Relevance:', aiRelRes.status, 'Result:', aiRelData.data.result);
  if (aiRelRes.status !== 200 || !aiRelData.data.result.toLowerCase().includes('relevance')) {
    throw new Error('Step 19 Failed: AI relevance failed');
  }
  console.log('✓ Step 19 PASSED: AI relevance evaluated score and suitability');

  // Clean up
  socketOrganizer.disconnect();
  socketAnchor.disconnect();

  console.log('\n====================================================');
  console.log('ALL 19 E2E VERIFICATION STEPS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runManualE2E().catch(err => {
  console.error('\n❌ E2E VERIFICATION ERROR:', err);
  process.exit(1);
});
