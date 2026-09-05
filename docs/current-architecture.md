# معماری فعلی (Current Architecture)

**وضعیت:** به‌روزرسانی برای فاز ۱۴ — تاریخ: مهر ۱۴۰۵

## وضعیت واقعی مخزن

- مخزن `behvarz` از وضعیت greenfield (فاز ۰) آغاز شد؛ هیچ کد legacy (PHP 7.3 / MariaDB 10.1) وجود ندارد.
- هیچ زیرساخت Production مستقر نشده است؛ توسعه روی SQLite محلی انجام می‌شود.

## معماری هدف (تصویب‌شده برای فاز ۱)

| لایه       | انتخاب                                 | دلیل                                                          |
| ---------- | -------------------------------------- | ------------------------------------------------------------- |
| فریم‌ورک   | Next.js (App Router)                   | Full-stack تک‌کدبیس، SSR/SSC، سازگار با استقرار ساده          |
| زبان       | TypeScript (Strict)                    | امنیت نوع در سطح پروژه                                        |
| استایل     | Tailwind CSS + CSS Variables (توکن‌ها) | موبایل‌فرست، RTL، کم‌حجم                                      |
| دیتابیس    | SQLite (توسعه) از طریق Prisma          | بدون نیاز به سرویس خارجی؛ مسیر مهاجرت به PostgreSQL در فاز ۱۳ |
| ORM        | Prisma                                 | Schema-first، Migration کنترل‌شده، Type-Safe                  |
| Validation | zod (سمت سرور)                         | قرارداد API شفاف                                              |
| تست        | Vitest                                 | سبک، سریع، سازگار با TS                                       |
| باندل/اجرا | Node 24 / pnpm                         | نصب موجود روی ماشین توسعه                                     |

## معماری احراز هویت و هویت (فاز ۲)

- **ورود:** شماره موبایل + OTP (کد با hash در `OtpCode`، Rate Limit، Provider قابل جایگزینی در `src/lib/auth/otp-provider.ts`).
- **نشست:** توکن تصادفی با ذخیره `sha256` در `Session`؛ کوکی `bhz_session` با HttpOnly/SameSite=Lax؛ خروج از همه دستگاه‌ها از طریق `revokeAllSessions`.
- **RBAC:** ماتریس مجوز در `src/lib/rbac.ts` (۸ نقش)؛ کنترل در API با `assertPermission` و در UI با layout محافظت‌شده.
- **Audit Log:** رویدادهای حساس در `AuditLog` ثبت می‌شوند (`src/lib/audit.ts`).
- **دسترسی کاربر فعلی:** `getCurrentUser`/`requireUser` از روی کوکی نشست (`src/lib/auth/current-user.ts`).

## معماری اتاق مسئله (فاز ۳)

- **مدل داده:** `Problem` (با وضعیت/فوریت/نوع مانع/ناشناس/پیش‌نویس/نظارت)، `ProblemAnswer` (+ «مفید بود» از طریق `ProblemAnswerHelpful` و انتخاب راهکار)، `ProblemStatusChange` (تاریخچه وضعیت)، `Tag/ProblemTag`، `ContentReport`.
- **محرک انگیزشی:** ساختار اجباری مسئله (نه پست+کامنت) و چرخه «ثبت مسئله ← پاسخ ← انتخاب راهکار ← ثبت نتیجه اجرا» مطابق حلقه بسته دانش.
- **امنیت محتوا:** `content-safety.ts` الگوهای اطلاعات قابل شناسایی را پیش از انتشار هشدار می‌دهد؛ تأیید نشده = رد، تأیید شده = `needsReview` برای ناظر.
- **نظارت:** `POST /api/moderation/{problems|answers}/[id]` (مخفی/حذف/بازیابی) و `POST /api/admin/reports/[id]` با `assertPermission("content:moderate"/"reports:review")` + Audit Log.
- **ناشناس‌سازی:** `authorId` همیشه ذخیره می‌شود اما در `serializeProblem` با `isAnonymous` از خروجی حذف می‌شود؛ ناظران با `revealAuthor` می‌توانند نویسنده را ببینند.
- **تاریخ شمسی:** فقط در لایه UI (`src/lib/dates.ts`)؛ ذخیره استاندارد UTC در دیتابیس.
- **Anti-Spam:** Rate Limit در حافظه برای ثبت مسئله (۱۰/ساعت)، پاسخ (۲۰/ساعت) و گزارش (۵/ساعت) به‌ازای کاربر.

