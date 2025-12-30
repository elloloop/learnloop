# Dual Data Store Setup

This application supports a dual data store system that automatically routes data to production or test stores based on user account type.

## How It Works

### Production Accounts
- **Always use production data store**
- Owner email (set via `NEXT_PUBLIC_OWNER_EMAIL` environment variable)
- Data stored in: `artifacts/learnloop-v1/public/data/...`

### Test Accounts
- **Use separate test data store**
- Examples: `admin@example.com`, `reviewer@example.com`
- Data stored in: `artifacts/learnloop-v1-test/public/data/...`

## Configuration

### Test Account Detection

Test accounts are identified by:

1. **Explicit test accounts** (defined in `lib/data-store.ts`):
   - `admin@example.com`
   - `reviewer@example.com`
   - `student@example.com`

2. **Test email domains**:
   - `@example.com`
   - `@test.com`
   - `@localhost`
   - `@local`

3. **Production accounts** (always use prod, even in test):
   - Owner email (from `NEXT_PUBLIC_OWNER_EMAIL`)

### Environment Variable Override

Set `NEXT_PUBLIC_USE_TEST_DATA=true` to force all accounts to use test data (useful for local development).

## Usage

### In API Routes

```typescript
import { getUserEmailFromRequest, getUserEmailFromBody } from '@/lib/api-helpers';
import { getTemplates } from '@/lib/db-helpers';

export async function GET(request: NextRequest) {
  // Get user email from request
  const userEmail = await getUserEmailFromRequest(request);
  
  // Pass to db-helper functions
  const templates = await getTemplates({}, userEmail);
  // Automatically routes to test or prod data store
}
```

### In Client Components

```typescript
'use client';

import { useUserEmail } from '@/lib/use-user-email';

export default function MyComponent() {
  const userEmail = useUserEmail();
  
  // When making API calls, include userEmail in headers
  const fetchData = async () => {
    const response = await fetch('/api/admin/templates', {
      headers: {
        'x-user-email': userEmail || '',
      },
    });
  };
}
```

### In Server Components

```typescript
import { auth } from '@/lib/firebase';
import { getTemplates } from '@/lib/db-helpers';

export default async function ServerComponent() {
  const user = await auth.currentUser;
  const templates = await getTemplates({}, user?.email || null);
}
```

## Data Store Paths

### Production Data Store
```
artifacts/learnloop-v1/public/data/
  ├── templates
  ├── variations
  ├── questions
  ├── reviews
  ├── attempts
  ├── sessions
  ├── curricula
  └── progress

users/
  └── {userId}
```

### Test Data Store
```
artifacts/learnloop-v1-test/public/data/
  ├── templates
  ├── variations
  ├── questions
  ├── reviews
  ├── attempts
  ├── sessions
  ├── curricula
  └── progress

users-test/
  └── {userId}
```

## Benefits

1. **Isolated Testing**: Test accounts don't affect production data
2. **Safe Development**: Developers can test with real-looking data
3. **Production Access**: Real accounts (like owner) always use production data
4. **Easy Cleanup**: Test data can be cleared without affecting production
5. **Parallel Development**: Multiple developers can use test accounts simultaneously

## Debugging

In development mode, data store routing is logged to the console:

```
[DataStore] getTemplates → TEST (admin@example.com)
[DataStore] getTemplate(abc123) → PROD (owner@example.com)
```

## Adding New Test Accounts

Edit `lib/data-store.ts`:

```typescript
const TEST_ACCOUNTS = [
  'admin@example.com',
  'reviewer@example.com',
  'student@example.com',
  'your-test-account@example.com', // Add here
];
```

Or add test email domains:

```typescript
const TEST_EMAIL_DOMAINS = [
  'example.com',
  'test.com',
  'your-test-domain.com', // Add here
];
```

## Migration Notes

- Existing functions in `db-helpers.ts` accept optional `userEmail` parameter
- Functions without `userEmail` default to production data store (backward compatible)
- Gradually migrate API routes to pass `userEmail` parameter
- Client components should use `useUserEmail()` hook and pass email in API calls

