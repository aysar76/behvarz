# اسکیمای دیتابیس (Database Schema) — فاز ۸

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
| FollowTargetType     | tag، problem، experience، user                                                                  |
| SavedTargetType      | problem، experience                                                                             |
| ThanksTargetType     | answer، experience                                                                              |
| CircleStatus         | active، archived                                                                                |
| CircleMembershipRole | member، facilitator                                                                             |
| CircleMembershipStatus | active، left، removed                                                                         |
| CircleJoinRequestStatus | pending، approved، rejected، canceled                                                        |
| CircleInviteStatus   | pending، accepted، declined                                                                     |
| PeerHelpRequestStatus | open، matched، completed، closed، canceled                                                     |
| PeerOfferStatus      | pending، accepted، rejected، withdrawn                                                          |
| PeerOfferInitiator   | requester، helper                                                                               |
| PeerCooperationStatus | active، completed، closed                                                                      |
| PeerCooperationReportStatus | pending، resolved، rejected                                                             |
| PeerCooperationReportReason | abusive، harassment، off_topic، sensitive_info، other                                   |
| AccountStatus               | active، warned، restricted، suspended                                                    |
| ModerationTargetType        | problem، answer، experience، user                                                        |
| ModerationAction            | warn، restrict، suspend، lift، hide_content، unhide_content، remove_content، restore_content |
| AppealStatus                | pending، approved، rejected                                                             |
| AppealTargetType            | problem، answer، experience، account                                                     |

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
| willingToHelp       | Boolean (false)         | تمایل به همیاری (فاز ۶؛ فقط این کاربران در پیشنهاد همیار) |
| accountStatus       | AccountStatus (active)  | وضعیت حساب (فاز ۷: active/warned/restricted/suspended) |
| accountStatusReason | String?                 | دلیل آخرین تغییر وضعیت حساب (فاز ۷)                 |
| accountStatusAt     | DateTime?               | زمان آخرین تغییر وضعیت حساب (فاز ۷)                 |
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
| thanksCount            | Int             | شمارش تشکر حرفه‌ای (فاز ۵) |
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

- `Tag` (id, name UNIQUE, isActive) — برچسب‌های سراسری (مشترک با فازهای بعد). `isActive` برای مدیریت برچسب در فاز ۷ اضافه شد.
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
| thanksCount       | Int                   | شمارش تشکر حرفه‌ای (فاز ۵)                                     |
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

### Follow (فاز ۵)

دنبال‌کردن موضوع/مسئله/تجربه/عضو (پلی‌مورفیک):

| فیلد       | نوع                | توضیح                                            |
| ---------- | ------------------ | ------------------------------------------------ |
| id         | String PK          | شناسه                                            |
| userId     | FK → User          | دنبال‌کننده                                      |
| targetType | FollowTargetType   | tag/problem/experience/user                      |
| targetId   | String             | شناسه هدف (نام برچسب یا id هدف)                 |
| createdAt  | DateTime           | زمان                                            |

> کلید ترکیبی یکتا `[userId, targetType, targetId]` + Index روی `[targetType, targetId]`. دنبال‌کردن عضو فقط با رعایت `visibility` (خصوصی = ممنوع).

### SavedItem (فاز ۵)

ذخیره محتوا برای مطالعه بعدی:

| فیلد       | نوع              | توضیح                        |
| ---------- | ---------------- | ---------------------------- |
| id         | String PK        | شناسه                        |
| userId     | FK → User        | کاربر                        |
| targetType | SavedTargetType  | problem/experience           |
| targetId   | String           | شناسه هدف                    |
| createdAt  | DateTime         | زمان                         |

> کلید ترکیبی یکتا `[userId, targetType, targetId]` + Index روی `[targetType, targetId]`.

### ProfessionalThanks (فاز ۵)

«تشکر حرفه‌ای» به‌جای لایک عمومی:

| فیلد        | نوع              | توضیح                                    |
| ----------- | ---------------- | ---------------------------------------- |
| id          | String PK        | شناسه                                    |
| userId      | FK → User        | تشکرکننده                                |
| targetType  | ThanksTargetType | answer/experience                        |
| targetId    | String           | شناسه هدف                                |
| answerId    | FK → ProblemAnswer? | پاسخ (برای targetType=answer)          |
| experienceId| FK → Experience? | تجربه (برای targetType=experience)      |
| receivedById| FK → User        | گیرنده تشکر (نویسنده پاسخ/تجربه)        |
| createdAt   | DateTime         | زمان                                     |

