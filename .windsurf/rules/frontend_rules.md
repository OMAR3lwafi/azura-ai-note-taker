---
trigger: always_on
---


## Section 2: Frontend Application

### Unit 2.1: User Interface & Authentication (React + Tailwind + ShadCN)

#### Phase 2.1.1: Foundation & Setup

1. إنشاء مشروع Vite React TS.
2. تثبيت Tailwind v4 وضبط `globals.css`.
3. إعداد ShadCN/Lucide.
4. i18n ar/en + RTL toggle.
5. تهيئة Supabase JS Client.
6. Theme tokens (light/dark/glass).
7. تنقل Mobile (SafeArea/Status/TabBar).
8. State-based routing للنمط المحمول.
9. ESLint/Prettier/TS strict.
10. `.env.local` وربط المفاتيح.

#### Phase 2.1.2: UI Components Library

1. Buttons Variants (primary/ghost/glass).
2. Forms/Inputs مع حالات التحقق.
3. Cards/Panels بتأثير Glass.
4. ListItem مع شارة متحدث.
5. Modal/Sheet لعناصر الجلسة.
6. Segmented/Tabs (active primary/10).
7. Toast/Toaster.
8. Loader/Shimmer.
9. Hero Section (gradient/glass).
10. Export/Share Menu.

#### Phase 2.1.3: Authentication UI

1. شاشة Email OTP محلية.
2. أزرار OAuth Google/Apple.
3. استكمال الملف الشخصي.
4. شاشات 2FA إعداد/تحقق.
5. مؤشر جلسة وميني بروفايل.
6. نسيان/تأكيد البريد UI.
7. إدارة الجلسات والأجهزة.
8. حارس ProtectedRoute.
9. شاشات Terms/Privacy.
10. Error Boundaries محلية.

#### Phase 2.1.4: Authentication Logic & State

1. `useAuth` يغلّف Supabase.
2. تخزين الجلسة محليًا بأمان.
3. API fetch wrapper بحقن التوكن.
4. Role/Claims Guards.
5. عرض رسائل RateLimit.
6. Global error interceptor.
7. حماية المسارات الأساسية.
8. Profile get/update موصول.
9. Logout شامل.
10. Events Telemetry لتتبّع.

#### Phase 2.1.5: UX Enhancements

1. Haptics على الإجراءات.
2. اختصارات لوحة مفاتيح.
3. Mirroring RTL للأيقونات.
4. Lazy وCode‑split للشاشات.
5. Skeleton للاقتراحات.
6. Optimistic UI لتبديل المهام.
7. A11y: تسميات وتركيز.
8. احترام Reduced Motion.
9. Lighthouse ميزانيات أداء.
10. Offline Banner/Retry.

---

### Unit 2.2: Session Editor & Notes (Live Transcript + Insights)

#### Phase 2.2.1: Session Foundation

1. هيكلة شاشة الجلسة (Transcript Pane).
2. UX أذونات الميكروفون.
3. محدد اللغة (افتراضي ar).
4. اتصال STT WS عبر Token.
5. عرض interim vs final مميز.
6. إدارة Scroll لأحدث سطر.
7. شارات متحدثين ملوّنة.
8. تحكم التسجيل (start/pause/stop).
9. حالات خطأ (mic/network).
10. مؤشرات زمنية منخفضة الكمون.

#### Phase 2.2.2: Content Management

1. تجميع فقرات حسب الزمن/المتحدث.
2. وضع Mark للحظات الهامّة.
3. تحرير نص المقاطع Inline.
4. RTF أساسي (عناوين/قوائم/غليظ).
5. إرفاق صور/ملفات.
6. Linkify للتوقيت/الروابط.
7. واجهة وسوم/Tags للاجتماع.
8. تحديد/نسخ/تصدير داخل الجلسة.
9. Undo/Redo محلي.
10. دمج تحديثات الخادم بدون تعارض.

#### Phase 2.2.3: Insights Panel

