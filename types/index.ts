// Core Types for LearnLoop

/**
 * User Roles:
 * 
 * A user can have MULTIPLE roles. Each role grants specific capabilities:
 * 
 * owner    - Can create admins and all other user types. Full system access.
 * admin    - Can do everything as owner EXCEPT delete owner.
 * reviewer - Can review questions. No admin access.
 * parent   - Can create and manage children accounts. Can view children's progress.
 * child    - Account tied to a parent. Parent can see all activity.
 * student  - Can practice questions and track progress. Added during onboarding.
 * 
 * Example combinations:
 * - ['owner', 'student'] - Owner who also practices
 * - ['parent', 'student'] - Parent who practices and manages children
 * - ['reviewer', 'student'] - Reviewer who also practices
 * - ['child', 'student'] - Child who can practice (most common for children)
 */
export type UserRole = 'owner' | 'admin' | 'reviewer' | 'parent' | 'child' | 'student';

/**
 * Authentication method for child accounts
 */
export type ChildAuthMethod = 
  | 'email'           // Child has email-based login
  | 'username_parent' // Username + password set by parent
  | 'username_child'; // Username only, child sets password on first login

export interface VariableDefinition {
  name: string;
  type: 'number' | 'text' | 'choice';
  min?: number;
  max?: number;
  options?: string[];
  precision?: number; // decimal places
}

export interface QuestionTemplate {
  id: string;
  title: string;
  templateText: string; // Primary phrasing
  variants: string[]; // Alternative phrasings
  answerFunction?: string; // JS Body: "const {a,b} = values; return a+b;"
  variables: VariableDefinition[];
  concepts: string[];
  curriculumTags: CurriculumTag[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'draft' | 'active' | 'archived';
}

export interface QuestionVariation {
  id: string;
  templateId: string;
  variationText: string; // One of the variants from template
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface GeneratedQuestion {
  id: string;
  templateId: string;
  variationId?: string;
  questionText: string;
  values: Record<string, any>;
  concepts: string[];
  curriculumTags: CurriculumTag[];
  calculatedAnswer?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  rejectionReason?: string;
  // For tracking attempts
  attemptCount: number;
  lastAttemptedAt?: Date;
}

export interface QuestionReview {
  id: string;
  questionId: string;
  reviewerId: string;
  reviewerType: 'human' | 'ai' | 'api';
  isValid: boolean;
  score?: number; // 1-10
  feedback: string;
  createdAt: Date;
}

export interface StudentAttempt {
  id: string;
  studentId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number; // seconds
  createdAt: Date;
}

export interface TestSession {
  id: string;
  studentId: string;
  curriculumTags: CurriculumTag[];
  questions: string[]; // question IDs
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface CurriculumTag {
  id: string;
  name: string;
  subject: 'math' | 'english';
  year: number; // 1-6 for UK Year 6 equivalent
  topic: string;
  subtopic?: string;
  // Mappings to other curricula
  mappings: {
    uk?: {
      keyStage?: string;
      year?: number;
      topic?: string;
    };
    us?: {
      grade?: number;
      standard?: string;
      domain?: string;
    };
    india?: {
      class?: number;
      board?: string;
      chapter?: string;
    };
    [country: string]: any; // Extensible for other countries
  };
}

export interface User {
  id: string;
  email?: string;
  username?: string;        // For child accounts with username login
  roles: UserRole[];        // User can have multiple roles
  primaryRole?: UserRole;   // Primary role for display/routing (highest privilege)
  name?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  status?: 'pending' | 'active' | 'suspended';
  
  // Student onboarding
  studentOnboardedAt?: Date; // When user completed student onboarding
  
  // Parent-Child relationship
  parentId?: string;        // For child accounts - links to parent
  childIds?: string[];      // For parent accounts - list of children
  
  // Child-specific fields
  authMethod?: ChildAuthMethod;  // How the child authenticates
  passwordSetByParent?: boolean; // True if parent set password, child can change on first login
  requirePasswordChange?: boolean; // True if child needs to set password on first login
  
  // Backward compatibility - will be migrated to roles[]
  role?: UserRole;          // @deprecated - use roles[] instead
}

/**
 * Permissions for each individual role
 */
export interface RolePermissions {
  // Admin capabilities
  canManageTemplates: boolean;
  canManageQuestions: boolean;
  canManageCurriculum: boolean;
  canManageUsers: boolean;
  canDeleteOwner: boolean;
  
