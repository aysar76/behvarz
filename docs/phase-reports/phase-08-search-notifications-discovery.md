# گزارش فاز ۸ — جست‌وجو، اعلان و کشف دانش

**شاخه پیشنهادی:** `phase/08-search-notifications-discovery`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** تکمیل و آماده تأیید (Stage-Gate)

---

## ۱. خلاصه

فاز ۸ «جست‌وجو، اعلان و کشف دانش» کامل پیاده شد. سه قابلیت مکمل ساخته شد:

1. **جست‌وجو:** دسترسی سریع به مسائل/تجربه‌ها/حلقه‌ها/اعضا با فیلتر نوع/برچسب/استان/وضعیت، Empty State مفید و پیشنهاد برچسب‌های دنبال‌شده — با راه‌حل ساده (LIKE در SQLite) بدون سرویس Full-Text خارجی.
2. **اعلان‌ها:** پاسخ جدید، اشاره کنترل‌شده (`@نام`)، انتخاب راهکار، پذیرش در حلقه، دعوت/جلسه حلقه، پیشنهاد/پیام/تکمیل همیاری و نتیجه اعتراض؛ خوانده/نخوانده با شمارنده؛ تنظیمات فعال/غیرفعال هر نوع (`NotificationPreference`).
3. **کشف دانش:** الگوریتم ساده و قابل توضیح بدون Popularity — مسائل مرتبط با علایق/مهارت، مسائل بی‌پاسخ، تجربه‌های برگزیده، حلقه‌های همان استان و «ادامه فعالیت‌های نیمه‌تمام».

**گیرنده‌ی مشکل فاز:** در حین تست زنده، PowerShell 5.1 با فایل UTF-8 بدون BOM، کاراکترهای فارسی را خراب می‌کرد (مشکل محیط تست، نه کد). تست‌ها با ساخت رشته فارسی از کد کاراکترها (`[char]0x0645`...) انجام و همه مسیرها راستی‌آزمایی شدند. داده‌های تست پاک‌سازی شدند.

## ۲. بررسی (Review)

- **مدل داده (Migration `20260905120802_phase8_search_notifications`):** `Notification` (گیرنده، نوع رویداد، عامل، عنوان/متن، نوع هدف/شناسه، خوانده/زمان خواندن) + `NotificationPreference` (کلید یکتا `[userId, type]`، فعال/غیرفعال) + enum های `NotificationType` و `NotificationTargetType`. هیچ داده بیمار در مدل داده وجود ندارد.
- **ایجاد اعلان (`src/lib/notifications.ts`):** `notifyUser` اعلان را فقط در صورت فعال‌بودن نوع آن در تنظیمات گیرنده می‌سازد؛ به خود کاربر اعلان داده نمی‌شود. در MVP فقط درون‌برنامه‌ای؛ Provider های SMS/Push/Email بعداً افزوده می‌شوند.
- **رویدادهای متصل به اعلان:**
  - `problem_answer` در `POST /api/problems/[id]/answers` (به نویسنده مسئله)
  - `answer_mention` در همین مسیر از `notifyMentions` (`src/lib/mention.ts`؛ الگوی `@نام`، یک‌بار به‌ازای هر کاربر، فقط کاربران فعال/غیرخصوصی/Onboarding‌شده)
  - `solution_selected` در `POST /api/problems/[id]/select-solution` (به نویسنده پاسخ)
  - `circle_join_accepted` در بررسی درخواست عضویت (به متقاضی)
  - `circle_invite` در `POST /api/circles/[id]/invites` (به دعوت‌شده)
  - `circle_meeting` در `POST /api/circles/[id]/meetings` (به اعضای غیرخالق)
  - `cooperation_offer` در `POST /api/peer/offers` (به طرف مقابل)
  - `cooperation_message` در `POST /api/peer/cooperations/[id]/messages` (به طرف مقابل)
  - `cooperation_complete` در `POST /api/peer/cooperations/[id]/complete` (به طرف مقابل)
  - `appeal_decision` در `POST /api/admin/appeals/[id]` (به متقاضی)
