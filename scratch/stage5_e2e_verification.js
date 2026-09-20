const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function runStage5Verification() {
  console.log('--- STARTING STAGE 5 FRONTEND & API VERIFICATION ---');
  const baseURL = 'http://localhost:5001/api';

  try {
    // 1. Authenticate as organizer
    console.log('[Step 1] Registering/logging in organizer...');
    const authRes = await axios.post(`${baseURL}/auth/register`, {
      name: 'Organizer E2E',
      email: `organizer_e2e_${Date.now()}@stagepilot.io`,
      password: 'password123',
      role: 'organizer'
    }).catch(async () => {
      return await axios.post(`${baseURL}/auth/login`, {
        email: 'organizer@stagepilot.io',
        password: 'password123'
      });
    });

    const token = authRes.data.data.token;
    console.log('[Step 1 PASS] Authenticated token received.');

    // 2. Fetch events
    console.log('[Step 2] Fetching events list...');
    const eventsRes = await axios.get(`${baseURL}/events`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const events = eventsRes.data.data || eventsRes.data;
    if (!events || events.length === 0) {
      throw new Error('No events found in backend');
    }

    const event = events[0];
    const eventId = event._id;
    console.log(`[Step 2 PASS] Event selected: "${event.title || event.name}" (ID: ${eventId})`);

    // 3. Test GET /api/events/:id/run-of-show endpoint
    console.log('[Step 3] Requesting Run-of-Show PDF (GET /api/events/:id/run-of-show)...');
    const pdfRes = await axios.get(`${baseURL}/events/${eventId}/run-of-show`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });

    console.log(`[Step 3 PASS] Response Status: ${pdfRes.status}`);
    console.log(`[Step 3 PASS] Content-Type: ${pdfRes.headers['content-type']}`);
    console.log(`[Step 3 PASS] Content-Disposition: ${pdfRes.headers['content-disposition']}`);

    const pdfBuffer = Buffer.from(pdfRes.data);
    console.log(`[Step 3 PASS] PDF byte size: ${pdfBuffer.length} bytes`);

    const headerMagic = pdfBuffer.toString('utf8', 0, 8);
    if (!headerMagic.includes('%PDF')) {
      throw new Error(`Invalid PDF header: ${headerMagic}`);
    }
    console.log(`[Step 3 PASS] PDF Magic Header verified: ${headerMagic.trim()}`);

    // Save PDF artifact for verification
    const artifactPath = '/Users/jeeya_mac/.gemini/antigravity-ide/brain/ae642884-44ff-457b-9b52-9cb97cba3ec5/scratch/downloaded_run_of_show.pdf';
    fs.writeFileSync(artifactPath, pdfBuffer);
    console.log(`[Step 4 PASS] PDF artifact saved to ${artifactPath}`);

    console.log('--- ALL STAGE 5 VERIFICATION STEPS PASSED ---');
  } catch (err) {
    console.error('VERIFICATION FAILED:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runStage5Verification();
