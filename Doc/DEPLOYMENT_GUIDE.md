# Azora AI NoteTaker - Deployment Guide

## Prerequisites

- **Docker Desktop**: Required for Supabase local development
  - Download: https://docs.docker.com/desktop/
  - Ensure Docker daemon is running before proceeding

- **Deno**: For Edge Functions
  ```bash
  curl -fsSL https://deno.land/x/install/install.sh | sh
  ```

- **Supabase CLI**: For database migrations
  ```bash
  brew install supabase/tap/supabase
  ```

- **Node.js**: For frontend development (v20+)

---

## Step 1: Start Docker Desktop

1. Open Docker Desktop application
2. Wait for Docker daemon to start (icon will show "running")
3. Verify Docker is running:
   ```bash
   docker ps
   ```

---

## Step 2: Initialize Supabase

From the project root:

```bash
cd /Users/omar/azura-ai-note-taker

# Start Supabase local stack
supabase start

# This will:
# - Start Postgres, PostgREST, GoTrue, Storage, and other services
# - Output connection details and API keys
# - Usually takes 1-2 minutes on first run
```

**Save the output!** It contains important credentials:
- API URL
- anon key
- service_role key

---

## Step 3: Apply Database Migrations

After Supabase starts successfully:

```bash
# Apply all migrations
supabase db reset

# This will apply in order:
# 1. 20240101000001_init.sql - Profiles, storage buckets
# 2. 20240101000002_auth_audit.sql - Auth audit logging
# 3. 20240101000003_core.sql - Meetings, segments, speakers, tasks, assets
# 4. 20240101000004_advanced_features.sql - API keys, integrations, RPC functions
```

---

## Step 4: Configure Environment Variables

### Backend (.env.local in root)

Already configured, but verify:

```bash
cat .env.local
```

Should contain:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LLM_API_KEY` (for OpenAI)
- `EMBEDDING_API_KEY`
- `TOTP_SECRET_KEY`

### Frontend (Frontend/.env.local)

```bash
cat Frontend/.env.local
```

Should contain:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Step 5: Start Backend (Edge Functions)

In a new terminal:

```bash
cd /Users/omar/azura-ai-note-taker

# Start Edge Functions locally
deno task dev:functions

# Or using Supabase CLI:
supabase functions serve

# Backend will be available at:
# http://localhost:54321/functions/v1/api
```

**Test the backend:**
```bash
curl http://localhost:54321/functions/v1/api/health
```

Expected response:
```json
{"ok":true,"request_id":"..."}
```

---

## Step 6: Start Frontend

In another new terminal:

```bash
cd /Users/omar/azura-ai-note-taker/Frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Frontend will be available at:
# http://localhost:5173
```

---

## Verification Checklist

### Backend API Endpoints

Test each endpoint category:

```bash
# Health check
curl http://localhost:54321/functions/v1/api/health

# Auth (requires JWT token)
curl -H "Authorization: Bearer <YOUR_JWT>" \
  http://localhost:54321/functions/v1/api/auth/profile

# Meetings (requires JWT)
curl -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"title":"Test Meeting","language":"ar"}' \
  http://localhost:54321/functions/v1/api/v1/meetings
```

### Database Functions

```bash
# Connect to local Postgres
supabase db connect

# Test RPC functions
SELECT * FROM calculate_talk_time('00000000-0000-0000-0000-000000000000');
```

### Frontend

1. Open http://localhost:5173
2. Navigate through screens
3. Check browser console for errors
4. Test authentication flow

---

## Advanced Features Testing

### 1. Search Endpoints

```bash
# Full-text search
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:54321/functions/v1/api/v1/search?q=test&lang=ar"

# Semantic search
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:54321/functions/v1/api/v1/search/semantic?q=project deadline"
```

### 2. Speaker Analytics

```bash
curl -H "Authorization: Bearer <JWT>" \
  http://localhost:54321/functions/v1/api/v1/meetings/<MEETING_ID>/speakers
