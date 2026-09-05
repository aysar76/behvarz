# گزارش فاز ۶ — حلقه‌های همیار

**شاخه پیشنهادی:** `phase/06-helper-circles`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** تکمیل و آماده تأیید (Stage-Gate)

---

## ۱. خلاصه

فاز ۶ «حلقه‌های همیار» کامل پیاده شد. دو قابلیت مکمل ساخته شد:

1. **درخواست همیار (Peer Help):** اتصال مستقیم فردِ دارای مسئله به فردِ دارای تجربه مشابه. جفت‌سازی مبتنی بر «تمایل به همیاری»، «حوزه تجربه (برچسب‌ها)»، «مهارت/علاقه مرتبط»، «استان همسان» و «کیفیت همکاری‌های قبلی» — بدون Popularity. جریان کامل «درخواست → پیشنهاد → پذیرش/رد → تعیین هدف → گفت‌وگوی محدود موضوع‌محور → ثبت خلاصه نتیجه و خاتمه → ارزیابی سودمندی → گزارش سوءاستفاده».
2. **حلقه‌های همیار (Circles):** گروه‌های کوچک ۵ تا ۱۲ نفره برای یادگیری، هم‌افزایی و حل مسئله. جریان کامل «ایجاد → درخواست عضویت/دعوت/تأیید → صفحه حلقه → جلسات و خروجی دوره‌ای → خروج/انتقال راهبری → آرشیو».

**بدون Chat بلادرنگ/WebSocket در MVP** (مطابق محدوده فاز): گفت‌وگوی همیاری Thread-Based است (`PeerMessage`) و صفحه همکاری به‌صورت Pull فقط پیام‌ها را نشان می‌دهد.

**گیرنده‌ی مشکل فاز:** در حین اجرای اولیه، سرور توسعه با Client تولیدشدهٔ قدیمی (پیش از Migration فاز ۶) در حال اجرا بود و ساخت حلقه/درخواست همیار `500` می‌داد (داده‌های مدل جدید در Client نبود). پس از ری‌استارت سرور، همه مسیرها با تست زنده روی دیتابیس واقعی از طریق HTTP راستی‌آزمایی شدند و داده‌های تست پاک‌سازی شدند.

## ۲. بررسی (Review)

- **مدل داده (Migration `20260905082900_phase6_helper_circles`):** `Circle`, `CircleMembership`, `CircleJoinRequest`, `CircleInvite`, `CircleMeeting`, `PeerHelpRequest`, `PeerOffer`, `PeerCooperation`, `PeerMessage`, `PeerCooperationReport` + ۱۲ enum جدید + فیلد `willingToHelp` روی `User`. هیچ داده بیمار در مدل داده وجود ندارد.
- **API حلقه‌ها:**
  - `GET/POST /api/circles` (فهرست با جست‌وجوی ساده `q` و فیلتر `mine`؛ ایجاد با Rate Limit و پاک‌سازی محتوای حساس؛ خالق به‌صورت خودکار راهبر/عضو می‌شود)
  - `GET /api/circles/[id]` (جزئیات: اعضا، درخواست‌ها، دعوت‌ها، جلسات)
  - `POST /api/circles/[id]/join-requests` (درخواست عضویت با ظرفیت و کنترل «عضو/درخواست تکراری»)
  - `PATCH/DELETE /api/circles/[id]/join-requests/[requestId]` (بررسی تأیید/رد توسط راهبر؛ انصراف توسط متقاضی)
  - `POST /api/circles/[id]/invites` + `POST /api/circles/[id]/invites/[inviteId]` (دعوت توسط راهبر؛ پذیرش/رد دعوت‌شده)
  - `POST /api/circles/[id]/meetings` + `PATCH /api/circles/[id]/meetings/[meetingId]` (جلسه و خروجی دوره‌ای؛ به‌روزرسانی توسط راهبر)
  - `POST /api/circles/[id]/leave`، `POST /api/circles/[id]/transfer` (انتقال راهبری)، `POST /api/circles/[id]/archive` (بایگانی)
