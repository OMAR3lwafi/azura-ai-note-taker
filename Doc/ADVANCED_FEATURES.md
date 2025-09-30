# Advanced Features Documentation

This document describes the advanced features implemented in Azora AI NoteTaker backend, covering Units 1.2 and 1.3 from the implementation plan.

## Table of Contents

1. [Search & Embeddings](#search--embeddings)
2. [Speaker Analytics](#speaker-analytics)
3. [Export System](#export-system)
4. [Third-Party Integrations](#third-party-integrations)
5. [Advanced Authentication](#advanced-authentication)
6. [Offline Audio Ingest](#offline-audio-ingest)
7. [AI Enhancements](#ai-enhancements)

---

## Search & Embeddings

### Full-Text Search
**Endpoint:** `GET /v1/search`

Combined full-text and trigram search with Arabic support.

**Query Parameters:**
- `q` (required): Search query
- `meetingId` (optional): Limit search to specific meeting
- `lang` (optional): Language for search optimization (default: `ar`)
- `limit` (optional): Results limit (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:54321/functions/v1/api/v1/search?q=مناقشة&lang=ar&limit=10"
```

**Features:**
- Arabic diacritics normalization
- Trigram fuzzy matching
- Combined relevance scoring

### Semantic Search
**Endpoint:** `GET /v1/search/semantic`

Vector-based semantic search using embeddings.

**Query Parameters:**
- `q` (required): Search query
- `meetingId` (optional): Limit search to specific meeting
- `limit` (optional): Results limit (default: 10)

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:54321/functions/v1/api/v1/search/semantic?q=project deadline&limit=5"
```

**Features:**
- OpenAI embeddings (text-embedding-3-small)
- Cosine similarity ranking
- Cross-meeting search

### Embeddings Backfill
**Endpoint:** `POST /v1/admin/embeddings/backfill`

Backfill embeddings for segments without them (maintenance endpoint).

**Query Parameters:**
- `batch` (optional): Batch size (default: 50)

---

## Speaker Analytics

### Get Speaker Analytics
**Endpoint:** `GET /v1/meetings/:id/speakers`

Retrieve speaker statistics for a meeting.

**Response:**
```json
{
  "speakers": [
    {
      "label": "SPEAKER_1",
      "display_name": "Ahmed",
      "talk_time_ms": 125000,
      "segment_count": 45
    }
  ],
  "total_speakers": 3,
  "total_segments": 150
}
```

**Features:**
- Talk-time calculation per speaker
- Segment count aggregation
- Display name mapping

### Update Speaker Name
**Endpoint:** `PUT /v1/meetings/:id/speakers/:label`

Update speaker display name.

**Request Body:**
```json
{
  "display_name": "Ahmed Ali"
}
```

---

## Export System

### Generate Export
**Endpoint:** `POST /v1/export`

Generate and store meeting export in multiple formats.

**Request Body:**
```json
{
  "meetingId": "uuid",
  "format": "markdown"
}
```

**Supported Formats:**
- `markdown`: Rich Markdown with headers, lists, and formatting
- `txt`: Plain text version
- `html`: HTML with styling (base for PDF)

**Response:**
```json
{
  "id": "asset-uuid",
  "storage_path": "user-id/export-meeting-id-timestamp.md",
  "signed_url": "https://..."
}
```

**Export Structure:**
- Meeting title and metadata
- Summary section
- Decisions list
- Action items with assignees
- Full transcript with speaker names

### Get Asset Signed URL
**Endpoint:** `GET /v1/assets/:id/signed-url`

Retrieve a signed URL for downloading an asset.

**Response:**
```json
{
  "signed_url": "https://..."
}
```

**Notes:**
- URLs valid for 1 hour
- Works for both audio and export assets

---

## Third-Party Integrations

### Push to Integration
**Endpoint:** `POST /v1/integrations/:provider/push`

Push meeting summary and tasks to external services.

**Supported Providers:**
- `notion`: Create Notion page with summary and tasks
- `trello`: Create Trello cards for tasks
- `todo`: Create Microsoft To-Do tasks

**Request Body:**
```json
{
  "meetingId": "uuid",
  "summary": "Meeting summary text",
  "tasks": [
    {
      "title": "Task description",
      "assignee": "Person Name",
      "due_date": "2024-12-31"
    }
  ]
}
```

**Features:**
- Idempotency protection (24h cache)
- Rate limiting per provider
- Automatic retry with backoff

### Save Integration Config
**Endpoint:** `PUT /v1/integrations/:provider/config`

Store integration credentials.

**Request Body:**
```json
{
  "accessToken": "your-token",
  "workspaceId": "workspace-id",
  "boardId": "board-id"
}
```

**Security:**
- Credentials encrypted at rest
- RLS enforced (user can only access own configs)

---

## Advanced Authentication

### API Keys

#### Generate API Key
**Endpoint:** `POST /v1/auth/api-keys`

Create scoped API key for programmatic access.

**Request Body:**
```json
{
  "name": "Production API Key",
  "scopes": ["read", "write"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "key": "azora_abc123...",
  "name": "Production API Key",
  "scopes": ["read", "write"]
}
```

**Important:** The plain key is returned only once. Store it securely.

**Usage:**
```bash
curl -H "Authorization: Bearer azora_abc123..." \
  http://localhost:54321/functions/v1/api/v1/meetings
```

**Features:**
- SHA-256 hashed storage
- Scope enforcement (read/write)
- Last used tracking

### 2FA Support

The auth middleware supports TOTP verification via the `X-TOTP-Code` header.

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
     -H "X-TOTP-Code: 123456" \
     http://localhost:54321/functions/v1/api/v1/meetings
```

### Device Tracking

Automatically tracks devices when these headers are provided:

- `X-Device-ID`: Unique device identifier
- `X-Platform`: Platform (ios/android/web)
- `User-Agent`: Standard user agent string

**Benefits:**
- Session management across devices
- Anomaly detection
- Audit trail

---

## Offline Audio Ingest

### Ingest Audio File
**Endpoint:** `POST /v1/meetings/:id/ingest`

Upload audio file for offline transcription.

**Request Body:**
```json
{
  "audioUrl": "https://storage.example.com/audio.mp3",
  "format": "mp3"
}
```

**Response:**
```json
{
  "id": "asset-uuid",
  "kind": "audio",
  "status": "pending"
}
```

**Workflow:**
1. Store audio reference
2. Queue for STT processing
3. Process segments via background job
4. Update asset status to `completed`

---

## AI Enhancements

### Topic Detection
**Endpoint:** `GET /v1/meetings/:id/topics`

Detect topic breaks in meeting transcript.

**Response:**
```json
{
  "breaks": [
    {
      "position": 45,
      "type": "silence",
      "gap_ms": 6500,
      "timestamp": 125000
    },
    {
      "position": 89,
      "type": "keyword",
      "keyword": "moving on to the next topic",
      "timestamp": 250000
    }
  ]
}
```

**Detection Methods:**
- Silence detection (>5s gaps)
- Keyword matching (English and Arabic)

### AI Improvements

**Enhanced Features:**
- Speaker context in summaries
- Retry logic with exponential backoff (3 retries)
- Speaker display names in transcripts
- Talk-time analytics integration

**Configuration:**
```env
LLM_PROVIDER=openai
LLM_API_KEY=your-key
```

---

## Database Functions

### calculate_talk_time
Calculates total talk time per speaker.

**Usage:**
```sql
SELECT * FROM calculate_talk_time('meeting-uuid');
```

### search_segments_semantic
Semantic search using vector embeddings.

**Usage:**
```sql
SELECT * FROM search_segments_semantic(
  query_embedding := '[0.1, 0.2, ...]'::vector,
  match_count := 10,
  filter_user_id := 'user-uuid'::uuid
);
```

### search_segments_trigram
Fuzzy search using trigram similarity.

**Usage:**
```sql
SELECT * FROM search_segments_trigram(
  search_query := 'discussion',
  similarity_threshold := 0.3,
  filter_user_id := 'user-uuid'::uuid
);
```

---

## Environment Variables

See `.env.example` for all required environment variables:

- `LLM_API_KEY`: OpenAI or Anthropic API key
- `EMBEDDING_API_KEY`: Embedding provider key
- `TOTP_SECRET_KEY`: Encryption key for 2FA secrets
- `STT_API_KEY`: Speech-to-text provider key
- Integration provider keys (Notion, Trello, MS To-Do)

---

## RLS Policies

All advanced feature tables enforce Row-Level Security:

- **api_keys**: Users can only access their own keys
- **totp_secrets**: Users can only manage their own 2FA
- **auth_devices**: Users can only view their own devices
- **integration_settings**: Users can only manage their own integrations

---

## Rate Limiting

Implemented via KV store for:

- Integration push operations (10 requests/hour/user)
- AI summarization (debounce: 30s)
- Search operations (optional, configurable)

---

## Next Steps

1. Implement PDF generation (external worker)
2. Add webhook callbacks for async operations
3. Implement two-way sync for integrations
4. Add usage metering and quotas
5. Implement comprehensive audit logging

---

## Support

For issues or questions, refer to:
- Main README: `../README-backend.md`
- API documentation (OpenAPI, coming soon)
- Backend rules: Memory files in project
