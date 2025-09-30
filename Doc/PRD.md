# PRD تقني عملي (Back-End & Database) — Azora AI NoteTaker

> هذا المستند يركّز فقط على البنية الخلفية وقاعدة البيانات لتطبيق الهاتف. الواجهة الأمامية والـ orchestration لديك جاهزة حسب README وهيكل المشروع المرفقين. 

---

## 0) النطاق والأهداف

**الأهداف الأساسية**

* نسخ صوت الاجتماعات لحظيًا (عربي/إنجليزي) وتخزينه مع الميتاداتا.
* توليد ملخصات/قرارات/مهام بالذكاء الاصطناعي مع قابلية المزامنة عبر الأجهزة.
* خصوصية قويّة: RLS، تشفير أثناء النقل، سياسات حذف تلقائي.
* تصدير (PDF/MD/TXT) وتكاملات (Notion/Trello/MS To-Do) بنمط webhooks/edge tasks.
* بحث نصي كامل + بحث دلالي (pgvector) + تصنيف/وسوم.

**خارج النطاق (Non-Goals)**

* واجهة المستخدم، الأنيميشن، نمط التصميم (موجود عندك).
* بناء نموذج STT محلي على الجهاز.
* تعاون فوري متعدد المستخدمين (يمكن إضافته لاحقًا).

---

## 1) المعمارية العالية (Supabase Backend)

```
Mobile App (Flutter)
  ├─ يستدعي: Supabase Auth, Realtime, Storage
  ├─ بث الصوت → STT Provider (WebSocket) مباشرة
  │    └─ Edge Function تعمل كـ Token Proxy/Webhook Receiver
  └─ REST/WS → Hono (Edge Functions) للعمليات:
       - جلسات، مقاطع، ملاحظات، اقتراحات AI، تصدير، تكاملات
       - Webhooks من STT/AI/Integrations
Supabase
  ├─ Postgres + RLS + Triggers (pgvector, tsvector)
  ├─ Storage (audio/, exports/)
  ├─ Realtime (changes on meetings/notes/suggestions)
  └─ Edge Functions (Deno + Hono)
KV Store
  └─ Redis/Upstash أو Deno KV (حالة مؤقتة للجلسة، معدلات/Rate Limits)
External Providers
  ├─ STT (Deepgram/Google/AssemblyAI/OpenAI Realtime)
  ├─ LLM (OpenAI/Anthropic) للتلخيص والاستخلاص
  └─ Integrations (Notion/Trello/To-Do)
```

**مبدأ مهم:** بث الصوت من الهاتف إلى مزوّد STT مباشرة لتقليل زمن الوصول. الخادم (Edge) يصدِر **tokens قصيرة العمر** ويستقبل **webhooks** بالنتائج النهائية/الجزئية.

---

## 2) نموذج البيانات (PostgreSQL + pgvector +全文 بحث)

### 2.1 الجداول الأساسية (DDL)