- **API همیاری (Peer):**
  - `GET/POST /api/peer/help-requests` (فهرست باز/مالِ من؛ ثبت با پاک‌سازی محتوای حساس)
  - `GET/PATCH /api/peer/help-requests/[id]` (جزئیات با تفکیک دسترسی؛ لغو توسط ثبت‌کننده)
  - `GET /api/peer/help-requests/[id]/suggestions` (جفت‌سازی همیاران مرتبط — فقط برای ثبت‌کننده)
  - `POST /api/peer/offers` (پیشنهاد همیار توسط همیار یا دعوت توسط درخواست‌دهنده؛ کلید یکتا و کنترل حالت)
  - `PATCH /api/peer/offers/[id]` (پذیرش/رد پیشنهاد) + `POST /api/peer/offers/[id]/withdraw` (پس‌گرفتن)
  - `GET /api/peer/cooperations` + `GET/PATCH /api/peer/cooperations/[id]` (فهرست و جزئیات همکاری؛ تعیین هدف)
  - `POST /api/peer/cooperations/[id]/messages` (گفت‌وگوی محدود Thread-Based)
  - `POST /api/peer/cooperations/[id]/complete` (ثبت خلاصه نتیجه + ارزیابی سودمندی دوطرفه) و `POST .../close` (خاتمه)
  - `POST /api/peer/cooperations/[id]/report` (گزارش سوءاستفاده با دلایل تعریف‌شده)
- **RBAC:** مجوزهای جدید `circles:create/join/manage/meeting` و `peer:request/offer/cooperate` — همه در API (نه فقط UI). عملیات راهبری (بررسی درخواست، دعوت، جلسه، انتقال، آرشیو) با بررسی سمت سرور عضو فعالِ `facilitator` انجام می‌شود.
- **جفت‌سازی قابل توضیح:** `suggestHelpers` با امتیازدهی شفاف (تجربه منتشرشده +۲، هم‌برچسبی +۲، مهارت/علاقه مرتبط +۲، هم‌استان +۲، همکاری قبلی موفق +۳، عضو تأییدشده +۱) و فقط کاندیدهای `willingToHelp` با `visibility ≠ private` و `onboardingCompleted`. بدون محبوبیت و بدون وابستگی به لایک.
- **حریم خصوصی و ایمنی:** اطلاعات تماس شخصی نمایش داده نمی‌شود؛ نام/استان/شهرستان فقط. گفت‌وگو فقط بین دو طرف همکاری. دعوت فقط توسط راهبر. گزارش سوءاستفاده به صف ناظر (فاز ۷) متصل است. `scanSensitiveContent` روی نام/توضیح حلقه و درخواست همیار.
- **Audit Log:** `circle.create`، `circle.archive`، `circle.transfer`، `peer.offer.requester/helper`، `peer.help-request.cancel`، `peer.cooperation.goal` و غیره با entityType و جزئیات.
- **عدم رقابت با سیب / بدون داده بیمار:** هیچ قابلیت ثبت رسمی یا داده هویتی بیمار ساخته نشده است.

## ۳. وضعیت ابزارها (همه سبز)

| ابزار            | نتیجه                                                       |
| ---------------- | ----------------------------------------------------------- |
| `pnpm build`     | موفق (۴۱ مسیر)                                              |
| `pnpm typecheck` | موفق (بدون خطا)                                             |
| `pnpm lint`      | موفق (بدون خطا/هشدار)                                       |
| `pnpm test:run`  | ۲۸ فایل، ۱۹۳ تست موفق (شامل تست‌های جدید circle/peer)        |
| تست زنده (HTTP)  | ورود/Onboarding، مسئله/پاسخ، تجربه، حلقه/جلسه، درخواست همیار/پیشنهاد/سازگاری روی دیتابیس واقعی موفق؛ داده‌های تست پاک‌سازی شدند |

## ۴. ریسک‌های امنیتی (فاز ۶)

