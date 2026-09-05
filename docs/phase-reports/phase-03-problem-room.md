# گزارش فاز ۳ — اتاق مسئله (هسته محصول)

**شاخه پیشنهادی:** `phase/03-problem-room`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** تکمیل و آماده تأیید (Stage-Gate)

---

## ۱. خلاصه

فاز ۳ «اتاق مسئله» — هسته محصول — کامل پیاده شد: ثبت مسئله ساختاریافته (عنوان، شرح، زمینه/شرایط، نوع مانع، اقدامات انجام‌شده، نتیجه مورد انتظار، برچسب‌ها، فوریت، انتشار ناشناس، پیش‌نویس)، پاسخ ساختاریافته + «درخواست توضیح» + «مفید بود»، انتخاب راهکار با جمع‌بندی، ثبت نتیجه اجرا، تاریخچه وضعیت قابل پیگیری، هشدار/کنترل محتوای حساس، گزارش محتوای نامناسب و اقدامات نظارت (مخفی/حذف/بازیابی)، و تاریخ شمسی در UI. چرخه «ثبت مسئله تا ثبت نتیجه راهکار» کامل است.

**گیرنده‌ی مشکل فاز:** — (بدون مشکل مسدودکننده؛ جریان کامل با تست یکپارچه موقت روی دیتابیس واقعی راستی‌آزمایی شد و پس از تأیید حذف شد تا در شاخه تولیدی نماند).

## ۲. بررسی (Review)

- **مدل داده (Migration ها):** `Problem`، `ProblemAnswer`، `ProblemAnswerHelpful`، `ProblemStatusChange`، `Tag/ProblemTag`، `ContentReport` + ۵ enum جدید (ProblemStatus، ProblemUrgency، ProblemBarrierType، ProblemResultOutcome، ModerationState، ReportStatus).
- **API ها:**
  - `GET/POST /api/problems` (فهرست با فیلتر وضعیت/برچسب/جست‌وجوی ساده/پیش‌نویس‌های من + ثبت با پیش‌نویس و ناشناس)
  - `GET/PATCH /api/problems/[id]` (جزئیات + پاسخ‌ها + مسئله‌های مرتبط + ویرایش)
  - `POST /api/problems/[id]/answers` (پاسخ + انتقال خودکار open→discussing)
  - `POST /api/problems/[id]/answers/[answerId]/helpful` (تغییر «مفید بود»)
  - `POST /api/problems/[id]/select-solution` (انتخاب راهکار + جمع‌بندی + solved)
  - `POST /api/problems/[id]/result` (ثبت نتیجه اجرا)
  - `PATCH /api/problems/[id]/status` (انتقال وضعیت با اعتبارسنجی `canTransition`)
  - `POST /api/reports` (گزارش مسئله/پاسخ)
  - `POST /api/moderation/{problems|answers}/[id]` و `POST /api/admin/reports/[id]` (نظارت + بررسی گزارش)
  - `GET /api/admin/moderation` (صف بررسی: مسائل `needsReview`/غیرقابل‌نمایش + گزارش‌ها)
- **امنیت محتوا:** `content-safety.ts` (کد ملی/شماره تماس/شناسه بلند/واژه‌های شناسایی‌کننده) — تأیید نشده = رد با جزئیات، تأیید شده = `needsReview`.
- **حریم خصوصی:** `authorId` همیشه ذخیره می‌شود؛ در خروجی عمومی با `isAnonymous` حذف می‌شود؛ ناظر با `revealAuthor` می‌بیند. هیچ داده بیمار در مدل داده.
- **Anti-Spam:** Rate Limit برای ثبت مسئله (۱۰/ساعت)، پاسخ (۲۰/ساعت)، گزارش (۵/ساعت).
- **RBAC:** مجوزهای جدید `problems:create/update:own/answer/mark-helpful/report` برای اعضا و `content:moderate/reports:review` برای ناظر/مدیر؛ همه در API (نه فقط UI).
- **Audit Log:** `problem.create/draft/update/answer/helpful/solution/result/status`، `report.create`، `moderation.*`، `report.resolve/reject`.
- **عدم رقابت با سیب:** هیچ قابلیت ثبت/ارجاع/پرونده ساخته نشده است.

