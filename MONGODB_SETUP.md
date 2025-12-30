# MongoDB Setup Guide

## Overview

The application now uses **MongoDB** instead of Firestore for all database operations. All database queries are executed from the backend (Next.js API routes) using MongoDB queries.

## Architecture

```
Client Component → Next.js API Route → MongoDB Driver → MongoDB Database
```

All database operations use MongoDB syntax:
- `find()`, `findOne()`, `insertOne()`, `updateOne()`, `deleteOne()`
- MongoDB query operators: `$set`, `$push`, `$inc`, etc.
- MongoDB aggregation pipelines (if needed)

## Setup

### 1. Add MongoDB Connection String

Add to `.env.local`:

```env
MONGODB_URI=mongodb://<username>:<password>@<host>:<port>/<database>?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false
MONGODB_DB_NAME=learnloop
```

**Important**: Replace `<username>` and `<password>` with your actual MongoDB credentials.

### 2. Connection String Format

Your connection string should look like:
```
mongodb://username:password@host:port/database?options
```

For your case:
```
mongodb://<username>:<password>@<host>:<port>/<database>?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false
```

### 3. Test Connection

The app will automatically connect when the first API route is called. Check the console for:
- ✅ `Connected to MongoDB` - Success
- ❌ `MongoDB connection error` - Check credentials

## Database Structure

### Collections

All data is stored in MongoDB collections:

- `users` - User accounts and roles
- `templates` - Question templates
- `variations` - Question variations
- `questions` - Generated questions
- `reviews` - Question reviews
- `attempts` - Student attempts
- `sessions` - Test sessions
- `curricula` - Curriculum tags
- `progress` - Student progress

### Document Structure

Documents use MongoDB's native `_id` field, but the app converts it to `id` for consistency:

```javascript
// MongoDB document
{
  _id: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  role: "student",
  createdAt: ISODate("2024-01-01T00:00:00Z")
}

// App format (after conversion)
{
  id: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  role: "student",
  createdAt: Date("2024-01-01T00:00:00Z")
}
```

## MongoDB Queries Used

### Find Operations

```javascript
// Find one
await collection.findOne({ _id: userId });

// Find many with filters
await collection.find({ role: 'student' }).toArray();

// Find with sorting
await collection.find({}).sort({ createdAt: -1 }).toArray();
```

### Insert Operations

```javascript
await collection.insertOne({
  _id: userId,
  email: userEmail,
  role: 'student',
  createdAt: new Date()
});
```

### Update Operations

```javascript
// Update one
await collection.updateOne(
  { _id: userId },
  { $set: { lastLoginAt: new Date() } }
);
```

### Delete Operations

```javascript
await collection.deleteOne({ _id: userId });
```

## Key Files

- `lib/mongodb.ts` - MongoDB connection and helpers
- `lib/db-helpers-mongo.ts` - All database operations using MongoDB
- `app/api/**/route.ts` - API routes that use MongoDB helpers

## Migration from Firestore

All Firestore operations have been replaced:

| Firestore | MongoDB |
|-----------|---------|
| `getDoc()` | `findOne()` |
| `getDocs()` | `find().toArray()` |
| `setDoc()` | `insertOne()` or `updateOne()` |
| `updateDoc()` | `updateOne()` with `$set` |
| `deleteDoc()` | `deleteOne()` |
| `where()` | Query object `{ field: value }` |
| `orderBy()` | `.sort({ field: -1 })` |

## Benefits

1. **MongoDB Queries**: Use familiar MongoDB syntax
2. **Backend Only**: All queries from server-side (secure)
3. **Better Performance**: Direct MongoDB connection
4. **Flexible Queries**: Full MongoDB query capabilities
5. **Aggregation**: Can use MongoDB aggregation pipelines

## Troubleshooting

### Connection Failed

1. Check `MONGODB_URI` in `.env.local`
2. Verify username/password are correct
3. Check network connectivity
4. Verify MongoDB server is accessible

### Authentication Error

- Check `authMechanism=SCRAM-SHA-256` matches your MongoDB setup
- Verify username/password credentials

### Database Not Found

- Check `MONGODB_DB_NAME` matches your database name
- Database will be created automatically on first write

## Next Steps

1. ✅ Add MongoDB connection string to `.env.local`
2. ✅ Restart dev server: `npm run dev`
3. ✅ Test login - should create user in MongoDB
4. ✅ Check MongoDB for data