- **API اعلان‌ها:**
  - `GET /api/notifications` (فهرست + تعداد خوانده‌نشده؛ اهداف مسئله/تجربه با Serializer پر می‌شوند)
  - `POST /api/notifications` (خواندن یک اعلان با `{id}` یا همه با `{}`؛ تأیید مالکیت)
  - `GET/PATCH /api/me/notification-preferences` (فهرست پیش‌فرض ۱۰ نوع + ذخیره انتخابی با upsert و Audit Log)
- **جست‌وجو (`src/lib/search.ts` + `GET /api/search`):** `searchAll` با `contains` (LIKE/SQLite) روی مسائل (title/description/context)، تجربه‌ها (title/situation/action)، حلقه‌ها (name/description/topic؛ فقط فعال) و اعضا (displayName/province/city؛ فقط Onboarding‌شده، `visibility ≠ private`، `accountStatus = active`). فیلتر برچسب/استان/وضعیت؛ فقط محتوای منتشرشده و `moderation=visible`. Empty State مفید در UI + پیشنهاد برچسب‌های دنبال‌شده.
- **کشف دانش (`src/lib/discovery.ts` + `GET /api/discover`):** مبتنی بر علایق/مهارت کاربر (برچسب هم‌تراز)، مسائل بی‌پاسخ (بدون هیچ پاسخ، قدیمی‌ترین اول)، تجربه‌های برگزیده/تأییدشده مرتبط (reviewedAt نزولی)، حلقه‌های فعال همان استان و «ادامه فعالیت‌های نیمه‌تمام» (پیش‌نویس مسئله/تجربه + درخواست همیاری باز). بدون Popularity؛ بدون شمارنده لایک.
- **UI:** `/search` (تب نوع + فیلتر + Empty State)، `/notifications` (لیست با نشان «جدید» + خواندن همه)، `/notifications/settings` (کلیدهای ۱۰ نوع)، `/discover` (بخش‌های کشف). زنگوله اعلان با شمارنده خوانده‌نشده و آیکن جست‌وجو در هدر؛ «کشف دانش» در ناوبری؛ «تنظیمات اعلان» در منوی کاربر؛ ناوبری موبایل به ۴ ستون.
- **امنیت:** همه مسیرهای جدید با `requireUser()`؛ `notifyUser` مالکیت/تنظیمات گیرنده را رعایت می‌کند؛ `POST /api/notifications` فقط اعلان خود کاربر را می‌خواند؛ جست‌وجوی اعضا فقط پروفایل‌های غیرخصوصی/فعال. بدون داده بیمار؛ بدون قابلیت شبیه سیب.

## ۳. وضعیت ابزارها (همه سبز)

| ابزار            | نتیجه                                                         |
| ---------------- | ------------------------------------------------------------- |
| `pnpm build`     | موفق (۶۱ مسیر؛ شامل /search, /notifications, /discover)       |
| `pnpm typecheck` | موفق (بدون خطا)                                               |
| `pnpm lint`      | موفق (بدون خطا/هشدار)                                         |
| `pnpm test:run`  | ۳۱ فایل، ۲۱۱ تست موفق (شامل تست‌های جدید notification/mention) |
| تست زنده (HTTP)  | پاسخ→اعلان، انتخاب راهکار→اعلان، Mention، خواندن همه، تنظیمات اعلان (فعال/غیرفعال)، جست‌وجو، کشف (علایق/بی‌پاسخ/نیمه‌تمام)، سرکوب اعلان با تنظیمات روی دیتابیس واقعی موفق؛ داده‌های تست پاک‌سازی شدند |

## ۴. ریسک‌های امنیتی (فاز ۸)

