# Secrets Management Setup

## Overview

This project uses:
- **GitHub Secrets** for production/deployment (via GitHub Actions, Vercel, etc.)
- **`.env.local`** for local development (gitignored)

## Local Development

### Setup `.env.local`

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local`:
   ```env
   MONGODB_URI=mongodb://backend:password@host:port/database?...
   MONGODB_DB_NAME=learnloop
   # ... other variables
   ```

3. `.env.local` is automatically gitignored (in `.gitignore`)

### Required Variables

- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name (default: `learnloop`)
- `NEXT_PUBLIC_AI_PROVIDER` - AI provider (gemini/openai/anthropic)
- `NEXT_PUBLIC_GEMINI_API_KEY` - Gemini API key (if using Gemini)
- `NEXT_PUBLIC_OPENAI_API_KEY` - OpenAI API key (if using OpenAI)
- `NEXT_PUBLIC_FIREBASE_*` - Firebase config for authentication

## Production (GitHub Secrets)

### View Secrets

```bash
gh secret list
```

### Set Secrets

```bash
# MongoDB
gh secret set MONGODB_URI --body "mongodb://..."

# Database name
gh secret set MONGODB_DB_NAME --body "learnloop"

# AI Provider
gh secret set NEXT_PUBLIC_AI_PROVIDER --body "gemini"

# API Keys
gh secret set NEXT_PUBLIC_GEMINI_API_KEY --body "your_key"
gh secret set NEXT_PUBLIC_OPENAI_API_KEY --body "your_key"

# Firebase
gh secret set NEXT_PUBLIC_FIREBASE_API_KEY --body "your_key"
gh secret set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --body "your_domain"
gh secret set NEXT_PUBLIC_FIREBASE_PROJECT_ID --body "your_project_id"
gh secret set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --body "your_bucket"
gh secret set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --body "your_sender_id"
gh secret set NEXT_PUBLIC_FIREBASE_APP_ID --body "your_app_id"
```

### Delete Secrets

```bash
gh secret delete SECRET_NAME
```

## Deployment Platforms

### Vercel

Vercel automatically reads GitHub Secrets. Just set them in GitHub and they'll be available in Vercel.

### Other Platforms

Most platforms support environment variables. Set them in the platform's dashboard or use their CLI.

## Security Best Practices

1. ✅ **Never commit `.env.local`** - Already in `.gitignore`
2. ✅ **Use GitHub Secrets for production** - Set via `gh secret set`
3. ✅ **Use `.env.example` as template** - Shows required variables without values
4. ✅ **Rotate secrets regularly** - Update both local and GitHub Secrets
5. ✅ **Use different credentials for dev/prod** - Separate MongoDB instances if possible

## Current Secrets Status

Check what secrets are set:

```bash
gh secret list
```

## Troubleshooting

### Local: Variables not loading

1. Check `.env.local` exists
2. Restart dev server: `npm run dev`
3. Verify variable names match exactly

### Production: Secrets not available

1. Check secrets are set: `gh secret list`
2. Verify deployment platform has access to GitHub Secrets
3. Check secret names match exactly (case-sensitive)

### Connection Issues

- MongoDB: Check `MONGODB_URI` format and credentials
- Firebase: Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
- AI: Ensure API key matches selected provider

