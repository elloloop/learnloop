# LearnLoop Setup Guide

## Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with Firestore enabled
- Gemini API key (for AI features)

## Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase and Gemini API credentials:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_GEMINI_API_KEY`

3. **Firebase Firestore Setup:**
The app uses the following collections structure:
```
artifacts/{APP_ID}/public/data/
  - templates
  - variations
  - questions
  - reviews
  - attempts
  - sessions
  - curricula
  - progress
```

Firestore security rules should allow authenticated users to read/write (adjust based on your needs).

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to `http://localhost:3000`

## Application Structure

### Three Main Portals

1. **Admin Portal** (`/admin`)
   - Create and manage question templates
   - Generate question variations
   - Generate unique question instances
   - Manage curriculum tags

2. **Reviewer Portal** (`/reviewer`)
   - Review pending questions
   - Approve or reject questions
   - AI-powered evaluation
   - Cascading deletion (questions → variations → templates)

3. **Student Portal** (`/student`)
   - Generate practice tests
   - Answer questions
   - Track progress
   - Adaptive learning based on performance

## Key Features

### Question Generation
- **Local Generation**: Uses JavaScript functions for deterministic answers
- **AI Generation**: Uses Gemini API for complex questions without answer functions
- **Variations**: Multiple phrasings of the same question template

### Cascading Deletion
When a question is rejected:
1. Question is deleted
2. If all questions from a variation are rejected → variation is deleted
3. If all variations are rejected → template is deleted

### Student Practice
- Never shows the same exact question twice
- Tracks attempts per question
- Adaptive learning prioritizes weak areas
- Progress tracking by curriculum tag

### Curriculum Management
- Internal curriculum tagging
- Mapping to UK, US, and India curricula
- Extensible for other countries

## API Routes

### Admin APIs
- `GET /api/admin/templates` - List templates
- `POST /api/admin/templates` - Create template
- `PUT /api/admin/templates` - Update template
- `DELETE /api/admin/templates` - Delete template
- `POST /api/admin/templates/[id]/generate` - Generate questions
- `POST /api/admin/templates/generate-structure` - AI template generation

### Reviewer APIs
- `GET /api/reviewer/questions` - List questions to review
- `POST /api/reviewer/questions` - Submit review
- `POST /api/reviewer/questions/[id]/evaluate` - AI evaluation

### Student APIs
- `POST /api/student/test/generate` - Generate practice test
- `POST /api/student/attempt` - Submit answer

### Curriculum APIs
- `GET /api/curriculum` - List curriculum tags
- `POST /api/curriculum` - Create curriculum tag

## Development Notes

- The app uses Firebase anonymous authentication by default
- For production, implement proper user roles and permissions
- Firestore indexes may be needed for complex queries
- Consider adding rate limiting for AI API calls

## Next Steps

1. Set up proper user authentication and roles
2. Add Firestore security rules
3. Implement user management UI
4. Add analytics and reporting
5. Set up production deployment