| ریسک                | وضعیت                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| افشای اطلاعات بیمار | بدون تغییر در مدل داده؛ ممنوعیت مطلق حفظ شده؛ `scanSensitiveContent` روی متن حلقه و درخواست همیار           |
| IDOR                | همه مسیرها با `requireUser()`؛ عضویت/راهبری با `assertCircleMember`/`assertCircleFacilitator` سمت سرور بررسی می‌شود؛ درخواست همیار فقط برای ثبت‌کننده (پیشنهادها و جزئیات) |
| RBAC سمت سرور       | `assertPermission` در همه مسیرها + بررسی نقش `facilitator` برای عملیات راهبری                               |
| سوءاستفاده از همیاری | گزارش سوءاستفاده (`PeerCooperationReport`) با دلایل تعریف‌شده؛ صف رسیدگی در فاز ۷                          |
| اسپم/سوءاستفاده     | Rate Limit روی ایجاد حلقه (۵/ساعت) و پیشنهاد همیار (۱۵/ساعت)؛ کلید یکتا برای پیشنهاد/درخواست/عضو            |
| CSRF/CORS           | API های Same-Origin و کوکی SameSite=Lax (همسو با فاز ۲)                                                     |

## ۵. بدهی فنی عمدی

| شناسه | بدهی                                                         | دلیل                              | بازپرداخت |
| ----- | ------------------------------------------------------------ | --------------------------------- | --------- |
| PH6-1 | جفت‌سازی در کد ساده و بدون داشبورد/تنظیم وزن‌ها               | سادگی و قابل توضیح‌بودن در MVP     | فاز ۸     |
| PH6-2 | گفت‌وگوی همیاری Thread-Based بدون بلادرنگ (Pull)             | طبق محدوده فاز؛ بدون WebSocket    | فاز ۱۳    |
| PH6-3 | گزارش سوءاستفاده ثبت می‌شود اما صف رسیدگی/داشبورد در فاز ۷   | صف کامل حکمرانی محتوا در فاز ۷     | فاز ۷     |
| PH6-4 | شمارش عضویت denormalized نبوده و از `_count` خوانده می‌شود    | سادگی در MVP؛ بهینه‌سازی در فاز ۱۳ | فاز ۱۳    |
| PH6-5 | خروجی دوره‌ای حلقه فقط در قالب جلسه ثبت می‌شود؛ بدون «خروجی» ساختاریافته جدا | سادگی در MVP؛ در صورت نیاز فازهای بعد | — |

## ۶. Migration ها

- `20260905082900_phase6_helper_circles` — مدل‌های حلقه/همیاری (Circle، CircleMembership، CircleJoinRequest، CircleInvite، CircleMeeting، PeerHelpRequest، PeerOffer، PeerCooperation، PeerMessage، PeerCooperationReport) + ۱۲ enum + فیلد `willingToHelp` روی User.

## ۷. فهرست فایل‌های اصلی (فاز ۶)

```
src/
  app/api/circles/route.ts  app/api/circles/[id]/route.ts
  app/api/circles/[id]/join-requests/route.ts  app/api/circles/[id]/join-requests/[requestId]/route.ts
  app/api/circles/[id]/invites/route.ts  app/api/circles/[id]/invites/[inviteId]/route.ts
  app/api/circles/[id]/meetings/route.ts  app/api/circles/[id]/meetings/[meetingId]/route.ts
  app/api/circles/[id]/leave/route.ts  app/api/circles/[id]/transfer/route.ts  app/api/circles/[id]/archive/route.ts
  app/api/peer/help-requests/route.ts  app/api/peer/help-requests/[id]/route.ts  app/api/peer/help-requests/[id]/suggestions/route.ts
  app/api/peer/offers/route.ts  app/api/peer/offers/[id]/route.ts  app/api/peer/offers/[id]/withdraw/route.ts
  app/api/peer/cooperations/route.ts  app/api/peer/cooperations/[id]/route.ts
  app/api/peer/cooperations/[id]/messages/route.ts  app/api/peer/cooperations/[id]/complete/route.ts
  app/api/peer/cooperations/[id]/close/route.ts  app/api/peer/cooperations/[id]/report/route.ts
  app/circles/page.tsx  app/circles/new/page.tsx  app/circles/[id]/page.tsx
  app/peer/page.tsx  app/peer/new/page.tsx  app/peer/[id]/page.tsx  app/peer/cooperations/[id]/page.tsx
  components/circles/circle-form.tsx  circle-detail.tsx
  components/peer/help-request-form.tsx  help-request-detail.tsx  cooperation-detail.tsx
  lib/circles.ts  lib/peer.ts  lib/constants/circle.ts  lib/constants/peer.ts
  lib/validations/circle.ts  lib/validations/peer.ts
  lib/serializers/circle.ts  lib/serializers/peer.ts (+ تست‌ها)
  app/api/me/profile/route.ts  components/auth/profile-form.tsx  lib/validations/auth.ts (فیلد willingToHelp)
  components/auth/session-provider.tsx  lib/serializers.ts (willingToHelp)
  lib/rbac.ts (مجوزهای فاز ۶)  config/site.ts (ناوبری «حلقه‌های همیار» فعال)
prisma/schema.prisma + migrations/20260905082900_phase6_helper_circles
```