1. موجز اقتراحات حي (summary/tasks/decisions).
2. أيقونات وتلوين حسب النوع.
3. طي/توسيع العناصر الطويلة.
4. Toggle مهام وتعيين مسؤول.
5. Regenerate Summary مع تبريد.
6. عرض محلي للغة المحتوى.
7. رسائل خطأ/إعادة محاولة AI.
8. Diff بين التحديثات.
9. تصدير الاقتراحات فقط.
10. دعم قارئ الشاشة.

#### Phase 2.2.4: Timeline & Review

1. Mini‑timeline لكثافة الكلام.
2. تحكم Jump‑to‑time.
3. فلترة بالنطاق/المتحدث/الوسوم.
4. بحث داخل الجلسة.
5. تشغيل مقاطع صوت (إن توفّر).
6. إنهاء الجلسة Flow آمن.
7. شاشة مراجعة بعد الجلسة.
8. تحرير واعتماد الملخص النهائي.
9. خيارات Export (PDF/MD/TXT).
10. مشاركة/تكاملات من الواجهة.

#### Phase 2.2.5: Advanced Features

1. ثيمات ألوان المتحدثين.
2. ربط بروفايل صوتي (تسمية).
3. رسوم talk‑time.
4. مؤشرات Offline Sync.
5. ربط فيديو وتحميل Transcript حالة.
6. تقسيم ذكي حسب الموضوع.
7. إيقاف Auto‑scroll عند التحديد.
8. دمج فروقات الخادم بسلاسة.
9. تنقل لوحة مفاتيح للمحرر.
10. بروفايل أداء لنصوص طويلة.

---

### Unit 2.3: Gallery & Management

#### Phase 2.3.1: Gallery Foundation

1. قائمة مع Virtualization.
2. فرز/تصفية بالتاريخ/الوسوم.
3. شريط بحث (سيرفر سايد).
4. حالات Empty/Help.
5. Pull‑to‑refresh.
6. تبديل Grid/List.
7. Pagination لانهائي.
8. تحديد متعدد وأفعال.
9. إجراءات سريعة (مشاركة/تصدير/حذف).
10. حالات تحميل/خطأ.

#### Phase 2.3.2: Detail & Editing

1. صفحة تفاصيل (Summary+Transcript).
2. تحرير عنوان/وسوم/مشروع.
3. قائمة مهام (Toggle/Assign).
4. قائمة متحدثين وإعادة تسمية.
5. تنزيل أصول (PDF/MD/TXT).
6. عرض مرفقات صوت/فيديو.
7. استنساخ الملاحظة.
8. أرشفة/إلغاء أرشفة.
9. استعادة من الأرشيف.
10. حذف مع تأكيد.

#### Phase 2.3.3: Settings & Preferences

1. تبديل اللغة مع حفظ.
2. الثيم (فاتح/داكن/نظام).
3. إعداد الحذف التلقائي.
4. ربط/فصل التكاملات.
5. اختيار قالب Export.
6. تفضيلات الإشعارات.
7. تصدير البيانات الكاملة.
8. مسح Cache محلي.
9. عن/الإصدار.
10. دعم/تواصل.

#### Phase 2.3.4: Analytics & Reports

1. إحصاءات الاستخدام (جلسات/مدد).
2. الوسوم/المشاريع الأعلى استخدامًا.
3. رسوم talk‑time الكلية.
4. معدلات إنجاز المهام.
5. سجلات التصدير.
6. تقدير تكلفة (Tokens/دقيقة).
7. Digest أسبوعي تلقائي.
8. تصدير CSV للميتاداتا.
9. اتجاهات زمنية.
10. Drill‑down للتفاصيل.

#### Phase 2.3.5: Documentation & Optimization

1. مساعدة داخل التطبيق للجلسة.
2. Tooltips/Coach‑marks.
3. تدقيق أداء المعرض.
4. تقليل Bundle (split).
5. Memoization للقوائم الثقيلة.
6. Cache‑first للبيانات.
7. Sentry أخطاء المتصفح.
8. إصلاحات وصولية.
9. توثيق سيناريوهات E2E.
10. مراجعة نصوص UX ar/en.

---