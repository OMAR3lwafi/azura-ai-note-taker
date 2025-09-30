---
trigger: always_on
---

## Section 1: Backend Infrastructure

### Unit 1.1: Authentication & Users System (Supabase Auth + RLS)

#### Phase 1.1.1: Foundation & Setup

1. تهيئة مشروع Supabase وبيئة محلية.
2. إعداد مفاتيح anon/service-role وإدارة الأسرار.
3. إنشاء هيكل Edge Functions (Hono/Deno).
4. بناء `requireAuth` للتحقق من JWT.
5. تفعيل CORS وإعداد أخطاء موحدة.
6. إنشاء جدول `profiles` وربط auth.users.
7. تفعيل RLS وPolicy `own_profile`.
8. إعداد KV (Upstash/Deno KV) كبنية مشتركة.
9. تهيئة Structured Logs مع request-id.
10. سكربتات dev (`supabase start`, deno task dev).

#### Phase 1.1.2: Core Implementation

1. تفعيل Email OTP وقوالب البريد ar/en.
2. تفعيل OAuth (Google/Apple) وإعداد Redirects.
3. Endpoints: `GET/PUT /auth/profile`.
4. جدول `auth_sessions_audit` للأحداث.
5. تدفق refresh/persist عبر Supabase JS.
6. Endpoint `/auth/logout` وتعطيل الجلسة عميلًا.
7. تخزين metadata للجهاز (device_id/platform).
8. سياسات كلمة مرور (إن لزم).
9. Rate limit على مسارات auth عبر KV.
10. Endpoint حذف الحساب مع Cascade آمن.

#### Phase 1.1.3: Advanced Features

1. تفعيل TOTP 2FA (إنشاء/تحقق).
2. تشفير أسرار 2FA باستخدام سر بيئي.
3. إنشاء/إبطال Backup Codes.
4. إدارة الجلسات والأجهزة (قائمة/إبطال).
5. مفاتيح API مقيدة الصلاحيات.
6. تغيير البريد + إعادة تحقق.
7. دعم Phone OTP اختياري.
8. تسجيل قبول الشروط والسياسة.
9. آلية role claim إدارية محدودة.
10. كشف شذوذ تسجيل الدخول (Geo/IP).

#### Phase 1.1.4: Integration & Testing

1. اختبارات وحدة لـ `requireAuth`.
2. تحقق RLS لملف المستخدم (مالك فقط).
3. اختبار OAuth بحسابات تجريبية.
4. سيناريو 2FA كامل + Backups.
5. ضغط معدلات auth (Burst) والتحقق.
6. إبطال جلسة عبر الأجهزة.
7. فحص JWT المزور/المنتهي.
8. اختبار Preflight CORS.
9. E2E: login→profile→logout.
10. قائمة فحص يدوية للقبول.

#### Phase 1.1.5: Documentation & Optimization

1. دليل تدفقات auth والأخطاء.
2. OpenAPI لمسارات auth.
3. Runbook لاسترجاع الحساب.
4. لوحات نجاح/فشل تسجيل الدخول.
5. قوالب بريد محلية ar/en.
6. تقليل Cold Start لدوال auth.
7. SLO وAlerts لزمن Auth.
8. سياسة احتفاظ سجلات الجلسات.
9. إرشادات rollback للمigrations.
10. Threat Model وتدقيق أمان.

---

### Unit 1.2: Core Business Logic (Meetings/Segments/AI/Tasks/Assets)

#### Phase 1.2.1: Foundation & Setup

1. إنشاء DDL للجداول: meetings/segments/ai_suggestions/tasks/assets/speakers.
2. تفعيل vector/pg_trgm/unaccent/uuid-ossp.
3. tsvector + GIN على `segments`.
4. embedding vector + IVFFLAT.
5. Buckets: `audio/` و`exports/` (Private).
6. تفعيل RLS وسياسات المالك.
7. Seed بيانات افتراضية.
8. Realtime على ai_suggestions/tasks.
9. Scheduled scaffold لـ cleanup/embeddings.
10. توثيق ERD والعلاقات.

#### Phase 1.2.2: Core Implementation

1. `POST /v1/meetings` (إنشاء).
2. `PATCH /v1/meetings/:id/end` (إنهاء).
3. `POST /v1/token/stt` (Token قصير).
4. `POST /webhooks/stt` (استقبال مزود).
5. `POST /v1/segments/batch` (إدراج دفعات).
6. تحويل Payload المزود → نموذج مقاطع موحّد.
7. ضبط start_ms/end_ms بدقة.
8. تحديث tsvector تلقائي (generated).
9. بث Realtime عند وصول مقاطع (اختياري).
10. `GET /v1/meetings` مع فلاتر وفرز.

