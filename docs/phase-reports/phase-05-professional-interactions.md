# گزارش فاز ۵ — تعاملات حرفه‌ای و سرمایه روایت (پایه)

**شاخه پیشنهادی:** `phase/05-professional-interactions`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** تکمیل و آماده تأیید (Stage-Gate)

---

## ۱. خلاصه

فاز ۵ «تعاملات حرفه‌ای و سرمایه روایت» کامل پیاده شد: **دنبال‌کردن** (موضوع/مسئله/تجربه/عضو با رعایت حریم خصوصی)، **ذخیره محتوا** (خواندنی‌های من)، **«تشکر حرفه‌ای» به‌جای لایک عمومی**، **پروفایل سرمایه حرفه‌ای** (تجربه‌های منتشرشده، مسائل حل‌شده، ارجاع‌های معتبر، اجرای موفق توسط دیگران، تشکر دریافتی + نشان‌های مبتنی بر شواهد) و **خوراک حرفه‌ای** مبتنی بر ارتباط موضوعی (نه محبوبیت). همه تعاملات به مسئله/تجربه/همکاری متصل‌اند و کاربران کنترل حریم خصوصی را حفظ می‌کنند. Mention و اعلان‌ها (اعلان پاسخ/ارجاع/نتیجه) عمداً به فاز ۸ (جست‌وجو، اعلان و کشف دانش) موکول شدند.

**گیرنده‌ی مشکل فاز:** — (بدون مشکل مسدودکننده؛ جریان کامل تعاملات با تست زنده روی دیتابیس واقعی از طریق HTTP راستی‌آزمایی شد و داده‌های تست پاک‌سازی شدند).

## ۲. بررسی (Review)

- **مدل داده (Migration):** `Follow` (پلی‌مورفیک: tag/problem/experience/user با کلید یکتا)، `SavedItem` (problem/experience)، `ProfessionalThanks` (answer/experience با `receivedById`) + فیلد `thanksCount` روی `ProblemAnswer` و `Experience` + سه enum جدید (FollowTargetType، SavedTargetType، ThanksTargetType).
- **API ها:**
  - `POST/DELETE /api/follows` (دنبال/لغو با اعتبارسنجی هدف؛ ممنوعیت عضو خصوصی و دنبال‌کردن خود)
  - `POST/DELETE /api/saves` + `GET /api/saved` (ذخیره/حذف و فهرست خواندنی‌ها)
  - `POST/DELETE /api/thanks` (تشکر حرفه‌ای با به‌روزرسانی تراکنشی شمارنده؛ ممنوعیت تشکر به محتوای خود)
  - `GET /api/users/[id]` (پروفایل سرمایه حرفه‌ای + نشان‌ها)
  - `GET /api/feed` (خوراک مبتنی بر دنبال‌شده‌ها)
- **سرمایه روایت (شواهد‌محور):** `serializers/capital.ts` شاخص‌ها را از رویدادهای واقعی محاسبه می‌کند (تجربه منتشرشده، مسئله حل‌شده، ارجاع، اجرای موفق توسط دیگران، تشکر دریافتی، تأیید ناظر). نشان‌ها (badges) از همین شواهد ساخته می‌شوند؛ **هیچ شمارنده لایک یا لیدربورد وجود ندارد.**
- **حریم خصوصی:** دنبال‌کردن عضو فقط با `visibility ≠ private`؛ پروفایل `private` فقط برای صاحب آن (حتی API و صفحه). پروفایل `public`/`members` بر اساس دسترسی عضو نمایش داده می‌شود.
- **امنیت:** `assertPermission` در همه مسیرها؛ تشکر به محتوای خود (VALIDATION)، دنبال‌کردن خود (VALIDATION)، اهداف ناموجود/غیرقابل‌نمایش (NOT_FOUND)، تکرار (CONFLICT). IDOR با `requireUser()` و پارامترهای تأییدشده سمت سرور.
- **Audit Log:** `interaction.follow/unfollow`، `interaction.save/unsave`، `interaction.thanks/unthanks` با entityType و جزئیات هدف.
- **RBAC:** مجوزهای جدید `interactions:follow`، `interactions:save`، `interactions:thanks`، `profile:read:other` (اعضا) — همه در API (نه فقط UI).
- **عدم رقابت با سیب:** هیچ قابلیت ثبت/ارجاع/پرونده ساخته نشده است؛ تعاملات همگی به محتوای حرفه‌ای متصل‌اند.
- **خارج از محدوده (محترم):** چت آزاد، پست شخصی، شمارنده دنبال‌کننده به‌عنوان معیار اعتبار، لیدربورد — هیچ‌کدام ساخته نشدند.

