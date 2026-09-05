# گزارش فاز ۱۳ — سخت‌سازی، مقیاس و استقرار پایدار

**شاخه پیشنهادی:** `phase/13-hardening`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** آماده تأیید (Stage-Gate) — ابزارها سبز

---

## ۱. خلاصه

فاز ۱۳ «سخت‌سازی، مقیاس و استقرار پایدار» را در چهار بخش (Security، Quality،
Performance، Deployment) اجرا می‌کند. با توجه به توپولوژی فعلی (SQLite تک‌نمونه،
بدون زیرساخت خارجی/تصمیم تأییدشده برای تغییر Database)، این فاز موارد قابل‌اجرا و
قابل‌تست را پیاده‌سازی و موارد وابسته به زیرساخت/تصمیم را مستند و به‌عنوان بدهی/بک‌لاگ
ثبت می‌کند:

1. **Security**: Security Headers + CSP، CSRF (Proxy)، Health Check، Validation
   محیطی (`env.ts`)، کش واژه‌های حساس، بازبینی Account Enumeration/Brute Force،
   مستندات `security-review.md` و `incident-response.md`.
2. **Quality**: ۳۴ تست جدید (واحد + Integration واقعی با SQLite موقت)؛ پوشش
   «مسیرهای حیاتی» (جست‌وجو/کشف، همیاری، اعلان، اعتبارسنجی اعلان، CSRF، TTL Cache).
3. **Performance**: ایندکس‌های موجود بازبینی شدند (کافی برای توپولوژی فعلی)؛
   کش واژه‌های حساس (PH7-3)؛ مستندات CWV/راهنمای اندازه‌گیری واقعی.
4. **Deployment**: Dockerfile (standalone)، Backup/Restore **آزمایش‌شده**،
   مستندات `deployment-guide.md`، `backup-and-restore.md`، `monitoring.md`،
   `api-contracts.md`، اسکریپت Load Test (k6) و راهنمای اجرای آن.

**نکته راهبردی:** شاخص موفقیت فاز (آپ‌تایم ۹۹.۵٪ در ماه اول پس از استقرار) پس از
استقرار واقعی قابل اندازه‌گیری است؛ این فاز زیرساخت لازم (Health Check، Rollback،
Backup/Restore، Monitoring) را آماده می‌کند. مهاجرت به PostgreSQL و معماری
چندنمونه/Redis به‌عنوان «نیازمند تأیید» مستند شده و اجرا نشده است.

## ۲. خروجی‌های این فاز (در مخزن)

| سند/فایل                                    | محتوا                                                              |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `next.config.ts`                            | Security Headers + CSP + `output: "standalone"`                    |
| `src/proxy.ts`                              | CSRF برای همه درخواست‌های تغییردهنده `/api/*`                      |
| `src/lib/csrf.ts` + `csrf.test.ts`          | منطق CSRF قابل‌تست + تست                                           |
| `src/lib/env.ts`                            | اعتبارسنجی محیطی با zod (Fail-fast در Production)                  |
| `src/app/api/health/route.ts`               | Health Check (DB + uptime)                                         |
| `src/lib/ttl-cache.ts` + تست                | کش TTL عمومی                                                       |
| `src/lib/moderation.ts`                     | کش واژه‌های حساس (بستن PH7-3)                                     |
| تست‌های واحد جدید                           | `notifications.test.ts`، `peer.test.ts`، `validations/notification.test.ts` |
| Integration test                            | `src/lib/integration/critical-paths.test.ts` (دیتابیس واقعی SQLite موقت) |
| `Dockerfile` + `.dockerignore`              | استقرار containerized (standalone)                                 |
| `scripts/backup.mjs` + `scripts/restore.mjs` | پشتیبان‌گیری/بازیابی؛ `pnpm backup` / `pnpm restore`              |
| `scripts/load-test.js`                      | اسکریپت Load Test (k6) برای مقیاس تا ۵۵ هزار عضو                   |
| مستندات عملیاتی                             | `deployment-guide.md`، `backup-and-restore.md`، `security-review.md`، `incident-response.md`، `monitoring.md`، `api-contracts.md` |
| به‌روزرسانی مستندات                         | changelog، technical-debt (بستن PH7-3)، known-limitations، development-roadmap |

## ۳. جزئیات پیاده‌سازی

### ۳.۱ Security

