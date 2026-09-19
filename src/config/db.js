// src/config/db.js
const mongoose = require('mongoose');
const env = require('./env');
const { logger } = require('../utils/logger');

let isConnected = false;

async function connectDB(customUri) {
  if (isConnected) return mongoose.connection;
  const uri = customUri || env.MONGO_URI;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.system(`MongoDB Connected: ${conn.connection.host || 'in-memory'}`);
    return conn.connection;
  } catch (error) {
    logger.error('[SYSTEM]', `MongoDB connection failed: ${error.message}`);
    // If not in test mode, we might throw or exit
    if (process.env.NODE_ENV !== 'test') {
      throw error;
    }
  }
}

async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.system('MongoDB Disconnected');
  }
}

module.exports = { connectDB, disconnectDB };
