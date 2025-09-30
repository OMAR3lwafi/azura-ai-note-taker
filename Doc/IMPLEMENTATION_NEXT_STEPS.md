# Implementation Next Steps — Azora AI NoteTaker

**Date:** 2025-09-30  
**Status:** Backend 100%, Frontend 87%, Library Research ✅ Complete

---

## 🎯 Current State Analysis

### ✅ Already Implemented
- Supabase Edge Functions with Hono framework
- Authentication system (requireAuth middleware)
- Core endpoints (meetings, segments, auth/profile)
- STT webhook handler
- AI summarization
- Search endpoints (full-text + semantic)
- Export generation (MD/TXT/HTML)
- Integration push (Notion/Trello/To-Do)
- Speaker analytics
- Database schema with pgvector

### 📚 New Resources Available
- 8 comprehensive library implementation guides in `/PRPs-agentic-eng/PRPs/ai_docs/`
- Production-ready patterns for all critical libraries
- Best practices and gotchas documented

---

## 🚀 Immediate Actions (This Week)

### 1. Apply Rate Limiting Patterns ⚡ HIGH PRIORITY

**Goal:** Implement production-grade rate limiting using Upstash patterns

**Reference:** `PRPs-agentic-eng/PRPs/ai_docs/upstash_kv_patterns.md`

**Files to Create/Modify:**
```typescript
// supabase/functions/_shared/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Sliding window rate limiter (recommended)
export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 login attempts per minute
  analytics: true,
  prefix: '@azora/auth',
});

export const aiRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 AI calls per minute
  analytics: true,
  prefix: '@azora/ai',
});

export const meetingRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '60 s'), // 20 meeting operations per minute
  analytics: true,
  prefix: '@azora/meetings',
});
```

**Apply to Endpoints:**
```typescript
// In api/index.ts
import { aiRateLimit, meetingRateLimit } from '../_shared/rate-limit.ts';

// Before AI endpoint
app.post("/v1/ai/summarize", requireAuth, async (c) => {
  const userId = getUserId(c);
  const { success } = await aiRateLimit.limit(userId);
  
  if (!success) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  
  // ... existing summarization logic
});

// Before meeting creation
app.post("/v1/meetings", requireAuth, async (c) => {
  const userId = getUserId(c);
  const { success } = await meetingRateLimit.limit(userId);
  
  if (!success) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  
  // ... existing meeting creation logic
});
```

**Environment Variables:**
```bash
# Add to .env and Supabase secrets
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Estimated Time:** 2-3 hours

---

### 2. Enhance RLS Policies with Multi-Tenant Support 🔒

**Goal:** Implement organization-based sharing from production gaps

**Reference:** `PRPs-agentic-eng/PRPs/ai_docs/pgvector_rls_patterns.md`

**Migration to Create:**
```sql
-- supabase/migrations/20250930000001_multi_tenant.sql

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Organization memberships
CREATE TABLE org_memberships (
  org_id UUID REFERENCES organizations ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- Note shares
CREATE TABLE note_shares (
  meeting_id UUID REFERENCES meetings ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  role TEXT CHECK (role IN ('viewer', 'editor')) NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (meeting_id, user_id)
);

-- Add org_id to meetings
ALTER TABLE meetings ADD COLUMN org_id UUID REFERENCES organizations;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view orgs they're members of
CREATE POLICY "Users can view their org memberships"
  ON org_memberships FOR SELECT
  USING (user_id = auth.uid());

-- Policies: Enhanced meeting access
DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;

CREATE POLICY "Users can view accessible meetings"
  ON meetings FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = meetings.org_id
        AND om.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM note_shares ns
      WHERE ns.meeting_id = meetings.id
        AND ns.user_id = auth.uid()
    )
  );

-- Similar policies for INSERT/UPDATE/DELETE with role checks
```

**API Endpoints to Add:**
```typescript
// POST /v1/organizations
// POST /v1/organizations/:id/members
// POST /v1/meetings/:id/shares
// GET /v1/meetings/:id/shares
```

**Estimated Time:** 4-6 hours

---

### 3. Implement Distributed Locks for AI Summarization 🔐

**Goal:** Prevent concurrent summarization calls (debouncing)

**Reference:** `PRPs-agentic-eng/PRPs/ai_docs/upstash_kv_patterns.md` (Distributed Locks section)

**Update Existing AI Code:**
```typescript
// In _shared/ai.ts
import { Redis } from '@upstash/redis';

