# معماری فعلی (Current Architecture)

**وضعیت:** به‌روزرسانی برای فاز ۳ — تاریخ: مهر ۱۴۰۵

## وضعیت واقعی مخزن

- مخزن `behvarz` از وضعیت greenfield (فاز ۰) آغاز شد؛ هیچ کد legacy (PHP 7.3 / MariaDB 10.1) وجود ندارد.
- هیچ زیرساخت Production مستقر نشده است؛ توسعه روی SQLite محلی انجام می‌شود.

## معماری هدف (تصویب‌شده برای فاز ۱)

| لایه       | انتخاب                                 | دلیل                                                          |
| ---------- | -------------------------------------- | ------------------------------------------------------------- |
| فریم‌ورک   | Next.js (App Router)                   | Full-stack تک‌کدبیس، SSR/SSC، سازگار با استقرار ساده          |
| زبان       | TypeScript (Strict)                    | امنیت نوع در سطح پروژه                                        |
| استایل     | Tailwind CSS + CSS Variables (توکن‌ها) | موبایل‌فرست، RTL، کم‌حجم                                      |
| دیتابیس    | SQLite (توسعه) از طریق Prisma          | بدون نیاز به سرویس خارجی؛ مسیر مهاجرت به PostgreSQL در فاز ۱۳ |
| ORM        | Prisma                                 | Schema-first، Migration کنترل‌شده، Type-Safe                  |
| Validation | zod (سمت سرور)                         | قرارداد API شفاف                                              |
| تست        | Vitest                                 | سبک، سریع، سازگار با TS                                       |
| باندل/اجرا | Node 24 / pnpm                         | نصب موجود روی ماشین توسعه                                     |

## معماری احراز هویت و هویت (فاز ۲)

- **ورود:** شماره موبایل + OTP (کد با hash در `OtpCode`، Rate Limit، Provider قابل جایگزینی در `src/lib/auth/otp-provider.ts`).
- **نشست:** توکن تصادفی با ذخیره `sha256` در `Session`؛ کوکی `bhz_session` با HttpOnly/SameSite=Lax؛ خروج از همه دستگاه‌ها از طریق `revokeAllSessions`.
- **RBAC:** ماتریس مجوز در `src/lib/rbac.ts` (۸ نقش)؛ کنترل در API با `assertPermission` و در UI با layout محافظت‌شده.
- **Audit Log:** رویدادهای حساس در `AuditLog` ثبت می‌شوند (`src/lib/audit.ts`).
- **دسترسی کاربر فعلی:** `getCurrentUser`/`requireUser` از روی کوکی نشست (`src/lib/auth/current-user.ts`).

## معماری اتاق مسئله (فاز ۳)

- **مدل داده:** `Problem` (با وضعیت/فوریت/نوع مانع/ناشناس/پیش‌نویس/نظارت)، `ProblemAnswer` (+ «مفید بود» از طریق `ProblemAnswerHelpful` و انتخاب راهکار)، `ProblemStatusChange` (تاریخچه وضعیت)، `Tag/ProblemTag`، `ContentReport`.
- **محرک انگیزشی:** ساختار اجباری مسئله (نه پست+کامنت) و چرخه «ثبت مسئله ← پاسخ ← انتخاب راهکار ← ثبت نتیجه اجرا» مطابق حلقه بسته دانش.
- **امنیت محتوا:** `content-safety.ts` الگوهای اطلاعات قابل شناسایی را پیش از انتشار هشدار می‌دهد؛ تأیید نشده = رد، تأیید شده = `needsReview` برای ناظر.
- **نظارت:** `POST /api/moderation/{problems|answers}/[id]` (مخفی/حذف/بازیابی) و `POST /api/admin/reports/[id]` با `assertPermission("content:moderate"/"reports:review")` + Audit Log.
- **ناشناس‌سازی:** `authorId` همیشه ذخیره می‌شود اما در `serializeProblem` با `isAnonymous` از خروجی حذف می‌شود؛ ناظران با `revealAuthor` می‌توانند نویسنده را ببینند.
- **تاریخ شمسی:** فقط در لایه UI (`src/lib/dates.ts`)؛ ذخیره استاندارد UTC در دیتابیس.
- **Anti-Spam:** Rate Limit در حافظه برای ثبت مسئله (۱۰/ساعت)، پاسخ (۲۰/ساعت) و گزارش (۵/ساعت) به‌ازای کاربر.

## محدودیت‌ها و مفروضات

- تاریخ شمسی فقط در لایه UI نمایش داده می‌شود؛ ذخیره‌سازی در دیتابیس به فرمت استاندارد (UTC/ISO) است.
- طراحی Mobile-First با پشتیبانی کامل RTL.
- بدون داده بیمار؛ ثبت تجربه فقط ناشناس‌سازی‌شده (رجوع به `data-privacy-rules.md`).