| ریسک                     | وضعیت                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| افشای اطلاعات بیمار      | بدون تغییر در مدل داده؛ ممنوعیت مطلق حفظ؛ اعلان/جست‌وجو روی محتوای ناشناس‌سازی‌شده و قابل‌نمایش              |
| IDOR                     | همه مسیرهای جدید با `requireUser()`؛ `POST /api/notifications` مالکیت اعلان را بررسی می‌کند (اعلان دیگران → NOT_FOUND) |
| RBAC سمت سرور            | اعلان/جست‌وجو/کشف برای اعضای واردشده؛ رویدادها در مسیرهای موجود با مجوزهای همان مسیر ساخته می‌شوند          |
| حریم خصوصی اعضا          | جست‌وجوی اعضا فقط `visibility ≠ private` و `accountStatus = active`؛ پروفایل خصوصی در نتایج جست‌وجو نمی‌آید  |
| سوءاستفاده از اعلان      | عدم اعلان به خود؛ تنظیمات فعال/غیرفعال؛ فقط محتوای قابل‌نمایش به‌عنوان هدف اعلان ارسال می‌شود               |
| اسپم Mention             | فقط کاربران فعال/غیرخصوصی/Onboarding‌شده؛ هر کاربر یک‌بار در هر پاسخ                                        |
| CSRF/CORS                | API های Same-Origin و کوکی SameSite=Lax (همسو با فازهای قبل)                                                 |

## ۵. بدهی فنی عمدی

| شناسه | بدهی                                                        | دلیل                              | بازپرداخت |
| ----- | ----------------------------------------------------------- | --------------------------------- | --------- |
| PH8-1 | جست‌وجو با LIKE/SQLite (بدون Full-Text فارسی/ایندکس)        | سادگی و کم‌وابستگی در MVP         | فاز ۱۳    |
| PH8-2 | اعلان‌ها فقط درون‌برنامه‌ای (Pull) و بدون WebSocket          | بدون زیرساخت قطعی؛ Provider آماده است | فازهای بعد |
| PH8-3 | Mention فقط نام یک‌تکه (بدون فاصله) و یک‌بار به‌ازای کاربر   | سادگی و جلوگیری از سوءاستفاده    | هنگام نیاز |
| PH8-4 | پیشنهاد کشف ثابت در کد (بدون پنل تنظیم وزن/معیار)            | قابل توضیح‌بودن و سادگی در MVP    | فاز ۱۰    |
| PH8-5 | تعداد اعلان‌های خوانده‌نشده در هر بارگذاری صفحه محاسبه می‌شود | بدون Cache؛ ساده در MVP           | فاز ۱۳    |

## ۶. Migration ها

- `20260905120802_phase8_search_notifications` — `Notification`، `NotificationPreference` + enum های `NotificationType`/`NotificationTargetType`.

## ۷. فهرست فایل‌های اصلی (فاز ۸)

```
src/
  lib/notifications.ts  lib/mention.ts  lib/search.ts  lib/discovery.ts
  lib/constants/notification.ts  lib/validations/notification.ts
  lib/serializers/notification.ts  lib/serializers/user-search.ts (+ تست‌ها)
  lib/mention.test.ts  lib/serializers/notification.test.ts
  app/api/notifications/route.ts  app/api/me/notification-preferences/route.ts
  app/api/search/route.ts  app/api/discover/route.ts
  app/api/problems/[id]/answers/route.ts  app/api/problems/[id]/select-solution/route.ts
  app/api/circles/[id]/join-requests/[requestId]/route.ts
  app/api/circles/[id]/invites/route.ts  app/api/circles/[id]/meetings/route.ts
  app/api/peer/offers/route.ts  app/api/peer/cooperations/[id]/messages/route.ts
  app/api/peer/cooperations/[id]/complete/route.ts  app/api/admin/appeals/[id]/route.ts
  app/search/page.tsx  app/notifications/page.tsx  app/notifications/settings/page.tsx  app/discover/page.tsx
  components/search/search-explorer.tsx
  components/notifications/notification-list.tsx  notification-settings.tsx  notification-bell.tsx
  components/discovery/discovery-feed.tsx
  components/shell/app-header.tsx  mobile-nav.tsx  components/auth/user-menu.tsx
  config/site.ts (ناوبری «کشف دانش»)
prisma/schema.prisma + migrations/20260905120802_phase8_search_notifications
```

## ۸. راهنمای تست دستی