export async function summarizeWindow(userId: string, meetingId: string, windowSec?: number) {
  const redis = Redis.fromEnv();
  const lockKey = `lock:summarize:${meetingId}`;
  const lockValue = crypto.randomUUID();
  
  // Try to acquire lock (30 second expiry)
  const acquired = await redis.set(lockKey, lockValue, { ex: 30, nx: true });
  
  if (!acquired) {
    throw new Error('Summarization already in progress for this meeting');
  }
  
  try {
    // Existing summarization logic
    const summary = await generateSummaryLogic(meetingId, windowSec);
    
    // Cache the result for 5 minutes
    await redis.setex(`cache:summary:${meetingId}`, 300, JSON.stringify(summary));
    
    return summary;
  } finally {
    // Release lock (only if we still own it)
    const current = await redis.get(lockKey);
    if (current === lockValue) {
      await redis.del(lockKey);
    }
  }
}
```

**Estimated Time:** 1-2 hours

---

### 4. Optimize pgvector Indexes 📊

**Goal:** Ensure optimal vector search performance

**Reference:** `PRPs-agentic-eng/PRPs/ai_docs/pgvector_rls_patterns.md` (Index Optimization section)

**Migration to Run:**
```sql
-- supabase/migrations/20250930000002_optimize_indexes.sql

-- Check current row count
SELECT COUNT(*) FROM segments;

-- Adjust IVFFlat lists parameter based on row count
-- Formula: lists = sqrt(total_rows)
-- For 10K rows -> lists = 100
-- For 100K rows -> lists = 316

-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_segments_embedding;

-- Create optimized IVFFlat index
CREATE INDEX idx_segments_embedding ON segments 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100); -- Adjust based on your data size

-- Run ANALYZE to update planner statistics
ANALYZE segments;

-- Verify index usage
EXPLAIN ANALYZE
SELECT id, text, 1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM segments
WHERE meeting_id = 'YOUR_TEST_MEETING_ID'
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

**Estimated Time:** 1 hour

---

### 5. Add Arabic Search Improvements 🔍

**Goal:** Implement trigram-based Arabic search

**Reference:** `PRPs-agentic-eng/PRPs/ai_docs/pgvector_rls_patterns.md` (Arabic Search section)

**Already Have:** `text_search tsvector` column

**Enhancement Needed:**
```sql
-- supabase/migrations/20250930000003_arabic_search.sql

-- Add trigram index for fuzzy matching
CREATE INDEX idx_segments_text_trigram 
ON segments USING GIN (text gin_trgm_ops);

-- Create combined search function
CREATE OR REPLACE FUNCTION search_segments_arabic(
  p_user_id UUID,
  p_query TEXT,
  p_meeting_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  meeting_id UUID,
  text TEXT,
  rank REAL,
  similarity REAL
)
LANGUAGE SQL
AS $$
  SELECT 
    s.id,
    s.meeting_id,
    s.text,
    ts_rank(s.text_search, query) AS rank,
    similarity(s.text, p_query) AS similarity
  FROM segments s,
       to_tsquery('simple', unaccent(p_query)) AS query
  INNER JOIN meetings m ON m.id = s.meeting_id
  WHERE m.owner_id = p_user_id
    AND (p_meeting_id IS NULL OR s.meeting_id = p_meeting_id)
    AND (
      s.text_search @@ query OR
      s.text % p_query  -- Trigram similarity
    )
  ORDER BY 
    GREATEST(rank, similarity) DESC,
    s.start_ms ASC
  LIMIT p_limit;
$$;
```

**Update Search Endpoint:**
```typescript
// In _shared/search.ts
export async function combinedSearch(
  userId: string,
  query: string,
  options: { meetingId?: string; limit?: number }
) {
  const supa = adminClient();
  
  const { data, error } = await supa.rpc('search_segments_arabic', {
    p_user_id: userId,
    p_query: query,
    p_meeting_id: options.meetingId || null,
    p_limit: options.limit || 20,
  });
  
  if (error) throw new DatabaseError(error.message, error.code);
  
  return { results: data || [] };
}
```