## ۳. وضعیت ابزارها (همه سبز)

| ابزار            | نتیجه                                                       |
| ---------------- | ----------------------------------------------------------- |
| `pnpm build`     | موفق (۴۴ مسیر)                                              |
| `pnpm typecheck` | موفق (بدون خطا)                                             |
| `pnpm lint`      | موفق (بدون خطا/هشدار)                                       |
| `pnpm test:run`  | ۲۴ فایل، ۱۵۳ تست موفق (شامل تست‌های جدید interaction/capital) |
| تست زنده (HTTP)  | دنبال/لغو، ذخیره/فهرست، تشکر/حذف، خوراک، پروفایل سرمایه روی دیتابیس واقعی موفق؛ داده‌های تست پاک‌سازی شدند |

## ۴. ریسک‌های امنیتی (فاز ۵)

| ریسک                | وضعیت                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| افشای اطلاعات بیمار | بدون تغییر در مدل داده؛ ممنوعیت مطلق حفظ شده (رجوع به فاز ۳/۴)                                        |
| IDOR                | همه مسیرها با `requireUser()`؛ اهداف با `resolveTarget` سمت سرور اعتبارسنجی می‌شوند                  |
| RBAC سمت سرور       | `assertPermission` در همه مسیرهای تعامل (follow/save/thanks/profile:read:other)                        |
| حریم خصوصی پروفایل  | `visibility=private` → رد در API و صفحه؛ دنبال‌کردن عضو خصوصی ممنوع                                    |
| سوءاستفاده از تشکر  | یک‌بار به‌ازای هر هدف (کلید یکتا)؛ ممنوعیت تشکر به محتوای خود                                         |
| CSRF/CORS           | API های Same-Origin و کوکی SameSite=Lax (همسو با فاز ۲)                                                |

## ۵. بدهی فنی عمدی

| شناسه | بدهی                                                        | دلیل                             | بازپرداخت |
| ----- | ----------------------------------------------------------- | -------------------------------- | --------- |
| PH5-1 | «خوراک» فقط مبتنی بر دنبال‌شده‌ها؛ بدون پیشنهاد هوشمند       | الگوریتم کشف کامل در فاز ۸       | فاز ۸     |
| PH5-2 | Mention و اعلان‌ها موکول شدند                                | فاز ۸ به آن‌ها اختصاص دارد       | فاز ۸     |
| PH5-3 | نشان‌ها در کد ثابت‌اند؛ بدون پنل/مدل اعتبار مستند            | مستندسازی کامل اعتبار در فاز ۱۰  | فاز ۱۰    |
| PH5-4 | «تشکر» و «دنبال» شمارنده‌های denormalized دارند              | سادگی خواندن در MVP؛ سازگاری در فاز ۱۳ | فاز ۱۳ |

## ۶. Migration ها

- `20260905074917_phase5_professional_interactions` — مدل‌های Follow، SavedItem، ProfessionalThanks + enum ها + فیلد thanksCount روی ProblemAnswer و Experience.

## ۷. فهرست فایل‌های اصلی (فاز ۵)

```
src/
  app/api/follows/route.ts  app/api/saves/route.ts  app/api/saved/route.ts
  app/api/thanks/route.ts  app/api/feed/route.ts  app/api/users/[id]/route.ts
  app/feed/page.tsx  app/saved/page.tsx  app/users/[id]/page.tsx
  components/interactions/ follow-button  save-button  thanks-button
  components/saved/saved-list.tsx
  lib/ interactions.ts  constants/interaction.ts  validations/interaction.ts
  lib/serializers/ capital.ts  (+ توسعه problem.ts و experience.ts برای حالت تعامل)
  app/api/experiences/[id]/route.ts  route.ts  app/api/problems/[id]/route.ts  route.ts
  app/experiences/[slug]/page.tsx  app/problems/[id]/page.tsx (حالت تعامل)
  components/problems/answer-item.tsx  problem-detail.tsx
  components/experiences/experience-detail.tsx
  components/shell/mobile-nav.tsx  config/site.ts (ناوبری «خوراک حرفه‌ای»)
  lib/rbac.ts (مجوزهای فاز ۵)
prisma/schema.prisma + migrations/20260905074917_phase5_professional_interactions
```

