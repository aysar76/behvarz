# گزارش فاز ۲ — هویت، احراز هویت و پروفایل حرفه‌ای

**شاخه پیشنهادی:** `phase/02-identity`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** تکمیل و آماده تأیید (Stage-Gate)

---

## ۱. خلاصه

فاز ۲ هویت، احراز هویت و پروفایل حرفه‌ای را کامل پیاده کرد: ورود با شماره موبایل + OTP (Provider قابل جایگزینی؛ در توسعه کد واقعی ارسال نمی‌شود)، مدیریت نشست امن (hash توکن + خروج از همه دستگاه‌ها)، Onboarding چندمرحله‌ای، پروفایل حرفه‌ای (استان/شهرستان، سابقه بازه‌ای، مهارت‌ها/علایق، معرفی، Visibility)، نقش‌ها و RBAC در Server و UI، درخواست و تأیید عضویت حرفه‌ای توسط مدیر، و Audit Log.

**گیرنده‌ی مشکل فاز:** مسیر «پروفایل من» (`/me`) در زمان رندر سمت سرور با خطای `useToast must be used within a <ToastProvider>` کرش می‌کرد؛ چون `ProfileForm` و `VerificationRequest` از هوک توست استفاده می‌کنند ولی صفحه در `AppShell` (که `ToastProvider` را فراهم می‌کند) قرار نداشت. با پیچیدن صفحه `/me` در `AppShell` رفع شد (همسو با `/ui` و `/admin`).

## ۲. بررسی (Review)

- ورود با OTP: `POST /api/auth/request-otp` (Rate Limit روی IP و شماره) و `POST /api/auth/verify-otp` (upsert کاربر + ساخت نشست).
- نشست امن: توکن تصادفی، ذخیره `sha256` در دیتابیس، کوکی HttpOnly/SameSite=Lax، عمر ۳۰ روز، `POST /api/auth/logout` و `POST /api/auth/logout-all` (خروج از همه دستگاه‌ها).
- Onboarding: ۴ مرحله (نام، محل خدمت و سابقه، مهارت‌ها/علایق، معرفی و حریم خصوصی) در `src/components/auth/onboarding-form.tsx`؛ ذخیره با `PATCH /api/me/profile`.
- نقش‌ها: همه ۸ نقش در enum + ماتریس مجوز در `src/lib/rbac.ts` و `assertPermission` سمت سرور.
- تأیید عضویت: `POST /api/me/verification-request` و `GET/POST /api/admin/memberships[/:id]` (approve/reject با transaction و تغییر نقش به `verified_member`).
- Audit Log: رویدادهای `auth.signin`، `profile.update`، `membership.request`، `membership.approve/reject` ثبت می‌شوند.
- **قواعد داده:** هیچ داده بیمار یا اطلاعات هویتی حساس (کد ملی/پرسنلی) در مدل داده وجود ندارد؛ فقط شماره موبایل و پروفایل حرفه‌ای.
- **عدم رقابت با سیب:** هیچ قابلیت ثبت/ارجاع/پرونده ساخته نشده است.

## ۳. وضعیت ابزارها (همه سبز)

| ابزار            | نتیجه                            |
| ---------------- | -------------------------------- |
| `pnpm build`     | موفق (۱۷ مسیر)                   |
| `pnpm typecheck` | موفق (بدون خطا)                  |
| `pnpm lint`      | موفق (بدون خطا/هشدار)            |
| `pnpm test:run`  | ۱۳ فایل، ۶۶ تست موفق             |
| Dev Server       | جریان کامل دستی تأیید شد (بخش ۸) |

## ۴. ریسک‌های امنیتی (فاز ۲)

| ریسک                       | وضعیت                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Brute Force روی OTP        | Rate Limit بر مبنای IP (۱۰/۱۰دقیقه) و شماره (۳/۱۰دقیقه) + حداکثر تلاش ۵ بار + انقضای کد                   |
| افشای کد OTP در Production | `devCode` فقط در `NODE_ENV !== "production"` برگردانده می‌شود؛ Provider قابل جایگزینی (`OTP_PROVIDER`)    |
| افشای نشست                 | توکن فقط به‌صورت hash در دیتابیس؛ کوکی HttpOnly؛ `clearSessionCookie` در logout                           |
| Account Enumeration        | پاسخ‌های یکسان برای شماره‌های موجود/ناموجود؛ Rate Limit از تست انبوه جلوگیری می‌کند                       |
| IDOR                       | همه مسیرهای `/me/*` با `requireUser()` روی نشست احرازشده محدود می‌شوند؛ شناسه کاربر از بدنه گرفته نمی‌شود |
| RBAC سمت سرور              | همه مسیرهای حساس با `assertPermission` (نه فقط UI) محافظت می‌شوند                                         |
| عدم افشای داده بیمار       | اسکیمای دیتابیس هیچ داده بیمار ندارد (مطابق `data-privacy-rules.md`)                                      |
| CORS/CSRF                  | API ها Same-Origin و stateless روی کوکی SameSite=Lax؛ بازبینی هنگام API های عمومی در فازهای بعد           |

