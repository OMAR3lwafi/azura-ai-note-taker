# Azora Backend (Supabase Edge)

This backend follows the PRD and backend rules. Phase 1.1.1 foundation is scaffolded:
- Supabase migrations for `profiles` + RLS and storage buckets (`audio`, `exports`).
- Edge Function `api` (Deno + Hono) with CORS, request-id logging, and `GET/PUT /auth/profile` protected by Supabase JWT.
- Deno tasks for local serving.

## Quick Start
1) Install Supabase CLI and Deno.
2) Copy `.env.example` to `.env.local` and fill `SUPABASE_URL`, keys, and `CORS_ORIGIN`.
3) Start local stack:
```bash
supabase start
supabase db reset   # applies migrations in supabase/migrations
```
4) Serve Edge Functions locally:
```bash
deno task dev:functions
```
5) Test health and profile:
```bash
# Health
curl http://localhost:54321/functions/v1/api/health
# Profile (requires Authorization: Bearer <supabase_jwt>)
curl -H "Authorization: Bearer <JWT>" http://localhost:54321/functions/v1/api/auth/profile
```

## Advanced Features Implemented

This backend now includes comprehensive advanced features from Units 1.2 and 1.3:

### Unit 1.2: Core Business Logic
- ✅ Full meetings/segments CRUD with ownership verification
- ✅ AI summarization with speaker context and retry logic
- ✅ Topic detection (silence-based and keyword-based)
- ✅ Speaker analytics (talk-time, segment counts)
- ✅ STT webhook ingestion with provider normalization
- ✅ Offline audio ingest pipeline

### Unit 1.3: Advanced Features & Integrations
- ✅ **Search**: Full-text (Arabic-optimized), trigram fuzzy, semantic (embeddings)
- ✅ **Exports**: Markdown, TXT, HTML generation with signed URLs
- ✅ **Integrations**: Notion, Trello, MS To-Do push with idempotency
- ✅ **Advanced Auth**: API keys (scoped), 2FA (TOTP), device tracking
- ✅ **AI Enhancements**: Speaker-aware prompts, exponential backoff retries

### New Endpoints

**Search & Analytics:**
- `GET /v1/search` - Combined full-text + trigram search
- `GET /v1/search/semantic` - Vector-based semantic search
- `GET /v1/meetings/:id/speakers` - Speaker analytics
- `PUT /v1/meetings/:id/speakers/:label` - Update speaker names
- `GET /v1/meetings/:id/topics` - Topic break detection

**Exports:**
- `POST /v1/export` - Generate exports (markdown/txt/html)
- `GET /v1/assets/:id/signed-url` - Download assets

**Integrations:**
- `POST /v1/integrations/:provider/push` - Push to Notion/Trello/To-Do
- `PUT /v1/integrations/:provider/config` - Save integration credentials

**Advanced Auth:**
- `POST /v1/auth/api-keys` - Generate scoped API keys
- Device tracking via headers (X-Device-ID, X-Platform)

**Maintenance:**
- `POST /v1/admin/embeddings/backfill` - Backfill embeddings
- `POST /v1/meetings/:id/ingest` - Offline audio ingest

### Database Functions

- `calculate_talk_time(meeting_id)` - Speaker talk-time aggregation
- `search_segments_semantic(...)` - pgvector kNN search
- `search_segments_trigram(...)` - Trigram similarity search

See `Doc/ADVANCED_FEATURES.md` for detailed documentation.

## Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
# Core
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI/ML
LLM_PROVIDER=openai
LLM_API_KEY=your-openai-key
EMBEDDING_MODEL=text-embedding-3-small

# Security
TOTP_SECRET_KEY=your-totp-encryption-key

# Optional Integrations
NOTION_CLIENT_ID=...
TRELLO_API_KEY=...
```

## Migrations

Apply all migrations including advanced features:

```bash
supabase db reset
```

This will apply:
1. `20240101000001_init.sql` - Profiles, storage buckets
2. `20240101000002_auth_audit.sql` - Auth audit logging
3. `20240101000003_core.sql` - Meetings, segments, speakers, tasks, assets
4. `20240101000004_advanced_features.sql` - API keys, integrations, RPC functions

## Next Phases
- Unit 1.1.2: Email OTP templates, OAuth, device management UI
- Unit 2.x: Frontend implementation (React + Tailwind + ShadCN)
- Unit 3.x: DevOps, testing, CI/CD, monitoring
