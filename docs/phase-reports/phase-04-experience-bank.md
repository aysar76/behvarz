# گزارش فاز ۴ — بانک تجربه‌های میدانی

**شاخه پیشنهادی:** `phase/04-experience-bank`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** تکمیل و آماده تأیید (Stage-Gate)

---

## ۱. خلاصه

فاز ۴ «بانک تجربه‌های میدانی» کامل پیاده شد: ثبت تجربه ساختاریافته (عنوان، مسئله/موقعیت، شرایط، اقدام، منابع، چالش‌ها، نتیجه، درس‌آموخته‌ها، پیشنهاد برای دیگران، برچسب‌ها) با پیش‌نویس/پیش‌نمایش/انتشار/ویرایش و اسلاگ قابل اشتراک (`/experiences/[slug]`). چرخه بسته دانش کامل شد: **مسئله حل‌شده ← تبدیل به تجربه ← ارجاع تجربه در پاسخ‌ها ← اجرای مجدد و ثبت نتیجه**. وضعیت‌ها (user_generated → under_review → reviewed → featured → archived) با انتقال معتبر، تفکیک «تجربه شخصی» از «محتوای بررسی‌شده/برگزیده»، هشدار محتوای حساس، گزارش و نظارت تجربه، و سرمایه روایت شواهد‌محور (ارجاع، اجرای مجدد، موفقیت اجرا، تأیید ناظر — بدون لایک).

**گیرنده‌ی مشکل فاز:** — (بدون مشکل مسدودکننده؛ جریان کامل با تست یکپارچه موقت روی دیتابیس واقعی راستی‌آزمایی شد و پس از تأیید حذف شد تا در شاخه تولیدی نماند).

## ۲. بررسی (Review)

- **مدل داده (Migration ها):** `Experience` (+ slug یکتا)، `ExperienceTag`، `ExperienceReference` (ارجاع در پاسخ)، `ExperienceReuse` (اجرای مجدد با upsert) + دو enum جدید (ExperienceStatus، ExperienceReuseOutcome) + توسعه `ContentReport` با `experienceId`.
- **API ها:**
  - `GET/POST /api/experiences` (فهرست با فیلتر وضعیت/برچسب/جست‌وجوی ساده/پیش‌نویس‌های من + ثبت با پیش‌نویس و هشدار محتوای حساس)
  - `GET/PATCH /api/experiences/[id]` (جزئیات + تجربه‌های مرتبط + ویرایش)
  - `POST /api/experiences/[id]/reuse` (این تجربه را اجرا کردم + نتیجه؛ upsert)
  - `POST /api/experiences/[id]/review` (ناظر: approve/feature/unfeature/unarchive)
  - `POST /api/experiences/[id]/archive` (بایگانی توسط نویسنده)
  - `POST /api/problems/[id]/convert-to-experience` (تبدیل مسئله حل‌شده به پیش‌نویس تجربه)
  - `POST /api/problems/[id]/answers` (پشتیبانی از ارجاع تجربه با `experienceSlugs`)
  - `POST /api/reports` (گزارش تجربه) + `POST /api/moderation/experiences/[id]` (مخفی/حذف/بازیابی)
  - `GET /api/admin/moderation` (بخش تجربه‌های نیازمند بررسی)
- **سرمایه روایت (شواهد‌محور):** `referenceCount` (ارجاع در مسائل واقعی)، `reuseCount` + `reuseSuccessCount` (اجرای گزارش‌شده و موفقیت اجرای مجدد)، وضعیت reviewed/featured (تأیید کیفی ناظر). هیچ شمارنده لایک یا محبوبیت وجود ندارد.
- **امنیت محتوا:** `scanSensitiveContent` برای همه فیلدهای تجربه؛ تأیید نشده = رد، تأیید شده = `under_review`/`needsReview` برای صف ناظر.
- **ناشناس‌سازی:** `authorId` همیشه ذخیره می‌شود؛ نام نویسنده تجربه در خروجی عمومی نمایش داده می‌شود (تجربه = دیده‌شدن و اعتبار، انگیزه از PDF)؛ محتوای تجربه نباید شامل مشخصات قابل شناسایی بیمار باشد و هیچ داده بیمار در مدل داده وجود ندارد.
- **Anti-Spam:** Rate Limit ثبت تجربه (۱۰/ساعت)، اجرای مجدد (۱۰/ساعت)، تبدیل (۱۰/ساعت)، پاسخ (۲۰/ساعت).
- **RBAC:** مجوزهای جدید `experiences:create/update:own/reuse/archive/report` (اعضا) و `experiences:review` (ناظر/مدیر)؛ همه در API (نه فقط UI).
- **Audit Log:** `experience.create/draft/update/reuse/archive/review.*`، `problem.convert-to-experience`، `report.create`، `moderation.experience.*`.
- **عدم رقابت با سیب:** هیچ قابلیت ثبت رسمی/پرونده/ارجاع ساخته نشده است.

