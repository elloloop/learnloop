// MongoDB database helpers using MongoDB queries
// All operations use MongoDB syntax

import {
  getCollection,
  toAppFormat,
  toMongoFormat,
} from './mongodb';
import {
  QuestionTemplate,
  GeneratedQuestion,
  QuestionReview,
  StudentAttempt,
  TestSession,
  QuestionVariation,
  CurriculumTag,
  StudentProgress,
  User,
} from '@/types';

// Type for documents with string _id (Firebase Firestore MongoDB API uses strings)
type WithStringId<T> = Omit<T, 'id'> & { _id: string };

// Collection names
const COLLECTIONS = {
  users: 'users',
  templates: 'templates',
  variations: 'variations',
  questions: 'questions',
  reviews: 'reviews',
  attempts: 'attempts',
  sessions: 'sessions',
  curricula: 'curricula',
  progress: 'progress',
};

// Helper to convert dates
const toDate = (value: any): Date => {
  if (value instanceof Date) return value;
  if (value?.toDate) return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date();
};

// ========== USER OPERATIONS ==========

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const collection = await getCollection(COLLECTIONS.users);
    const doc = await collection.findOne({ _id: userId } as any as any);
    return doc ? toAppFormat<User>(doc) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const getUsers = async (filters?: {
  role?: string;
}): Promise<User[]> => {
  try {
    const collection = await getCollection(COLLECTIONS.users);
    const query: any = {};
    if (filters?.role) {
      query.role = filters.role;
    }
    const docs = await collection.find(query).toArray();
    return docs.map((doc) => toAppFormat<User>(doc));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const createUser = async (
  userId: string,
  userData: Omit<User, 'id' | 'createdAt'>
): Promise<void> => {
  try {
    const collection = await getCollection(COLLECTIONS.users);
    await collection.insertOne({
      _id: userId,
      ...userData,
      createdAt: new Date(),
    } as any);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (
  userId: string,
  updates: Partial<User>
): Promise<void> => {
  try {
    const collection = await getCollection<User>(COLLECTIONS.users);
    const { id, ...updateData } = updates;
    await collection.updateOne(
      { _id: userId } as any,
      { $set: updateData }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const collection = await getCollection<User>(COLLECTIONS.users);
    await collection.deleteOne({ _id: userId } as any);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const updateUserLastLogin = async (userId: string): Promise<void> => {
  try {
    const collection = await getCollection<User>(COLLECTIONS.users);
    await collection.updateOne(
      { _id: userId } as any,
      { $set: { lastLoginAt: new Date() } }
    );
  } catch (error) {
    console.error('Error updating last login:', error);
    // Don't throw - this is not critical
  }
};

// ========== TEMPLATE OPERATIONS ==========

export const getTemplate = async (
  id: string
): Promise<QuestionTemplate | null> => {
  try {
    const collection = await getCollection<QuestionTemplate>(
      COLLECTIONS.templates
    );
    // MongoDB uses ObjectId, but we're using string IDs
    // Try both string and ObjectId
    let doc = await collection.findOne({ _id: id } as any);
    if (!doc) {
      // Try with ObjectId if id is a valid ObjectId format
      const { ObjectId } = await import('mongodb');
      if (ObjectId.isValid(id)) {
        doc = await collection.findOne({ _id: new ObjectId(id) });
      }
    }
    if (!doc) return null;
    const template = toAppFormat<QuestionTemplate>(doc);
    // Convert dates
    template.createdAt = toDate(doc.createdAt);
    template.updatedAt = toDate(doc.updatedAt);
    return template;
  } catch (error) {
    console.error('Error getting template:', error);
    return null;
  }
};

export const getTemplates = async (filters?: {
  status?: string;
  createdBy?: string;
  includeDeleted?: boolean;
}): Promise<QuestionTemplate[]> => {
  try {
    const collection = await getCollection<QuestionTemplate>(
      COLLECTIONS.templates
    );
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.createdBy) query.createdBy = filters.createdBy;
    if (!filters?.includeDeleted) query.deletedAt = { $exists: false };

    const docs = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map((doc) => {
      const template = toAppFormat<QuestionTemplate>(doc);
      template.createdAt = toDate(doc.createdAt);
      template.updatedAt = toDate(doc.updatedAt);
      return template;
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    return [];
  }
};

export const createTemplate = async (
  template: Omit<QuestionTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const collection = await getCollection<QuestionTemplate>(
      COLLECTIONS.templates
    );
    const now = new Date();
    const doc = {
      ...template,
      createdAt: now,
      updatedAt: now,
    };
    const result = await collection.insertOne(doc as any);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

export const updateTemplate = async (
  id: string,
  updates: Partial<QuestionTemplate>
): Promise<void> => {
  try {
    const collection = await getCollection<QuestionTemplate>(
      COLLECTIONS.templates
    );
    const { id: _, ...updateData } = updates;

    // Try with string ID first
    let result = await collection.updateOne(
      { _id: id } as any,
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    // If no document matched, try with ObjectId
    if (result.matchedCount === 0) {
      const { ObjectId } = await import('mongodb');
      if (ObjectId.isValid(id)) {
        await collection.updateOne(
          { _id: new ObjectId(id) } as any,
          { $set: { ...updateData, updatedAt: new Date() } }
        );
      }
    }
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    const collection = await getCollection<QuestionTemplate>(
      COLLECTIONS.templates
    );

    // Try with string ID first
    let result = await collection.updateOne(
      { _id: id } as any,
      { $set: { deletedAt: new Date() } }
    );

    // If no document matched, try with ObjectId
    if (result.matchedCount === 0) {
      const { ObjectId } = await import('mongodb');
      if (ObjectId.isValid(id)) {
        await collection.updateOne(
          { _id: new ObjectId(id) } as any,
          { $set: { deletedAt: new Date() } }
        );
      }
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};

export const restoreTemplate = async (id: string): Promise<void> => {
  try {
    const collection = await getCollection<QuestionTemplate>(
      COLLECTIONS.templates
    );

    // Try with string ID first
    let result = await collection.updateOne(
      { _id: id } as any,
      { $unset: { deletedAt: "" } }
    );

    // If no document matched, try with ObjectId
    if (result.matchedCount === 0) {
      const { ObjectId } = await import('mongodb');
      if (ObjectId.isValid(id)) {
        await collection.updateOne(
          { _id: new ObjectId(id) } as any,
          { $unset: { deletedAt: "" } }
        );
      }
    }
  } catch (error) {
    console.error('Error restoring template:', error);
    throw error;
  }
};

// ========== VARIATION OPERATIONS ==========

export const getVariations = async (
  templateId: string
): Promise<QuestionVariation[]> => {
  try {
    const collection = await getCollection<QuestionVariation>(
      COLLECTIONS.variations
    );
    const docs = await collection
      .find({ templateId })
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map((doc) => {
      const variation = toAppFormat<QuestionVariation>(doc);
      variation.createdAt = toDate(doc.createdAt);
      if (doc.approvedAt) variation.approvedAt = toDate(doc.approvedAt);
      if (doc.rejectedAt) variation.rejectedAt = toDate(doc.rejectedAt);
      return variation;
    });
  } catch (error) {
    console.error('Error getting variations:', error);
    return [];
  }
};

export const createVariation = async (
  variation: Omit<QuestionVariation, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const collection = await getCollection<QuestionVariation>(
      COLLECTIONS.variations
    );
    const doc = {
      ...variation,
      createdAt: new Date(),
    };
    const result = await collection.insertOne(doc as any);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error creating variation:', error);
    throw error;
  }
};

export const updateVariation = async (
  id: string,
  updates: Partial<QuestionVariation>
): Promise<void> => {
  try {
    const collection = await getCollection<QuestionVariation>(
      COLLECTIONS.variations
    );

    const { id: _, ...updateData } = updates;

    let result = await collection.updateOne({ _id: id } as any, { $set: updateData });

    if (result.matchedCount === 0) {
      const { ObjectId } = await import('mongodb');
      if (ObjectId.isValid(id)) {
        await collection.updateOne(
          { _id: new ObjectId(id) } as any,
          { $set: updateData }
        );
      }
    }
  } catch (error) {
    console.error('Error updating variation:', error);
    throw error;
  }
};

export const deleteVariation = async (id: string): Promise<void> => {
  try {
    const collection = await getCollection<QuestionVariation>(
      COLLECTIONS.variations
    );
    let result = await collection.deleteOne({ _id: id } as any);

    if (result.deletedCount === 0) {
      const { ObjectId } = await import('mongodb');
      if (ObjectId.isValid(id)) {
        await collection.deleteOne({ _id: new ObjectId(id) } as any);
      }
    }
  } catch (error) {
    console.error('Error deleting variation:', error);
    throw error;
  }
};

// ========== QUESTION OPERATIONS ==========

export const getQuestions = async (filters?: {
  templateId?: string;
  variationId?: string;
  status?: string;
  curriculumTagId?: string;
}): Promise<GeneratedQuestion[]> => {
  try {
    const collection = await getCollection<GeneratedQuestion>(
      COLLECTIONS.questions
    );
    const query: any = {};
    if (filters?.templateId) query.templateId = filters.templateId;
    if (filters?.variationId) query.variationId = filters.variationId;
    if (filters?.status) query.status = filters.status;

    const docs = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map((doc) => {
      const question = toAppFormat<GeneratedQuestion>(doc);
      question.createdAt = toDate(doc.createdAt);
      if (doc.reviewedAt) question.reviewedAt = toDate(doc.reviewedAt);
      if (doc.lastAttemptedAt)
        question.lastAttemptedAt = toDate(doc.lastAttemptedAt);
      return question;
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    return [];
  }
};

export const createQuestion = async (
  question: Omit<GeneratedQuestion, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const collection = await getCollection<GeneratedQuestion>(
      COLLECTIONS.questions
    );
    const doc = {
      ...question,
      createdAt: new Date(),
    };
    const result = await collection.insertOne(doc as any);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

export const updateQuestion = async (
  id: string,
  updates: Partial<GeneratedQuestion>
): Promise<void> => {
  try {
    const collection = await getCollection<GeneratedQuestion>(
      COLLECTIONS.questions
    );
    const { id: _, ...updateData } = updates;
    await collection.updateOne({ _id: id } as any, { $set: updateData });
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

export const deleteQuestion = async (id: string): Promise<void> => {
  try {
    const collection = await getCollection<GeneratedQuestion>(
      COLLECTIONS.questions
    );
    await collection.deleteOne({ _id: id } as any);
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// ========== REVIEW OPERATIONS ==========

export const createReview = async (
  review: Omit<QuestionReview, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const collection = await getCollection<QuestionReview>(COLLECTIONS.reviews);
    const doc = {
      ...review,
      createdAt: new Date(),
    };
    const result = await collection.insertOne(doc as any);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const getReviews = async (
  questionId: string
): Promise<QuestionReview[]> => {
  try {
    const collection = await getCollection<QuestionReview>(COLLECTIONS.reviews);
    const docs = await collection
      .find({ questionId })
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map((doc) => {
      const review = toAppFormat<QuestionReview>(doc);
      review.createdAt = toDate(doc.createdAt);
      return review;
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return [];
  }
};

// ========== ATTEMPT OPERATIONS ==========

export const createAttempt = async (
  attempt: Omit<StudentAttempt, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const collection = await getCollection<StudentAttempt>(
      COLLECTIONS.attempts
    );
    const doc = {
      ...attempt,
      createdAt: new Date(),
    };
    const result = await collection.insertOne(doc as any);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error creating attempt:', error);
    throw error;
  }
};

export const getStudentAttempts = async (
  studentId: string,
  questionId?: string
): Promise<StudentAttempt[]> => {
  try {
    const collection = await getCollection<StudentAttempt>(
      COLLECTIONS.attempts
    );
    const query: any = { studentId };
    if (questionId) query.questionId = questionId;

    const docs = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map((doc) => {
      const attempt = toAppFormat<StudentAttempt>(doc);
      attempt.createdAt = toDate(doc.createdAt);
      return attempt;
    });
  } catch (error) {
    console.error('Error getting attempts:', error);
    return [];
  }
};

// ========== SESSION OPERATIONS ==========

export const createSession = async (
  session: Omit<TestSession, 'id' | 'startedAt'>
): Promise<string> => {
  try {
    const collection = await getCollection<TestSession>(COLLECTIONS.sessions);
    const doc = {
      ...session,
      startedAt: new Date(),
    };
    const result = await collection.insertOne(doc as any);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const updateSession = async (
  id: string,
  updates: Partial<TestSession>
): Promise<void> => {
  try {
    const collection = await getCollection<TestSession>(COLLECTIONS.sessions);
    const { id: _, ...updateData } = updates;
    await collection.updateOne({ _id: id } as any, { $set: updateData });
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

// ========== CURRICULUM OPERATIONS ==========

export const getCurricula = async (): Promise<CurriculumTag[]> => {
  try {
    const collection = await getCollection<CurriculumTag>(COLLECTIONS.curricula);
    const docs = await collection.find({}).toArray();
    return docs.map(toAppFormat<CurriculumTag>);
  } catch (error) {
    console.error('Error getting curricula:', error);
    return [];
  }
};

export const createCurriculumTag = async (
  tag: Omit<CurriculumTag, 'id'>
): Promise<string> => {
  try {
    const collection = await getCollection<CurriculumTag>(COLLECTIONS.curricula);
    const result = await collection.insertOne(tag as any);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error creating curriculum tag:', error);
    throw error;
  }
};

// ========== PROGRESS OPERATIONS ==========

export const getStudentProgress = async (
  studentId: string
): Promise<StudentProgress[]> => {
  try {
    const collection = await getCollection<StudentProgress>(
      COLLECTIONS.progress
    );
    const docs = await collection.find({ studentId }).toArray();

    return docs.map((doc) => {
      const progress = toAppFormat<StudentProgress>(doc);
      if (doc.lastPracticedAt)
        progress.lastPracticedAt = toDate(doc.lastPracticedAt);
      return progress;
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    return [];
  }
};

export const updateProgress = async (
  studentId: string,
  curriculumTagId: string,
  isCorrect: boolean
): Promise<void> => {
  try {
    const collection = await getCollection<StudentProgress>(
      COLLECTIONS.progress
    );
    const progressId = `${studentId}_${curriculumTagId}`;

    const existing = await collection.findOne({ _id: progressId } as any);

    if (existing) {
      const totalAttempts = (existing.totalAttempts || 0) + 1;
      const correctAttempts =
        (existing.correctAttempts || 0) + (isCorrect ? 1 : 0);
      const accuracy = correctAttempts / totalAttempts;

      let masteryLevel: StudentProgress['masteryLevel'] = 'beginner';
      if (accuracy >= 0.9 && totalAttempts >= 5) masteryLevel = 'mastered';
      else if (accuracy >= 0.75 && totalAttempts >= 3)
        masteryLevel = 'proficient';
      else if (accuracy >= 0.5) masteryLevel = 'developing';

      await collection.updateOne(
        { _id: progressId } as any,
        {
          $set: {
            totalAttempts,
            correctAttempts,
            masteryLevel,
            lastPracticedAt: new Date(),
          },
        }
      );
    } else {
      await collection.insertOne({
        _id: progressId,
        studentId,
        curriculumTagId,
        totalAttempts: 1,
        correctAttempts: isCorrect ? 1 : 0,
        masteryLevel: 'beginner' as const,
        lastPracticedAt: new Date(),
      } as any);
    }
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
};