## ۳. وضعیت ابزارها (همه سبز)

| ابزار            | نتیجه                                                      |
| ---------------- | ---------------------------------------------------------- |
| `pnpm build`     | موفق (۳۳ مسیر)                                             |
| `pnpm typecheck` | موفق (بدون خطا)                                            |
| `pnpm lint`      | موفق (بدون خطا/هشدار)                                      |
| `pnpm test:run`  | ۱۷ فایل، ۱۰۴ تست موفق                                      |
| تست یکپارچه موقت | جریان «ثبت ← پاسخ ← راهکار ← نتیجه» روی دیتابیس واقعی موفق |

## ۴. ریسک‌های امنیتی (فاز ۳)

| ریسک                | وضعیت                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| افشای اطلاعات بیمار | الگوی محتوای حساس + هشدار پیش از انتشار + `needsReview` + ممنوعیت مطلق در مدل داده                   |
| IDOR                | همه مسیرها با `requireUser()`؛ ویرایش/راهکار/نتیجه فقط نویسنده؛ شناسه از پارامتر مسیر نه بدنه        |
| RBAC سمت سرور       | `assertPermission` در همه مسیرهای حساس (ایجاد، نظارت، بررسی گزارش)                                   |
| ناشناس‌سازی         | `authorId` داخلی؛ نام فقط با مجوز ناظر (`revealAuthor`) ظاهر می‌شود                                  |
| Spam                | Rate Limit ثبت مسئله/پاسخ/گزارش به‌ازای کاربر                                                        |
| محتوای نامناسب      | گزارش + صف ناظر + مخفی/حذف/بازیابی با Audit Log و امکان بازگشت (Soft Delete از طریق ModerationState) |
| CSRF/CORS           | API های Same-Origin و کوکی SameSite=Lax (همسو با فاز ۲)                                              |

## ۵. بدهی فنی عمدی

| شناسه | بدهی                                        | دلیل                      | بازپرداخت |
| ----- | ------------------------------------------- | ------------------------- | --------- |
| PH3-1 | برخی به‌روزرسانی‌ها بدون Transaction فراگیر | سادگی در MVP              | فاز ۱۳    |
| PH3-2 | Rate Limit در حافظه                         | بدون زیرساخت خارجی در MVP | فاز ۱۳    |
| PH3-3 | الگوی محتوای حساس مبتنی بر Regex            | مدیریت واژه‌ها در فاز ۷   | فاز ۷     |
| PH3-4 | صف بررسی ناظر UI ابتدایی                    | داشبورد کامل در فاز ۷     | فاز ۷     |
| PH3-5 | «مسئله‌های مرتبط» فقط بر پایه برچسب         | جست‌وجوی کامل در فاز ۸    | فاز ۸     |

## ۶. Migration ها

- `20260904201036_phase3_problem_room` — مدل‌های Problem، ProblemAnswer، ProblemAnswerHelpful، ProblemStatusChange، Tag/ProblemTag، ContentReport + enum ها.
- `20260904201413_phase3_answer_needs_review` — افزودن `needsReview` به ProblemAnswer.

## ۷. فهرست فایل‌های اصلی (فاز ۳)

```
src/
  app/api/problems/route.ts  app/api/problems/[id]/route.ts
  app/api/problems/[id]/answers/route.ts
  app/api/problems/[id]/answers/[answerId]/helpful/route.ts
  app/api/problems/[id]/select-solution/route.ts  result/route.ts  status/route.ts
  app/api/reports/route.ts
  app/api/moderation/{problems,answers}/[id]/route.ts
  app/api/admin/moderation/route.ts  app/api/admin/reports/[id]/route.ts
  app/problems/page.tsx  app/problems/new/page.tsx  app/problems/[id]/page.tsx
  app/admin/moderation/page.tsx  (app/admin/layout.tsx ناوبری مدیریت)
  components/problems/ problem-form  problem-list  problem-card  problem-detail  answer-item  answer-form  report-dialog  tag-input  sensitive-warning
  components/admin/moderation-queue.tsx
  lib/ dates.ts  content-safety.ts  problem-status.ts  problems.ts
  lib/constants/problem.ts  lib/validations/problem.ts  lib/serializers/problem.ts
  lib/rbac.ts (مجوزهای فاز ۳)
prisma/schema.prisma + migrations/20260904201036_phase3_problem_room + 20260904201413_phase3_answer_needs_review
```