> کلید ترکیبی یکتا `[userId, targetType, targetId]` + Index روی `[targetType, targetId]`. شمارنده `thanksCount` روی `ProblemAnswer` و `Experience` نگه‌داری می‌شود. تشکر به محتوای خود کاربر ممنوع است.

### Circle (فاز ۶)

گروه کوچک ۵ تا ۱۲ نفره با راهبر:

| فیلد          | نوع               | توضیح                        |
| ------------- | ----------------- | ---------------------------- |
| id            | String PK         | شناسه                        |
| name          | String            | نام حلقه                     |
| description   | String            | توضیح                        |
| topic         | String?           | موضوع                        |
| province      | String?           | استان (اختیاری)              |
| capacity      | Int (۱۲)          | ظرفیت (۵ تا ۱۲)              |
| status        | CircleStatus      | active/archived              |
| facilitatorId | FK → User (Restrict) | راهبر حلقه                |
| createdAt/updatedAt | DateTime    | زمان ثبت/به‌روزرسانی         |

> Index: `[status]`، `[facilitatorId]`. خالق حلقه به‌صورت خودکار با نقش `facilitator` عضو می‌شود.

### CircleMembership

| فیلد    | نوع                    | توضیح            |
| ------- | ---------------------- | ---------------- |
| id      | String PK              | شناسه            |
| circleId| FK → Circle (Cascade)  | حلقه             |
| userId  | FK → User (Cascade)    | عضو              |
| role    | CircleMembershipRole   | member/facilitator |
| status  | CircleMembershipStatus | active/left/removed |
| joinedAt | DateTime             | زمان عضویت       |
| leftAt  | DateTime?              | زمان خروج        |

> کلید ترکیبی یکتا `[circleId, userId]`.

### CircleJoinRequest

| فیلد       | نوع                    | توضیح                     |
| ---------- | ---------------------- | ------------------------- |
| id         | String PK              | شناسه                     |
| circleId   | FK → Circle (Cascade)  | حلقه                      |
| userId     | FK → User (Cascade)    | متقاضی                    |
| message    | String?                | پیام متقاضی               |
| status     | CircleJoinRequestStatus| pending/approved/rejected/canceled |
| reviewedAt | DateTime?              | زمان بررسی                |
| createdAt  | DateTime               | زمان ثبت                  |

> کلید ترکیبی یکتا `[circleId, userId]`.

### CircleInvite

| فیلد       | نوع                 | توضیح                  |
| ---------- | ------------------- | ---------------------- |
| id         | String PK           | شناسه                  |
| circleId   | FK → Circle (Cascade) | حلقه                 |
| userId     | FK → User (Cascade) | دعوت‌شده               |
| invitedById| FK → User (Cascade) | دعوت‌کننده (راهبر)     |
| message    | String?             | پیام دعوت              |
| status     | CircleInviteStatus  | pending/accepted/declined |
| respondedAt| DateTime?           | زمان پاسخ              |

> کلید ترکیبی یکتا `[circleId, userId]`. فقط راهبر می‌تواند دعوت کند.

### CircleMeeting

جلسه و خروجی دوره‌ای حلقه:

| فیلد       | نوع                 | توضیح          |
| ---------- | ------------------- | -------------- |
| id         | String PK           | شناسه          |
| circleId   | FK → Circle (Cascade) | حلقه         |
| title      | String              | عنوان جلسه     |
| agenda     | String?             | دستور کار      |
| scheduledAt| DateTime?           | زمان برنامه‌ریزی |
| summary    | String?             | خروجی/خلاصه    |
| createdById| FK → User (Cascade) | ثبت‌کننده      |

> Index: `[circleId]`.

### PeerHelpRequest (فاز ۶)

درخواست همیار (فرد دارای مسئله):

| فیلد       | نوع                    | توضیح                     |
| ---------- | ---------------------- | ------------------------- |
| id         | String PK              | شناسه                     |
| requesterId| FK → User (Cascade)   | ثبت‌کننده                 |
| title      | String                 | عنوان                     |
| description| String                 | شرح نیاز                  |
| barrierType| ProblemBarrierType     | نوع مانع                  |
| tags       | Json?                  | برچسب‌ها (متن ساده)        |
| province   | String?                | استان                     |
| status     | PeerHelpRequestStatus  | open/matched/completed/closed/canceled |
| createdAt/updatedAt | DateTime      | زمان ثبت/به‌روزرسانی      |

> Index: `[requesterId]`، `[status]`، `[barrierType]`. محتوای مسئله ناشناس‌سازی‌شده است (بدون داده بیمار).

### PeerOffer

