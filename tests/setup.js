// tests/setup.js
const { clearAllMemoryCollections } = require('../src/models/inMemoryStore');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret_stagepilot_98765';
  process.env.AI_PROVIDER = 'gemini';
  clearAllMemoryCollections();
});

afterAll(async () => {
  clearAllMemoryCollections();
});
