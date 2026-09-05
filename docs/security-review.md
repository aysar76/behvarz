# بررسی امنیتی (Security Review)

**وضعیت:** فاز ۱۳ — سخت‌سازی، مقیاس و استقرار پایدار
**تاریخ:** مهر ۱۴۰۵

این سند وضعیت واقعی امنیت پلتفرم را بر اساس کد مستند می‌کند و کنترل‌های موجود،
پروتکل‌های جاری و مواردی که نیازمند زیرساخت/تصمیم خارجی هستند را فهرست می‌کند.
این سند صرفاً بر اساس وضعیت واقعی کد به‌روز می‌شود.

---

## ۱. کنترل‌های پیاده‌سازی‌شده

| موضوع | وضعیت | محل/توضیح |
| ----- | ------ | --------- |
| Session | امن | `src/lib/auth/session.ts`: توکن تصادفی ۳۲ بایتی (base64url) + hash SHA-256 در DB؛ کوکی `httpOnly` + `sameSite=lax` + `secure` در Production + TTL ۳۰ روز؛ `revokeAllSessions` برای خروج از همه دستگاه‌ها |
| OTP | امن | `src/lib/auth/otp.ts`: کد ۶ رقمی، hash شده، TTL ۱۰ دقیقه، حداکثر ۵ تلاش، یک‌بارمصرف (`consumedAt`) |
| Rate Limit | موجود (درون‌فرآیندی) | `src/lib/auth/rate-limit.ts`: سطل در حافظه (Map) با پاک‌سازی دوره‌ای؛ روی OTP، ثبت مسئله/تجربه، پاسخ، گزارش، پیام همیاری و... |
| RBAC | امن | `src/lib/rbac.ts` + `assertPermission` در همه APIهای تغییردهنده؛ `admin/layout.tsx` گیت سمت سرور برای زیردرخت `/admin` |
| Validation سمت سرور | امن | zod در همه مسیرهای ورودی (`validateInput`)؛ بدون SQLi (Prisma پارامتری) |
| محتوای حساس | موجود | `src/lib/content-safety.ts` (Regex + نرمال‌سازی ارقام فارسی) + `SensitiveTerm` مدیریت‌شده در DB با کش ۶۰ ثانیه‌ای (`getActiveSensitiveTerms`) |
| Audit Log | امن | `src/lib/audit.ts`: ~۷۵ نقطه فراخوانی در مسیرهای تغییردهنده/مدیریتی؛ `ModerationDecision` برای بازبینی/بازگشت تصمیم |
| Soft Delete | موجود | مدل‌ها از `moderation: hidden/removed` و `status` استفاده می‌کنند؛ بدون حذف فیزیکی محتوا در جریان عادی |
| Security Headers | **جدید در فاز ۱۳** | `next.config.ts`: CSP، X-Frame-Options=DENY، X-Content-Type-Options=nosniff، Referrer-Policy، Permissions-Policy، HSTS (فقط Production) |
| CSRF | **جدید در فاز ۱۳** | `src/proxy.ts` + `src/lib/csrf.ts`: بررسی `Origin`/`Referer` برای تمام درخواست‌های تغییردهنده به `/api/*` |
| Health Check | **جدید در فاز ۱۳** | `src/app/api/health/route.ts`: بررسی اتصال DB + uptime |
| Validation محیطی | **جدید در فاز ۱۳** | `src/lib/env.ts`: اعتبارسنجی `NODE_ENV`/`DATABASE_URL`/`OTP_PROVIDER`/`APP_ORIGIN`/`TRUST_PROXY` با zod؛ Fail-fast در Production |
| Cache واژه‌های حساس | **جدید در فاز ۱۳** | `src/lib/ttl-cache.ts` + استفاده در `scanContentForModeration` (PH7-3) |

## ۲. پروتکل‌ها و تصمیم‌های جاری

- **IP**: `getClientIp` به `x-forwarded-for`/`x-real-ip` اعتماد می‌کند. در Production باید
  یک پروکسی قابل‌اعتماد در جلو باشد که این هدرها را بازنویسی کند و `TRUST_PROXY` به‌درستی تنظیم شود.
  بدون پروکسی قابل‌اعتماد، Rate Limit مبتنی بر IP قابل جعل است.
- **Secret Management**: در حال حاضر هیچ Secret دایمی (JWT/API Key) نداریم؛ امنیت نشست بر hash
  در DB است. هنگام افزودن سرویس‌های خارجی (SMS، ایمیل، Push، Postgres) هر کلید از طریق
  متغیر محیطی تأمین و با `src/lib/env.ts` اعتبارسنجی می‌شود. از قراردادن Secret در کد یا `.env` در گیت جدا خودداری شود.
- **Account Enumeration**: OTP بدون تفکیک «ثبت‌نام/ورود» و برای هر شماره یکسان پاسخ می‌دهد
  (`request-otp` همیشه `sent: true` در Production). بنابراین شماره‌های دارای حساب قابل تشخیص نیستند.
- **Brute Force**: OTP محدود به ۵ تلاش و Rate Limit شماره/IP دارد.
- **CSRF**: Cookie با `sameSite=lax` + بررسی `Origin`/`Referer` در Proxy. درخواست‌های بدون
  `Origin`/`Referer` (مثل curl/سروربه‌سرور) مجازند؛ این رفتار استاندارد است.

## ۳. موارد نیازمند زیرساخت/تصمیم (Backlog امنیتی)

| مورد | توضیح | پیش‌نیاز |
| ---- | ----- | -------- |
| Rate Limit توزیع‌شده | سطل در حافظه فقط برای تک‌نمونه مناسب است؛ با چند نمونه/مقیاس به Redis/حداقل آداپتر جایگزین نیاز دارد | زیرساخت خارجی |
| ارسال OTP واقعی | Provider فقط `dev` است | سرویس SMS با قرارداد رسمی |
| مهاجرت به PostgreSQL | SQLite تک‌نویسنده محدودیت مقیاس دارد | تصمیم تأییدشده برای تغییر Database |
| Incident Response ابزاری | خط‌مشی در `docs/incident-response.md` مستند شده؛ بدون ابزار خودکار اعلان | تصمیم عملیاتی |
| خروجی CSP سخت‌گیرانه‌تر | CSP فعلی شامل `'unsafe-inline'` برای اسکریپت/استایل است (سازگاری با Next/Tailwind)؛ سخت‌سازی بیشتر با Nonce نیازمند بازبینی | تست دستی کامل |

## ۴. موارد «نیازمند تأیید» (طبق اصول ثابت)

- تغییر Framework / Upgrade عمده
- تغییر Backend/Database (مثلاً PostgreSQL)
- تغییر احراز هویت یا ذخیره مدارک هویتی
- اتصال سرویس رسمی/پولی یا هوش مصنوعی خارجی

همه موارد بالا بدون تأیید صریح انجام نمی‌شوند.