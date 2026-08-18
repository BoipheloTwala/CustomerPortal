import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  try {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to in-memory MongoDB for testing');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
});

// Cleanup after each test
afterEach(async () => {
  try {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Failed to clear collections:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    // Stop in-memory MongoDB instance
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('Disconnected from in-memory MongoDB');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
});