## ۸. راهنمای تست دستی

1. `pnpm dev`؛ ورود با OTP (`/auth`) و تکمیل Onboarding.
2. `/problems` → «مطرح‌کردن مسئله» → فرم ساختاریافته را پر کنید؛ اگر متن شامل شماره/کد ملی باشد، هشدار محتوای حساس نمایش داده می‌شود (بدون تأیید امکان انتشار نیست).
3. «ذخیره پیش‌نویس» → بازگشت به `/problems?drafts=1` و مشاهده پیش‌نویس؛ از صفحه مسئله «ویرایش» → «انتشار مسئله».
4. با کاربر دوم به مسئله پاسخ دهید (اولین پاسخ وضعیت را به «در حال بررسی» می‌برد).
5. «مفید بود» را روی پاسخ بزنید (یک‌بار در هر کاربر).
6. نویسنده «انتخاب به‌عنوان راهکار» → جمع‌بندی → مسئله «حل‌شده» و نتیجه را ثبت کنید.
7. «بایگانی مسئله» توسط نویسنده؛ تاریخچه وضعیت در پایین صفحه.
8. مسئله/پاسخ را «گزارش» کنید؛ سپس با کاربر ناظر (role=content_moderator یا admin) در `/admin/moderation` گزارش را بررسی و محتوا را مخفی/حذف کنید.
9. تست RBAC: عضو معمولی به `/api/admin/moderation` دسترسی ندارد (۴۰۳).
10. تاریخ‌ها در UI به شمسی نمایش داده می‌شوند.

## ۹. معیار خروج فاز ۳

- ✅ چرخه «ثبت مسئله تا ثبت نتیجه راهکار» کامل (ایجاد ← پاسخ ← انتخاب راهکار ← جمع‌بندی ← حل‌شدن ← ثبت نتیجه)
- ✅ ناظر می‌تواند محتوای حساس را پنهان/حذف کند (ModerationState + صف بررسی + گزارش)
- ✅ تاریخچه وضعیت قابل پیگیری (`ProblemStatusChange` + نمایش در UI)
- ✅ وضعیت‌ها: open/discussing/solved/archived با اعتبارسنجی انتقال
- ✅ هشدار و کنترل محتوای حساس قبل از انتشار؛ ممنوعیت مشخصات قابل شناسایی بیمار
- ✅ گزارش محتوای نامناسب + فیلتر (وضعیت/برچسب/پیش‌نویس‌ها) + جلوگیری از Spam (Rate Limit)
- ✅ تاریخ شمسی در UI با ذخیره استاندارد در DB

## ۱۰. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-3): problem room — core product

- Structured problems (title, description, context, barrier type, actions, expected outcome, tags, urgency, anonymous, drafts)
- Answers with clarification requests and evidence-based 'helpful' marks; select solution + conclusion + result recording
- Trackable status history (open/discussing/solved/archived) with validated transitions
- Sensitive-content warning and pre-publication control; moderator review queue (hide/remove/restore) + reports
- Persian dates in UI (UTC storage); anti-spam rate limits; RBAC + audit log for all actions
- Pages: /problems, /problems/new, /problems/[id], /admin/moderation
- schema v3 migrations; phase-3 report and docs update"
```

## ۱۱. توقف و انتظار تأیید

بر اساس مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. پس از تأیید، فاز ۴ (بانک تجربه‌های میدانی) آغاز می‌شود که «تبدیل پاسخ موفق اتاق به تجربه» را به همین مدل متصل می‌کند.
