# قراردادهای API (API Contracts)

**وضعیت:** فاز ۱۴ — افق بلند: اکوسیستم کامل
**تاریخ:** مهر ۱۴۰۵

این سند قراردادهای عمومی API را بر اساس وضعیت واقعی کد مستند می‌کند. جزئیات کامل هر
مؤلفه در `docs/database-schema.md` و گزارش‌های فاز موجود است.

---

## ۱. قرارداد عمومی

- همه مسیرها `JSON` هستند.
- پاسخ موفق: `{ "ok": true, "data": ... }`
- پاسخ خطا: `{ "ok": false, "error": { "code", "message", "details?": ... } }`

### کدهای خطا (از `src/lib/errors.ts`)

| کد | HTTP | معنا |
| --- | ---- | ---- |
| `VALIDATION` | 400 | ورودی نامعتبر (zod) |
| `UNAUTHORIZED` | 401 | نیاز به ورود |
| `FORBIDDEN` | 403 | بدون مجوز (RBAC/CSRF) |
| `NOT_FOUND` | 404 | موجودیت یافت نشد |
| `CONFLICT` | 409 | تعارض وضعیت |
| `RATE_LIMITED` | 429 | سقف نرخ درخواست |
| `INTERNAL` | 500 | خطای داخلی |

## ۲. احراز هویت

- کوکی نشست: `bhz_session` (httpOnly). پس از `POST /api/auth/verify-otp` ست می‌شود.
- جریان: `POST /api/auth/request-otp` (بدنه: `{ phone }`) → `POST /api/auth/verify-otp` (بدنه: `{ phone, code }`).
- در حالت غیر Production پاسخ request-otp شامل `devCode` است.

## ۳. دسته‌بندی مسیرها

| دسته | مسیرهای اصلی |
| ---- | ------------ |
| احراز هویت | `/api/auth/request-otp`, `/verify-otp`, `/logout`, `/logout-all`, `/me` |
| پروفایل | `/api/me/profile`, `/api/me/notification-preferences`, `/api/me/verification-request` |
| اتاق مسئله | `/api/problems` (+`/[id]`, `answers`, `select-solution`, `status`, `result`, `convert-to-experience`) |
| بانک تجربه | `/api/experiences` (+`/[id]`, `review`, `archive`, `reuse`) |
| تعاملات | `/api/follows`, `/api/saves`, `/api/saved`, `/api/thanks` |
| حلقه‌ها | `/api/circles` (+`/[id]`, `join-requests`, `invites`, `meetings`, `leave`, `transfer`, `archive`) |
| همیاری | `/api/peer/help-requests` (+`/[id]`, `suggestions`), `/api/peer/offers` (+`/[id]`, `withdraw`), `/api/peer/cooperations` (+`/[id]`, `messages`, `complete`, `close`, `report`) |
| کشف/جست‌وجو | `/api/search`, `/api/discover`, `/api/feed` |
| اعلان | `/api/notifications` |
| گزارش/اعتراض | `/api/reports`, `/api/appeals` |
| حکمرانی | `/api/moderation/...` |
| آکادمی | `/api/academy` (+`/[slug]`, `enroll`, `lessons/[id]/apply|complete|quiz`) |
| مزایا/بودجه | `/api/benefits` (+`/[id]`, `usage`, `report`), `/api/budget-proposals` (+`/[id]/vote`) |
| کمپین‌ها | `/api/campaigns` (+`/[id]`, `/[id]/participation`) |
| ابزارها | `/api/tools` (+`/[slug]`) |
| بینش/نقشه موانع | `/api/insights/barrier-map`, `/api/insights/data-contribution` |
| مدیریت | `/api/admin/**` (پنل)؛ شامل `/api/admin/command-center`، `/api/admin/campaigns(+[id])`، `/api/admin/tools(+[id])` |
| سلامت | `/api/health` |

## ۴. قواعد

- **Authorization**: همه مسیرها `requireUser()` دارند (به‌جز request-otp/verify-otp و logout).
  مجوزهای RBAC با `assertPermission(user, "<perm>")` در سمت سرور بررسی می‌شوند.
- **Validation**: ورودی با اسکیمای zod در `src/lib/validations/**` اعتبارسنجی می‌شود.
- **CSRF**: درخواست‌های تغییردهنده به `/api/*` با بررسی `Origin`/`Referer` در Proxy محافظت می‌شوند.
- **Audit**: عملیات تغییردهنده `auditLog` ثبت می‌کنند.
- **Content Moderation**: محتوای حساس با `scanContentForModeration` اسکن می‌شود.

## ۵. فهرست مجوزها (Permission)

مجوزها در `src/lib/rbac.ts` تعریف شده‌اند و شامل: `problems:*`, `experiences:*`, `interactions:*`,
`circles:*`, `peer:*`, `moderation:*`, `academy:*`, `benefits:*`, `campaigns:*`, `tools:*`,
`insights:read`, `command-center:view`, `membership:review`,
`content:moderate`, `reports:review`, `moderation:users`, `tags:manage` و... .

> جزئیات کامل و نقش‌ها: `docs/roles-and-permissions.md` (یا بخش RBAC در `src/lib/rbac.ts`).