```sql
-- امتدادات
create extension if not exists vector;         -- pgvector
create extension if not exists pg_trgm;        -- تحسين البحث
create extension if not exists unaccent;       -- تطبيع النص
create extension if not exists "uuid-ossp";

-- مستأجر/حساب مستخدم
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text default 'ar',
  auto_delete_days int default 0, -- 0=تعطيل الحذف التلقائي
  created_at timestamptz default now()
);

-- اجتماعات/جلسات
create table public.meetings (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  language text check (language in ('ar','en')) default 'ar',
  tags text[] default '{}',
  project text,
  is_offline bool default false, -- للتسجيل بدون إنترنت
  created_at timestamptz default now()
);

-- مقاطع النسخ (مقسّمة زمنياً + دعم متحدثين)
create table public.segments (
  id bigserial primary key,
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  speaker_label text,                    -- 'SPEAKER_1' ... أو اسم بعد التعيين
  start_ms int not null,
  end_ms int not null,
  text text not null,
  lang text default 'ar',
  created_at timestamptz default now()
);

-- فهرس نصي كامل
alter table public.segments add column tsv tsvector
  generated always as (to_tsvector('simple', unaccent(coalesce(text,'')))) stored;
create index on public.segments using gin(tsv);

-- اقتراحات الذكاء الاصطناعي (ملخص/قرارات/مهام)
create table public.ai_suggestions (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  kind text check (kind in ('summary','decision','action_item')) not null,
  content jsonb not null,                   -- مرن: {text, items[], assignees[], due_date...}
  source_window int,                        -- آخر N ثواني/دقائق
  created_at timestamptz default now(),
  model text,
  latency_ms int
);

-- مهام مشتقة (للتصدير للتكاملات)
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  title text not null,
  assignee text,
  due_date date,
  status text check (status in ('open','done')) default 'open',
  created_at timestamptz default now()
);

-- وسائط/ملفات (صوت خام، مخرجات PDF/MD)
create table public.assets (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid references public.meetings(id) on delete cascade,
  kind text check (kind in ('audio','export_pdf','export_md','export_txt','video_ref')) not null,
  path text not null,        -- مسار في supabase storage
  bytes bigint,
  meta jsonb,
  created_at timestamptz default now()
);

-- تضمين متحدثين معروفين (بروفايل صوتي/اسم)
create table public.speakers (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  label text not null,          -- SPEAKER_1...
  display_name text,            -- اسم بعد التعيين
  color text,                   -- للواجهة
  created_at timestamptz default now()
);

-- فهارس
create index on public.meetings(owner_id, started_at desc);
create index on public.segments(meeting_id, start_ms);
create index on public.ai_suggestions(meeting_id, created_at desc);
create index on public.tasks(meeting_id, status);
create index on public.assets(meeting_id, kind);

-- متجهات دلالية (لنصوص التجميع/المقاطع)
-- طول المتجه يعتمد على الموديل (مثال 1536 لـ text-embedding-3-small)
alter table public.segments add column embedding vector(1536);
create index on public.segments using ivfflat (embedding vector_cosine_ops);
```

### 2.2 سياسات RLS (خصوصية صارمة)

```sql
alter table public.meetings enable row level security;
alter table public.segments enable row level security;
alter table public.ai_suggestions enable row level security;
alter table public.tasks enable row level security;
alter table public.assets enable row level security;
alter table public.speakers enable row level security;
alter table public.profiles enable row level security;

-- كل مستخدم يرى/يعدّل موارده فقط
create policy "own_meetings" on public.meetings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "segments_by_owner" on public.segments
  for all using (meeting_id in (select id from public.meetings where owner_id = auth.uid()));

create policy "ai_by_owner" on public.ai_suggestions
  for all using (meeting_id in (select id from public.meetings where owner_id = auth.uid()));

create policy "tasks_by_owner" on public.tasks
  for all using (meeting_id in (select id from public.meetings where owner_id = auth.uid()));

create policy "assets_by_owner" on public.assets
  for all using (meeting_id in (select id from public.meetings where owner_id = auth.uid()));

create policy "speakers_by_owner" on public.speakers
  for all using (meeting_id in (select id from public.meetings where owner_id = auth.uid()));

create policy "own_profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
```

### 2.3 تخزين الملفات (Supabase Storage)

* حاويات:

  * `audio/` تسجيلات خام (WAV/PCM 16kHz)، وملفات مرفوعة من وضع offline.
  * `exports/` نواتج PDF/MD/TXT.
* **الربط**: كل سجل في `assets` يشير إلى مسار داخل Storage.

### 2.4 بحث

* **Text Search**: `tsvector` + `pg_trgm` لبحث سريع بالعربي/الإنجليزي (نُطبّع النص بـ `unaccent`).
* **Semantic**: حفظ `embedding` للمقاطع، واستعلام kNN لاقتراحات/بحث ذكي.

---

## 3) واجهات الخادم (Edge Functions + Hono)

> جميع المسارات محمية بـ JWT من Supabase (role: authenticated). مفاتيح المزودين في بيئة الوظائف (Service Role لا يُرسل للعميل).

**المسارات (أمثلة):**

