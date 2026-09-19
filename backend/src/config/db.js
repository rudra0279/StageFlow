import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`[MongoDB] Database connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn(`[MongoDB] Ensure MongoDB is running at ${ENV.MONGODB_URI} or update MONGODB_URI in backend/.env`);
    if (ENV.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
