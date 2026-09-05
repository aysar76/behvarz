# اسکیمای دیتابیس (Database Schema) — فاز ۱

**وضعیت:** نسخه اولیه — تاریخ: مهر ۱۴۰۵

## پیکربندی

- **پایگاه:** SQLite (توسعه) از طریق Prisma 7 با `@prisma/adapter-better-sqlite3`
- **فایل config:** `prisma7.config.ts`
- **مسیر schema:** `prisma/schema.prisma`
- **خروجی Client:** `src/generated/prisma` (تولیدشده، کامیت نمی‌شود)
- **مسیر Migration:** `prisma/migrations`

## مدل‌ها

### User (پیش‌نویس — بازبینی در فاز ۲)

| فیلد | نوع | توضیح |
|---|---|---|
| id | String (cuid) PK | شناسه |
| phone | String UNIQUE | شماره موبایل (برای احراز هویت) |
| displayName | String? | نام نمایشی |
| createdAt | DateTime | زمان ثبت |
| updatedAt | DateTime | آخرین به‌روزرسانی |

> **نکته:** این مدل پیش‌نویس پایه برای راه‌اندازی لایه دیتابیس است. مدل کامل هویت، نقش‌ها و Onboarding در فاز ۲ طراحی و اعمال می‌شود.

## قواعد

- **هیچ داده بیمار** در مدل داده ذخیره نمی‌شود (رجوع به `data-privacy-rules.md`).
- تاریخ‌ها به فرمت استاندارد (UTC) ذخیره می‌شوند؛ نمایش شمسی فقط در UI.