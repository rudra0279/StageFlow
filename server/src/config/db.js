import mongoose from 'mongoose';
import { ENV } from './env.js';
import { User } from '../models/User.js';
import { seedDatabase } from '../utils/seedData.js';

let memoryServerInstance = null;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);

    // Check if seeding is needed for an empty database
    const userCount = await User.countDocuments().catch(() => 0);
    if (userCount === 0) {
      console.log('[MongoDB] Empty database detected. Seeding realistic event demo data...');
      await seedDatabase(false);
    }

    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Could not connect to MongoDB at ${ENV.MONGODB_URI} (${error.message})`);

    if (ENV.NODE_ENV === 'production') {
      console.error('[MongoDB] Mandatory MongoDB connection failed in production.');
      process.exit(1);
    }

    console.log('[MongoDB] Starting embedded in-memory MongoDB for instant local run...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memoryUri = memoryServerInstance.getUri();

      const conn = await mongoose.connect(memoryUri);
      console.log(`[MongoDB] Embedded in-memory MongoDB started and connected: ${memoryUri}`);

      console.log('[MongoDB] Auto-seeding demo conference data into in-memory store...');
      await seedDatabase(false);
      console.log('[MongoDB] Ready! Demo accounts:');
      console.log('          Organizer: organizer@stagepilot.io / password123');
      console.log('          Anchor:    anchor@stagepilot.io / password123');

      return conn;
    } catch (memError) {
      console.error('[MongoDB] Failed to start embedded MongoDB:', memError.message);
      throw memError;
    }
  }
};
