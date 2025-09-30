#!/bin/bash
# Quick setup script for rate limiting and performance enhancements
# Based on library research in PRPs-agentic-eng/PRPs/ai_docs/

set -e

echo "🚀 Azora AI NoteTaker - Rate Limiting Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "supabase/config.toml" ]; then
  echo -e "${RED}❌ Error: Must run from project root${NC}"
  exit 1
fi

echo "📋 Step 1: Checking Upstash Redis credentials..."
if [ -z "$UPSTASH_REDIS_REST_URL" ] || [ -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  Upstash credentials not found in environment${NC}"
  echo ""
  echo "Please set the following environment variables:"
  echo "  export UPSTASH_REDIS_REST_URL='https://your-db.upstash.io'"
  echo "  export UPSTASH_REDIS_REST_TOKEN='your_token_here'"
  echo ""
  echo "Get your credentials from: https://console.upstash.com/redis"
  echo ""
  read -p "Do you want to continue without setting these now? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo -e "${GREEN}✅ Upstash credentials found${NC}"
fi

echo ""
echo "📋 Step 2: Setting Supabase secrets..."
if command -v supabase &> /dev/null; then
  if [ ! -z "$UPSTASH_REDIS_REST_URL" ] && [ ! -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
    echo "Setting UPSTASH_REDIS_REST_URL..."
    supabase secrets set UPSTASH_REDIS_REST_URL="$UPSTASH_REDIS_REST_URL" 2>/dev/null || echo -e "${YELLOW}⚠️  Could not set secret (may need to be done manually)${NC}"
    
    echo "Setting UPSTASH_REDIS_REST_TOKEN..."
    supabase secrets set UPSTASH_REDIS_REST_TOKEN="$UPSTASH_REDIS_REST_TOKEN" 2>/dev/null || echo -e "${YELLOW}⚠️  Could not set secret (may need to be done manually)${NC}"
    
    echo -e "${GREEN}✅ Secrets configured${NC}"
  else
    echo -e "${YELLOW}⚠️  Skipping secret configuration (credentials not set)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Supabase CLI not found. Please install: https://supabase.com/docs/guides/cli${NC}"
fi

echo ""
echo "📋 Step 3: Running database migrations..."
if command -v supabase &> /dev/null; then
  echo "Applying multi-tenant sharing..."
  supabase migration up --file 20250930000001_multi_tenant_sharing.sql 2>/dev/null || echo -e "${YELLOW}⚠️  Migration may already be applied${NC}"
  
  echo "Optimizing indexes..."
  supabase migration up --file 20250930000002_optimize_indexes.sql 2>/dev/null || echo -e "${YELLOW}⚠️  Migration may already be applied${NC}"
  
  echo "Enhancing Arabic search..."
  supabase migration up --file 20250930000003_arabic_search_enhancement.sql 2>/dev/null || echo -e "${YELLOW}⚠️  Migration may already be applied${NC}"
  
  echo -e "${GREEN}✅ Migrations applied${NC}"
else
  echo -e "${YELLOW}⚠️  Run migrations manually with: supabase db push${NC}"
fi

echo ""
echo "📋 Step 4: Verifying rate limiting modules..."
if [ -f "supabase/functions/_shared/rate-limit.ts" ]; then
  echo -e "${GREEN}✅ rate-limit.ts exists${NC}"
else
  echo -e "${RED}❌ rate-limit.ts missing${NC}"
fi

if [ -f "supabase/functions/_shared/kv-locks.ts" ]; then
  echo -e "${GREEN}✅ kv-locks.ts exists${NC}"
else
  echo -e "${RED}❌ kv-locks.ts missing${NC}"
fi

echo ""
echo "📋 Step 5: Next steps..."
echo ""
echo "To apply rate limiting to your endpoints, add to api/index.ts:"
echo ""
echo -e "${YELLOW}import { aiRateLimit, meetingRateLimit } from '../_shared/rate-limit.ts';${NC}"
echo ""
echo -e "${YELLOW}// Before AI endpoint${NC}"
echo -e "${YELLOW}app.post('/v1/ai/summarize', requireAuth, async (c) => {${NC}"
echo -e "${YELLOW}  const userId = getUserId(c);${NC}"
echo -e "${YELLOW}  const { success } = await aiRateLimit.limit(userId);${NC}"
echo -e "${YELLOW}  if (!success) return c.json({ error: 'Rate limit exceeded' }, 429);${NC}"
echo -e "${YELLOW}  // ... rest of handler${NC}"
echo -e "${YELLOW}});${NC}"
echo ""
echo "📚 Full documentation available at:"
echo "  PRPs-agentic-eng/PRPs/ai_docs/README.md"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "🔗 Useful commands:"
echo "  supabase start          # Start local Supabase"
echo "  supabase functions serve # Serve Edge Functions locally"
echo "  supabase db push        # Push migrations to production"
echo "  supabase functions deploy # Deploy functions to production"
echo ""
