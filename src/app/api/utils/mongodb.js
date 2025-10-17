import { MongoClient } from 'mongodb';

// MongoDB connection configuration
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/sangshekkan';
const MONGODB_DB = process.env.MONGODB_DB || 'sangshekkan';

// Global variable to store the client and database connection
let client;
let db;

// Connect to MongoDB
export async function connectToDatabase() {
  if (db) {
    return { client, db };
  }

  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    db = client.db(MONGODB_DB);
    
    console.log('✅ Connected to MongoDB Atlas');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Get database instance
export async function getDatabase() {
  const { db } = await connectToDatabase();
  return db;
}

// Get collections
export async function getCollections() {
  const db = await getDatabase();
  return {
    users: db.collection('users'),
    otpCodes: db.collection('otpCodes'),
    messages: db.collection('messages'),
    reports: db.collection('reports'),
    challenges: db.collection('challenges'),
    notifications: db.collection('notifications'),
    settings: db.collection('settings'),
    videos: db.collection('videos'),
    content: db.collection('content'),
    profanities: db.collection('profanities'),
  };
}

// Close connection
export async function closeConnection() {
  if (client) {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Export default database instance for backward compatibility
export default async function getDB() {
  return await getDatabase();
}