## معماری بانک تجربه (فاز ۴)

- **مدل داده:** `Experience` (با وضعیت/پیش‌نویس/نظارت/مسئله مبدا)، `ExperienceTag`، `ExperienceReference` (ارجاع تجربه در پاسخ مسئله)، `ExperienceReuse` («این تجربه را اجرا کردم» + نتیجه)، توسعه `ContentReport` با `experienceId`.
- **چرخه بسته دانش:** «مسئله حل‌شده ← تبدیل به تجربه (`convert-to-experience`) ← تجربه در پاسخ‌ها ارجاع می‌شود ← دیگران آن را اجرا و نتیجه ثبت می‌کنند».
- **سرمایه روایت (شواهد‌محور، نه لایک):** تعداد ارجاع در مسائل واقعی + تعداد اجرای گزارش‌شده + میزان موفقیت اجرای مجدد + تأیید/برگزیده‌شدن توسط ناظر. هیچ شمارنده لایک وجود ندارد.
- **اسلاگ قابل اشتراک:** `tajrobe-XXXXXXXX` (توکن کوتاه تصادفی)؛ صفحه `/experiences/[slug]` مستقل از id.
- **تفکیک «تجربه شخصی» از «محتوای بررسی‌شده»:** وضعیت `user_generated` برچسب «تجربه شخصی» دارد؛ تأیید ناظر → `reviewed`، برگزیده → `featured`؛ محتوای حساس → `under_review`/`needsReview` برای صف ناظر.
- **امنیت محتوا و نظارت:** الگوی محتوای حساس یکسان با فاز ۳؛ گزارش تجربه + `POST /api/moderation/experiences/[id]` + بخش تجربه‌ها در `GET /api/admin/moderation`.
- **دیده‌شدن نویسنده:** برخلاف مسئله (که `isAnonymous` دارد)، نام نویسنده تجربه در خروجی عمومی نمایش داده می‌شود (تجربه = اعتبار و دیده‌شدن)؛ محتوای تجربه ناشناس‌سازی‌شده از مشخصات بیمار است.
- **RBAC:** مجوزهای جدید `experiences:create/update:own/reuse/archive/report` برای اعضا و `experiences:review` برای ناظر/مدیر.

## معماری تعاملات حرفه‌ای و سرمایه روایت (فاز ۵)

- **مدل داده:** `Follow` (پلی‌مورفیک: برچسب/مسئله/تجربه/عضو)، `SavedItem` (خواندنی‌های من)، `ProfessionalThanks` (تشکر حرفه‌ای) + فیلد `thanksCount` روی `ProblemAnswer` و `Experience`.
- **دنبال‌کردن:** یک کلید ترکیبی یکتا `[userId, targetType, targetId]`؛ هدف (برچسب/مسئله/تجربه/عضو) سمت سرور پیش از ذخیره اعتبارسنجی می‌شود (`resolveTarget`). دنبال‌کردن عضو با `visibility=private` ممنوع و دنبال‌کردن خود ممنوع است.
- **ذخیره محتوا:** فقط مسائل/تجربه‌های منتشرشده و قابل‌نمایش؛ از طریق `POST/DELETE /api/saves` و فهرست در `GET /api/saved`.
- **تشکر حرفه‌ای به‌جای لایک:** یک‌بار به‌ازای هر هدف؛ تشکر به محتوای خود کاربر ممنوع؛ `receivedById` برای محاسبه سرمایه روایت ذخیره می‌شود؛ شمارنده به‌صورت تراکنشی به‌روزرسانی می‌شود.
- **پروفایل سرمایه حرفه‌ای (`/users/[id]`):** تجربه‌های منتشرشده، مسائل حل‌شده، ارجاع‌های معتبر، اجرای موفق توسط دیگران، تشکر دریافتی + نشان‌های مبتنی بر شواهد (`serializers/capital.ts`) — بدون لایک/لیدربورد. حریم خصوصی: پروفایل `private` فقط برای صاحبش.
- **خوراک حرفه‌ای (`/feed`):** بر اساس موضوع‌ها/اعضای دنبال‌شده، نه محبوبیت؛ الگوریتم ساده و قابل توضیح (`GET /api/feed`).
- **حالت تعامل در Serializerها:** `serializeProblem`/`serializeExperience` گزینه‌های `savedSet`/`followedSet`/`followedTags`/`thankedIds` می‌گیرند؛ API ها و صفحه‌های سرور از `getInteractionState(userId)` استفاده می‌کنند.
- **RBAC:** مجوزهای جدید `interactions:follow`، `interactions:save`، `interactions:thanks`، `profile:read:other` برای اعضا.
- **Audit Log:** `interaction.follow/unfollow`، `interaction.save/unsave`، `interaction.thanks/unthanks`.

