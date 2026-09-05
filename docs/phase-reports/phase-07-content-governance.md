# گزارش فاز ۷ — حکمرانی محتوا و ایمنی

**شاخه پیشنهادی:** `phase/07-content-governance`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** تکمیل و آماده تأیید (Stage-Gate)

---

## ۱. خلاصه

فاز ۷ «حکمرانی محتوا و ایمنی» کامل پیاده شد. این فاز زیرساخت نظارت محتوا را از صف ساده به یک سیستم کامل حکمرانی ارتقا داد:

1. **مدیریت وضعیت حساب کاربران:** اخطار (warn)، محدودسازی (restrict)، تعلیق (suspend) و رفع محدودیت (lift) با ثبت دلیل — توسط مدیر/ناظر از داشبورد.
2. **فرآیند اعتراض (Appeal):** کاربر می‌تواند به تصمیم ناظر روی محتوای خودش یا وضعیت حسابش اعتراض کند؛ ناظر می‌پذیرد یا رد می‌کند و در صورت پذیرش محتوا بازیابی یا محدودیت برداشته می‌شود.
3. **تاریخچه تصمیم ناظر (ModerationDecision):** هر اقدام نظارتی (مخفی‌سازی، حذف نرم، بازیابی، اخطار، محدودسازی، تعلیق و...) به‌صورت جدا ثبت و در داشبورد قابل بازبینی است.
4. **مدیریت واژه‌های حساس (SensitiveTerm):** ناظر می‌تواند واژه/الگوی حساس اضافه، فعال/غیرفعال یا حذف کند؛ این واژه‌ها در کنار الگوهای ثابت هنگام انتشار محتوا بررسی می‌شوند و در صورت تطبیق، محتوا به صف بررسی می‌رود.
5. **مدیریت برچسب‌ها:** ایجاد برچسب جدید و فعال/غیرفعال‌کردن برچسب‌های موجود.
6. **گزارش همکاری (Peer Cooperation Report):** صف رسیدگی به گزارش‌های سوءاستفاده در همکاری‌های همیار (بدهی PH6-3) در داشبورد ناظر.
7. **کنترل Spam:** جلوگیری از گزارش تکراری در انتظار بررسی + Rate Limit موجود + کنترل تعامل کاربران معلق/محدود.

**بدون داده بیمار و بدون قابلیت شبیه سیب** حفظ شد. همه اقدامات حساس Server-Side Authorization دارند و در `AuditLog` + `ModerationDecision` ثبت می‌شوند.

## ۲. بررسی (Review)

- **مدل داده (Migration `20260905110559_phase7_content_governance`):**
  - `AccountStatus` (active, warned, restricted, suspended) + فیلدهای `accountStatus`، `accountStatusReason`، `accountStatusAt` روی `User`.
  - `ModerationDecision` (تاریخچه تصمیم ناظر: moderatorId، targetType، targetId، action، reason، note) + enum های `ModerationTargetType` و `ModerationAction`.
  - `Appeal` (فرآیند اعتراض: userId، targetType، targetId، reason، status، decisionNote، decidedBy) + enum های `AppealStatus` و `AppealTargetType`.
  - `SensitiveTerm` (واژه‌های حساس قابل مدیریت: term یکتا، description، isActive، createdById).
  - `Tag.isActive` برای مدیریت برچسب.