```
POST /v1/token/stt          # يصدر Token قصير العمر للاتصال المباشر مع مزود STT
POST /v1/meetings           # إنشاء جلسة
PATCH /v1/meetings/:id/end  # إنهاء جلسة وتوليد ملخص نهائي
POST /v1/segments/batch     # إدراج دفعة مقاطع (من webhook STT)
POST /v1/ai/summarize       # توليد ملخص/قرارات/مهام للنافذة الأخيرة
GET  /v1/search             # نصي + دلالي
POST /v1/export             # إنشاء PDF/MD/TXT وتخزينه في Storage
POST /v1/integrations/:k/export  # دفع مهام/ملاحظات إلى Notion/Trello...
POST /webhooks/stt          # استقبال دفعات نص جزئي/نهائي من مزوّد STT
POST /webhooks/ai           # اختياري، إن كان LLM يدعم webhooks (أو نعالج متزامن)
```

**مثال Hono (TypeScript/Deno):**

```ts
import { Hono } from 'hono';
import { supabaseClient } from './lib/supabase.ts';
import { requireAuth } from './lib/auth.ts';
import { issueSttToken } from './lib/stt.ts';
import { upsertSegments } from './lib/segments.ts';
import { summarizeWindow } from './lib/ai.ts';

const app = new Hono();

// JWT guard
app.use('/v1/*', requireAuth);

// إصدار توكن STT مؤقت
app.post('/v1/token/stt', async (c) => {
  const user = c.get('user'); // from requireAuth
  const token = await issueSttToken(user.id);
  return c.json({ token, expiresIn: 60 });
});

// إدراج دفعة مقاطع (من webhook أو من العميل)
app.post('/v1/segments/batch', async (c) => {
  const { meetingId, segments } = await c.req.json();
  const user = c.get('user');

  // تحقق ملكية الجلسة
  const { data: meeting } = await supabaseClient
    .from('meetings').select('owner_id').eq('id', meetingId).single();
  if (!meeting || meeting.owner_id !== user.id) return c.text('Forbidden', 403);

  await upsertSegments(meetingId, segments); // يملأ tsv/embedding لاحقاً عبر وظيفة
  return c.json({ ok: true });
});

// توليد ملخص نافذة أخيرة
app.post('/v1/ai/summarize', async (c) => {
  const { meetingId, windowSec = 180 } = await c.req.json();
  const user = c.get('user');
  const suggestion = await summarizeWindow(user.id, meetingId, windowSec);
  return c.json(suggestion);
});

// Webhook STT
app.post('/webhooks/stt', async (c) => {
  const payload = await c.req.json(); // provider-specific
  // map to {meetingId, segments[]} ثم upsertSegments
  // استخدم توقيع سري للتحقق من المزود
  return c.json({ ok: true });
});

export default app;
```

---

## 4) تدفق العمل (Realtime STT → DB → AI)

1. **Start Session**

   * العميل ينشئ `meeting` عبر `/v1/meetings`.
   * يطلب `/v1/token/stt` للحصول على **JWT قصير العمر** للمزوّد.
2. **Streaming STT**

   * العميل يبث الصوت مباشرة إلى مزوّد STT (WS).
   * المزوّد يرسل partial/final عبر **Webhook** إلى `/webhooks/stt` أو يعيدها للعميل ليجلبها إلى `/v1/segments/batch`.
3. **Persist**

   * حفظ `segments` + تحديث فهارس/tsvector.
   * (اختياري) **Queue** وظيفة embeddings (Edge Task) لتوليد `embedding` لكل مقطع.
4. **AI Suggestions**

   * كل N ثوانٍ أو عند “topic break” يستدعي العميل `/v1/ai/summarize(window=180s)`.
   * الخادم يجمع النص الحديث، يستدعي LLM، ويخزن نتيجة في `ai_suggestions` + يرصد `tasks`.
5. **End Session**

   * `/v1/meetings/:id/end` يغلق الجلسة، يولد **ملخص نهائي**، ويحدّث `ended_at`.
6. **Exports/Integrations**

   * `/v1/export` تنشئ PDF/MD وتضيف سجل في `assets`.
   * `/v1/integrations/:k/export` تدفع المهام/الملخص إلى Notion/Trello.

---