## ۸. راهنمای تست دستی

1. `pnpm dev`؛ ورود با OTP (`/auth`) و تکمیل Onboarding با تیک «تمایل به همیاری».
2. `/peer` → «درخواست همیار» → ثبت درخواست. در صفحه درخواست دکمه «پیشنهاد همیاران» فهرست همیاران مرتبط را نشان می‌دهد (فقط برای ثبت‌کننده).
3. با حساب دوم: از فهرست «درخواست‌های باز دیگران» روی درخواست کلیک کنید و «پیشنهاد همیاری» بدهید. ثبت‌کننده پیشنهاد را پذیرش/رد می‌کند → همکاری «در جریان» آغاز می‌شود.
4. در `/peer/cooperations/[id]`: «هدف» را تعیین کنید، پیام بفرستید (گفت‌وگوی محدود)، سپس «تکمیل» با خلاصه نتیجه و ارزیابی سودمندی دوطرفه؛ «گزارش» برای سوءاستفاده.
5. `/circles` → «ایجاد حلقه». در صفحه حلقه: «درخواست عضویت» بدهید؛ راهبر تأیید/رد می‌کند. راهبر می‌تواند «دعوت»، «جلسه»، «انتقال راهبری» و «آرشیو» انجام دهد.
6. تست RBAC/محدودیت: کاربر مهمان به همه API ها ۴۰۱ می‌گیرد؛ عضو غیرراهبر به عملیات راهبری ۴۰۳؛ ظرفیت پر → درخواست عضویت رد؛ پیشنهاد تکراری → CONFLICT.
7. تاریخ‌ها در UI به شمسی نمایش داده می‌شوند (همسو با فازهای قبل).

## ۹. معیار خروج فاز ۶

- ✅ جریان کامل «درخواست تا ثبت نتیجه» همیاری (درخواست → پیشنهاد → پذیرش → هدف → گفت‌وگو → تکمیل/ارزیابی)
- ✅ حلقه‌ها: ایجاد، عضویت/دعوت/تأیید، ظرفیت ۵-۱۲، صفحه حلقه، جلسات، انتقال راهبری، آرشیو
- ✅ جفت‌سازی مبتنی بر مانع/حوزه تجربه/استان/تمایل به همیاری/کیفیت قبلی — بدون Popularity
- ✅ اطلاعات تماس شخصی بدون رضایت نمایش داده نمی‌شود (فقط نام/استان/شهرستان؛ visibility=private حذف از کاندیدها)
- ✅ گفت‌وگوها هدف و وضعیت مشخص دارند (Thread-Based؛ بدون Chat بلادرنگ)
- ✅ گزارش سوءاستفاده ثبت می‌شود (صف رسیدگی در فاز ۷)
- ✅ بدون داده بیمار؛ بدون قابلیت شبیه سیب

## ۱۰. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-6): helper circles & peer help

- Peer help request -> offers (requester invite or helper offer) -> cooperation with goal,
  thread-based limited messages, outcome summary, mutual usefulness rating, abuse report
- Explainable helper matching (willingToHelp + tags + skill/interest + province + past success) - no popularity
- Circles (5-12): create, join request/invite approval, circle page, meetings/periodic output,
  leave, leadership transfer, archive
- willingToHelp toggle in profile/onboarding
- New RBAC permissions (circles:*, peer:*) + audit log + rate limits + sensitive-content scan
- schema v6 migration; phase-6 report and docs update"
```

## ۱۱. توقف و انتظار تأیید

بر اساس مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. پس از تأیید، فاز ۷ (حکمرانی محتوا و ایمنی) آغاز می‌شود. صف رسیدگی به گزارش‌های سوءاستفاده همیاری و داشبورد کامل حکمرانی به فاز ۷ موکول شد و در `docs/known-limitations.md` ثبت شده است.