- **Security Headers** در `next.config.ts`: `Content-Security-Policy` (default-src
  'self'، script/style با `'unsafe-inline'` برای سازگاری Next/Tailwind، بدون
  `frame-ancestors` خارجی)، `X-Frame-Options: DENY`، `X-Content-Type-Options:
  nosniff`، `Referrer-Policy`، `Permissions-Policy` (بدون دوربین/میکروفون/موقعیت/
  پرداخت/USB)، `Strict-Transport-Security` فقط در Production.
- **CSRF** در `src/proxy.ts`: برای همه درخواست‌های غیر GET به `/api/*`، در صورت
  وجود `Origin`/`Referer`، مبدأ با `APP_ORIGIN` یا `Host` درخواست مقایسه می‌شود؛
  تطابق‌نداشتن → 403. (درخواست‌های بدون هدر مبدأ — مثل curl — مجازند؛ استاندارد.)
- **Health Check**: `GET /api/health` → بررسی `SELECT 1` روی DB + uptime.
- **Validation محیطی**: `src/lib/env.ts` با zod؛ در Production متغیر نامعتبر =
  Fail-fast؛ در توسعه فقط هشدار + پیش‌فرض.
- **کش واژه‌های حساس**: `getActiveSensitiveTerms` با `TtlCache` (TTL ۶۰ ثانیه)
  — بستن PH7-3.
- **بازبینی Account Enumeration**: `request-otp` برای هر شماره یکسان پاسخ می‌دهد
  (`sent: true` در Production؛ `devCode` فقط در توسعه) و بین «ثبت‌نام/ورود» تفکیک
  نمی‌کند؛ شماره‌های دارای حساب قابل تشخیص نیستند. (در `security-review.md` مستند شد.)
- **IP/Trusted Proxy**: `TRUST_PROXY` تعریف و در `env.ts` اعتبارسنجی می‌شود؛ در
  Production پروکسی باید هدرهای IP را بازنویسی کند.

### ۳.۲ Quality

- تست‌های واحد جدید:
  - `notifications.test.ts`: منطق `notifyUser` (جلوگیری از اعلان به خود، احترام به
    تنظیمات غیرفعال، ایجاد اعلان) با `prisma` mock.
  - `peer.test.ts`: امتیازدهی/رتبه‌بندی `suggestHelpers`، محدودیت تعداد، ترتیب بر
    اساس نام در امتیاز برابر؛ `requireOpenHelpRequest` (NOT_FOUND/CONFLICT/ok).
  - `validations/notification.test.ts`: اسکیمای تنظیمات اعلان (پیش‌فرض، خالی، نوع
    ناشناخته، bool، بیش از ۵۰).
  - `csrf.test.ts` و `ttl-cache.test.ts`.
- **Integration test** `src/lib/integration/critical-paths.test.ts` با **دیتابیس
  واقعی SQLite موقت** (`prisma db push` در `beforeAll` روی فایل موقت؛ پاک‌سازی در
  `afterAll`): جست‌وجوی مسائل/تجربه/اعضا، حذف پیش‌نویس/مخفی/حذف‌شده از جست‌وجو،
  کشف علاقه‌محور + فعالیت‌های نیمه‌تمام، سریالایز مسئله.
- آمار: **۲۹۶ تست (۴۲ فایل)** — نسبت به فاز ۱۲ (+۳۴ تست).

### ۳.۳ Performance

- بازبینی ایندکس‌های دیتابیس: ایندکس‌های موجود روی مسیرهای داغ (status/moderation،
  userId+read اعلان، composite یکتا تعاملات، کلیدهای خارجی) کافی‌اند؛ Migration
  اختیاری اضافه نشد (پرهیز از ریسک/اسپکولیت).
- کش واژه‌های حساس (PH7-3) یکی از منابع پرتکرار DB را حذف کرد.
- اهداف CWV و اندازه‌گیری واقعی پس از استقرار در `monitoring.md` مستند شد.

### ۳.۴ Deployment

- **Dockerfile** چندمرحله‌ای (deps → builder → runner) با `output: "standalone"`،
  اجرای `prisma generate` در بیلد، حجم `/data` برای SQLite.
- **Backup/Restore**: `scripts/backup.mjs` (اسنپ‌شات online با `db.backup`) و
  `scripts/restore.mjs` (با `integrity_check` پیش از جایگزینی).
- **آزمایش عملی Restore انجام شد**: دیتابیس آزمایشی ساخته شد، ردیف درج، پشتیبان،
  حذف ردیف، بازیابی → داده بازگشت (شمارش و مقدار تأیید شد). جزئیات:
  `docs/backup-and-restore.md` بخش ۴.
