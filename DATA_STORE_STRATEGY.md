# Data Store Strategy: Local vs Production

## Current Setup

### ❌ **NO** - We're NOT using different data stores

**Current State:**
- **Local Development**: Uses MongoDB connection from `.env.local`
- **Production**: Uses MongoDB connection from GitHub Secrets
- **Same Database**: Both environments point to the **same MongoDB instance**

### Why This Might Be a Problem

1. **Data Mixing**: Local development data mixes with production data
2. **Accidental Deletion**: Local testing could delete production data
3. **No Isolation**: Can't safely test without affecting production

## Options for Environment Separation

### Option 1: Different MongoDB Databases (Recommended)

Use the same MongoDB cluster but different databases:

**Local (.env.local):**
```env
MONGODB_URI=mongodb://backend:password@host:port/default?...
MONGODB_DB_NAME=learnloop-dev
```

**Production (GitHub Secrets):**
```env
MONGODB_URI=mongodb://backend:password@host:port/default?...
MONGODB_DB_NAME=learnloop-prod
```

**Benefits:**
- ✅ Same MongoDB cluster (cost-effective)
- ✅ Complete data isolation
- ✅ Easy to switch between environments
- ✅ Can share connection string (just different DB name)

### Option 2: Different MongoDB Clusters

Use completely separate MongoDB instances:

**Local (.env.local):**
```env
MONGODB_URI=mongodb://dev-user:password@dev-cluster:port/db?...
```

**Production (GitHub Secrets):**
```env
MONGODB_URI=mongodb://prod-user:password@prod-cluster:port/db?...
```

**Benefits:**
- ✅ Complete isolation (network, resources, etc.)
- ✅ Can use cheaper dev cluster
- ❌ More expensive (two clusters)
- ❌ More complex setup

### Option 3: Environment-Based Routing (Like Old System)

Route to different databases based on user email or environment variable:

```typescript
// lib/mongodb.ts
const DB_NAME = process.env.NODE_ENV === 'production' 
  ? 'learnloop-prod' 
  : 'learnloop-dev';
```

Or based on user email (like old Firestore system):
```typescript
function getDatabaseName(userEmail?: string): string {
  if (isTestAccount(userEmail)) {
    return 'learnloop-test';
  }
  return 'learnloop-prod';
}
```

## Recommended Approach

### Use Option 1: Different Database Names

1. **Update `.env.local`**:
   ```env
   MONGODB_URI=mongodb://backend:password@host:port/default?...
   MONGODB_DB_NAME=learnloop-dev
   ```

2. **Update GitHub Secrets**:
   ```bash
   gh secret set MONGODB_DB_NAME --repo elloloop/learnloop --body "learnloop-prod"
   ```

3. **No Code Changes Needed**: The `lib/mongodb.ts` already uses `MONGODB_DB_NAME` from environment

## Implementation

### Current Code (Already Supports This!)

```typescript
// lib/mongodb.ts
const DB_NAME = process.env.MONGODB_DB_NAME || 'learnloop';

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  db = client.db(DB_NAME);  // Uses environment variable
  return db;
}
```

**This already works!** Just set different `MONGODB_DB_NAME` values.

### Quick Setup

**For Local Development:**
```bash
# .env.local
MONGODB_DB_NAME=learnloop-dev
```

**For Production:**
```bash
gh secret set MONGODB_DB_NAME --repo elloloop/learnloop --body "learnloop-prod"
```

## Old System (Firestore)

The old Firestore system had:
- Test/prod routing based on user email
- Separate collection paths: `artifacts/learnloop-v1-test/...` vs `artifacts/learnloop-v1/...`
- See `lib/data-store.ts` and `DATA_STORE_SETUP.md`

**This is no longer used** after migrating to MongoDB.

## Migration Path

If you want to restore test/prod routing:

1. Keep current MongoDB setup (single connection, different DB names)
2. Add routing logic back:
   ```typescript
   // lib/mongodb.ts
   export async function getDatabase(userEmail?: string): Promise<Db> {
     const dbName = isTestAccount(userEmail) 
       ? 'learnloop-test' 
       : 'learnloop-prod';
     return client.db(dbName);
   }
   ```
3. Update all `getCollection()` calls to pass `userEmail`

**But this might be overkill** - Option 1 (different DB names per environment) is simpler and sufficient.

## Summary

| Aspect | Current | Recommended |
|--------|---------|-------------|
| **Local DB** | `learnloop` | `learnloop-dev` |
| **Production DB** | `learnloop` | `learnloop-prod` |
| **Isolation** | ❌ None | ✅ Complete |
| **Code Changes** | None needed | None needed |
| **Setup** | Change DB name | Change DB name |

**Action Required:** Just update `MONGODB_DB_NAME` in `.env.local` and GitHub Secrets!

