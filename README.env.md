# Environment Variables Setup Guide

This guide explains how to set up environment variables for local development and deployment.

## 📋 Quick Start (Local Development)

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your actual values:**
   ```bash
   SPRING_AI_GOOGLE_GENAI_API_KEY=your-actual-api-key
   SPRING_AI_GOOGLE_GENAI_PROJECT_ID=not-used-api-key-mode
   ```

3. **Get your Google GenAI API Key:**
   - Visit: https://aistudio.google.com/app/apikey
   - Create a new API key
   - Copy and paste it into your `.env` file

## 🗂️ Environment Files Overview

| File | Purpose | Committed to Git? |
|------|---------|-------------------|
| `.env.example` | Template for team members | ✅ Yes |
| `.env` | Local development secrets | ❌ No (in .gitignore) |
| `front/.env.example` | Frontend template | ✅ Yes |
| `front/.env.development` | Frontend dev config | ❌ No (in .gitignore) |
| `front/.env.production` | Frontend prod config | ❌ No (in .gitignore) |

## 🔐 Security Best Practices

### ✅ DO:
- Use `.env.example` to document required variables
- Keep actual API keys in `.env` (not committed)
- Use Railway dashboard for production secrets
- Share non-sensitive defaults in `.env.example`

### ❌ DON'T:
- Commit `.env` files with real API keys
- Share API keys in chat/email
- Hard-code secrets in source code

## 🚀 Deployment (Railway)

For production deployment on Railway:

1. **Go to Railway Dashboard** → Your Project → Service
2. **Click "Variables" tab**
3. **Add the following variables:**
   ```
   SPRING_AI_GOOGLE_GENAI_API_KEY=<your-production-api-key>
   SPRING_AI_GOOGLE_GENAI_PROJECT_ID=not-used-api-key-mode
   ```

## 📝 Required Environment Variables

### Resource Server (Backend)

| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_AI_GOOGLE_GENAI_API_KEY` | Google GenAI API Key | `AIzaSy...` |
| `SPRING_AI_GOOGLE_GENAI_PROJECT_ID` | GCP Project ID (dummy for API Key mode) | `not-used-api-key-mode` |

### Auth0 (Authentication)

| Variable | Description | Example |
|----------|-------------|---------|
| `OAUTH2_CLIENT_ID` | Auth0 Client ID | `Noff...` |
| `OAUTH2_CLIENT_SECRET` | Auth0 Client Secret | `C_XP...` |
| `OAUTH2_ISSUER_URI` | Auth0 Issuer URI | `https://...` |
| `OAUTH2_AUDIENCE` | Auth0 Audience (API Identifier) | `todo-app-api` |

### Server URLs

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_FRONT_URL` | Frontend URL (Browser access) | `http://localhost:5173` |
| `APP_API_URL` | Backend API URL (Public) | `https://localhost` |

### Frontend

Frontend environment variables are in `front/.env.development` and `front/.env.production`:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BFF_API_BASE_URL` | BFF server URL | `https://localhost/bff` |

## 🆘 Troubleshooting

### "Google GenAI project-id must be set!" error
- Make sure `.env` file exists in the project root
- Verify `SPRING_AI_GOOGLE_GENAI_PROJECT_ID` is set
- Restart Docker containers: `docker compose down && docker compose up -d`

### API Key not working
- Check if the API key is valid at https://aistudio.google.com/app/apikey
- Ensure there are no extra spaces in the `.env` file
- Verify the key starts with `AIzaSy`

## 🔄 Updating Environment Variables

After changing `.env`:

```bash
# Restart Docker containers
docker compose down
docker compose up -d --build
```

## 👥 Team Onboarding

When a new team member joins:

1. Clone the repository
2. **Backend setup:**
   ```bash
   cp .env.example .env
   # Edit .env and add your API key
   ```
3. **Frontend setup:**
   ```bash
   cp front/.env.example front/.env.development
   # Default values should work for local development
   ```
4. Ask team lead for API keys (via secure channel)
5. Update `.env` with actual values
6. Run: `docker compose up -d`

---

**Note:** Never commit `.env` files with real secrets. Always use `.env.example` as a template.
