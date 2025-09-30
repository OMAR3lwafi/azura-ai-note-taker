# Installation Guide - Azora AI NoteTaker

## Prerequisites

### Required Software
- **Node.js:** 20.x or higher
- **Deno:** 1.x or higher
- **Supabase CLI:** Latest version
- **Git:** For version control

### Accounts Needed
- **Supabase:** For backend and database
- **Sentry:** For error tracking (optional but recommended)
- **Vercel:** For frontend deployment (optional)
- **OpenAI/Anthropic:** For AI features
- **Deepgram/AssemblyAI:** For speech-to-text
- **Upstash:** For Redis/KV storage

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/azora-ai-note-taker.git
cd azora-ai-note-taker
```

### 2. Install Dependencies

**Frontend:**
```bash
cd Frontend
npm install

# Install Sentry SDK
npm install @sentry/react

# Install Testing Dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui jsdom

# Install E2E Testing
npm install -D @playwright/test
npx playwright install
```

**Backend:**
```bash
# Deno uses import maps, no installation needed
# Dependencies are fetched on first run
```

**Root (for E2E tests):**
```bash
npm install
```

### 3. Setup Supabase

**Install Supabase CLI:**
```bash
# macOS
brew install supabase/tap/supabase

# Windows/Linux
npm install -g supabase
```

**Start Supabase:**
```bash
supabase start
```

This will start:
- Postgres database on `localhost:54322`
- Studio UI on `http://localhost:54323`
- API on `http://localhost:54321`
- Inbucket (email testing) on `http://localhost:54324`

**Apply Migrations:**
```bash
supabase db reset
```

### 4. Configure Environment Variables

**Frontend (.env):**
```bash
cd Frontend
cp ../.env.example .env
```

Edit `.env` with your values:
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
VITE_SENTRY_DSN=your-frontend-sentry-dsn
```

**Backend (Supabase Secrets):**

For local development, create `.env` in root:
```bash
cp .env.example .env
```

Set secrets for production:
```bash
supabase secrets set LLM_API_KEY=your-openai-key
supabase secrets set STT_API_KEY=your-deepgram-key
supabase secrets set SENTRY_DSN=your-backend-sentry-dsn
supabase secrets set UPSTASH_REDIS_REST_URL=your-redis-url
supabase secrets set UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 5. Setup Sentry (Optional but Recommended)

Follow the detailed guide in `Doc/SENTRY_SETUP.md`:

1. Create Sentry account at https://sentry.io
2. Create two projects:
   - `azora-ai-notetaker-frontend` (React)
   - `azora-ai-notetaker-backend` (Node)
3. Copy DSNs to your `.env` files
4. Install SDKs (already done in step 2)

### 6. Start Development Servers

**Terminal 1 - Supabase:**
```bash
supabase start
```

**Terminal 2 - Backend (Edge Functions):**
```bash
supabase functions serve --env-file .env
```

**Terminal 3 - Frontend:**
```bash
cd Frontend
npm run dev
```

The app will be available at `http://localhost:5173`

## Running Tests

### Unit Tests

**Frontend:**
```bash
cd Frontend
npm test
```

**Backend:**
```bash
cd supabase/functions
deno test --allow-all
```

### E2E Tests

```bash
npm run test:e2e
```

### With Coverage

```bash
cd Frontend
npm run test:ci
```

## Building for Production

### Frontend

```bash
cd Frontend
npm run build
```

The build output will be in `Frontend/dist/`

### Backend

Backend Edge Functions are deployed via Supabase CLI (see Deployment section).

## Deployment

### Frontend to Vercel

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Link Project:**
```bash
cd Frontend
vercel link
```

3. **Deploy:**
```bash
vercel --prod
```

Or use GitHub Actions (see `.github/workflows/deploy-frontend.yml`)

### Backend to Supabase

1. **Create Supabase Project:**
   - Go to https://supabase.com/dashboard
   - Create new project
   - Note your project ref ID

2. **Link Project:**
```bash
supabase link --project-ref your-project-ref
```

3. **Deploy Functions:**
```bash
supabase functions deploy api
```

4. **Apply Migrations:**
```bash
supabase db push
```

Or use GitHub Actions (see `.github/workflows/deploy-backend.yml`)

## Troubleshooting

### Supabase Won't Start

**Issue:** Port already in use

**Solution:**
```bash
supabase stop
supabase start
```

### Frontend Build Fails

**Issue:** TypeScript errors

**Solution:**
```bash
cd Frontend
npm run type-check
# Fix reported errors
```

### Backend Function Errors

**Issue:** Import errors or missing dependencies

**Solution:**
```bash
# Clear Deno cache
deno cache --reload supabase/functions/api/index.ts
```

### Database Migration Issues

**Issue:** Migration fails or conflicts

**Solution:**
```bash
# Reset database (WARNING: loses data)
supabase db reset

# Or create new migration
supabase migration new fix_issue
```

### Tests Failing

**Issue:** Tests timeout or fail

**Solution:**
```bash
# Clear test cache
rm -rf node_modules/.vite
npm test -- --no-cache
```

## Next Steps

After successful installation:

1. ✅ Review `TODO.md` for implementation status
2. ✅ Check `Doc/LINEAR_ISSUES.md` for planned features
3. ✅ Read `Doc/SENTRY_SETUP.md` for monitoring setup
4. ✅ Review `DEPLOYMENT_GUIDE.md` for production deployment
5. ✅ Set up CI/CD pipeline (see `.github/workflows/`)

## Development Workflow

1. **Create Feature Branch:**
```bash
git checkout -b feature/your-feature
```

2. **Make Changes and Test:**
```bash
npm test
npm run lint
npm run type-check
```

3. **Commit with Conventional Commits:**
```bash
git commit -m "feat: add new feature"
```

4. **Push and Create PR:**
```bash
git push origin feature/your-feature
```

## Resources

- **Documentation:** See `Doc/` directory
- **API Reference:** `Doc/ADVANCED_FEATURES.md`
- **Architecture:** `Doc/DESIGN_SYSTEM.md`
- **Linear Board:** https://linear.app/omar3lwafi
- **Sentry Dashboard:** https://waqietv.sentry.io

## Support

For issues or questions:
- Check `IMPLEMENTATION_STATUS.md` for current state
- Review `FINAL_SUMMARY.md` for completed features
- Create issue in Linear
- Contact: omar@example.com

---

**Last Updated:** 2025-09-30
**Version:** 1.0.0
