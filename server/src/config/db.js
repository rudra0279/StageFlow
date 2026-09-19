import mongoose from 'mongoose';
import dns from 'dns';
import { ENV } from './env.js';
import { User } from '../models/User.js';
import { seedDatabase } from '../utils/seedData.js';

let memoryServerInstance = null;

// Ensure Node.js resolves Atlas SRV records smoothly on Windows networks
dns.setServers(['8.8.8.8', '1.1.1.1']);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`[MongoDB] Connected successfully to external MongoDB: ${conn.connection.host}`);

    // Check if seeding is needed for an empty database
    const userCount = await User.countDocuments().catch(() => 0);
    if (userCount === 0) {
      console.log('[MongoDB] Empty database detected. Seeding realistic event demo data...');
      await seedDatabase(false);
    }

    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Could not reach ${ENV.MONGODB_URI} (${error.message})`);

    if (ENV.NODE_ENV === 'production') {
      console.error('[MongoDB] Mandatory MongoDB connection failed in production.');
      process.exit(1);
    }

    console.log('[MongoDB] Starting embedded in-memory MongoDB Server for local run...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create({
        instance: { dbName: 'stagepilot' }
      });

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
      console.error('[MongoDB] Failed to start In-Memory MongoDB:', memError.message);
      throw memError;
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
};