```

### 3. Export Generation

```bash
curl -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"meetingId":"<MEETING_ID>","format":"markdown"}' \
  http://localhost:54321/functions/v1/api/v1/export
```

### 4. API Key Generation

```bash
curl -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"name":"Test Key","scopes":["read","write"]}' \
  http://localhost:54321/functions/v1/api/v1/auth/api-keys
```

### 5. Integration Configuration

```bash
curl -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -X PUT \
  -d '{"accessToken":"<TOKEN>","workspaceId":"<ID>"}' \
  http://localhost:54321/functions/v1/api/v1/integrations/notion/config
```

---

## Troubleshooting

### Docker Issues

**Error: "Cannot connect to Docker daemon"**
- Ensure Docker Desktop is running
- Check Docker icon in system tray/menu bar
- Try: `docker ps` to verify

**Error: "Port already in use"**
```bash
# Stop Supabase
supabase stop

# Start again
supabase start
```

### Migration Issues

**Error: "Migration failed"**
```bash
# Reset and try again
supabase db reset

# If issues persist, check migration files
ls -la supabase/migrations/
```

### Edge Function Issues

**Error: "Module not found"**
- Ensure all files in `supabase/functions/_shared/` exist
- Check imports in `api/index.ts`

**Error: "KV not available"**
- Configure KV_URL and KV_TOKEN in .env.local
- Or use local Deno KV (automatic)

### Frontend Issues

**Error: "Cannot connect to API"**
- Verify backend is running on port 54321
- Check `VITE_SUPABASE_URL` in Frontend/.env.local
- Check browser console for CORS errors

**Build errors**
```bash
cd Frontend
npm install
npm run build
```

---

## Production Deployment

### Backend (Supabase Cloud)

1. Create Supabase project: https://supabase.com
2. Apply migrations:
   ```bash
   supabase link --project-ref <YOUR_PROJECT_REF>
   supabase db push
   ```
3. Deploy Edge Functions:
   ```bash
   supabase functions deploy api
   ```
4. Configure environment variables in Supabase Dashboard

### Frontend (Vercel/Netlify)

1. Connect GitHub repository
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build command: `cd Frontend && npm run build`
4. Output directory: `Frontend/build`

---

## Development Workflow

### Daily Development

1. Start Docker Desktop
2. Terminal 1: `supabase start` (if not already running)
3. Terminal 2: `deno task dev:functions`
4. Terminal 3: `cd Frontend && npm run dev`

### Making Changes

**Backend changes:**
- Edit files in `supabase/functions/`
- Changes hot-reload automatically

**Database changes:**
- Create new migration: `supabase migration new <name>`
- Apply: `supabase db reset`

**Frontend changes:**
- Edit files in `Frontend/src/`
- Vite hot-reloads automatically

### Testing

```bash
# Backend
deno test supabase/functions/

# Frontend
cd Frontend
npm run type-check
npm run lint
```

---

## Next Steps

1. ✅ **Backend Complete**: All Units 1.1-1.3 implemented
2. 🔄 **Frontend In Progress**: Unit 2.1 foundation exists
3. ⏭️ **Next**: Implement Unit 2.1 Auth UI components
4. ⏭️ **Next**: Implement Unit 2.2 Session Editor
5. ⏭️ **Next**: Implement Unit 2.3 Gallery & Management

---

## Documentation References

- **Advanced Features**: `Doc/ADVANCED_FEATURES.md`
- **Backend README**: `README-backend.md`
- **API Documentation**: Coming soon (OpenAPI spec)
- **Memory Files**: Backend/Frontend/DevOps rules in project

---

## Support

For issues:
1. Check troubleshooting section above
2. Review Supabase logs: `supabase logs`
3. Check Edge Function logs in terminal
4. Review browser console for frontend errors

---

**Last Updated**: 2025-09-30 (after advanced features implementation)
