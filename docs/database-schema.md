# اسکیمای دیتابیس (Database Schema) — فاز ۴

**وضعیت:** به‌روزرسانی با وضعیت واقعی کد — تاریخ: مهر ۱۴۰۵

## پیکربندی

- **پایگاه:** SQLite (توسعه) از طریق Prisma 7 با `@prisma/adapter-better-sqlite3`
- **فایل config:** `prisma7.config.ts`
- **مسیر schema:** `prisma/schema.prisma`
- **خروجی Client:** `src/generated/prisma` (تولیدشده، کامیت نمی‌شود)
- **مسیر Migration:** `prisma/migrations`

## Enum ها

| Enum                 | مقادیر                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Role                 | guest، member، verified_member، mentor، circle_facilitator، content_moderator، admin، super_admin |
| MembershipStatus     | none، pending، verified، rejected                                                                 |
| Visibility           | public، members، private                                                                          |
| ProblemStatus        | open، discussing، solved، archived                                                                |
| ProblemUrgency       | low، medium، high، critical                                                                       |
| ProblemBarrierType   | resources، knowledge، process، community، equipment، other                                        |
| ProblemResultOutcome | successful، partial، unsuccessful                                                                 |
| ModerationState      | visible، hidden، removed                                                                          |
| ReportStatus         | pending، reviewing، resolved، rejected                                                            |
| ExperienceStatus     | user_generated، under_review، reviewed، featured، archived                                        |
| ExperienceReuseOutcome | successful، partial، unsuccessful                                                               |

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

### Problem (فاز ۳)

| فیلد                | نوع                   | توضیح                                                |
| ------------------- | --------------------- | ---------------------------------------------------- |
| id                  | String (cuid) PK      | شناسه                                                |
| authorId            | FK → User             | نویسنده (همیشه ذخیره می‌شود حتی برای ناشناس)         |
| title               | String                | عنوان مسئله                                          |
| description         | String                | شرح مسئله                                            |
| context             | String?               | زمینه/شرایط                                          |
| barrierType         | ProblemBarrierType    | نوع مانع                                             |
| actionsTaken        | String?               | اقدامات انجام‌شده                                    |
| expectedOutcome     | String?               | نتیجه مورد انتظار                                    |
| urgency             | ProblemUrgency        | فوریت                                                |
| isAnonymous         | Boolean               | انتشار ناشناس (نام نویسنده در UI نمایش داده نمی‌شود) |
| status              | ProblemStatus         | open/discussing/solved/archived                      |
| isDraft             | Boolean               | پیش‌نویس                                             |
| needsReview         | Boolean               | در صف بررسی محتوای حساس (ناظر)                       |
| moderation          | ModerationState       | visible/hidden/removed                               |
| moderationNote      | String?               | یادداشت ناظر                                         |
| conclusion          | String?               | جمع‌بندی راهکار                                      |
| selectedAnswerId    | String?               | پاسخ منتخب به‌عنوان راهکار                           |
| resultSummary       | String?               | خلاصه نتیجه اجرا                                     |
| resultOutcome       | ProblemResultOutcome? | نتیجه اجرا (موفق/تا حدی/ناموفق)                      |
| publishedAt         | DateTime?             | زمان انتشار                                          |
| solvedAt            | DateTime?             | زمان حل‌شدن                                          |
| createdAt/updatedAt | DateTime              | زمان ثبت/به‌روزرسانی                                 |

> Indexها: `[status]`، `[moderation]`، `[authorId]`

### ProblemAnswer

| فیلد                   | نوع             | توضیح                      |
| ---------------------- | --------------- | -------------------------- |
| id                     | String PK       | شناسه                      |
| problemId              | FK → Problem    | مسئله (حذف آبشاری)         |
| authorId               | FK → User       | نویسنده پاسخ               |
| body                   | String          | متن پاسخ                   |
| isClarificationRequest | Boolean         | درخواست توضیح (نه راهکار)  |
| isSelectedSolution     | Boolean         | انتخاب‌شده به‌عنوان راهکار |
| moderation             | ModerationState | وضعیت نظارت                |
| moderationNote         | String?         | یادداشت ناظر               |
| needsReview            | Boolean         | در صف بررسی محتوای حساس    |
| helpfulCount           | Int             | شمارش «مفید بود»           |
| createdAt/updatedAt    | DateTime        | زمان ثبت/به‌روزرسانی       |

> Index: `[problemId]`

### ProblemAnswerHelpful

رابطه چند-به-چند (answerId + userId) با کلید ترکیبی — جلوگیری از چندباره «مفید بود».

### ProblemStatusChange

| فیلد      | نوع            | توضیح                        |
| --------- | -------------- | ---------------------------- |
| id        | String PK      | شناسه                        |
| problemId | FK → Problem   | مسئله                        |
| from      | ProblemStatus? | وضعیت قبلی (null برای اولین) |
| to        | ProblemStatus  | وضعیت جدید                   |
| changedBy | String         | شناسه تغییردهنده             |
| note      | String?        | یادداشت                      |
| createdAt | DateTime       | زمان                         |

> Index: `[problemId]` — **تاریخچه وضعیت قابل پیگیری.**

### Tag / ProblemTag