## ۵. بدهی فنی عمدی

| بدهی                                     | دلیل                                                             |
| ---------------------------------------- | ---------------------------------------------------------------- |
| SQLite در توسعه                          | سادگی؛ مهاجرت به PostgreSQL در فاز ۱۳                            |
| `devCode` در پاسخ API                    | فقط در توسعه؛ Provider واقعی (SMS) در فازهای بعد با زیرساخت قطعی |
| فهرست استان‌ها/مهارت‌ها/علایق ثابت در کد | کافی برای MVP؛ مدیریت توسط مدیر در فاز ۷                         |
| گزارش‌دهی Audit در DB بدون UI مدیریتی    | مصرف فعلی در ممیزی رویداد؛ داشبورد در فاز ۷/۱۰                   |
| هیچ تست Integration برای API             | تست‌های واحد لایه‌های منطقی؛ تست Integration در فاز ۱۳           |

## ۶. Migration ها

- `prisma/migrations/20260904172841_init` — مدل User اولیه (فاز ۱).
- `prisma/migrations/20260904182623_phase2_identity` — جدول‌های OtpCode، Session، MembershipRequest، Skill/UserSkill، Interest/UserInterest، AuditLog و توسعه مدل User (نقش، وضعیت عضویت، پروفایل).

## ۷. فهرست فایل‌های اصلی (فاز ۲)

```
src/
  app/api/auth/request-otp/route.ts  verify-otp/route.ts  logout/route.ts  logout-all/route.ts  me/route.ts
  app/api/me/profile/route.ts  app/api/me/verification-request/route.ts
  app/api/admin/memberships/route.ts  app/api/admin/memberships/[id]/route.ts
  app/auth/page.tsx  app/onboarding/page.tsx  app/me/page.tsx  app/admin/layout.tsx  app/admin/memberships/page.tsx
  components/auth/  otp-form  onboarding-form  profile-form  verification-request  membership-queue  session-provider  user-menu
  components/ui/    chip-select  select
  lib/auth/         otp  otp-provider  session  current-user  authorization  rate-limit
  lib/              rbac  audit  crypto  serializers  validations/auth  constants/profile
prisma/schema.prisma + migrations/20260904182623_phase2_identity
```

## ۸. راهنمای تست دستی

1. `pnpm dev` و باز کردن `/auth` روی موبایل (عرض ≤ ۳۷۵px):
   - وارد شماره موبایل (مثلاً 0912xxxxxxx) → «دریافت کد تأیید» → کد آزمایشی (devCode) در پاسخ نمایش داده می‌شود.
   - وارد کردن کد → ورود و هدایت به `/onboarding`.
2. Onboarding چهارمرحله‌ای: نام، استان/شهرستان/سابقه، مهارت‌ها/علایق، معرفی/Visibility → «تکمیل پروفایل».
3. `/me`: کارت پروفایل، دکمه «درخواست تأیید عضویت حرفه‌ای»، و ویرایش پروفایل (بدون خطای توست).
4. کاربر دوم را با role=admin (موقتاً از `db` یا `prisma studio`) بسازید و در `/admin/memberships` درخواست را تأیید کنید؛ نقش کاربر به `verified_member` تغییر می‌کند.
5. خروج از همه دستگاه‌ها (`logout-all`) و بررسی نامعتبر شدن نشست.
6. تست RBAC: عضو معمولی به `/api/admin/*` دسترسی ندارد (۴۰۳).

## ۹. معیار خروج فاز ۲

- ✅ ثبت‌نام کامل روی موبایل (OTP + Onboarding)
- ✅ کنترل دسترسی هر نقش در API (assertPermission) و UI (layout محافظت‌شده)
- ✅ هیچ داده بیماری در مدل داده
- ✅ نشست امن + خروج از همه دستگاه‌ها + Audit Log
- ✅ رفع گیرنده‌ی فاز: خطای `useToast` در `/me` حذف شد

## ۱۰. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-2): identity, auth and professional profile

- OTP login (phone + rate-limited dev provider), secure sessions, logout / logout-all
- Multi-step onboarding and professional profile (province, work years, skills, interests, visibility)
- Roles + RBAC on server and UI; membership verification request and admin review
- Audit log; schema v2 migration; phase-2 report and docs update
- Fix: wrap /me in AppShell to provide ToastProvider (useToast crash)"
```

## ۱۱. توقف و انتظار تأیید

بر اساس مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. پس از تأیید، فاز ۳ (اتاق مسئله — هسته محصول) آغاز می‌شود.
