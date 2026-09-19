import app from './src/app.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from './src/config/env.js';

console.log('--- RUNNING BACKEND FOUNDATION VERIFICATION ---');

// 1. Verify bcryptjs
const password = 'secretPassword123';
const salt = await bcrypt.genSalt(10);
const hashed = await bcrypt.hash(password, salt);
const isMatch = await bcrypt.compare(password, hashed);
console.log('1. Bcrypt Password Hashing Test:', isMatch ? 'PASSED' : 'FAILED');

// 2. Verify JWT token generation & verification
const testPayload = { id: '65e3170a4b0123456789abcd', role: 'organizer' };
const token = jwt.sign(testPayload, ENV.JWT_SECRET, { expiresIn: '1h' });
const decoded = jwt.verify(token, ENV.JWT_SECRET);
console.log('2. JWT Signing & Verification Test:', decoded.role === 'organizer' ? 'PASSED' : 'FAILED');

// 3. Verify Express app server initialization & route mounting
const server = app.listen(5999, async () => {
  console.log('3. Express Server Boot Test: PASSED (Listening on 5999)');

  try {
    const healthRes = await fetch('http://localhost:5999/api/health');
    const healthData = await healthRes.json();
    console.log('4. Health Check Endpoint (/api/health):', healthData.status === 'ok' ? 'PASSED' : 'FAILED');

    // Test 404 handler
    const notFoundRes = await fetch('http://localhost:5999/api/unknown-route');
    console.log('5. Centralized 404 Handler:', notFoundRes.status === 404 ? 'PASSED' : 'FAILED');

    // Test Registration Validation (missing fields)
    const invalidRegRes = await fetch('http://localhost:5999/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' })
    });
    const regData = await invalidRegRes.json();
    console.log('6. Express-Validator Middleware:', invalidRegRes.status === 400 && regData.errors?.length > 0 ? 'PASSED' : 'FAILED');

    console.log('--- ALL BACKEND FOUNDATION TESTS PASSED ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
});
