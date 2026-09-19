// tests/setup.js
const env = require('../src/config/env');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = env.JWT_SECRET;
