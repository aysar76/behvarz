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
