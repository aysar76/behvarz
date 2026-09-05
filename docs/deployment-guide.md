# راهنمای استقرار (Deployment Guide)

**وضعیت:** فاز ۱۳ — سخت‌سازی، مقیاس و استقرار پایدار
**تاریخ:** مهر ۱۴۰۵

هدف این سند، استقرار پایدار نسخه Production روی یک نمونه (single instance) با SQLite
و Docker است. این توپولوژی «معیار خروج» فاز ۱۳ را پوشش می‌دهد؛ مهاجرت به PostgreSQL
(برای مقیاس ۵۵ هزار نفره) یک تصمیم «نیازمند تأیید» است و در این سند مستند می‌شود اما اجرا نمی‌شود.

---

## ۱. پیش‌نیازها

- Node.js ≥ ۲۲ (برای بیلد) — در CI از ۲۲ استفاده می‌شود
- pnpm ≥ ۱۱
- Docker (برای اجرای Production)
- متغیرهای محیطی (بخش ۳)

## ۲. توپولوژی

```
Internet → (HTTPS/TLS Terminator: nginx/پروکسی) → Next.js (Node, port 3000, standalone)
                                                   → SQLite (فایل در /data)
```

- **تک‌نمونه**: چون Rate Limit و Cache در حافظه‌اند، در این فاز فقط یک نمونه سرویس می‌دهد.
- **HTTPS**: TLS در لبه قطع شود؛ HSTS در `next.config.ts` فعال است (Production).
- **پروکسی قابل‌اعتماد**: برای صحت `getClientIp`، پروکسی باید هدرهای `x-forwarded-for` را
  بازنویسی کند و `TRUST_PROXY=true` تنظیم شود.

## ۳. متغیرهای محیطی

| متغیر | الزامی | مقدار نمونه | توضیح |
| ----- | ------ | ------------ | ----- |
| `DATABASE_URL` | بله | `file:/data/behvarz.db` | مسیر فایل SQLite |
| `NODE_ENV` | بله | `production` | توسط محیط اجرا |
| `OTP_PROVIDER` | خیر | `dev` | فقط `dev` موجود است |
| `APP_ORIGIN` | بله (Production) | `https://behvarz.example.ir` | مبدأ مجاز برای CSRF |
| `TRUST_PROXY` | بله (اگر پروکسی هست) | `true` | بازنویسی هدر IP توسط پروکسی |
| `LOG_LEVEL` | خیر | `info` | سطح لاگ |

> `.env` در گیت ایگنور شده است؛ فقط `.env.example` کامیت می‌شود. در Production متغیرها از
> سکوتِ محیط/Orchestrator تأمین شوند، نه فایل commit‌شده.

## ۴. ساخت و اجرا با Docker

```bash
# بیلد
docker build -t behvarz:latest .

# اجرا با حجم داده
docker run -d --name behvarz \
  -p 3000:3000 \
  -e DATABASE_URL="file:/data/behvarz.db" \
  -e NODE_ENV=production \
  -e APP_ORIGIN="https://behvarz.example.ir" \
  -v behvarz-data:/data \
  behvarz:latest
```

نکته‌ها:

- تصویر `standalone` است (`output: "standalone"` در `next.config.ts`).
- Prisma Client در مرحله بیلد تولید می‌شود (`pnpm db:generate`)؛ پوشه `src/generated` در گیت نیست.
- Migrationها در `prisma/migrations` کپی می‌شوند؛ برای اجرای Migration دستی:

```bash
docker exec -it behvarz sh -c "DATABASE_URL=file:/data/behvarz.db npx prisma migrate deploy --config prisma7.config.ts"
```

## ۵. کنترل‌شده Migration و Rollback

1. **قبل از استقرار نسخه جدید**: `pnpm backup` (بخش backup-and-restore.md).
2. **Migration**: فقط `migrate deploy` (نه `dev`) روی Production؛ هیچ `migrate reset` انجام نمی‌شود.
3. **Rollback**: تصویر قبلی + فایل دیتابیس قبلی را برگردانید:
   - توقف نمونه جدید
   - `pnpm restore <backup-file>` روی فایل دیتابیس
   - اجرای تصویر قبلی با دیتابیس بازیابی‌شده
4. **اصل**: Migrationهای غیرقابل بازگشت (حذف جدول/ستون) بدون تأیید صریح انجام نمی‌شوند.

## ۶. Health Check

- مسیر: `GET /api/health` → `{ ok: true, data: { status: "ok", checks: { database: "up" }, uptimeSeconds, timestamp } }`
- استفاده در پایش/لودبالانسر/Orchestrator برای بررسی زنده‌بودن نمونه و اتصال DB.

## ۷. CI/CD

- **CI**: `.github/workflows/ci.yml` — lint/typecheck/format/test/build روی push و PR به `main`.
- **Deploy**: در این فاز اسکریپت‌های دستی (`scripts/`) و این راهنما آماده‌اند؛ استقرار خودکار
  (build image + push registry + rollout) پس از مشخص‌شدن زیرساخت هدف به‌صورت جداگانه تنظیم می‌شود
  (فاز ۱۳ محدوده Deployment را «آماده‌سازی» می‌داند؛ بدون زیرساخت واقعی اتصال داده نمی‌شود).

## ۸. پشتیبانی و Monitoring

- لاگ‌ها از `src/lib/logger.ts` (console) خروجی می‌گیرند؛ در Production توسط systemd/Docker
  جمع‌آوری می‌شوند.
- Health Check بالا برای پایش.
- جزئیات در `docs/monitoring.md` و `docs/incident-response.md`.

## ۹. محدودیت‌های استقرار در این فاز

- **SQLite تک‌نمونه**: برای شروع و مقیاس محدود مناسب است؛ ۵۵ هزار عضو نیازمند PostgreSQL و
  معماری چندنمونه/Read-Replica است (تصمیم تأییدشده).
- **Rate Limit در حافظه**: با چند نمونه مؤثر نیست (باید به Redis مهاجرت کند).
- **OTP واقعی**: ارسال SMS نیازمند سرویس رسمی است.

## ۱۰. فهرست نهایی قبل از Production

- [ ] `APP_ORIGIN` و `TRUST_PROXY` تنظیم شده‌اند
- [ ] یک پشتیبان گرفته و Restore در محیط آزمایشی تست شده است
- [ ] `pnpm backup` روزانه فعال شده است
- [ ] `/api/health` در پایش پاسخ می‌دهد
- [ ] HTTPS + HSTS فعال است
- [ ] پروکسی هدرهای IP را بازنویسی می‌کند