## معماری حلقه‌های همیار (فاز ۶)

- **مدل داده:** `Circle` (گروه کوچک ۵-۱۲ نفره با راهبر)، `CircleMembership`، `CircleJoinRequest`، `CircleInvite`، `CircleMeeting` (جلسه/خروجی دوره‌ای)، `PeerHelpRequest` (درخواست همیار)، `PeerOffer` (پیشنهاد همیاری)، `PeerCooperation` (همکاری دونفره)، `PeerMessage` (گفت‌وگوی محدود Thread-Based)، `PeerCooperationReport` (گزارش سوءاستفاده) + فیلد `willingToHelp` روی `User`. بدون Chat بلادرنگ/WebSocket در MVP.
- **درخواست همیار:** ثبت مسئله با نوع مانع/برچسب/استان؛ **جفت‌سازی قابل توضیح** (`suggestHelpers` در `src/lib/peer.ts`) بر اساس: تمایل به همیاری + تجربه/برچسب هم‌تراز + مهارت/علاقه مرتبط + استان همسان + کیفیت همکاری‌های قبلی (رتبه ≥ ۴) + عضو تأییدشده — بدون Popularity. فقط کاندیدهای `willingToHelp` با `visibility ≠ private` و `onboardingCompleted`.
- **پیشنهاد و همکاری:** همیار پیشنهاد می‌دهد یا درخواست‌دهنده دعوت می‌کند (`PeerOffer` با کلید یکتا `[helpRequestId, helperId]`)؛ پذیرش/رد/پس‌گرفتن؛ همکاری با هدف، گفت‌وگوی محدود، ثبت خلاصه نتیجه/خاتمه، ارزیابی سودمندی دوطرفه (۱-۵) و گزارش سوءاستفاده.
- **حلقه‌ها:** ایجاد (خالق = راهبر)، درخواست عضویت/دعوت/تأیید با کنترل ظرفیت، صفحه حلقه (`/circles/[id]`)، جلسات، خروج، انتقال راهبری، آرشیو. عملیات راهبری با `assertCircleFacilitator` سمت سرور محدود می‌شود.
- **حالت تعامل در Serializerها:** `serializeCircle` (isMember/isFacilitator/myJoinRequest/myInvite)، `serializePeerHelpRequest` (isRequester، offers/isMine)، `serializePeerCooperation`.
- **امنیت محتوا:** `scanSensitiveContent` روی نام/توضیح/موضوع حلقه و عنوان/شرح درخواست همیار؛ Rate Limit برای ایجاد حلقه (۵/ساعت) و پیشنهاد همیار (۱۵/ساعت).
- **RBAC:** مجوزهای جدید `circles:create/join/manage/meeting` و `peer:request/offer/cooperate` برای اعضا.
- **Audit Log:** `circle.create/archive/transfer`، `peer.offer.requester/helper`، `peer.help-request.cancel`، `peer.cooperation.goal` و غیره.

## معماری حکمرانی محتوا و ایمنی (فاز ۷)

