# اسکیمای دیتابیس (Database Schema) — فاز ۲

**وضعیت:** به‌روزرسانی با وضعیت واقعی کد — تاریخ: مهر ۱۴۰۵

## پیکربندی

- **پایگاه:** SQLite (توسعه) از طریق Prisma 7 با `@prisma/adapter-better-sqlite3`
- **فایل config:** `prisma7.config.ts`
- **مسیر schema:** `prisma/schema.prisma`
- **خروجی Client:** `src/generated/prisma` (تولیدشده، کامیت نمی‌شود)
- **مسیر Migration:** `prisma/migrations`

## Enum ها

| Enum             | مقادیر                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Role             | guest، member، verified_member، mentor، circle_facilitator، content_moderator، admin، super_admin |
| MembershipStatus | none، pending، verified، rejected                                                                 |
| Visibility       | public، members، private                                                                          |

## مدل‌ها

### User

| فیلد                | نوع                     | توضیح                                               |
| ------------------- | ----------------------- | --------------------------------------------------- |
| id                  | String (cuid) PK        | شناسه                                               |
| phone               | String UNIQUE           | شماره موبایل (برای احراز هویت)                      |
| role                | Role (پیش‌فرض member)   | نقش کاربر                                           |
| membershipStatus    | MembershipStatus (none) | وضعیت تأیید عضویت حرفه‌ای                           |
| displayName         | String?                 | نام نمایشی                                          |
| province            | String?                 | استان                                               |
| city                | String?                 | شهرستان                                             |
| workYears           | String?                 | سابقه کاری بازه‌ای (0-2، 3-5، 6-10، 11-20، 21-plus) |
| bio                 | String?                 | معرفی کوتاه                                         |
| visibility          | Visibility (members)    | تنظیم حریم خصوصی پروفایل                            |
| onboardingCompleted | Boolean (false)         | تکمیل Onboarding                                    |
| createdAt/updatedAt | DateTime                | زمان ثبت/به‌روزرسانی                                |

### OtpCode

| فیلد        | نوع       | توضیح                      |
| ----------- | --------- | -------------------------- |
| id          | String PK | شناسه                      |
| phone       | String    | شماره موبایل               |
| codeHash    | String    | hash کد OTP                |
| purpose     | String    | نوع کاربرد (پیش‌فرض login) |
| attempts    | Int       | تعداد تلاش‌ها              |
| maxAttempts | Int       | حداکثر تلاش (پیش‌فرض ۵)    |
| expiresAt   | DateTime  | زمان انقضا                 |
| consumedAt  | DateTime? | زمان مصرف                  |
| createdAt   | DateTime  | زمان ثبت                   |

> Index: `[phone, purpose]`

### Session

| فیلد      | نوع           | توضیح           |
| --------- | ------------- | --------------- |
| id        | String PK     | شناسه           |
| userId    | FK → User     | کاربر           |
| tokenHash | String UNIQUE | hash توکن نشست  |
| expiresAt | DateTime      | زمان انقضا      |
| revokedAt | DateTime?     | زمان لغو (خروج) |
| ip        | String?       | IP ورود         |
| userAgent | String?       | مرورگر ورود     |
| createdAt | DateTime      | زمان ثبت        |

> Index: `[userId]`

### MembershipRequest

| فیلد       | نوع              | توضیح                  |
| ---------- | ---------------- | ---------------------- |
| id         | String PK        | شناسه                  |
| userId     | FK → User        | متقاضی                 |
| status     | MembershipStatus | پیش‌فرض pending        |
| note       | String?          | توضیح متقاضی/مدیر      |
| reviewedBy | String?          | شناسه مدیر بررسی‌کننده |
| reviewedAt | DateTime?        | زمان بررسی             |
| createdAt  | DateTime         | زمان ثبت               |

> Index: `[status]`

### Skill / UserSkill و Interest / UserInterest

- `Skill` (id, name UNIQUE) و `Interest` (id, name UNIQUE) — فهرست‌های سراسری.
- `UserSkill` / `UserInterest` — رابطه چند-به-چند (userId + skillId/interestId) با حذف آبشاری.

### AuditLog

| فیلد       | نوع        | توضیح                                  |
| ---------- | ---------- | -------------------------------------- |
| id         | String PK  | شناسه                                  |
| actorId    | FK → User? | بازیگر (null برای رویدادهای بدون نشست) |
| action     | String     | رویداد (مثلاً auth.signin)             |
| entityType | String     | نوع موجودیت                            |
| entityId   | String?    | شناسه موجودیت                          |
| details    | String?    | جزئیات (JSON)                          |
| ip         | String?    | IP                                     |
| createdAt  | DateTime   | زمان ثبت                               |

> Index: `[actorId]`، `[action]`

## قواعد

- **هیچ داده بیمار** در مدل داده ذخیره نمی‌شود (رجوع به `data-privacy-rules.md`).
- تاریخ‌ها به فرمت استاندارد (UTC) ذخیره می‌شوند؛ نمایش شمسی فقط در UI.
- توکن نشست و کد OTP فقط به‌صورت hash ذخیره می‌شوند.