**Estimated Time:** 2-3 hours

---

## 🎨 Frontend Enhancements (Next Week)

### 6. Implement React Query for Server State

**Goal:** Replace manual fetch logic with React Query patterns

**Reference:** `PRPs-agentic-eng/PRPs/ai_docs/react_tailwind_shadcn_patterns.md`

**Install Dependencies:**
```bash
cd Frontend
npm install @tanstack/react-query
```

**Setup Query Client:**
```typescript
// Frontend/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
```

**Create Custom Hooks:**
```typescript
// Frontend/src/hooks/useMeetings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meeting: { title: string; language: string }) => {
      const response = await fetch('/v1/meetings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meeting),
      });
      
      if (!response.ok) throw new Error('Failed to create meeting');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}
```

**Estimated Time:** 6-8 hours

---

### 7. Add Virtual Scrolling for Gallery

**Goal:** Optimize large meeting lists

**Reference:** `PRPs-agentic-eng/PRPs/ai_docs/react_tailwind_shadcn_patterns.md`

```bash
npm install @tanstack/react-virtual
```

```typescript
// Frontend/src/components/VirtualMeetingList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function VirtualMeetingList({ meetings }: { meetings: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: meetings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MeetingCard meeting={meetings[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Estimated Time:** 3-4 hours

---

## 📋 Updated TODO Priority

### Week 1 (NOW - High Impact)
1. ✅ Complete library research (DONE)
2. ⚡ **Add rate limiting** (2-3 hours) - Use `upstash_kv_patterns.md`
3. 🔒 **Implement distributed locks for AI** (1-2 hours)
4. 📊 **Optimize pgvector indexes** (1 hour)
5. 🔍 **Enhance Arabic search** (2-3 hours)

**Total: 6-9 hours of backend work**

### Week 2 (Frontend Polish)
6. 🎨 **React Query integration** (6-8 hours)
7. 📜 **Virtual scrolling** (3-4 hours)
8. 🔐 **Multi-tenant RLS** (4-6 hours)
9. ✅ **Testing infrastructure** (start with unit tests)

---

## 🛠 Quick Start Commands

### Apply New Patterns Now

```bash
# 1. Install Upstash Redis dependencies
cd supabase/functions
deno cache --reload https://deno.land/x/upstash_redis/mod.ts
deno cache --reload https://esm.sh/@upstash/ratelimit@1

# 2. Add environment variables to Supabase
supabase secrets set UPSTASH_REDIS_REST_URL="your_url"
supabase secrets set UPSTASH_REDIS_REST_TOKEN="your_token"

# 3. Create new rate-limit module
cat > supabase/functions/_shared/rate-limit.ts << 'EOF'
// Copy rate limiting code from above
EOF

# 4. Run new migrations
supabase migration new multi_tenant
supabase migration new optimize_indexes
supabase migration new arabic_search

# 5. Apply migrations locally
supabase db reset

# 6. Test locally
supabase functions serve

# 7. Deploy when ready
supabase functions deploy api
supabase db push
```

---

## 📚 Reference Quick Links

All patterns available in `/PRPs-agentic-eng/PRPs/ai_docs/`:

1. **supabase_hono_patterns.md** - Edge Functions best practices
2. **pgvector_rls_patterns.md** - Database & security
3. **upstash_kv_patterns.md** - Rate limiting & caching
4. **stt_llm_integration_patterns.md** - AI integrations
5. **react_tailwind_shadcn_patterns.md** - Frontend setup
6. **README.md** - Master guide with quick reference

---

## ✅ Success Criteria

**This Week:**
- [ ] Rate limiting active on all endpoints
- [ ] AI summarization uses distributed locks
- [ ] pgvector indexes optimized
- [ ] Arabic search improved with trigrams
- [ ] Performance metrics show <1s P95 for most endpoints

**Next Week:**
- [ ] React Query managing all server state
- [ ] Gallery uses virtual scrolling
- [ ] Multi-tenant sharing enabled
- [ ] 50+ unit tests passing
- [ ] CI/CD pipeline deployed

---

**Last Updated:** 2025-09-30  
**Next Review:** Daily standup at 9am