- **Load Test**: `scripts/load-test.js` (k6) با سناریوی خواندهمحور (health/problems/
  experiences/circles/search + OTP کم‌حجم) و مراحل ramp برای مقیاس تا ۵۵ هزار عضو؛
  اجرا پس از استقرار واقعی.
- **CI**: بدون تغییر ضروری (workflow موجود lint/typecheck/format/test/build را
  پوشش می‌دهد و Integration test شامل `prisma db push` در CI قابل اجراست).
- **Rollback**: راهنمای Rollback در `deployment-guide.md` (تصویر قبلی + Restore).

## ۴. ابزارها (در گیت)

| ابزار      | نتیجه                     |
| ---------- | ------------------------- |
| `lint`     | بدون خطا (۰ خطا)          |
| `typecheck`| بدون خطا                  |
| `test:run` | ۲۹۶ تست موفق (+۳۴ تست جدید)|
| `build`    | موفق (با `output: standalone`) |

## ۵. امنیت و حریم خصوصی

- Security Headers + CSRF برای همه مسیرهای تغییردهنده.
- `env.ts` Fail-fast در Production برای جلوگیری از پیکربندی اشتباه.
- Health Check بدون داده حساس؛ فقط وضعیت DB و uptime.
- هیچ داده بیمار جدیدی ذخیره نمی‌شود؛ کش‌ها فقط در حافظه‌اند.
- Backup/Restore دارای `integrity_check`؛ دسترسی به پشتیبان باید محدود باشد.
- Account Enumeration و Brute Force بازبینی و مستند شدند (بدون تغییر رفتار لازم).

## ۶. بدهی/تأخیر عمدی (Backlog)

| شناسه | مورد                                                                       | بازپرداخت               |
| ----- | -------------------------------------------------------------------------- | ----------------------- |
| PH13-1| SQLite تک‌نمونه؛ مهاجرت به PostgreSQL «نیازمند تأیید»                       | پس از تأیید تصمیم Database |
| PH13-2| Rate Limit در حافظه (تک‌نمونه)؛ توزیع‌شده با چندنمونه                        | با مقیاس/چندنمونه        |
| PH13-3| OTP واقعی (SMS) ساخته نشد                                                   | پس از زیرساخت قطعی      |
| PH13-4| اعلان بلادرنگ (WebSocket/Push) ساخته نشد                                    | پس از زیرساخت قطعی      |
| PH13-5| جست‌وجوی Full-Text فارسی ساخته نشد                                          | با PostgreSQL/سرویس جست‌وجو |
| PH13-6| CSP شامل `'unsafe-inline'` است                                              | بازبینی هنگام نیاز      |
| PH13-7| Load Test/استقرار واقعی انجام نشد (بدون زیرساخت)                            | پس از استقرار           |
| PH13-8| اپلیکیشن Deploy خودکار (registry/rollout) ساخته نشد                         | پس از تعیین زیرساخت هدف |

## ۷. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-13): hardening, scale readiness & deployment

- Security headers + CSP + standalone output (next.config.ts)
- CSRF protection via proxy.ts + lib/csrf.ts (Origin/Referer check on all
  state-changing /api requests) with unit tests
- Health check endpoint /api/health (DB + uptime)
- Env validation module lib/env.ts (zod, fail-fast in production,
  TRUST_PROXY/APP_ORIGIN/LOG_LEVEL)
- TTL cache lib/ttl-cache.ts + sensitive-term cache (closes PH7-3)
- New unit tests: notifications, peer matching, notification validation,
  csrf, ttl-cache (+34 tests, 296 total)
- DB-backed integration test (src/lib/integration/critical-paths.test.ts)
  covering search/discovery/drafts/serialization on a temp SQLite db
- Dockerfile (multi-stage, standalone) + .dockerignore
- Backup/restore scripts (online snapshot + integrity-checked restore),
  pnpm backup/restore, restore practically tested
- Load test script (k6) for growth to ~55k members
- Ops docs: deployment-guide, backup-and-restore, security-review,
  incident-response, monitoring, api-contracts
- Docs updated: changelog, technical-debt, known-limitations, roadmap
- lint/typecheck/test(296)/build all green"
```

## ۸. توقف و انتظار تأیید

طبق مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. موارد «نیازمند
تأیید» (مهاجرت به PostgreSQL، چندنمونه، سرویس‌های خارجی، CSP سخت‌گیرانه‌تر) اجرا
نشده‌اند و برای ادامه به فاز ۱۴ (افق بلند) یا استقرار واقعی، ابتدا باید تصمیمات
مربوطه تأیید شوند.