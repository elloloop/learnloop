# User Roles in LearnLoop

## Multi-Role System

Users can have **multiple roles** simultaneously. Each role grants specific capabilities:

| Role | Level | Description |
|------|-------|-------------|
| **owner** | 6 | Full system access. Can create admins and all other user types. |
| **admin** | 5 | Full access except deleting owner. |
| **reviewer** | 4 | Can review questions. No admin access. |
| **parent** | 3 | Can create and manage children. Can view children's progress. |
| **child** | 2 | Account tied to parent. Parent can see all activity. |
| **student** | 1 | Can practice questions and track progress. |

## Student Role & Onboarding

**Important**: The `student` role is NOT automatically assigned when a user signs up.

- When a user signs up, they get a default role (e.g., `parent`)
- To practice questions, they must **enable practice mode** (add `student` role)
- This is done via the "Start Practicing" button on the home page
- Once enabled, the user has `['parent', 'student']` roles

### Why Separate Student Role?

- Not everyone who signs up wants to practice (e.g., a parent might only want to manage children)
- Allows tracking of who has "onboarded" as a student
- Cleaner data: only users who want to practice have the `student` role

## Example Role Combinations

| Roles | Description |
|-------|-------------|
| `['owner']` | Owner who hasn't onboarded for practice |
| `['owner', 'student']` | Owner who also practices |
| `['parent']` | Parent who only manages children |
| `['parent', 'student']` | Parent who also practices |
| `['child', 'student']` | Child who can practice (most common) |
| `['reviewer', 'student']` | Reviewer who also practices |
| `['admin', 'reviewer', 'student']` | Admin who reviews and practices |

## Role Permissions

### owner
- ✅ Manage templates
- ✅ Manage questions
- ✅ Manage curriculum
- ✅ Manage ALL users (create any role)
- ❌ Delete themselves
- ✅ Review questions
- ✅ Create children
- ✅ View child progress
- ❌ Practice (needs `student` role)

### admin
- ✅ Manage templates
- ✅ Manage questions
- ✅ Manage curriculum
- ✅ Manage users (except owner)
- ❌ Delete owner
- ❌ Create owner
- ✅ Review questions
- ✅ Create children
- ✅ View child progress
- ❌ Practice (needs `student` role)

### reviewer
- ❌ Manage templates
- ❌ Manage questions
- ❌ Manage curriculum
- ❌ Manage users
- ✅ Review questions
- ❌ Create children
- ❌ Practice (needs `student` role)

### parent
- ❌ Admin access
- ❌ Review access
- ✅ Create children
- ✅ View children's progress
- ✅ Reset children's passwords
- ❌ Practice (needs `student` role)

### child
- ❌ Admin access
- ❌ Review access
- ❌ Create users
- Account always tied to parent
- ❌ Practice (needs `student` role)

### student
- ✅ Practice questions
- ✅ View own progress
- ❌ All other capabilities

## Portal Access

| Portal | Required Roles |
|--------|----------------|
| Admin | `owner` OR `admin` |
| Reviewer | `owner` OR `admin` OR `reviewer` |
| Parent | `owner` OR `admin` OR `parent` |
| Practice | `student` |

## Parent-Child Relationship

### Creating Children

Parents can create children with three authentication methods:

1. **Email-based login** (`email`)
   - Child has their own email
   - Standard Firebase authentication
   - Child can reset their own password

2. **Username + Parent-set password** (`username_parent`)
   - Parent creates username and initial password
   - Child uses username to login
   - Parent can reset password anytime

3. **Username only (child sets password)** (`username_child`)
   - Parent creates just the username
   - Child sets password on first login
   - Parent can still reset password if child forgets

### Parent Capabilities

- Create children accounts
- View all children's activity
- View children's progress
- Reset children's passwords
- Cannot delete their own account if they have children

### Child Account Features

- Account tied to parent
- Parent can see all practice activity
- Parent can reset password
- Limited to practice mode (when `student` role is added)

## User Management

### Adding Users (Admin Portal)

When adding a user, select one or more roles:
- The selected roles are stored as an array
- The "primary role" is the highest-level role for display/routing

### User Data Structure

```typescript
interface User {
  id: string;
  email?: string;
  name?: string;
  roles: UserRole[];        // e.g., ['parent', 'student']
  primaryRole?: UserRole;   // Highest privilege role
  status?: 'pending' | 'active' | 'suspended';
  studentOnboardedAt?: Date; // When they enabled practice mode
  parentId?: string;        // For children
  childIds?: string[];      // For parents
}
```

## API Endpoints

### GET /api/auth/user-role
Returns user's roles and whether they are a student:
```json
{
  "roles": ["parent", "student"],
  "primaryRole": "parent",
  "isStudent": true,
  "email": "user@example.com"
}
```

### POST /api/auth/add-student-role
Adds the `student` role to the current user (onboarding):
```json
{
  "success": true,
  "roles": ["parent", "student"],
  "studentOnboardedAt": "2024-01-15T10:30:00Z"
}
```

## Default Roles for New Users

When a user signs up without being pre-added:
- Default role: `['parent']`
- They can add children and manage them
- To practice, they click "Start Practicing" → adds `student` role

When a child is created by parent:
- Default roles depend on parent's choice
- Typically: `['child']` or `['child', 'student']`
