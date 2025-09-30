# Dependencies Installation Guide

## Quick Install Commands

### Frontend Dependencies

**Core Dependencies (Already in package.json):**
```bash
cd Frontend
npm install
```

**Additional Required Dependencies:**
```bash
# Sentry for error tracking
npm install @sentry/react

# Testing libraries
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @playwright/test

# Install Playwright browsers
npx playwright install
```

**Optional Development Tools:**
```bash
# Bundle analyzer
npm install -D vite-bundle-visualizer

# React import optimization
npm install -D react

# TypeScript for path aliases
npm install -D @types/node
```

### Backend Dependencies

Deno uses import maps - no npm install needed. Dependencies are fetched automatically on first run.

**Verify Deno Installation:**
```bash
deno --version
```

**Cache Backend Dependencies:**
```bash
cd supabase/functions
deno cache --reload api/index.ts
```

### Root Dependencies (E2E Tests)

```bash
# At project root
npm install
npm install -D @playwright/test
npx playwright install
```

## Complete Setup Script

Save this as `setup.sh` and run with `bash setup.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up Azora AI NoteTaker..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v deno >/dev/null 2>&1 || { echo "❌ Deno is required but not installed. Aborting." >&2; exit 1; }
command -v supabase >/dev/null 2>&1 || { echo "❌ Supabase CLI is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"

# Frontend setup
echo "📦 Installing frontend dependencies..."
cd Frontend
npm install

echo "📦 Installing Sentry..."
npm install @sentry/react

echo "🧪 Installing testing dependencies..."
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

echo "🎭 Installing Playwright..."
npm install -D @playwright/test
npx playwright install

cd ..

# Root setup
echo "📦 Installing root dependencies..."
npm install

# Backend setup
echo "🦕 Caching Deno dependencies..."
cd supabase/functions
deno cache --reload api/index.ts
cd ../..

# Environment setup
echo "⚙️  Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file - please update with your values"
fi

if [ ! -f Frontend/.env ]; then
    cp .env.example Frontend/.env
    echo "✅ Created Frontend/.env file - please update with your values"
fi

# Supabase setup
echo "🗄️  Starting Supabase..."
supabase start

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env files with your API keys"
echo "2. Create Sentry projects and add DSNs"
echo "3. Run 'supabase db reset' to apply migrations"
echo "4. Start development:"
echo "   Terminal 1: supabase functions serve --env-file .env"
echo "   Terminal 2: cd Frontend && npm run dev"
echo ""
echo "📚 See INSTALLATION_GUIDE.md for detailed instructions"
```

## Verify Installation

### Check All Dependencies

```bash
# Frontend
cd Frontend
npm list @sentry/react
npm list vitest
npm list @playwright/test

# Check for missing peer dependencies
npm list --depth=0

# Backend
cd ../supabase/functions
deno cache --check api/index.ts

# Root
cd ../..
npm list @playwright/test
```

### Run Tests to Verify

```bash
# Frontend unit tests
cd Frontend
npm test -- --run

# E2E tests
cd ..
npm run test:e2e

# Backend tests
cd supabase/functions
deno test --allow-all
```

## Troubleshooting

### "Module not found" Errors

**Issue:** Missing dependencies after clone

**Solution:**
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
rm -rf Frontend/node_modules Frontend/package-lock.json
npm install
cd Frontend && npm install
```

### Playwright Installation Issues

**Issue:** Playwright browsers won't install

**Solution:**
```bash
# Install system dependencies (Linux)
npx playwright install-deps

# Or install specific browser
npx playwright install chromium
```

### Deno Cache Issues

**Issue:** Import errors or outdated cache

**Solution:**
```bash
# Clear and reload cache
deno cache --reload --lock-write supabase/functions/api/index.ts
```

### TypeScript Errors in Tests

**Issue:** Type errors in test files

**Solution:**
```bash
# Install missing type definitions
npm install -D @types/node
npm install -D @types/react @types/react-dom
```

### Vitest Won't Run

**Issue:** `vitest: command not found`

**Solution:**
```bash
# Install as dev dependency
npm install -D vitest

# Or run with npx
npx vitest
```

## Package Versions

Current tested versions (as of 2025-09-30):

```json
{
  "node": "20.x",
  "deno": "1.x",
  "react": "^18.3.1",
  "@sentry/react": "^7.x",
  "vitest": "^1.x",
  "@playwright/test": "^1.40.x",
  "vite": "^6.3.5"
}
```

## Optional Dependencies

### For Development

```bash
# Husky for git hooks (if not installed)
npm install -D husky

# Commitlint for conventional commits
npm install -D @commitlint/cli @commitlint/config-conventional

# Renovate for dependency updates (GitHub App)
# Install from: https://github.com/apps/renovate
```

### For Production

```bash
# Vercel CLI for deployment
npm install -g vercel

# Supabase CLI (already required)
npm install -g supabase
```

## Updates and Maintenance

### Update All Dependencies

```bash
# Check for updates
npm outdated

# Update safely
npm update

# Update to latest (use with caution)
npm install <package>@latest
```

### Security Audit

```bash
# Run security audit
npm audit

# Fix automatically if possible
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force
```

---

**Last Updated:** 2025-09-30
**Node Version:** 20.x
**Deno Version:** 1.x
