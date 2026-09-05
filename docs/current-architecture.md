# معماری فعلی (Current Architecture)

**وضعیت:** به‌روزرسانی برای فاز ۶ — تاریخ: مهر ۱۴۰۵

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

## محدودیت‌ها و مفروضات

- تاریخ شمسی فقط در لایه UI نمایش داده می‌شود؛ ذخیره‌سازی در دیتابیس به فرمت استاندارد (UTC/ISO) است.
- طراحی Mobile-First با پشتیبانی کامل RTL.
- بدون داده بیمار؛ ثبت تجربه فقط ناشناس‌سازی‌شده (رجوع به `data-privacy-rules.md`).
