# تغییرات (Changelog)

## فاز ۳ — اتاق مسئله (هسته محصول)

- مدل مسئله ساختاریافته: عنوان، شرح، زمینه/شرایط، نوع مانع، اقدامات انجام‌شده، نتیجه مورد انتظار، برچسب‌ها، فوریت، انتشار ناشناس، پیش‌نویس.
- وضعیت‌ها (open/discussing/solved/archived) با **تاریخچه وضعیت قابل پیگیری** (`ProblemStatusChange`).
- پاسخ ساختاریافته + «درخواست توضیح» + «مفید بود» (بدون لایک عمومی) + انتخاب راهکار با جمع‌بندی + ثبت نتیجه اجرا.
- هشدار/کنترل محتوای حساس پیش از انتشار (`content-safety.ts`)؛ محتوای مشکوک به صف بررسی ناظر می‌رود.
- گزارش محتوای نامناسب (`ContentReport`) + اقدامات نظارت (مخفی/حذف/بازیابی) توسط ناظر با Audit Log.
- تاریخ شمسی در UI (`dates.ts`) با ذخیره استاندارد UTC در دیتابیس؛ Rate Limit برای مسئله/پاسخ/گزارش.
- Migration های فاز ۳ (Problem، ProblemAnswer، Tag، ContentReport و...).
- صفحه‌های `/problems`، `/problems/new`، `/problems/[id]` و مدیریت محتوا `/admin/moderation`.

## فاز ۲ — هویت، احراز هویت و پروفایل حرفه‌ای

- ورود با شماره موبایل + OTP (Provider قابل جایگزینی؛ `devCode` فقط در توسعه)، Rate Limit، نشست امن (hash توکن + کوکی HttpOnly) و خروج از همه دستگاه‌ها (`logout-all`).
- Onboarding چهارمرحله‌ای و پروفایل حرفه‌ای: استان/شهرستان، سابقه بازه‌ای، مهارت‌ها/علایق، معرفی، Visibility.
- نقش‌ها (۸ نقش) + RBAC در Server و UI؛ درخواست و تأیید عضویت حرفه‌ای توسط مدیر.
- Audit Log برای ورود، ویرایش پروفایل و بررسی عضویت.
- Migration فاز ۲ (OtpCode، Session، MembershipRequest، Skill/Interest، AuditLog و توسعه User).
- رفع گیرنده: صفحه `/me` در `AppShell` قرار گرفت تا `ToastProvider` در دسترس باشد (خطای `useToast` رفع شد).

## فاز ۱ — بنیان فنی و سیستم طراحی (شروع)

- راه‌اندازی Next.js 16 (App Router, Turbopack) با TypeScript Strict.
- Design System: توکن‌ها، RTL، فونت Vazirmatn (self-host)، کامپوننت‌های پایه و App Shell.
- لایه دیتابیس: Prisma 7 + SQLite + adapter better-sqlite3؛ مدل پیش‌نویس User.
- ابزارهای پایه: zod (Validation)، logger، AppError، Vitest، ESLint، Prettier، CI اولیه.
- صفحات وضعیت: error / global-error / loading / not-found و پیش‌نمایش `/ui`.
