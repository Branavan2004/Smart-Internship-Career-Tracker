import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/career-tracker');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists.');
      process.exit(0);
    }

    // Create test user
    await User.create({
      name: 'Test Student',
      email: 'test@example.com',
      password: 'password123',
      role: 'student'
    });

    console.log('Test user created successfully: test@example.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding user:', error);
    process.exit(1);
  }
};

seedTestUser();