- **مدل داده:** `ModerationDecision` (تاریخچه تصمیم ناظر)، `Appeal` (فرآیند اعتراض)، `SensitiveTerm` (واژه‌های حساس قابل مدیریت) + فیلدهای `accountStatus/accountStatusReason/accountStatusAt` روی `User` + `Tag.isActive` برای مدیریت برچسب.
- **وضعیت حساب:** `active`/`warned`/`restricted`/`suspended`. اقدامات `POST /api/admin/users/[id]/action` (warn/restrict/suspend/lift) فقط برای admin/super_admin؛ اقدام روی خود و `super_admin` ممنوع. همه در `ModerationDecision` + `AuditLog` ثبت می‌شوند.
- **اجرا (Enforcement):** `assertAccountCanCreate` در همه مسیرهای ثبت محتوا (مسئله/تجربه/پاسخ/حلقه/همیار) و `assertAccountCanInteract` در تعاملات (دنبال/ذخیره/تشکر/گزارش). کاربر معلق می‌تواند وارد شود (برای دیدن وضعیت و اعتراض) اما نمی‌تواند محتوا/تعامل داشته باشد.
- **فرآیند اعتراض:** کاربر (نویسنده) می‌تواند به تصمیم روی محتوای خود یا وضعیت حسابش اعتراض کند (`POST/GET /api/appeals`)؛ یک اعتراض در انتظار برای هر هدف. ناظر در `/admin/appeals` می‌پذیرد/رد می‌کند؛ پذیرش → بازیابی محتوا یا رفع محدودیت حساب.
- **تاریخچه تصمیم:** `GET /api/admin/decisions` تمام اقدامات (hide/remove/restore/warn/restrict/suspend/lift) را با ناظر و دلیل بازمی‌گرداند. Soft Delete با Restore حفظ شد.
- **واژه‌های حساس:** `SensitiveTerm` (term یکتا، isActive) مدیریت در `/admin/sensitive-terms`؛ `scanContentForModeration` در `src/lib/moderation.ts` الگوهای ثابت + واژه‌های فعال را ترکیب می‌کند (کد `managed_term`). در صورت تطبیق → `needsReview` یا درخواست تأیید ناشناس‌سازی.
- **گزارش همکاری:** `PeerCooperationReport` در صف ناظر (`GET /api/admin/moderation` → `peerReports`) با `POST /api/admin/peer-reports/[id]`؛ در صورت تأیید، اخطار روی طرف خاطی ثبت می‌شود.
- **کنترل Spam:** جلوگیری از گزارش تکراریِ در انتظار بررسی (CONFLICT) + Rate Limit موجود (گزارش ۵/ساعت).
- **RBAC (فاز ۷):** `moderation:users`، `moderation:appeals`، `moderation:terms`، `tags:manage` فقط admin/super_admin؛ `moderation:decisions` برای content_moderator هم فعال. همه اقدامات با `assertPermission` سمت سرور.
- **ناظر به Secret دسترسی ندارد:** هیچ API اداری کد OTP/توکن نشست را بازنمی‌گرداند.

## معماری جست‌وجو، اعلان و کشف دانش (فاز ۸)

- **مدل داده:** `Notification` (اعلان درون‌برنامه‌ای: گیرنده، نوع رویداد، عامل، عنوان/متن، نوع هدف/شناسه، خوانده‌شده) + `NotificationPreference` (فعال/غیرفعال‌بودن هر نوع اعلان برای هر کاربر؛ کلید یکتا `[userId, type]`). هیچ داده بیمار در مدل داده وجود ندارد.
- **ایجاد اعلان (`src/lib/notifications.ts`):** `notifyUser` اعلان را فقط در صورت فعال‌بودن نوع آن در تنظیمات گیرنده می‌سازد؛ اعلان به خود کاربر (actorId === userId) داده نمی‌شود. در MVP فقط اعلان درون‌برنامه‌ای است؛ Provider های SMS/Push/Email برای فازهای بعدی قابل افزودن‌اند (اینترفیس مستقل است).
- **رویدادهای متصل:** پاسخ به مسئله (`problem_answer`)، اشاره کنترل‌شده (`answer_mention` از `src/lib/mention.ts` با الگوی `@نام`)، انتخاب راهکار (`solution_selected`)، پذیرش درخواست عضویت در حلقه (`circle_join_accepted`)، دعوت به حلقه (`circle_invite`)، جلسه حلقه (`circle_meeting`)، پیشنهاد همیاری (`cooperation_offer`)، پیام همکاری (`cooperation_message`)، تکمیل همکاری (`cooperation_complete`)، نتیجه اعتراض (`appeal_decision`).
- **API اعلان‌ها:** `GET/POST /api/notifications` (فهرست + تعداد خوانده‌نشده؛ خواندن تک/همه با تأیید مالکیت)، `GET/PATCH /api/me/notification-preferences` (تنظیمات نوع اعلان با اعتبارسنجی و Audit Log).
- **جست‌وجو (`src/lib/search.ts` + `GET /api/search`):** جست‌وجوی ساده مسائل/تجربه‌ها/حلقه‌ها/اعضا با `contains` (LIKE در SQLite؛ بدون سرویس Full-Text خارجی). فیلتر بر اساس نوع، برچسب، استان و وضعیت؛ فقط محتوای منتشرشده/قابل‌نمایش و اعضای با `visibility ≠ private` و `accountStatus = active`؛ پیشنهاد برچسب‌های دنبال‌شده. Empty State مفید در UI.
- **کشف دانش (`src/lib/discovery.ts` + `GET /api/discover`):** الگوریتم ساده و قابل توضیح بدون Popularity — مسائل مرتبط با علایق/مهارت‌های کاربر، مسائل بی‌پاسخ (بدون هیچ پاسخ)، تجربه‌های برگزیده/تأییدشده مرتبط، حلقه‌های فعال همان استان، و «ادامه فعالیت‌های نیمه‌تمام» (پیش‌نویس مسئله/تجربه + درخواست همیاری باز).
- **UI:** صفحه `/search` (جست‌وجوی همه‌انواع با تب/فیلتر/Empty State)، `/notifications` (فهرست اعلان با خوانده/نخوانده و خواندن همه)، `/notifications/settings` (کلیدهای هر نوع)، `/discover` (بخش‌های کشف). زنگوله اعلان با شمارنده خوانده‌نشده + آیکن جست‌وجو در هدر؛ «کشف دانش» در ناوبری؛ «تنظیمات اعلان» در منوی کاربر.
- **RBAC:** اعلان‌ها و جست‌وجو/کشف برای اعضای واردشده (requireUser) هستند؛ هیچ مجوز جدیدی اضافه نشد (رویدادها در مسیرهای موجود با مجوزهای خودشان ساخته می‌شوند).
- **Audit Log:** به‌روزرسانی تنظیمات اعلان (`notification.preferences.update`).