1. `pnpm dev`؛ با یک کاربر وارد شوید (Onboarding کامل).
2. با دو کاربر: الف مسئله ثبت می‌کند؛ ب پاسخ می‌دهد → اعلان «پاسخ جدید» برای الف. الف راهکار انتخاب می‌کند → اعلان «انتخاب راهکار» برای ب.
3. در پاسخ، `@نام‌نمایشی` کاربر ب را بنویسید → اعلان «اشاره به شما» برای ب (فقط نام یک‌تکه).
4. `/notifications`: نشان «جدید»، دکمه «خواندن همه» و شمارنده زنگوله در هدر.
5. `/notifications/settings`: نوعی را غیرفعال کنید (مثلاً پیام همکاری)؛ سپس همان رویداد را تولید کنید → اعلانی برای شما ساخته نمی‌شود.
6. `/search`: عبارت، برچسب یا استان را جست‌وجو کنید؛ تب نوع (مسئله/تجربه/حلقه/عضو) و فیلترها را امتحان کنید؛ جست‌وجوی بدون نتیجه Empty State مفید نشان می‌دهد.
7. `/discover`: با علایق/مهارت پروفایل، مسائل مرتبط، مسائل بی‌پاسخ، تجربه‌های برگزیده، حلقه‌های همان استان و «ادامه فعالیت‌های نیمه‌تمام» (پیش‌نویس‌ها) نمایش داده می‌شوند.
8. تست RBAC: کاربر مهمان به همه این API ها ۴۰۱ می‌گیرد.
9. تاریخ‌ها در UI به شمسی نمایش داده می‌شوند (همسو با فازهای قبل).

## ۹. معیار خروج فاز ۸

- ✅ جست‌وجوی مسائل/تجربه‌ها/حلقه‌ها/اعضا با فیلتر نوع/برچسب/استان/وضعیت و رعایت حریم خصوصی
- ✅ محدودیت‌های Full-Text فارسی بررسی و راه‌حل ساده (LIKE/SQLite) انتخاب شد؛ بدون سرویس خارجی
- ✅ اعلان‌های پاسخ/Mention/پذیرش حلقه/انتخاب راهکار/رویداد حلقه/همیاری/اعتراض؛ خوانده/نخوانده؛ تنظیمات نوع؛ Provider قابل توسعه
- ✅ کشف: علایق، حلقه‌ها، اتاق‌های بی‌پاسخ، تجربه‌های برگزیده، ادامه فعالیت‌های نیمه‌تمام
- ✅ الگوریتم پیشنهاد ساده/قابل توضیح/بدون Popularity
- ✅ جست‌وجوهای بدون نتیجه با Empty State مفید قابل تحلیل‌اند (پیشنهاد برچسب دنبال‌شده)
- ✅ بدون داده بیمار؛ بدون قابلیت شبیه سیب

## ۱۰. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-8): search, notifications & knowledge discovery

- Search across problems/experiences/circles/members (LIKE/SQLite, no external
  full-text) with type/tag/province/status filters, privacy-aware member search,
  useful empty state and followed-tag suggestions
- In-app notifications (Notification): problem answer, controlled mention (@name),
  solution selected, circle join accepted/invite/meeting, cooperation
  offer/message/complete, appeal decision; read/unread with unread count; mark
  single/all read with ownership check
- Notification preferences (NotificationPreference) per type with upsert + audit;
  notifyUser respects recipient prefs and never notifies self
- Extensible notification provider (in-app only in MVP; SMS/Push/Email later)
- Knowledge discovery /discover: interest/skill-tagged problems, unanswered rooms,
  featured/reviewed experiences, same-province circles, continue unfinished
  (drafts + open help requests) - simple, explainable, no popularity
- Header notification bell + search icon; nav discovery entry; mobile nav 4 cols
- schema v8 migration; phase-8 report and docs update"
```

## ۱۱. توقف و انتظار تأیید

بر اساس مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. پس از تأیید، **دروازه MVP** (ارزیابی آمادگی و شروع پایلوت ۵۰-۱۰۰ نفره) انجام می‌شود. بدهی‌های فاز ۸ در `docs/known-limitations.md` و `docs/technical-debt.md` ثبت شده‌اند.