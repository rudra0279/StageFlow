// tests/setup.js
const env = require('../src/config/env');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = env.JWT_SECRET || 'test_secret_stagepilot_98765';
process.env.AI_PROVIDER = env.AI_PROVIDER || 'gemini';

let inMemoryStore = null;
try {
  inMemoryStore = require('../src/models/inMemoryStore');
} catch (e) {}

beforeAll(async () => {
  if (inMemoryStore && inMemoryStore.clearAllMemoryCollections) {
    inMemoryStore.clearAllMemoryCollections();
  }
});

afterAll(async () => {
  if (inMemoryStore && inMemoryStore.clearAllMemoryCollections) {
    inMemoryStore.clearAllMemoryCollections();
  }
});
