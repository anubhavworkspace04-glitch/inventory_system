import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Ensure environment variables are loaded prior to database initialization
dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI && process.env.NODE_ENV === 'production') {
      console.error('CRITICAL ERROR: MONGODB_URI environment variable is required in production environment.');
      process.exit(1);
    }

    const targetURI = mongoURI || 'mongodb://localhost:27017/inventory_app';
    const conn = await mongoose.connect(targetURI);

    const safeHost = conn.connection.host || 'Cloud Database';
    const dbName = conn.connection.name || 'inventory_app';
    console.log(`MongoDB connected successfully to ${safeHost}/${dbName}`);
  } catch (error: any) {
    console.error(`MongoDB Connection Error: ${error?.message || error}`);
    process.exit(1); // Fail immediately and clearly
  }
};