## محدودیت‌ها و مفروضات

- تاریخ شمسی فقط در لایه UI نمایش داده می‌شود؛ ذخیره‌سازی در دیتابیس به فرمت استاندارد (UTC/ISO) است.
- طراحی Mobile-First با پشتیبانی کامل RTL.
- بدون داده بیمار؛ ثبت تجربه فقط ناشناس‌سازی‌شده (رجوع به `data-privacy-rules.md`).

## معماری افق بلند (فاز ۱۴)

- **مرکز فرماندهی** (`/admin/command-center` + `GET /api/admin/command-center`):
  گزارش تجمیعی و ناشناس از داده‌های واقعی — نمای کلی (اعضا/مسائل/تجربه‌ها/اجرای مجدد/
  حلقه‌ها/همکاری‌ها/کمپین‌ها)، الگوها (`groupBy` روی نوع مانع/وضعیت/استان/برچسب)،
  هشدارها (بی‌پاسخ ۴۸ساعته، گزارش در انتظار، صف ناظر، اعتراض، تأیید عضویت، کاربران
  محدود)، روندهای هفتگی و پیشنهاد حمایت/Coaching برای تیم جامعه. فقط مجوز
  `command-center:view` (admin/super_admin).
- **کمپین‌ها و بازی‌های شبکه‌ای** (`/campaigns` + `/admin/campaigns`): `Campaign` با
  شش خانواده بازی PDF + `CampaignParticipation` (کلید یکتا) برای مشارکت اختیاری؛
  بدون لیدربورد و پاداش اعتیادآور. مجوز `campaigns:read/join/manage`.
- **ابزارهای اجرایی (کارخانه محتوا)** (`/tools` + `/admin/tools`): `Tool` با نوع
  (راهنما/چک‌لیست/بسته/اقلام)، نسخه، تاریخ بازبینی و اسلاگ قابل اشتراک؛ فقط
  `published` برای اعضا؛ بدون ورود به قلمرو سیب. مجوز `tools:read/manage`.
- **نقشه موانع تجمیعی ناشناس** (`/insights` + `/api/insights/barrier-map`): شمارش
  تجمیعی «نوع مانع × استان» از مسائل منتشرشده، **فقط از کاربران دارای رضایت صریح**
  (`User.allowDataContribution`)؛ سوییچ رضایت قابل برگشت (`PATCH
  /api/insights/data-contribution`) و حکمرانی داده شفاف. مجوز `insights:read`.
- **مدل داده (فاز ۱۴)**: `Campaign`, `CampaignParticipation`, `Tool` + ۴ enum +
  `User.allowDataContribution`. همه APIها با `requireUser` + `assertPermission` +
  Audit Log.