| فیلد        | نوع                | توضیح                  |
| ----------- | ------------------ | ---------------------- |
| id          | String PK          | شناسه                  |
| helpRequestId| FK → PeerHelpRequest (Cascade) | درخواست |
| helperId    | FK → User (Cascade)| همیار                  |
| initiator   | PeerOfferInitiator | requester/helper       |
| message     | String?            | پیام                   |
| status      | PeerOfferStatus    | pending/accepted/rejected/withdrawn |
| respondedAt | DateTime?          | زمان پاسخ              |

> کلید ترکیبی یکتا `[helpRequestId, helperId]`.

### PeerCooperation

| فیلد          | نوع                    | توضیح              |
| ------------- | ---------------------- | ------------------ |
| id            | String PK              | شناسه              |
| helpRequestId | FK → PeerHelpRequest? (SetNull) | درخواست مبدا |
| requesterId   | FK → User (Cascade)    | درخواست‌دهنده      |
| helperId      | FK → User (Cascade)    | همیار              |
| goal          | String?                | هدف همکاری         |
| status        | PeerCooperationStatus  | active/completed/closed |
| outcomeSummary| String?                | خلاصه نتیجه        |
| requesterRating | Int?                 | ارزیابی درخواست‌دهنده (۱-۵) |
| helperRating  | Int?                   | ارزیابی همیار (۱-۵) |
| completedAt/closedAt | DateTime?      | زمان تکمیل/بسته‌شدن |
| createdAt/updatedAt | DateTime       | زمان ثبت/به‌روزرسانی |

> Index: `[requesterId]`، `[helperId]`، `[status]`.

### PeerMessage

گفت‌وگوی محدود و موضوع‌محور (Thread-Based؛ بدون Chat بلادرنگ):

| فیلد         | نوع                     | توضیح      |
| ------------ | ----------------------- | ---------- |
| id           | String PK               | شناسه      |
| cooperationId| FK → PeerCooperation (Cascade) | همکاری |
| senderId     | FK → User (Cascade)     | فرستنده    |
| body         | String                  | متن        |
| createdAt    | DateTime                | زمان       |

> Index: `[cooperationId]`.

### PeerCooperationReport

گزارش سوءاستفاده در همکاری:

| فیلد        | نوع                              | توضیح        |
| ----------- | -------------------------------- | ------------ |
| id          | String PK                        | شناسه        |
| cooperationId| FK → PeerCooperation (Cascade)  | همکاری       |
| reporterId  | FK → User (Cascade)              | گزارش‌دهنده  |
| reason      | PeerCooperationReportReason      | دلیل         |
| note        | String?                          | توضیح        |
| status      | PeerCooperationReportStatus      | pending/resolved/rejected |
| reviewedAt  | DateTime?                        | زمان بررسی   |
| createdAt   | DateTime                         | زمان         |

> Index: `[cooperationId]`، `[status]`.

### ModerationDecision (فاز ۷)

تاریخچه تصمیم ناظر — هر اقدام نظارتی:

| فیلد        | نوع                  | توضیح                          |
| ----------- | -------------------- | ------------------------------ |
| id          | String PK            | شناسه                          |
| moderatorId | FK → User (Cascade)  | ناظر                           |
| targetType  | ModerationTargetType | problem/answer/experience/user |
| targetId    | String               | شناسه هدف                      |
| action      | ModerationAction     | warn/restrict/suspend/lift/hide_content/unhide_content/remove_content/restore_content |
| reason      | String?              | دلیل                           |
| note        | String?              | یادداشت ناظر                   |
| createdAt   | DateTime             | زمان                           |

> Index: `[targetType, targetId]`، `[moderatorId]`.

### Appeal (فاز ۷)

فرآیند اعتراض کاربر به تصمیم ناظر:

| فیلد          | نوع              | توضیح                              |
| ------------- | ---------------- | ---------------------------------- |
| id            | String PK        | شناسه                              |
| userId        | FK → User (Cascade) | اعتراض‌کننده                     |
| targetType    | AppealTargetType | problem/answer/experience/account  |
| targetId      | String           | شناسه هدف                          |
| reason        | String           | توضیح اعتراض                       |
| status        | AppealStatus     | pending/approved/rejected          |
| decisionNote  | String?          | یادداشت ناظر هنگام تصمیم           |
| decidedBy     | FK → User? (SetNull) | ناظر تصمیم‌گیرنده                |
| decidedAt     | DateTime?        | زمان تصمیم                         |
| createdAt     | DateTime         | زمان ثبت                           |

> Index: `[status]`، `[userId]`، `[targetType, targetId]`.

