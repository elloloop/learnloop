// MongoDB connection and helpers
// All database operations use MongoDB with MongoDB queries

import { MongoClient, Db, Collection, Document } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';

// For Firebase Firestore MongoDB API, the database name MUST be 'default'
// as specified in the connection URI. Other MongoDB instances can use custom names.
const DB_NAME = process.env.MONGODB_DB_NAME || 'default';

if (!MONGODB_URI) {
  console.warn('MONGODB_URI not set. Database operations will fail.');
}

let client: MongoClient | null = null;
let db: Db | null = null;

// Extract database name from MongoDB URI if present
function getDatabaseNameFromUri(uri: string): string | null {
  try {
    // Parse the URI to extract database name from path
    // Format: mongodb://user:pass@host:port/dbname?params
    const url = new URL(uri);
    const pathname = url.pathname;
    if (pathname && pathname.length > 1) {
      // Remove leading slash
      return pathname.substring(1);
    }
  } catch (e) {
    // If URL parsing fails, return null
  }
  return null;
}

// Get MongoDB client (singleton)
export async function getMongoClient(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    return client;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    client = null;
    throw error;
  }
}

// Get database instance
export async function getDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  const client = await getMongoClient();
  
  // Use database name from URI if available, otherwise use DB_NAME
  const dbNameFromUri = getDatabaseNameFromUri(MONGODB_URI);
  const finalDbName = dbNameFromUri || DB_NAME;
  
  console.log('📦 Using database:', finalDbName);
  db = client.db(finalDbName);
  return db;
}

// Get collection helper
export async function getCollection<T extends Document = Document>(
  collectionName: string
): Promise<Collection<T>> {
  const database = await getDatabase();
  return database.collection<T>(collectionName);
}

// Close connection (for cleanup)
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

// Helper to convert MongoDB document to app format
export function toAppFormat<T>(doc: any): T {
  if (!doc) return doc;
  
  // Convert _id to id and remove _id
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id.toString(),
  } as T;
}

// Helper to convert app format to MongoDB format
export function toMongoFormat(doc: any): any {
  if (!doc) return doc;
  
  const { id, ...rest } = doc;
  if (id) {
    // If id is provided, use it as _id
    return { _id: id, ...rest };
  }
  return rest;
}