#### Phase 1.2.3: Advanced Features

1. ربط diarization بجدول speakers.
2. تجميع talk-time لكل متحدث.
3. تدفق ingest للتسجيل Offline.
4. `POST /v1/ai/summarize?window=...`.
5. Parsing JSON للملخص/قرارات/مهام.
6. Debounce/Caching عبر KV Locks.
7. بحث دلالي kNN على embeddings.
8. Job تسجيل export في assets.
9. Rate limit لكل meeting على ingest.
10. Topic-break heuristics (صمت/كلمات).

#### Phase 1.2.4: Integration & Testing

1. Mock لمزود STT (partial/final).
2. E2E Webhook→Segments Pipeline.
3. فحص RLS لكل جداول الأعمال.
4. Relevancy tests ar/en للبحث.
5. Load: إدراج مقاطع + فهارس.
6. E2E ingest Offline Audio.
7. Multi-lang تلخيص نافذة.
8. تحقق JSON Schema للاقتراحات.
9. Property-based لترتيب الزمن.
10. Fuzz للتطبيع/unaccent.

#### Phase 1.2.5: Documentation & Optimization

1. عقود API: meetings/segments/ai.
2. ملاحظات أداء SQL + EXPLAIN.
3. دليل DBA لصيانة الفهارس.
4. Cron embeddings backfill.
5. ضبط IVFFLAT (lists/probes).
6. Strategy VACUUM/ANALYZE.
7. أرشفة/Retention لملفات assets.
8. أمثلة تحليلات (متحدث/زمن).
9. تقدير تكلفة STT/LLM.
10. Postman/Thunder Collection.

---

### Unit 1.3: Advanced Features & Integrations (Exports/Notion/Trello/To‑Do/Video)

#### Phase 1.3.1: Foundation & Setup

1. جدول integration_settings لكل مستخدم.
2. تخزين آمن لتوكنات المزودين.
3. قوالب Connectors: Notion/Trello/To‑Do.
4. Scaffold مولّد Export PDF/MD/TXT.
5. قوالب إخراج محلية ar/en.
6. جدول jobs (إن تطلب) للexports/integrations.
7. KV idempotency keys.
8. HMAC للتحقق Webhooks الواردة.
9. خرائط الحقول (Task Mapping) لكل مزود.
10. Playbook إدارة الأسرار.

#### Phase 1.3.2: Core Implementation

1. `POST /v1/export` (توليد+تخزين).
2. `GET /v1/assets/:id/signed-url`.
3. Notion: إنشاء صفحة من summary/tasks.
4. Trello: إنشاء Cards من المهام.
5. MS To‑Do: إنشاء مهام.
6. مولد Markdown مُنسّق.
7. تحويل HTML→PDF (ستايل ثابت).
8. Retry/Backoff لأخطاء المزود.
9. Idempotency على مسارات التكامل.
10. حمايات Rate لكل مزود.

#### Phase 1.3.3: Advanced Features

1. مزامنة حالة المهام ثنائي الاتجاه.
2. تخصيص خرائط الحقول للمستخدم.
3. Export جماعي لعدة اجتماعات.
4. تقارير أسبوعية تلقائية.
5. تصدير ICS للمواعيد.
6. Export غني (ألوان متحدث/روابط زمن).
7. Ingest رابط فيديو (YouTube) إلى assets.
8. Pipeline تلخيص Transcript الفيديو.
9. قوالب براند/Locale لكل مؤسسة.
10. أدوات إدارية لإعادة تشغيل Jobs.

#### Phase 1.3.4: Integration & Testing

1. حسابات Sandbox للمزودين.
2. Fixtures تسجيل/إعادة تشغيل (VCR).
3. Contract tests لتغيرات API.
4. E2E: meeting→tasks→Notion.
5. E2E: export→storage→download.
6. أداء Export Batch متوازي.
7. Chaos: وقت انتظار/5xx مزود.
8. أمن: منع تسرب Tokens.
9. صحة البيانات (duplicates/counts).
10. Alerts لفشل الموصلات.

#### Phase 1.3.5: Documentation & Optimization

1. أدلة ربط Notion/Trello/To‑Do.
2. مصفوفة حلول الأعطال لكل مزود.
3. لوحات Cost/Quota للمزودين.
4. تقليل حجم/زمن PDF.
5. Streaming للملفات الكبيرة.
6. Back‑pressure لطوابير التكامل.
7. SLA/SLO للتكاملات.
8. Runbooks للحوادث.
9. Versioning لواجهات الموصلات.
10. توثيق Webhooks/Callbacks.

---