### SensitiveTerm (فاز ۷)

واژه‌های حساس قابل مدیریت:

| فیلد         | نوع              | توضیح                            |
| ------------ | ---------------- | -------------------------------- |
| id           | String PK        | شناسه                            |
| term         | String UNIQUE    | واژه/الگو (مطابقت شامل‌بودن)      |
| description  | String?          | توضیح                            |
| isActive     | Boolean (true)   | فعال/غیرفعال                     |
| createdById  | FK → User? (SetNull) | ثبت‌کننده                     |
| createdAt    | DateTime         | زمان                             |

### Notification (فاز ۸)

اعلان‌های درون‌برنامه‌ای:

| فیلد        | نوع                | توضیح                                             |
| ----------- | ------------------ | ------------------------------------------------- |
| id          | String PK          | شناسه                                             |
| userId      | FK → User (Cascade)| گیرنده اعلان                                      |
| type        | NotificationType   | نوع رویداد (پاسخ/ارجاع/راهکار/حلقه/همیاری/اعتراض) |
| actorId     | FK → User? (SetNull)| عامل ایجاد رویداد                                |
| title       | String             | عنوان اعلان                                       |
| body        | String?            | متن کوتاه اعلان                                   |
| targetType  | NotificationTargetType? | نوع هدف (problem/answer/experience/circle/cooperation/appeal) |
| targetId    | String?            | شناسه هدف                                         |
| read        | Boolean (false)    | خوانده‌شده                                        |
| readAt      | DateTime?          | زمان خواندن                                       |
| createdAt   | DateTime           | زمان                                              |

> Index: `[userId, read]`، `[userId, createdAt]`، `[targetType, targetId]`.

### NotificationPreference (فاز ۸)

تنظیمات نوع اعلان هر کاربر (هر نوع با یک کلید یکتا):

| فیلد      | نوع                | توضیح                    |
| --------- | ------------------ | ------------------------ |
| id        | String PK          | شناسه                    |
| userId    | FK → User (Cascade)| کاربر                    |
| type      | NotificationType   | نوع اعلان                |
| enabled   | Boolean (true)     | فعال/غیرفعال             |
| updatedAt | DateTime           | زمان آخرین تغییر         |

> UNIQUE: `[userId, type]`؛ Index: `[userId]`.

### Course (فاز ۱۱)

مسیر یادگیری کوتاه آکادمی مسئله‌محور:

| فیلد               | نوع                     | توضیح                                            |
| ------------------ | ----------------------- | ------------------------------------------------ |
| id                 | String PK               | شناسه                                            |
| slug               | String UNIQUE           | شناسه خوانا (`vaccination-communication`)        |
| title              | String                  | عنوان                                            |
| description        | String                  | توضیح                                            |
| level              | CourseLevel             | مقدماتی/متوسط/پیشرفته                            |
| status             | CourseStatus            | draft/published/archived                         |
| ownerId            | FK → User (Cascade)     | مالک/نویسنده محتوا                               |
| version            | Int (1)                 | نسخه محتوا (در هر ویرایش افزایش می‌یابد)         |
| reviewedAt         | DateTime?               | آخرین تاریخ بازبینی                              |
| emoji              | String?                 | نماد بصری دوره                                   |
| isPaid             | Boolean (false)         | آماده‌سازی دوره پولی (بدون درگاه)                |
| relatedProblemId   | FK → Problem? (SetNull) | مسئله مرتبط                                      |
| relatedExperienceId| FK → Experience? (SetNull)| تجربه مرتبط (Case Study)                        |
| publishedAt        | DateTime?               | زمان انتشار                                       |
| createdAt/updatedAt| DateTime                | زمان‌ها                                          |

> Index: `[status]`، `[ownerId]`. درس‌ها (`Lesson`)، پرسش‌ها (`CourseQuizQuestion`)، ثبت‌نام‌ها (`CourseEnrollment`)، پیشرفت (`LessonProgress`)، تلاش آزمونک (`QuizAttempt`)، کاربرد میدانی (`FieldApplication`) و برچسب‌ها (`CourseTag`).

### Lesson (فاز ۱۱)

درس کم‌حجم یک دوره:

