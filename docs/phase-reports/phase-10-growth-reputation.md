# گزارش فاز ۱۰ — رشد و اعتبار حرفه‌ای

**شاخه پیشنهادی:** `phase/10-growth-reputation`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** آماده تأیید (Stage-Gate) — ابزارها سبز

---

## ۱. خلاصه

فاز ۱۰ پس از فاز ۹ (پایلوت میدانی) اجرا می‌شود و هدف آن «تبدیل مشارکت به تصویر معنادار
رشد، بدون رقابت ناسالم» است. خروجی این فاز:

1. **مستندسازی مدل اعتبار** (`docs/reputation-model.md`) **پیش از پیاده‌سازی** — طبق محدوده فاز.
2. **الگوی مقیاس جامعه استان به استان** (`docs/community-scaling.md`) — توسعه الگوی سفیران فاز ۹.
3. **داشبورد رشد شخصی** (`/growth`): آمار واقعی، نشان‌های مشارکت، «قدم بعدی» و «ادامه نیمه‌تمام».
4. **دو نشان جدید** مبتنی بر شواهد: «پاسخ‌گوی مفید» و «همیار حلقه».

**نکته راهبردی:** شاخص موفقیت فاز ۱۰ («افزایش ثبت تجربه در استان‌های جدید با الگوی
قابل تکرار») به‌صورت مستند (`community-scaling.md`) و با ابزار داشبورد آماده شده است؛
عدد واقعی آن وابسته به اجرای میدانی استان‌هاست.

## ۲. خروجی‌های این فاز (در مخزن)

| سند/فایل                              | محتوا                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `docs/reputation-model.md`            | مدل اعتبار: اصل شواهد، شاخص‌ها، جدول نشان‌ها، «قدم بعدی»، ممنوعیت‌ها     |
| `docs/community-scaling.md`           | چرخه فعال‌سازی استان به استان + شاخص آمادگی + مدیریت چند استان          |
| `src/lib/growth.ts`                   | کوئری شاخص‌های واقعی + `computeNextStep` (منطق «قدم بعدی»)              |
| `src/lib/growth.test.ts`              | تست‌های منطق «قدم بعدی» (۷ حالت)                                        |
| `src/app/growth/page.tsx`             | داشبورد رشد شخصی (`/growth`)                                            |
| `src/lib/serializers/capital.ts`      | نشان‌های جدید `helpful-answer` و `circle-member`                         |
| `src/app/users/[id]/page.tsx`         | ارسال شاخص‌های جدید به محاسبه نشان‌ها                                   |
| `src/components/auth/user-menu.tsx`   | آیتم «داشبورد رشد من»                                                   |
| `src/app/me/page.tsx`                 | بخش ورود به داشبورد رشد                                                |
| `docs/development-roadmap.md` و...    | به‌روزرسانی نقشه، changelog، known-limitations، technical-debt          |

## ۳. جزئیات پیاده‌سازی

- **شاخص‌ها از رویدادهای واقعی**: تجربه منتشرشده/برگزیده، مسئله حل‌شده، پاسخ «مفید بود»
  دریافتی (بدون درخواست توضیح)، حلقه فعال، اجرای موفق توسط دیگران (غیر از خود)، ارجاع معتبر
  و تشکر دریافتی — همه با فیلتر منتشر/قابل‌نمایش/غیرخصوصی.
- **حریم خصوصی**: محتوای پیش‌نویس فقط برای «قدم بعدی» خود کاربر دیده می‌شود، نه در آمار عمومی.
- **بدون لیدربورد و نشان رسمی**: هیچ رتبه سراسری و هیچ نشان «مدرک رسمی» معرفی نشد؛
  یک بخش در داشبورد صریحاً «مدرک رسمی؟» را رد می‌کند.
- **«قدم بعدی»** ترتیبی و قابل توضیح: ادامه پیش‌نویس ← ثبت تجربه ← پیگیری مسئله ←
  به‌اشتراک‌گذاری ← حلقه ← تکمیل پروفایل ← کشف دانش (ضد قاتل انگیزه «بی‌اثر بودن»).
- **بدون Migration**: فاز ۱۰ نیازی به تغییر اسکیمای دیتابیس نداشت (شاخص‌ها از مدل‌های موجود
  محاسبه می‌شوند).

## ۴. ابزارها (در گیت)

| ابزار      | نتیجه                     |
| ---------- | ------------------------- |
| `lint`     | بدون خطا (۰ خطا)          |
| `typecheck`| بدون خطا                  |
| `test:run` | ۲۱۹ تست موفق (+۸ تست جدید)|
| `build`    | موفق (مسیر `/growth` در خروجی) |

## ۵. امنیت و حریم خصوصی

- هیچ تغییر مدل داده و هیچ داده بیمار اضافه نشد.
- دسترسی به داشبورد فقط برای کاربر واردشده و دربارهٔ خودش؛ محتوای عمومی طبق visibility فیلتر می‌شود.
- هیچ رتبه‌بندی تنبیهی و هیچ لیدربورد ساخته نشد.

## ۶. بدهی/تأخیر عمدی (Backlog)

| شناسه | مورد                                                                 | بازپرداخت                     |
| ----- | -------------------------------------------------------------------- | ----------------------------- |
| PH10-1| شاخص‌ها در هر بارگذاری از DB محاسبه می‌شوند (بدون Cache/denormalize) | فاز ۱۳                        |
| PH10-2| «استمرار اثر در زمان» هنوز محاسبه نمی‌شود (نیازمند داده تاریخی)      | فاز ۱۱+ با شواهد پایلوت       |
| PH10-3| عدد واقعی «افزایش ثبت تجربه در استان‌های جدید» وابسته به اجرای میدانی| پایان اجرای استان‌های جدید    |

## ۷. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-10): growth & professional reputation dashboard

- Reputation model documented before implementation
  (docs/reputation-model.md): evidence-based metrics, badge table,
  transparent next-step, no official badge / leaderboard / bought points
- Community scaling playbook (docs/community-scaling.md): repeatable
  province-by-province activation using the phase-9 ambassador pattern
- Personal growth dashboard (/growth): real-event stats (published
  experiences, solved problems, helpful answers, active circles,
  successful reuses by others, thanks), participation badges, suggested
  next step, continue-unfinished drafts (privacy: own drafts only)
- New evidence-based badges: 'helpful-answer', 'circle-member' on the
  public capital profile too
- lib/growth.ts with real-event queries + computeNextStep (ordered,
  explainable, non-competitive); growth.test.ts (7 cases)
- Entry points in user menu + /me; roadmap/changelog/known-limitations/
  technical-debt updated; lint/typecheck/test(219)/build all green"
```

## ۸. توقف و انتظار تأیید

طبق مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. ادامه به فاز ۱۱
(آکادمی مسئله‌محور) پس از تأیید این فاز و داشتن شواهد میدانی از پایلوت (فاز ۹).