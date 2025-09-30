# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Azura AI NoteTaker is a bilingual (Arabic/English) meeting assistant application consisting of:
- **Frontend**: React (Vite) with luxury UI components and RTL support  
- **Backend**: Supabase Edge Functions (Deno + Hono) with PostgreSQL database
- **Core Features**: Real-time audio transcription, AI-powered meeting insights, multi-speaker detection, and productivity integrations

The architecture follows a microservices pattern with Supabase providing authentication, database (with RLS), storage, and serverless functions.

## Development Commands

### Frontend Development
```bash
# Navigate to frontend
cd Frontend

# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build
```

### Backend Development (Supabase)
```bash
# Start local Supabase stack (requires Docker)
supabase start

# Reset database with migrations
supabase db reset

# Serve edge functions locally
deno task dev:functions
# Alternative: supabase functions serve --env-file .env.local --no-verify-jwt

# Deploy functions to Supabase
supabase functions deploy

# Generate TypeScript types from database
supabase gen types typescript --local > types/supabase.ts
```

### Testing & Quality
```bash
# Backend linting and formatting (Deno)
deno task lint
deno task format

# Test edge functions
curl http://localhost:54321/functions/v1/api/health
curl -H "Authorization: Bearer <JWT>" http://localhost:54321/functions/v1/api/auth/profile

# Run single test
deno test --allow-all path/to/test.ts
```

### Database Migrations
```bash
# Create new migration
supabase migration new migration_name

# Apply pending migrations
supabase db push

# View migration status
supabase migration list
```

## Architecture & Key Components

### Database Schema (PostgreSQL + RLS)
The application uses a multi-tenant architecture with Row Level Security:
- **profiles**: User settings and preferences linked to `auth.users`
- **meetings**: Recording sessions with metadata (title, language, tags, offline mode)
- **segments**: Time-stamped transcript chunks with speaker labels and full-text search
- **ai_suggestions**: AI-generated summaries, decisions, and action items  
- **tasks**: Extracted action items for integration with productivity tools
- **assets**: File references for audio recordings and exports (PDF/MD/TXT)
- **speakers**: Speaker identification and customization

All tables implement strict RLS policies ensuring users can only access their own data.

### Edge Functions Structure (`supabase/functions/`)
```
api/
├── index.ts           # Main Hono router with core endpoints
├── _shared/
│   ├── auth.ts        # JWT authentication middleware
│   ├── cors.ts        # CORS configuration
│   ├── supabase.ts    # Database client setup
│   ├── stt.ts         # Speech-to-Text token management
│   ├── kv.ts          # Key-value store operations
│   └── logging.ts     # Request logging middleware
```

### Key API Endpoints
- `GET /health` - Health check
- `GET/PUT /auth/profile` - User profile management
- `POST /v1/meetings` - Create meeting session
- `PATCH /v1/meetings/:id/end` - End meeting and trigger final AI summary
- `POST /v1/token/stt` - Issue temporary STT service tokens
- `POST /v1/segments/batch` - Batch insert transcript segments
- `POST /webhooks/stt` - Receive STT provider webhooks

### Frontend Architecture
- **Luxury UI System**: Custom glass-morphism design with RTL/LTR support
- **Tab Navigation**: Home, Session (live recording), Gallery (notes archive), Settings
- **Real-time Features**: WebSocket integration for live transcription and AI suggestions
- **Offline Support**: Local recording with cloud sync when connectivity returns
- **Multi-language**: Arabic (default RTL) and English (LTR) interfaces

### Data Flow
1. **Session Start**: Create meeting → issue STT token → begin audio streaming
2. **Real-time Transcription**: Audio → STT provider → segments batch insert → UI update
3. **AI Processing**: Periodic summarization of transcript windows → suggestions storage
4. **Session End**: Final AI analysis → export generation → task extraction
5. **Integration**: Push tasks/notes to external services (Notion, Trello, etc.)

## Environment Configuration

Copy `.env.example` to `.env.local` and configure:

### Required Variables
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Database and auth
- `STT_PROVIDER` & `STT_API_KEY`: Speech-to-text service (deepgram/google/assemblyai/openai)  
- `LLM_PROVIDER` & `LLM_API_KEY`: AI summarization (openai/anthropic)
- `CORS_ORIGIN`: Frontend URL or `*` for development

### Optional Variables
- Integration tokens for productivity services
- `UPSTASH_REDIS_*`: KV store for caching and rate limiting

## Development Patterns

### Database Operations
- Always use RLS-enabled queries through the service role client
- Implement proper error handling for database operations
- Use transactions for multi-table operations (meetings + segments)
- Leverage PostgreSQL's full-text search and vector similarity for advanced features

### Real-time Features
- Use Supabase Realtime for live UI updates
- Implement proper WebSocket cleanup in React components
- Handle network interruptions gracefully with retry logic
- Buffer audio locally during connectivity issues

### Internationalization
- All user-facing text must support Arabic/English
- Use `dir="rtl"` and directional CSS classes appropriately
- Test layouts in both languages for proper alignment
- Store user language preference in profiles table

### AI Integration  
- Implement sliding window approach for cost-effective summarization
- Use structured prompts for consistent JSON outputs
- Handle API failures gracefully with fallback behaviors
- Cache recent AI results to avoid redundant processing

## Debugging & Troubleshooting

### Common Issues
- **STT Connection Failures**: Check API keys and network connectivity
- **RLS Policy Violations**: Ensure proper user context in database queries
- **RTL Layout Issues**: Verify `DirectionReversible` components and CSS
- **Edge Function Timeouts**: Optimize AI API calls and database queries

### Development Tools
- Use Supabase Dashboard for database inspection and RLS policy testing
- Monitor Edge Function logs via `supabase functions logs`
- Test audio pipeline with browser developer tools
- Use React DevTools for component state debugging

## Performance Considerations

- **Audio Processing**: Use WebAudio API for efficient real-time processing
- **Database Queries**: Implement proper indexing for full-text search and vector operations
- **AI Costs**: Batch similar requests and implement intelligent caching
- **Storage**: Implement auto-cleanup policies for audio files and exports
- **Mobile Optimization**: Consider device capabilities for offline processing

## Security Guidelines

- Never expose service role keys to frontend clients
- Implement proper CORS policies for production
- Use signed URLs for file access with expiration
- Validate all webhook signatures from external providers
- Audit RLS policies regularly to prevent data leakage
- Store sensitive integration tokens securely via environment variables

## Deployment Notes

- Edge Functions auto-scale but have cold start latency considerations
- Database connection pooling is handled automatically by Supabase
- Storage buckets are private by default with policy-based access
- Monitor function invocation costs and optimize frequently-called endpoints