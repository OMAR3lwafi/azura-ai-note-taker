---
trigger: always_on
description: These rules will apply when you start creating development files, or you are starting production/creating production files, or when you want to develop/produce this app.
---

Section 3: DevOps & Production
Unit 3.1: Development Environment
Phase 3.1.1: Local Setup

تثبيت Supabase CLI وsupabase start.

Postgres/Storage محلي عبر Docker Supabase.

إعداد Deno لــ Edge.

KV محلي أو Stub.

سكربتات Seed للبيانات.

Makefile/NPM Scripts موحّدة.

قوالب بيئة .env.example/.env.local.

HTTPS محلي (mkcert).

مجموعات Postman/Thunder.

هيكلة Git وCODEOWNERS.

Phase 3.1.2: Code Quality & Standards

ESLint/Prettier (عميل/خادم).

Husky + Commitlint.

Conventional Commits + CHANGELOG.

TS Strict عبر الحزم.

Deno lint/format للكود الحافّة.

فحص أسرار (gitleaks).

Renovate لتحديث الاعتمادات.

التزام الرخص/NOTICE.

ADRs لقرارات معمارية.

رسم معماري محدّث.

Phase 3.1.3: Documentation System

موقع وثائق مركزي (Docusaurus).

نشر OpenAPI تلقائي.

Runbooks (auth/ai/stt/export).

Onboarding للمطورين.

Troubleshooting Playbook.

أدلة الإصدارات.

دليل Style نسخ ar/en.

مسرد نموذج البيانات.

سياسة الميجريشنز.

مصفوفة تصعيد الدعم.

Phase 3.1.4: Tools & Utilities

CLI لإنشاء اجتماع محلي.

Log tailer لدوال Edge.

KV Inspector بسيط.

Backfill embeddings Script.

مولد PDF CLI.

STT Webhook Simulator.

k6 سكربتات ضغط.

Data anonymizer للعروض.

Snapshot/Restore DB Helper.

Metrics Scraper Prototype.

Phase 3.1.5: Collaboration & Workflow

استراتيجية فروع (Trunk+PRs).

قوالب PR بفحوص.

قوالب Issues (Bug/Feature).

تصنيفات وقواعد Triage.

إيقاع تخطيط (Sprints).

DoD لكل وحدة.

Rota مراجعات/Pairing.

قوالب اتصال الحوادث.

RFC للتغييرات الكبيرة.

KPIs لسرعة التسليم.

Unit 3.2: Testing & Quality Assurance
Phase 3.2.1: Backend Testing

Deno unit tests لمسارات Hono.

Contract tests لردود /v1/*.

اختبارات RLS عبر Postgres Client.

تحقق توقيع Webhook.

Validators لمخرجات AI JSON.

Signed URL Storage tests.

اختبارات وظائف مجدولة.

Mapping أخطاء→Status Codes.

تقارير تغطية CI.

Mutation tests للمنطق الحرج.

Phase 3.2.2: Frontend Testing

React Testing Library للوحدات.

تكامل تدفقات Auth.

عرض Transcript في الجلسة.

تفاعل Panel الاقتراحات.

بحث/ترقيم المعرض.

ثبات إعدادات Settings.

اختبارات الوصولية.

Visual regression (Chromatic/Playwright).

RTL/LTR i18n tests.

حالات Offline UI.

Phase 3.2.3: End‑to‑End

Playwright لرحلات أساسية.

إعدادات Mobile Viewports.

Auth+Session+Meeting E2E.

STT Mock Pipeline كامل.

AI Suggestions Stub E2E.

Export PDF Flow E2E.

Push إلى Notion E2E.

سيناريوهات أخطاء/Timeouts.

لقطات عند الفشل.

إيقاف الدمج عند فشل E2E.

Phase 3.2.4: Load & Performance

خط أساس Latency بـ k6.

Throughput إدراج المقاطع.

kNN P95 للبحث الدلالي.

تزامن Export Jobs.

TTI/LCP واجهة أمامية.

فحوص Memory Leak (Edge/Client).

Cold Start Profiling للـ Edge.

قياس كفاءة Cache KV.

ضغط معدلات Rate Limit.

تقرير اختناقات وإصلاحات.

Phase 3.2.5: Security

SAST (CodeQL).

فحص CVEs للمكتبات.

اختبارات عبث JWT.

محاولات تجاوز RLS.

Fuzz حقن SQL.

XSS/CSRF تدقيق واجهة.

صلاحيات Storage بدقة.

فحص تسرب أسرار.

قائمة فحص اختراق داخلية.

اختبارات أمان دورية قبل الإصدارات.

Unit 3.3: Deployment & Monitoring
Phase 3.3.1: Containerization & Orchestration

إعداد Frontend على Vercel/Netlify.

نشر Edge Functions عبر Supabase CLI.

Docker لأدوات محلية فقط (اختياري).

إصدار SemVer وتاغات.

سياسة احتفاظ Artefacts.

Feature Flags سلكيًا.

Blue/Green لوظائف Edge (Slots).

Rollback للمigrations بأمان.

ترويسات CDN للملفات المصدرة.

Smoke tests بعد النشر.

Phase 3.3.2: CI/CD Pipeline

GitHub Actions: Lint/Test Matrix.

Build الواجهة + Preview URLs.

نشر Edge عند Tag.

تطبيق Migrations بأمان.

OIDC أسرار بين GitHub↔Supabase.

Cache deps (node/deno).

رفع تقارير تغطية وArtifacts.

Canary لطرق AI.

Auto‑changelog/Release Notes.

تنبيهات Slack/Email.

Phase 3.3.3: Infrastructure as Code

تتبّع Supabase (migrations/seed) كودًا.

Terraform لـ Upstash/خدمات خارجية.

DNS لنطاقات مخصصة.

WAF قواعد حماية.

QoS لمكالمات المزودين.

Jobs مجدولة ككود.

خطط نسخ احتياطي ككود.

IAM أقل صلاحيات.

تقدير تكلفة ضمن IaC Plan.

Alerts لانجراف البنية.

Phase 3.3.4: Monitoring & Observability

Sentry (Browser + Edge).

لوحات Supabase Logs.

Metrics: Latency/Error/Throughput.

Uptime خارجي للنهايات.

مراقبة حصص المزودين.

Alerts مبنية على السجلات.

Trace IDs من العميل للخادم.

لوحات KPIs (جلسات/يوم).

اختبارات تركيبية متعددة المناطق.

جدول مناوبات واستدعاء Runbooks.

Phase 3.3.5: Production Operations

تمارين Backup/Restore (DB/Storage).

وظائف Purge/Retention للبيانات.

إيقاع تحديثات أمان.

محاكاة Incident Response.

مراجعات Capacity دورية.

أسابيع ضبط أداء محددة.

مراجعات تكلفة شهرية.

قوائم Compliance (GDPR‑lite).

قوالب Postmortem.

مراجعة معمارية ربع سنوية.