## 5) الذكاء الاصطناعي (التلخيص والاستخلاص)

**استراتيجية:**

* نافذة متحركة Sliding Window (آخر 2–5 دقائق) لتقليل التكلفة والكمون.
* Prompt ثابت يُوجّه الموديل لإخراج JSON:

```jsonc
{
  "summary": "٣-٥ جمل موجزة",
  "decisions": ["..."],
  "action_items": [{"title":"...", "assignee":"...", "due_date":"YYYY-MM-DD"}]
}
```

* **لغة الإخراج = لغة الجلسة** (ar/en).
* عند النهاية يُعاد توليد **ملخص شامل** لكل الجلسة (يمكن استخلاص قرارات نهائية).

**وظيفة تلخيص (تبسيط):**

```ts
export async function summarizeWindow(userId: string, meetingId: string, windowSec: number){
  // 1) جلب المقاطع الأخيرة windowSec
  // 2) بناء Prompt بلغة الجلسة
  // 3) استدعاء LLM (OpenAI/Anthropic)
  // 4) حفظ في ai_suggestions + تفريغ tasks إلى جدول tasks
  // 5) إرجاع النتيجة
}
```

---

## 6) قاعدة المفاتيح (KV) والاستخدامات

* **Deno KV أو Upstash Redis**:

  * حالة الجلسة المؤقتة: `session:{meetingId}:state`
  * تخفيض الكمون: cache آخر ملخص `ai:last:{meetingId}`
  * **معدلات** (Rate Limits): `ratelimit:{userId}:{route}` (Token Bucket)
  * قفل/Lock لمنع سباق تلخيص متوازي `lock:ai:{meetingId}`

---

## 7) الأمان والامتثال

* **Auth**: Supabase Auth (JWT)؛ كل استدعاء Edge متحقق.
* **RLS**: كما بالأعلى، لا وصول بين المستخدمين.
* **Webhooks**: توقيع HMAC لكل مزود (هيدرات توقيع، وقت صالح).
* **التشفير**: HTTPS فقط؛ Storage private buckets؛ روابط موقّتة للتنزيل.
* **الحذف التلقائي**: وظيفة يومية تفحص `profiles.auto_delete_days` وتحذف بيانات المستخدم/الأصول الأقدم.
* **CSP/Secrets**: مفاتيح المزودين في بيئة Edge فقط؛ عدم إرجاعها للعميل.

---

## 8) الأداء والموثوقية

* **STT مباشر** من العميل للمزوّد (أقل زمن).
* **Batching** للمقاطع (كل 1–3 ثوانٍ) لتقليل ضغط الكتابة.
* **Embeddings** تعمل Async (Edge Task/cron) مع backoff.
* **فهرسة** صحيحة (GIN على tsvector، IVFFLAT على embeddings).
* **Realtime**: اشتراك العميل على تغيّرات `ai_suggestions` و`tasks` لتحديث فوري.

**SLO مقترح**

* تدوين مقطع ← قابلية الاستعلام < 1.5s
* تلخيص نافذة 180s ← < 2.5s  (P95)
* تصدير PDF < 10s  (P95)

---

## 9) اختبار وضمان الجودة

* **وحدات**: دوال Hono/SQL (pgTAP إن أمكن).
* **تكامل**: مسارات `/v1/*`، سيناريو بث STT وهمي.
* **تحمل**: توليد 60 دقيقة/جلسة، 10 جلسات متوازية.
* **أمن**: محاولات وصول Cross-tenant، تزوير Webhook.
* **دخان**: إنشاء/إنهاء جلسة، استدعاء AI، تصدير، بحث.

---

## 10) التهيئة والبيئة (.env مثال)

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# STT/LLM
STT_PROVIDER=deepgram|google|assemblyai|openai
STT_API_KEY=...
LLM_PROVIDER=openai|anthropic
LLM_API_KEY=...

# Integrations
NOTION_TOKEN=...
TRELLO_KEY=...
TRELLO_TOKEN=...

# KV (اختياري)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## 11) خطّ سير التسليم (Milestones)