## ۸. راهنمای تست دستی

1. `pnpm dev`؛ ورود با OTP (`/auth`) و تکمیل Onboarding.
2. در صفحه یک مسئله: «دنبال‌کردن» و «ذخیره» را بزنید؛ دکمه‌ها وضعیت خود را عوض می‌کنند و در صفحه تکرار نمی‌شوند (کنترل CONFLICT).
3. روی یک پاسخ: «تشکر حرفه‌ای» را بزنید (شمارنده +۱ می‌شود)؛ دوباره بزنید تا حذف شود. با پاسخ/تجربه خودتان این دکمه با پیام خطا رد می‌شود.
4. در صفحه یک تجربه: «دنبال‌کردن»، «ذخیره» و «تشکر حرفه‌ای» را امتحان کنید.
5. روی نام نویسنده (مسئله غیرناشناس یا تجربه) کلیک کنید → `/users/[id]`: نشان‌ها، آمار سرمایه حرفه‌ای، تجربه‌ها و مسائل حل‌شده نمایش داده می‌شوند.
6. «خوراک حرفه‌ای» (`/feed`): با دنبال‌کردن موضوع‌ها/اعضا، محتوای مرتبط ظاهر می‌شود؛ «خواندنی‌های من» (`/saved`) موارد ذخیره‌شده را نشان می‌دهد و دکمه حذف دارد.
7. دنبال‌کردن یک عضو با پروفایل خصوصی → ۴۰۳/FORBIDDEN؛ دنبال‌کردن خود و تشکر به محتوای خود → VALIDATION.
8. تست RBAC: کاربر مهمان (بدون نشست) به همه این API ها ۴۰۱ می‌گیرد.
9. تاریخ‌ها در UI به شمسی نمایش داده می‌شوند (همسو با فازهای قبل).

## ۹. معیار خروج فاز ۵

- ✅ همه تعاملات به مسئله/تجربه/همکاری متصل‌اند (دنبال/ذخیره/تشکر فقط روی اهداف حرفه‌ای معتبر)
- ✅ «تشکر حرفه‌ای» به‌جای لایک عمومی (بدون شمارنده لایک در هیچ‌جا)
- ✅ Activity Feed مبتنی بر ارتباط موضوعی نه محبوبیت (`/feed`)
- ✅ پروفایل سرمایه حرفه‌ای با نشان‌های مبتنی بر شواهد (`/users/[id]`)
- ✅ کاربران حریم خصوصی را کنترل می‌کنند (پروفایل خصوصی محفوظ؛ دنبال‌کردن عضو با رعایت visibility)
- ✅ خارج از محدوده (چت آزاد/پست شخصی/لیدربورد) ساخته نشد
- ✅ بدون داده بیمار؛ بدون قابلیت شبیه سیب

## ۱۰. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-5): professional interactions & narrative capital

- Follow topics/problems/experiences/members (polymorphic Follow; privacy-aware member follows; self-follow blocked)
- Save content to reading list (SavedItem) + /saved page; /api/saves + /api/saved
- 'Professional thanks' instead of public likes (ProfessionalThanks + transactional thanksCount; no self-thanks)
- Professional capital profile /users/[id] with evidence-based badges (experiences, solved problems, references, successful reuses, thanks) - no leaderboard
- Topic-relevance activity feed /feed (not popularity-based)
- Interaction state via getInteractionState in serializers + UI buttons on problems/experiences/answers
- New RBAC permissions (interactions:follow/save/thanks, profile:read:other) + audit log
- schema v5 migration; phase-5 report and docs update"
```

## ۱۱. توقف و انتظار تأیید

بر اساس مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. پس از تأیید، فاز ۶ (حلقه‌های همیار) آغاز می‌شود. Mention و اعلان‌های پاسخ/ارجاع/نتیجه به فاز ۸ (جست‌وجو، اعلان و کشف دانش) موکول شدند و در `docs/known-limitations.md` ثبت شده‌اند.