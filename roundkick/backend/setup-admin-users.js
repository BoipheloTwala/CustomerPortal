#!/usr/bin/env node

/**
 * Setup Admin Users Script
 * Pre-configures admin users for the Employee International Payments Portal
 * No registration process is allowed - only pre-configured users
 */

console.log('Starting setup script...');

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

console.log('Imports loaded');

// Skip dotenv loading for setup script

const adminUsers = [
  {
    email: 'admin@internationalpayments.com',
    password: 'AdminSecure123!',
    firstName: 'John',
    lastName: 'Administrator',
    phoneNumber: '+1234567890',
    role: 'admin',
    emailVerified: true
  },
  {
    email: 'manager@internationalpayments.com',
    password: 'ManagerSecure123!',
    firstName: 'Sarah',
    lastName: 'Manager',
    phoneNumber: '+1234567891',
    role: 'admin',
    emailVerified: true
  },
  {
    email: 'payments@internationalpayments.com',
    password: 'PaymentsSecure123!',
    firstName: 'Mike',
    lastName: 'Payments',
    phoneNumber: '+1234567892',
    role: 'admin',
    emailVerified: true
  }
];

const customerUsers = [
  {
    email: 'john.doe@example.com',
    password: 'Customer123!',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567893',
    role: 'customer',
    emailVerified: true
  },
  {
    email: 'jane.smith@example.com',
    password: 'Customer456!',
    firstName: 'Jane',
    lastName: 'Smith',
    phoneNumber: '+1234567894',
    role: 'customer',
    emailVerified: true
  }
];

async function setupUsers() {
  try {
    // Only connect to MongoDB if not already connected (when called from server)
    let shouldCloseConnection = false;
    if (mongoose.connection.readyState === 0) {
      // Not connected, so we need to connect
      const mongoUrl = 'mongodb://localhost:27017/customer_portal';
      console.log('Connecting to MongoDB:', mongoUrl);

      // Set connection options for better error handling
      await mongoose.connect(mongoUrl, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      });

      console.log('Connected to MongoDB successfully');
      shouldCloseConnection = true;
    } else {
      console.log('Using existing MongoDB connection');
    }

    // Clear existing users (for development/testing)
    if (process.env.NODE_ENV !== 'production') {
      await User.deleteMany({});
      console.log('Cleared existing users');
    }

    // Create admin users
    console.log('Creating admin users...');
    for (const adminData of adminUsers) {
      const existingUser = await User.findOne({ email: adminData.email });
      if (!existingUser) {
        const user = new User(adminData);
        await user.save();
        console.log(`✓ Created admin user: ${adminData.email}`);
      } else {
        console.log(`- Admin user already exists: ${adminData.email}`);
      }
    }

    // Create customer users
    console.log('Creating customer users...');
    for (const customerData of customerUsers) {
      const existingUser = await User.findOne({ email: customerData.email });
      if (!existingUser) {
        const user = new User(customerData);
        await user.save();
        console.log(`✓ Created customer user: ${customerData.email}`);
      } else {
        console.log(`- Customer user already exists: ${customerData.email}`);
      }
    }

    console.log('\n🎉 User setup completed successfully!');
    console.log('\nAdmin Portal Credentials:');
    adminUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log('---');
    });

    console.log('\nCustomer Portal Credentials:');
    customerUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error setting up users:', error);
    // Only exit when called directly as a script
    if (import.meta.url === `file://${process.argv[1]}`) {
      process.exit(1);
    }
    throw error; // Re-throw for server to handle
  } finally {
    // Only close connection when we opened it ourselves
    if (shouldCloseConnection) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  }
}

// Run setup only when called directly (not when imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running setup...');
  setupUsers().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
}

export default setupUsers;

