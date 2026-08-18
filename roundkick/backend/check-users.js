import mongoose from 'mongoose';
import User from './models/User.js';

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/customer-portal');
    const users = await User.find({}).select('email role isActive emailVerified');
    console.log('Users in database:');
    users.forEach(u => {
      console.log(`${u.email} - ${u.role} - Active: ${u.isActive} - Verified: ${u.emailVerified}`);
    });
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