## ۳. وضعیت ابزارها (همه سبز)

| ابزار            | نتیجه                                                      |
| ---------------- | ---------------------------------------------------------- |
| `pnpm build`     | موفق (۴۳ مسیر)                                             |
| `pnpm typecheck` | موفق (بدون خطا)                                            |
| `pnpm lint`      | موفق (بدون خطا/هشدار)                                      |
| `pnpm test:run`  | ۲۱ فایل، ۱۴۱ تست موفق                                      |
| تست یکپارچه موقت | جریان «مسئله حل‌شده ← تبدیل ← انتشار ← اجرای مجدد ← ارجاع» روی دیتابیس واقعی موفق |

## ۴. ریسک‌های امنیتی (فاز ۴)

| ریسک                | وضعیت                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| افشای اطلاعات بیمار | الگوی محتوای حساس + هشدار پیش از انتشار + `under_review`/`needsReview` + ممنوعیت مطلق در مدل داده |
| IDOR                | همه مسیرها با `requireUser()`؛ ویرایش/بایگانی فقط نویسنده؛ تبدیل فقط نویسنده مسئله حل‌شده           |
| RBAC سمت سرور       | `assertPermission` در همه مسیرهای حساس (ایجاد، ویرایش، اجرای مجدد، بررسی ناظر، نظارت)               |
| Spam                | Rate Limit ثبت تجربه/اجرای مجدد/تبدیل/پاسخ به‌ازای کاربر                                           |
| ارجاع نامعتبر       | اسلاگ‌ها سمت سرور به id تبدیل و اعتبارسنجی می‌شوند؛ فقط تجربه منتشرشده/قابل‌نمایش ارجاع می‌شود    |
| محتوای نامناسب      | گزارش تجربه + صف ناظر + مخفی/حذف/بازیابی با Audit Log و امکان بازگشت (Soft Delete)                 |
| CSRF/CORS           | API های Same-Origin و کوکی SameSite=Lax (همسو با فاز ۲)                                            |

## ۵. بدهی فنی عمدی

| شناسه | بدهی                                                        | دلیل                             | بازپرداخت |
| ----- | ----------------------------------------------------------- | -------------------------------- | --------- |
| PH4-1 | اسلاگ تجربه توکن تصادفی (بدون بخش خوانا)                    | محتوای فارسی قابل ترجمهٔ خوانا نیست | فاز ۸     |
| PH4-2 | «تجربه‌های مرتبط» فقط بر پایه برچسب مشترک                   | جست‌وجو/کشف کامل در فاز ۸        | فاز ۸     |
| PH4-3 | ارجاع تجربه در پاسخ با واردکردن دستی اسلاگ                  | بدون زیرساخت جست‌وجو در MVP      | فاز ۸     |
| PH4-4 | سرمایه روایت بدون محاسبه «استمرار اثر در زمان»              | نیازمند داده تاریخی              | فاز ۱۰    |

## ۶. Migration ها

- `20260905071616_phase4_experience_bank` — مدل‌های Experience، ExperienceTag، ExperienceReference، ExperienceReuse + enum ها + توسعه ContentReport.

## ۷. فهرست فایل‌های اصلی (فاز ۴)

```
src/
  app/api/experiences/route.ts  app/api/experiences/[id]/route.ts
  app/api/experiences/[id]/reuse/route.ts  review/route.ts  archive/route.ts
  app/api/problems/[id]/convert-to-experience/route.ts
  app/api/moderation/experiences/[id]/route.ts
  app/api/reports/route.ts (گزارش تجربه)  app/api/admin/moderation/route.ts (بخش تجربه‌ها)
  app/api/problems/[id]/answers/route.ts (ارجاع تجربه)
  app/experiences/page.tsx  app/experiences/new/page.tsx  app/experiences/[slug]/page.tsx
  components/experiences/ experience-form  experience-list  experience-card  experience-detail  reuse-form
  components/problems/ answer-form (ارجاع)  answer-item (نمایش ارجاع)  problem-detail (تبدیل به تجربه)  report-dialog (تجربه)
  components/admin/moderation-queue.tsx (بخش تجربه‌ها)
  lib/ slug.ts  experiences.ts  experience-status.ts  validations/experience.ts  serializers/experience.ts  constants/experience.ts
  lib/rbac.ts (مجوزهای فاز ۴)  lib/serializers/problem.ts (ارجاع در پاسخ + گزارش تجربه)
prisma/schema.prisma + migrations/20260905071616_phase4_experience_bank
```

