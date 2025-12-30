# LearnLoop - Question Generation & Practice Platform

A comprehensive Next.js application for generating, reviewing, and practicing educational questions.

## Features

### 1. Admin/Internal Section
- Create and manage question templates
- Define variations and answer functions
- Generate unique question instances

### 2. Reviewer Section
- Validate questions (human/AI/API)
- Cascading deletion: questions → variations → templates
- Quality assurance workflow

### 3. Student Section
- Generate practice tests
- Track attempts (never show same question twice)
- Adaptive learning based on performance
- Comprehensive question bank for Math & English (Year 6 UK equivalent)

## Curriculum Management
- Internal curriculum tagging
- Mapping to UK, US, India, and other countries' curricula

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Run development server:
```bash
npm run dev
```

## Tech Stack
- Next.js 14
- TypeScript
- Firebase (Firestore & Auth)
- Tailwind CSS
- Lucide React Icons

