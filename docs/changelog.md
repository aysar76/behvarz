# تغییرات (Changelog)

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