- **API ها:**
  - `GET /api/admin/users` (فهرست کاربران با جست‌وجو/فیلتر وضعیت/صفحه‌بندی)
  - `POST /api/admin/users/[id]/action` (warn/restrict/suspend/lift با دلیل؛ ممنوعیت اقدام روی خود و super_admin)
  - `POST/GET /api/appeals` (ثبت اعتراض توسط کاربر + فهرست اعتراض‌ها و تصمیم‌های حساب خودش)
  - `GET /api/admin/appeals` + `POST /api/admin/appeals/[id]` (صف اعتراض + پذیرش/رد با بازیابی محتوا یا رفع محدودیت حساب)
  - `GET /api/admin/decisions` (تاریخچه تصمیم‌های ناظر با صفحه‌بندی)
  - `GET/POST /api/admin/sensitive-terms` + `PATCH/DELETE /api/admin/sensitive-terms/[id]`
  - `GET/POST /api/admin/tags` + `PATCH /api/admin/tags/[id]`
  - `POST /api/admin/peer-reports/[id]` (رسیدگی به گزارش همکاری)
  - ارتقای `GET /api/admin/moderation` برای بازگشت `peerReports`.
- **RBAC (فاز ۷):** مجوزهای جدید `moderation:users`، `moderation:appeals`، `moderation:terms`، `moderation:decisions`، `tags:manage`. `moderation:decisions` برای content_moderator هم فعال است؛ بقیه فقط admin/super_admin.
- **اجرا (Enforcement):**
  - `assertAccountCanCreate` در همه مسیرهای ثبت محتوا (مسئله، تجربه، پاسخ، حلقه، درخواست/پیشنهاد/پیام همیار، تکمیل همکاری).
  - `assertAccountCanInteract` در دنبال‌کردن/ذخیره/تشکر/گزارش — کاربر معلق نمی‌تواند تعامل کند.
  - کاربر معلق همچنان می‌تواند وارد شود (برای دیدن وضعیت و اعتراض) اما اجازه انتشار/تعامل ندارد.
  - ثبت هر اقدام نظارتی در `ModerationDecision` + `AuditLog` (Soft Delete با امکان Restore حفظ شد).
- **تشخیص محتوای حساس:** `scanContentForModeration` در `lib/moderation.ts` الگوهای ثابت + واژه‌های فعال دیتابیس را ترکیب می‌کند (کد `managed_term` برای تطبیق با واژه‌های مدیریتی).
- **عدم رقابت با سیب / بدون داده بیمار:** رعایت شده.

## ۳. وضعیت ابزارها (همه سبز)

| ابزار            | نتیجه                                                          |
| ---------------- | -------------------------------------------------------------- |
| `pnpm build`     | موفق                                                           |
| `pnpm typecheck` | موفق (بدون خطا)                                                |
| `pnpm lint`      | موفق (بدون خطا/هشدار)                                          |
| `pnpm test:run`  | ۲۹ فایل، ۲۰۲ تست موفق (شامل تست‌های جدید moderation + RBAC)      |
| تست زنده (HTTP)  | ثبت مسئله، تشخیص محتوای حساس، گزارش تکراری، اخطار/محدودسازی/تعلیق/رفع، اعتراض کاربر و رسیدگی ناظر، واژه حساس مدیریتی، برچسب، تاریخچه تصمیم روی دیتابیس واقعی موفق؛ داده‌های تست پاک‌سازی شدند |

## ۴. ریسک‌های امنیتی (فاز ۷)

| ریسک                        | وضعیت                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| افشای اطلاعات بیمار          | بدون تغییر در مدل داده؛ ممنوعیت مطلق حفظ؛ `scanContentForModeration` + واژه‌های مدیریتی روی همه مسیرهای انتشار |
| RBAC سمت سرور               | همه اقدامات نظارتی با `assertPermission` (moderation:*) + `assertAccountCanCreate/Interact`              |
| IDOR                        | همه مسیرها با `requireUser()`؛ اقدام روی خود ممنوع؛ اقدام روی super_admin ممنوع؛ اعتراض فقط روی محتوای خود |
| تصمیم نادرست ناظر            | `ModerationDecision` تاریخچه + امکان بازگشت (restore/lift) + فرآیند اعتراض                                 |
| Spam/سوءاستفاده از گزارش     | جلوگیری از گزارش تکراری (pending/reviewing) + Rate Limit (۵/ساعت) + تعلیق مانع تعامل                       |
| CSRF/CORS                   | API های Same-Origin و کوکی SameSite=Lax (همسو با فازهای قبل)                                              |

