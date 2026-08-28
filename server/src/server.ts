import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  // Start server
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});
