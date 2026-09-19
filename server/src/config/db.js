import mongoose from 'mongoose';
import dns from 'dns';
import { ENV } from './env.js';

// Ensure Node.js resolves Atlas SRV records smoothly on Windows networks
dns.setServers(['8.8.8.8', '1.1.1.1']);

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`[MongoDB] Connected successfully to external MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Could not reach ${ENV.MONGODB_URI} (${error.message})`);
    console.log('[MongoDB] Starting embedded in-memory MongoDB Server...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: { dbName: 'stagepilot' }
      });

      const uri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoDB] In-Memory MongoDB running and connected: ${uri}`);
      return conn;
    } catch (memError) {
      console.error(`[MongoDB] Failed to start In-Memory MongoDB: ${memError.message}`);
      if (ENV.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