## ۵. بدهی فنی عمدی

| شناسه | بدهی                                                        | دلیل                          | بازپرداخت |
| ----- | ----------------------------------------------------------- | ----------------------------- | --------- |
| PH7-1 | تصمیم ناظر در UI به‌صورت «فقط فهرست» است (بدون جزئیات هدف)   | سادگی در MVP                  | فاز ۱۰    |
| PH7-2 | واژه‌های حساس فقط «شامل‌بودن» ساده (بدون Regex از سمت مدیر) | امنیت در برابر Regex تزریقی  | بازبینی هنگام نیاز |
| PH7-3 | `scanContentForModeration` هر بار واژه‌ها را از DB می‌خواند  | بدون کش؛ ساده در MVP/SQLite   | فاز ۱۳    |
| PH7-4 | تعلیق فقط بر «انتشار/تعامل» اثر دارد؛ دسترسی خواندن حفظ است  | برای امکان اعتراض کاربر معلق | بازبینی با خط مشی |

## ۶. Migration ها

- `20260905110559_phase7_content_governance` — AccountStatus، فیلدهای User، ModerationDecision، Appeal، SensitiveTerm، Tag.isActive + enum های جدید.

## ۷. فهرست فایل‌های اصلی (فاز ۷)

```
src/
  lib/moderation.ts  lib/moderation.test.ts  lib/constants/moderation.ts
  lib/rbac.ts (مجوزهای فاز ۷)  lib/serializers.ts  lib/serializers/peer.ts (serializePeerReport)
  lib/content-safety.ts (بدون تغییر؛ ترکیب در lib/moderation)
  app/api/admin/users/route.ts  app/api/admin/users/[id]/action/route.ts
  app/api/admin/appeals/route.ts  app/api/admin/appeals/[id]/route.ts
  app/api/admin/decisions/route.ts
  app/api/admin/sensitive-terms/route.ts  app/api/admin/sensitive-terms/[id]/route.ts
  app/api/admin/tags/route.ts  app/api/admin/tags/[id]/route.ts
  app/api/admin/peer-reports/[id]/route.ts
  app/api/admin/moderation/route.ts (گزارش همکاری)
  app/api/appeals/route.ts
  app/api/reports/route.ts (گزارش تکراری)
  app/api/moderation/{problems,experiences,answers}/[id]/route.ts (ثبت ModerationDecision)
  app/api/problems/route.ts  app/api/problems/[id]/route.ts  app/api/experiences/route.ts
  app/api/experiences/[id]/route.ts  app/api/problems/[id]/answers/route.ts
  app/api/circles/route.ts  app/api/peer/help-requests/route.ts
  app/api/peer/cooperations/[id]/messages/route.ts  app/api/peer/cooperations/[id]/complete/route.ts
  app/api/follows/route.ts  app/api/saves/route.ts  app/api/thanks/route.ts
  components/admin/ admin-users-manager  admin-appeals-queue  sensitive-terms-manager
                 admin-tags-manager  decisions-history  moderation-queue (گزارش همکاری)
  components/auth/ account-status-banner  appeals-manager  user-menu (لینک اعتراض)
  components/shell/app-shell.tsx (بنر وضعیت حساب)
  app/admin/users/page.tsx  app/admin/appeals/page.tsx  app/admin/sensitive-terms/page.tsx
  app/admin/tags/page.tsx  app/admin/decisions/page.tsx  app/appeals/page.tsx
  app/admin/layout.tsx (ناوبری جدید)
prisma/schema.prisma + migrations/20260905110559_phase7_content_governance
```

## ۸. راهنمای تست دستی