| فیلد           | نوع                  | توضیح                                    |
| -------------- | -------------------- | ---------------------------------------- |
| id             | String PK            | شناسه                                    |
| courseId       | FK → Course (Cascade)| دوره                                     |
| title          | String               | عنوان                                    |
| summary        | String?              | خلاصه                                    |
| body           | String               | محتوای اصلی (متنی)                       |
| contentType    | LessonContentType    | text/audio/video                         |
| mediaUrl       | String?              | آدرس رسانه (بدون آپلود داخلی)           |
| durationMinutes| Int?                 | مدت تقریبی                              |
| order          | Int (0)              | ترتیب                                    |
| isOptional     | Boolean (false)      | درس اختیاری (در تکمیل دوره لحاظ نمی‌شود) |
| createdAt/updatedAt | DateTime       | زمان‌ها                                  |

> Index: `[courseId]`.

### CourseQuizQuestion (فاز ۱۱)

پرسش آزمونک درس — گزینه صحیح **فقط سمت سرور**:

| فیلد        | نوع                  | توضیح                    |
| ----------- | -------------------- | ------------------------ |
| id          | String PK            | شناسه                    |
| lessonId    | FK → Lesson (Cascade)| درس                      |
| question    | String               | متن پرسش                |
| options     | Json                 | آرایه `{ text }` گزینه‌ها |
| correctIndex| Int                  | اندیس گزینه صحیح (سرور) |
| explanation | String?              | توضیح                    |
| order       | Int (0)              | ترتیب                    |

> Index: `[lessonId]`.

### CourseEnrollment (فاز ۱۱)

ثبت‌نام کاربر در دوره:

| فیلد        | نوع                  | توضیح                |
| ----------- | -------------------- | -------------------- |
| id          | String PK            | شناسه                |
| courseId    | FK → Course (Cascade)| دوره                 |
| userId      | FK → User (Cascade)  | کاربر                |
| enrolledAt  | DateTime             | زمان ثبت‌نام         |
| completedAt | DateTime?            | زمان تکمیل دوره      |

> UNIQUE: `[courseId, userId]`.

### LessonProgress (فاز ۱۱)

پیشرفت هر کاربر در هر درس:

| فیلد        | نوع                     | توضیح                  |
| ----------- | ----------------------- | ---------------------- |
| id          | String PK               | شناسه                  |
| lessonId    | FK → Lesson (Cascade)   | درس                    |
| userId      | FK → User (Cascade)     | کاربر                  |
| status      | LessonProgressStatus    | not_started/in_progress/completed |
| quizPassed  | Boolean (false)         | گذراندن آزمونک         |
| completedAt | DateTime?               | زمان تکمیل             |
| createdAt/updatedAt | DateTime      | زمان‌ها                |

> UNIQUE: `[lessonId, userId]`.

### QuizAttempt (فاز ۱۱)

سابقه تلاش آزمونک:

| فیلد     | نوع                  | توضیح          |
| -------- | -------------------- | -------------- |
| id       | String PK            | شناسه          |
| lessonId | FK → Lesson (Cascade)| درس            |
| userId   | FK → User (Cascade)  | کاربر          |
| score    | Int                  | پاسخ درست      |
| total    | Int                  | کل پرسش‌ها     |
| passed   | Boolean              | قبولی          |
| createdAt| DateTime             | زمان           |

> Index: `[lessonId]`، `[userId]`.

### FieldApplication (فاز ۱۱)

«ثبت کاربرد میدانی» — بستن حلقه «آموزش → سنجش → کاربرد»:

| فیلد     | نوع                       | توضیح              |
| -------- | ------------------------- | ------------------ |
| id       | String PK                 | شناسه              |
| lessonId | FK → Lesson (Cascade)     | درس                |
| courseId | FK → Course (Cascade)     | دوره               |
| userId   | FK → User (Cascade)       | کاربر              |
| summary  | String                    | خلاصه کاربرد       |
| outcome  | FieldApplicationOutcome   | successful/partial/unsuccessful |
| createdAt| DateTime                  | زمان               |

> Index: `[lessonId]`، `[courseId]`، `[userId]`.

### CourseTag (فاز ۱۱)

برچسب‌های موضوعی دوره (برای پیشنهاد مبتنی بر علایق/مهارت/مسائل):

| فیلد   | نوع                  | توضیح |
| ------ | -------------------- | ----- |
| courseId | FK → Course (Cascade) | دوره  |
| tagId  | FK → Tag (Cascade)   | برچسب |

> PK مرکب: `[courseId, tagId]`.

## قواعد

- **هیچ داده بیمار** در مدل داده ذخیره نمی‌شود (رجوع به `data-privacy-rules.md`).
- تاریخ‌ها به فرمت استاندارد (UTC) ذخیره می‌شوند؛ نمایش شمسی فقط در UI.
- توکن نشست و کد OTP فقط به‌صورت hash ذخیره می‌شوند.