  // Review capabilities
  canReviewQuestions: boolean;
  
  // Parent capabilities
  canCreateChildren: boolean;
  canViewChildProgress: boolean;
  canResetChildPassword: boolean;
  
  // Student capabilities - requires 'student' role
  canPractice: boolean;
  canViewOwnProgress: boolean;
}

/**
 * Permissions for each role
 * Note: canPractice and canViewOwnProgress only come with 'student' role
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  owner: {
    canManageTemplates: true,
    canManageQuestions: true,
    canManageCurriculum: true,
    canManageUsers: true,
    canDeleteOwner: false,
    canReviewQuestions: true,
    canCreateChildren: true,
    canViewChildProgress: true,
    canResetChildPassword: true,
    canPractice: false, // Needs 'student' role
    canViewOwnProgress: false,
  },
  admin: {
    canManageTemplates: true,
    canManageQuestions: true,
    canManageCurriculum: true,
    canManageUsers: true,
    canDeleteOwner: false,
    canReviewQuestions: true,
    canCreateChildren: true,
    canViewChildProgress: true,
    canResetChildPassword: true,
    canPractice: false, // Needs 'student' role
    canViewOwnProgress: false,
  },
  reviewer: {
    canManageTemplates: false,
    canManageQuestions: false,
    canManageCurriculum: false,
    canManageUsers: false,
    canDeleteOwner: false,
    canReviewQuestions: true,
    canCreateChildren: false,
    canViewChildProgress: false,
    canResetChildPassword: false,
    canPractice: false, // Needs 'student' role
    canViewOwnProgress: false,
  },
  parent: {
    canManageTemplates: false,
    canManageQuestions: false,
    canManageCurriculum: false,
    canManageUsers: false,
    canDeleteOwner: false,
    canReviewQuestions: false,
    canCreateChildren: true,
    canViewChildProgress: true,
    canResetChildPassword: true,
    canPractice: false, // Needs 'student' role
    canViewOwnProgress: false,
  },
  child: {
    canManageTemplates: false,
    canManageQuestions: false,
    canManageCurriculum: false,
    canManageUsers: false,
    canDeleteOwner: false,
    canReviewQuestions: false,
    canCreateChildren: false,
    canViewChildProgress: false,
    canResetChildPassword: false,
    canPractice: false, // Needs 'student' role
    canViewOwnProgress: false,
  },
  student: {
    canManageTemplates: false,
    canManageQuestions: false,
    canManageCurriculum: false,
    canManageUsers: false,
    canDeleteOwner: false,
    canReviewQuestions: false,
    canCreateChildren: false,
    canViewChildProgress: false,
    canResetChildPassword: false,
    canPractice: true,
    canViewOwnProgress: true,
  },
};

/**
 * Get combined permissions for a user with multiple roles
 */
export function getUserPermissions(roles: UserRole[]): RolePermissions {
  const combined: RolePermissions = {
    canManageTemplates: false,
    canManageQuestions: false,
    canManageCurriculum: false,
    canManageUsers: false,
    canDeleteOwner: false,
    canReviewQuestions: false,
    canCreateChildren: false,
    canViewChildProgress: false,
    canResetChildPassword: false,
    canPractice: false,
    canViewOwnProgress: false,
  };

  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (perms) {
      Object.keys(perms).forEach((key) => {
        if (perms[key as keyof RolePermissions]) {
          combined[key as keyof RolePermissions] = true;
        }
      });
    }
  }

  return combined;
}

/**
 * Role hierarchy for determining primary role
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 6,
  admin: 5,
  reviewer: 4,
  parent: 3,
  child: 2,
  student: 1,
};

/**
 * Get the primary (highest privilege) role from a list of roles
 */
export function getPrimaryRole(roles: UserRole[]): UserRole {
  if (!roles || roles.length === 0) return 'student';
  
  return roles.reduce((highest, current) => {
    return (ROLE_HIERARCHY[current] || 0) > (ROLE_HIERARCHY[highest] || 0)
      ? current
      : highest;
  }, roles[0]);
}

export interface StudentProgress {
  studentId: string;
  curriculumTagId: string;
  totalAttempts: number;
  correctAttempts: number;
  masteryLevel: 'beginner' | 'developing' | 'proficient' | 'mastered';
  lastPracticedAt?: Date;
}