1. `pnpm dev`؛ با یک کاربر عادی وارد شوید. از منوی کاربر «اعتراض به تصمیم» (`/appeals`): ثبت اعتراض روی محتوای خود (شناسه از آدرس) یا وضعیت حساب.
2. با حساب مدیر (`role=admin`): از منوی کاربر «مدیریت درخواست‌های عضویت» یا آدرس `/admin/users`: کاربری را جست‌وجو و اخطار/محدودسازی/تعلیق کنید (با دلیل). وضعیت در فهرست نمایش داده می‌شود.
3. با حساب معلق: دوباره وارد شوید (امکان‌پذیر است)؛ بنر «معلق» بالای صفحه ظاهر می‌شود؛ ثبت مسئله → ۴۰۳؛ دنبال‌کردن → ۴۰۳؛ ثبت اعتراض → ۲۰۱.
4. `/admin/appeals`: اعتراض در انتظار را ببینید و بپذیرید/رد کنید. پذیرش اعتراض حساب، وضعیت را به active برمی‌گرداند.
5. `/admin/decisions`: تاریخچه تمام اقدامات (warn/restrict/suspend/lift/hide/remove/restore) با ناظر و دلیل.
6. `/admin/sensitive-terms`: واژه‌ای مثل یک عبارت خاص اضافه کنید؛ سپس با کاربر عادی در متن مسئله/تجربه همان عبارت را بنویسید → VALIDATION «واژهٔ حساس» و در صورت تأیید، `needsReview`.
7. `/admin/tags`: برچسب جدید بسازید یا یکی را غیرفعال کنید.
8. `/admin/moderation`: بخش «گزارش‌های همکاری» — گزارش سوءاستفاده در همکاری (از صفحه همکاری) اینجا ظاهر می‌شود.
9. گزارش تکراری: روی یک محتوا دوبار گزارش بدهید → CONFLICT (در انتظار بررسی).
10. تاریخ‌ها در UI به شمسی نمایش داده می‌شوند (همسو با فازهای قبل).

## ۹. معیار خروج فاز ۷

- ✅ هر گزارش وضعیت/مسئول/نتیجه دارد (`ContentReport` + `PeerCooperationReport` با reviewedBy/reviewedAt/status)
- ✅ همه اقدامات نظارتی در `ModerationDecision` + `AuditLog` ثبت می‌شوند
- ✅ امکان بازگشت تصمیم اشتباه (restore/unhide/lift + فرآیند اعتراض)
- ✅ داشبورد مدیریت: کاربران، تأیید عضویت، گزارش‌ها، صف محتوا، وضعیت تجربه‌ها، برچسب‌ها
- ✅ مدیریت واژه‌ها و الگوهای حساس + کنترل Spam (گزارش تکراری + Rate Limit)
- ✅ همه اقدامات حساس Server-Side Authorization؛ مدیر به Secret/OTP/Session دسترسی ندارد
- ✅ Soft Delete با امکان Restore؛ بدون داده بیمار؛ بدون قابلیت شبیه سیب

## ۱۰. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-7): content governance & safety

- User account moderation: warn/restrict/suspend/lift with reason + admin users dashboard
- Enforcement: suspended/restricted users blocked from content creation & interactions;
  suspended users can still sign in to view status and file appeals
- Appeal process: user appeals content/account decisions; admin approve/reject restores
  content or lifts restriction; duplicates prevented
- Moderation decision history (ModerationDecision) recorded for every content/account action
- Managed sensitive terms (SensitiveTerm) combined with static patterns in content scanning
- Tag management (create/activate/deactivate)
- Peer cooperation report queue + resolution endpoint
- Duplicate pending report detection (spam control)
- New RBAC permissions (moderation:users/appeals/terms/decisions, tags:manage) + audit log
- schema v7 migration; phase-7 report and docs update"
```

## ۱۱. توقف و انتظار تأیید

بر اساس مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. پس از تأیید، فاز ۸ (جست‌وجو، اعلان و کشف دانش) آغاز می‌شود.