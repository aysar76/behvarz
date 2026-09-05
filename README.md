# هم‌بهورز

شبکه حرفه‌ای، یادگیری و هم‌افزایی بهورزان و مراقبین سلامت.

> **هم‌بهورز، خانه حرفه‌ای بهورزان.**

نقشه راه کامل پروژه در [MASTER_PLAN.md](./MASTER_PLAN.md) و مستندات فنی در [docs/](./docs) قرار دارند.

## وضعیت

- **فاز ۱ (بنیان فنی و سیستم طراحی)** — در حال انجام.
- فاز ۰ نتیجه گرفت که مخزن greenfield است (بدون کد legacy).

## پشته فنی

| لایه       | انتخاب                                                       |
| ---------- | ------------------------------------------------------------ |
| فریم‌ورک   | Next.js 16 (App Router, Turbopack)                           |
| زبان       | TypeScript (Strict)                                          |
| استایل     | Tailwind CSS v4 + توکن‌ها در `globals.css`                   |
| دیتابیس    | SQLite (توسعه) + Prisma 7 (`@prisma/adapter-better-sqlite3`) |
| Validation | zod (سمت سرور)                                               |
| تست        | Vitest + Testing Library                                     |
| فرمت       | Prettier + ESLint (flat config)                              |

## راه‌اندازی (زیر ۳۰ دقیقه)

پیش‌نیاز: Node.js 20.9+ و pnpm.

```bash
pnpm install
cp .env.example .env
pnpm db:migrate    # ساخت dev.db و اعمال migration ها
pnpm db:generate   # تولید Prisma Client
pnpm dev           # http://localhost:3000
```

## دستورهای مفید

```bash
pnpm dev            # سرور توسعه
pnpm lint           # ESLint
pnpm typecheck      # TypeScript
pnpm test           # تست‌ها (watch)
pnpm test:run       # تست‌ها (یک‌بار)
pnpm build          # بیلد production
pnpm format         # فرمت‌کردن با Prettier
pnpm check:all      # lint + typecheck + test + build
pnpm db:studio      # مشاهده دیتابیس
```

## متغیرهای محیطی

پروژه با `.env.example` شروع می‌شود. متغیرهای موردنیاز (بدون مقدار محرمانه):

| متغیر       | توضیح                                            | پیش‌فرض       |
| ----------- | ------------------------------------------------ | ------------- |
| `DATABASE_URL` | آدرس دیتابیس SQLite (توسعه) — برای production با دیتابیس ابری جایگزین شود | `file:./dev.db` |

سایر متغیرها (`OTP_PROVIDER`، `APP_ORIGIN`، `LOG_LEVEL`، `TRUST_PROXY`) مقدار پیش‌فرض دارند و اختیاری هستند.

> **محرمانه‌ها**: هرگز `.env`، `.env.local`، `.env.production` یا فایل‌های رمز/کلید را در Git Commit نکنید. فقط `.env.example` (با مقدارهای خالی یا نمونه) در مخزن می‌ماند.

## Deploy در Vercel

1. پروژه را به GitHub Push کنید (Root Directory همان ریشه مخزن است؛ `package.json` و `pnpm-lock.yaml` در ریشه قرار دارند).
2. در Vercel پروژه‌ای بسازید و از GitHub import کنید. تنظیمات پیش‌فرض:
   - Framework Preset: **Next.js**
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`
   - Root Directory: `.`
3. در Project → Settings → Environment Variables، `DATABASE_URL` را تنظیم کنید.
4. Deploy کنید.

> **نکته مهم درباره دیتابیس**: پروژه در حالت توسعه از **SQLite** (`@prisma/adapter-better-sqlite3`) استفاده می‌کند که فایل‌محور است و روی توابع سرورلس Vercel پایدار نیست (فایل‌سیستم موقتی و فقط‌خواندنی است). برای production در Vercel باید دیتابیس ابری (مانند PostgreSQL با Prisma) جایگزین شود. برای پیش‌نمایش/نمونه می‌توان از Postgres رایگان Vercel استفاده کرد. ساختار Prisma (`prisma/schema.prisma`) حفظ شده و با تغییر `provider` در datasource و مقدار `DATABASE_URL` قابل انتقال است.

## ساختار پروژه

```
src/
  app/          # مسیرها (App Router) + layout + صفحات وضعیت
  components/
    ui/         # کامپوننت‌های پایه (Design System)
    shell/      # App Shell (Header + ناوبری)
  config/       # تنظیمات سایت و ناوبری
  lib/          # db, logger, errors, validation, utils
  fonts/        # فونت خودکار Vazirmatn
  generated/    # خروجی Prisma Client (تولیدشده)
prisma/         # schema + migrations
docs/           # مستندات فنی
```

## مستندات

- [معماری فعلی](./docs/current-architecture.md)
- [محدوده محصول](./docs/product-scope.md)
- [قواعد حریم خصوصی داده](./docs/data-privacy-rules.md)
- [نقشه توسعه و استاندارد ساخت قابلیت](./docs/development-roadmap.md)
- [سیستم طراحی](./docs/design-system.md)
- [بدهی فنی](./docs/technical-debt.md)
- [گزارش فاز ۱](./docs/phase-reports/phase-01-foundation.md)
