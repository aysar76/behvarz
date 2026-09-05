# گزارش فاز ۱ — بنیان فنی و سیستم طراحی

**شاخه پیشنهادی:** `phase/01-foundation`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** تکمیل و آماده تأیید (Stage-Gate)

---

## ۱. خلاصه

فاز ۰ نتیجه گرفت که مخزن greenfield است؛ بنابراین فاز ۱ از صفر پایه فنی و سیستم طراحی را ساخت:
Next.js 16 (App Router + Turbopack)، TypeScript Strict، Tailwind v4، Prisma 7 + SQLite، zod، Vitest، ESLint/Prettier، CI اولیه و Design System کامل (RTL + Vazirmatn + توکن‌ها + کامپوننت‌های پایه + App Shell + صفحات وضعیت).

## ۲. بررسی (Review)

- پشته فنی با تأیید کاربر انتخاب شد (Next.js + Prisma + SQLite).
- قواعد `data-privacy-rules.md` رعایت شده: مدل داده هیچ داده بیمار ندارد.
- هیچ قابلیتی شبیه سیب ساخته نشده است.
- ساختار پوشه‌ها در `README.md` مستند شده است.

## ۳. وضعیت ابزارها (همه سبز)

| ابزار | نتیجه |
|---|---|
| `pnpm build` | موفق (Turbopack؛ ۳ مسیر: `/`, `/_not-found`, `/ui`) |
| `pnpm typecheck` | موفق (بدون خطا) |
| `pnpm lint` | موفق (بدون خطا/هشدار) |
| `pnpm test:run` | ۵ فایل، ۲۰ تست موفق |
| `pnpm format:check` | موفق |
| Dev Server | ۲۰۰ روی `/` و `/ui`؛ RTL و فونت تأیید شد |

## ۴. ریسک‌های امنیتی (فاز ۱)

| ریسک | وضعیت |
|---|---|
| Injection/Validation | لایه `validation.ts` با zod آماده است؛ هنوز هیچ ورودی کاربری ذخیره نمی‌شود |
| Secret Management | `DATABASE_URL` در `.env` است و `.gitignore` آن را مستثنی کرده؛ `.env.example` نمونه عمومی است |
| عدم افشای داده بیمار | هیچ داده حساسی در اسکیمای دیتابیس وجود ندارد |
| CORS/CSRF | هنوز API تعاملی نداریم؛ هنگام ساخت Route Handler در فازهای بعد بررسی می‌شود |
| لایه دیتابیس | از adapter استاندارد (`better-sqlite3`) با Auth معادل Prisma استفاده شده |

## ۵. بدهی فنی عمدی

| بدهی | دلیل |
|---|---|
| SQLite در توسعه | سادگی؛ مهاجرت به PostgreSQL در فاز ۱۳ |
| مدل User پیش‌نویس | بازطراحی کامل در فاز ۲ |
| کامپوننت‌های Modal/Toast بدون انیمیشن ورود | سبک و کم‌مصرف در MVP |
| `src/generated/` (Prisma) | خروجی تولیدشده؛ بازتولید با `pnpm db:generate` |

## ۶. Migration ها

- یک migration اولیه: `prisma/migrations/*_init` (جدول `User`).
- دستورها: `pnpm db:migrate` (توسعه)، `pnpm db:generate`، `pnpm db:studio`.

## ۷. فهرست فایل‌های اصلی

```
src/
  app/
    layout.tsx  globals.css  page.tsx  loading.tsx  error.tsx
    global-error.tsx  not-found.tsx
    ui/page.tsx                      # پیش‌نمایش Design System
  components/
    ui/  button input textarea badge spinner skeleton modal tabs toast empty-state
    shell/  app-shell app-header mobile-nav logo
  config/site.ts
  lib/  db logger errors validation utils
  fonts/vazirmatn-variable.woff2
  generated/prisma/                  # تولیدشده
prisma/  schema.prisma  migrations/
docs/    # ۱۲ سند (شامل این گزارش)
vitest.config.mts  vitest.setup.ts  .prettierrc.json
.github/workflows/ci.yml
```

## ۸. راهنمای تست دستی

1. `pnpm dev` و باز کردن `http://localhost:3000` — بررسی RTL، فونت Vazirmatn و صفحه اصلی.
2. `http://localhost:3000/ui` — بررسی همه کامپوننت‌ها روی **موبایل (عرض ≤ ۳۷۵px)** و **دسکتاپ**:
   - دکمه‌ها (حالت‌ها، loading، disabled)، فرم‌ها، نشان‌ها، Spinner، Skeleton.
   - تب‌ها، مودال (بستن با Escape/backdrop)، توست (سه تن‌رنگ، بستن دستی/خودکار)، حالت خالی.
   - ناوبری پایین موبایل و هدر دسکتاپ.
3. تست خطای ۴۰۴: `http://localhost:3000/does-not-exist`.
4. صفحه `loading.tsx` هنگام ناوبری کند مشاهده می‌شود.

## ۹. معیار خروج فاز ۱

- ✅ Build/Lint/Type Check بدون خطا
- ✅ کامپوننت‌ها در موبایل و دسکتاپ بررسی شدند (راهنما در بالا)
- ✅ استاندارد ساخت قابلیت جدید مستند شد (`docs/development-roadmap.md` §استاندارد)
- ✅ شاخص موفقیت: راه‌اندازی زیر ۳۰ دقیقه (بخش «راه‌اندازی» در `README.md`)

## ۱۰. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-1): technical foundation and design system

- Next.js 16 (App Router, Turbopack) + TypeScript Strict
- Design system: RTL, Vazirmatn, tokens, base UI components, app shell
- Prisma 7 + SQLite foundation (preliminary User model, no patient data)
- zod validation, logger, AppError, Vitest, ESLint, Prettier, CI
- Phase 0 docs + phase 1 report"
```

## ۱۱. توقف و انتظار تأیید

بر اساس مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. پس از تأیید، فاز ۲ (هویت، احراز هویت و پروفایل حرفه‌ای) آغاز می‌شود.