1. **M1: الأساسيات (DB+RLS+Storage+Auth)** — 3 أيام
   جداول، سياسات، Storage، ميثاق اتصال من التطبيق.
2. **M2: جلسات ومقاطع + Webhook STT** — 4 أيام
   `/v1/meetings`, `/v1/segments/batch`, `/webhooks/stt` + فهارس.
3. **M3: AI نافذة + مهام** — 4 أيام
   `/v1/ai/summarize`, توليد tasks، حفظ suggestions.
4. **M4: بحث وتصدير** — 3 أيام
   `/v1/search` (نصي + دلالي)، `/v1/export` PDF/MD/TXT.
5. **M5: تكاملات + تنظيف تلقائي + رصد** — 4 أيام
   Integrations، cron cleanup، Logging/Tracing.

---

## 12) أمثلة استدعاء من التطبيق (Flutter)

**إنشاء جلسة**

```ts
POST /v1/meetings
{ "title":"Sprint Planning", "language":"ar", "tags":["sprint","teamA"] }
→ 201 { id, started_at }
```

**Token لبث STT**

```ts
POST /v1/token/stt
→ { token, expiresIn:60 }
```

**دفعة مقاطع**

```ts
POST /v1/segments/batch
{
  "meetingId":"...", 
  "segments":[
    {"speaker_label":"SPEAKER_1","start_ms":1200,"end_ms":3500,"text":"..."}
  ]
}
```

**تلخيص نافذة**

```ts
POST /v1/ai/summarize
{ "meetingId":"...", "windowSec":180 }
→ { id, kind:"summary", content:{ summary:"...", decisions:[...], action_items:[...] } }
```

**بحث**

```
GET /v1/search?q=موعد&meetingId=...
→ { segments:[...], suggestions:[...], tasks:[...] }
```

---

## 13) المراقبة والمقاييس

* **Logs**: لكل وظيفة Edge (request id, user id, route, latency, status).
* **Metrics**:

  * STT: chunks/min, partial→final latency.
  * AI: tokens, latency, cost (إن متاح).
  * DB: inserts/sec في segments، حجم التخزين.
* **Alerts**: فشل Webhook، تجاوز latency، أخطاء LLM.

---

## 14) خطة الحذف التلقائي

* وظيفة يومية:

```sql
-- مثال منطقي: حذف لقاءات أقدم من N أيام لكل مستخدم مفعّل
-- تُنفّذ عبر Edge Scheduled Function:
delete from public.assets a
using public.meetings m, public.profiles p
where a.meeting_id = m.id and m.owner_id = p.id
and p.auto_delete_days > 0
and m.ended_at < now() - (p.auto_delete_days || ' days')::interval;

-- ثم حذف السجلات التابعة (بـ cascade)
delete from public.meetings m
using public.profiles p
where m.owner_id = p.id
and p.auto_delete_days > 0
and m.ended_at < now() - (p.auto_delete_days || ' days')::interval;
```

---

## 15) مخاطر ومعالجات

* **كمون AI/STT**: نافذة متحركة + partial UI + مزوّد سريع.
* **تكلفة LLM**: تلخيص مجتزأ + ضغط نص + caching KV.
* **خروقات خصوصية**: RLS صارم + توقيع Webhooks + تشفير.
* **انقطاع مزود خارجي**: إعادة محاولة مع backoff + fallbacks.
* **حجم البيانات**: أرشفة/حذف تلقائي + ضغط/تنظيف Storage.

---

### الخلاصة

هذا الـ PRD يقدّم **تصميمًا قابلًا للتنفيذ فورًا** على Supabase (Postgres/Storage/Edge/Realtime) مع **واجهات واضحة**، **مخطط بيانات محكم**، **RLS قوي**، وتدفقات عمل عملية لنسخ الصوت، التلخيص، البحث، التصدير، والتكاملات—متوافق مع مشروعك وهيكل الواجهة الأمامية المرفق. 

إذا أردت، أجهّز لك:

* **ملفات migration SQL** (ready for `supabase db push`).
* **قوالب Edge Functions** كاملة (Hono) لكل مسار أعلاه.
* **نماذج طلبات Thunder Client / Postman** للاختبار السريع.