## ۸. راهنمای تست دستی

1. `pnpm dev`؛ ورود با OTP (`/auth`) و تکمیل Onboarding.
2. `/experiences` → «ثبت تجربه میدانی» → فرم ساختاریافته را پر کنید؛ اگر متن شامل شماره/کد ملی باشد هشدار محتوای حساس نمایش داده می‌شود (بدون تأیید امکان انتشار نیست).
3. «ذخیره پیش‌نویس» → `/experiences?drafts=1` → از صفحه تجربه «ویرایش» → «انتشار تجربه».
4. صفحه تجربه منتشرشده: دکمه «این تجربه را اجرا کردم» → ثبت نتیجه (موفق/تا حدی/ناموفق). شمارنده «اجرای ثبت‌شده» و «اجرای موفق» به‌روزرسانی می‌شود.
5. در یک مسئله حل‌شده (نویسنده)، دکمه «تبدیل به تجربه میدانی» → پیش‌نویس تجربه از مسئله ساخته می‌شود (منبع در صفحه تجربه لینک دارد).
6. هنگام پاسخ به مسئله، لینک تجربه را در «ارجاع به تجربه» وارد کنید → پاسخ، تجربه ارجاع‌شده را نمایش می‌دهد و شمارنده «ارجاع» تجربه افزایش می‌یابد.
7. با کاربر ناظر (role=content_moderator یا admin): در صفحه تجربه «بررسی کیفیت» → «تأیید» (بررسی‌شده) یا «برگزیده‌کردن»؛ در `/admin/moderation` بخش «تجربه‌های نیازمند بررسی» (تحت‌بررسی + غیرقابل‌نمایش) و گزارش تجربه.
8. تجربه را «گزارش» کنید → در صف مدیریت محتوا بررسی و مخفی/حذف کنید.
9. تست RBAC: عضو معمولی به `/api/experiences/[id]/review` دسترسی ندارد (۴۰۳).
10. اسلاگ تجربه در URL پایدار است و صفحه با `/experiences/<slug>` (بدون نیاز به id) باز می‌شود.

## ۹. معیار خروج فاز ۴

- ✅ مدیریت کامل تجربه از ثبت تا بازتولید (پیش‌نویس ← پیش‌نمایش ← انتشار ← ویرایش ← اجرای مجدد ← بایگانی)
- ✅ تبدیل پاسخ موفق اتاق به تجربه (`convert-to-experience`) و ارجاع تجربه در پاسخ‌ها ذخیره می‌شوند (`ExperienceReference`)
- ✅ نتایج اجرای مجدد ذخیره می‌شوند (`ExperienceReuse` با upsert)
- ✅ وضعیت‌ها: user_generated/under_review/reviewed/featured/archived با انتقال معتبر و تفکیک «تجربه شخصی» از «محتوای بررسی‌شده»
- ✅ اسلاگ/URL قابل اشتراک (`/experiences/[slug]`)
- ✅ رتبه‌بندی به لایک وابسته نیست (سرمایه روایت: ارجاع، اجرا، موفقیت، تأیید ناظر)
- ✅ بدون هوش مصنوعی خارجی (فقط آماده‌سازی معماری)
- ✅ هشدار/کنترل محتوای حساس، گزارش تجربه و نظارت ناظر

## ۱۰. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-4): field experience bank

- Structured experiences (title, situation, conditions, action, resources, challenges, result, lessons, suggestion, tags) with drafts/publish/edit and shareable slug URLs
- Statuses user_generated/under_review/reviewed/featured/archived with validated transitions; clear 'personal' vs 'reviewed' labeling
- Convert solved problem to experience; reference experiences in answers (ExperienceReference); 'I implemented this' reuse + result (ExperienceReuse)
- Evidence-based narrative capital (references, reuses, success rate, moderator approval) with no likes
- Sensitive-content warning + moderator review queue + experience reports + moderation (hide/remove/restore)
- Pages: /experiences, /experiences/new, /experiences/[slug]; enable nav; extend admin moderation queue
- schema v4 migration; phase-4 report and docs update"
```

## ۱۱. توقف و انتظار تأیید

بر اساس مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. پس از تأیید، فاز ۵ (تعاملات حرفه‌ای و سرمایه روایت) آغاز می‌شود که پروفایل سرمایه حرفه‌ای و «تشکر حرفه‌ای» را به همین داده‌های شواهد‌محور متصل می‌کند.