- `Tag` (id, name UNIQUE) — برچسب‌های سراسری (مشترک با فازهای بعد).
- `ProblemTag` — رابطه چند-به-چند مسئله/برچسب با کلید ترکیبی.

### Experience (فاز ۴)

| فیلد              | نوع                   | توضیح                                                          |
| ----------------- | --------------------- | -------------------------------------------------------------- |
| id                | String (cuid) PK      | شناسه                                                          |
| authorId          | FK → User             | نویسنده                                                        |
| slug              | String UNIQUE         | اسلاگ قابل اشتراک (`tajrobe-XXXXXXXX`)                         |
| title             | String                | عنوان تجربه                                                    |
| situation         | String                | مسئله/موقعیت                                                   |
| conditions        | String?               | شرایط و زمینه                                                  |
| action            | String                | اقدامی که انجام شد                                              |
| resources         | String?               | منابع و ابزارها                                                |
| challenges        | String?               | چالش‌ها                                                        |
| result            | String                | نتیجه                                                          |
| lessons           | String?               | درس‌آموخته‌ها                                                   |
| suggestion        | String?               | پیشنهاد برای دیگران                                            |
| status            | ExperienceStatus      | user_generated/under_review/reviewed/featured/archived          |
| isDraft           | Boolean               | پیش‌نویس                                                       |
| needsReview       | Boolean               | در صف بررسی محتوای حساس                                        |
| moderation        | ModerationState       | visible/hidden/removed                                         |
| moderationNote    | String?               | یادداشت ناظر                                                   |
| sourceProblemId   | FK → Problem?         | مسئله مبدا (تبدیل راهکار به تجربه)                             |
| publishedAt       | DateTime?             | زمان انتشار                                                    |
| reviewedAt        | DateTime?             | زمان تأیید/برگزیده‌کردن توسط ناظر                              |
| createdAt/updatedAt | DateTime            | زمان ثبت/به‌روزرسانی                                           |

> Indexها: `[status]`، `[moderation]`، `[authorId]`، `[sourceProblemId]`

### ExperienceTag

رابطه چند-به-چند تجربه/برچسب با کلید ترکیبی (`experienceId + tagId`).

### ExperienceReference

ارجاع یک پاسخ به تجربه (برای «ارجاع در پاسخ‌ها»):

| فیلد         | نوع              | توضیح             |
| ------------ | ---------------- | ----------------- |
| id           | String PK        | شناسه             |
| experienceId | FK → Experience  | تجربه ارجاع‌شده   |
| answerId     | FK → ProblemAnswer | پاسخ ارجاع‌دهنده |
| createdAt    | DateTime         | زمان              |

> کلید ترکیبی یکتا `[experienceId, answerId]` + Index روی هر دو. «تعداد ارجاع» بخشی از سرمایه روایت است.

### ExperienceReuse

«این تجربه را اجرا کردم» + ثبت نتیجه اجرای مجدد:

| فیلد         | نوع                      | توضیح                                    |
| ------------ | ------------------------ | ---------------------------------------- |
| id           | String PK                | شناسه                                    |
| experienceId | FK → Experience          | تجربه                                    |
| userId       | FK → User                | کاربر اجراکننده                          |
| outcome      | ExperienceReuseOutcome   | موفق/تا حدی/ناموفق                      |
| summary      | String                   | خلاصه نتیجه                              |
| createdAt/updatedAt | DateTime          | زمان ثبت/به‌روزرسانی                     |

> کلید ترکیبی یکتا `[experienceId, userId]` (upsert برای به‌روزرسانی نتیجه). «تعداد اجرا + میزان موفقیت» بخشی از سرمایه روایت است و به لایک وابسته نیست.

### ContentReport (به‌روزرسانی فاز ۴)

علاوه بر `problemId`/`answerId`، فیلد `experienceId` (FK → Experience?) برای گزارش تجربه اضافه شد.

### ContentReport

| فیلد          | نوع                 | توضیح                               |
| ------------- | ------------------- | ----------------------------------- |
| id            | String PK           | شناسه                               |
| reporterId    | FK → User           | گزارش‌دهنده                         |
| problemId     | FK → Problem?       | مسئله مورد گزارش (اختیاری)          |
| answerId      | FK → ProblemAnswer? | پاسخ مورد گزارش (اختیاری)           |
| reason        | String              | دلیل (sensitive_info و...)          |
| note          | String?             | توضیح گزارش‌دهنده                   |
| status        | ReportStatus        | pending/reviewing/resolved/rejected |
| reviewedBy    | String?             | ناظر بررسی‌کننده                    |
| reviewedAt    | DateTime?           | زمان بررسی                          |
| moderatorNote | String?             | یادداشت ناظر                        |
| createdAt     | DateTime            | زمان                                |

> Indexها: `[status]`، `[problemId]`، `[answerId]`

## قواعد

- **هیچ داده بیمار** در مدل داده ذخیره نمی‌شود (رجوع به `data-privacy-rules.md`).
- تاریخ‌ها به فرمت استاندارد (UTC) ذخیره می‌شوند؛ نمایش شمسی فقط در UI.
- توکن نشست و کد OTP فقط به‌صورت hash ذخیره می‌شوند.
