# گزارش فاز ۱۴ — افق بلند: اکوسیستم کامل (چشم‌انداز PDF)

**شاخه پیشنهادی:** `phase/14-ecosystem`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** آماده تأیید (Stage-Gate) — ابزارها سبز

---

## ۱. خلاصه

فاز ۱۴ «افق بلند: اکوسیستم کامل» را طبق چهار قلمرو PDF (مرکز فرماندهی، بازی‌های
شبکه‌ای، کارخانه محتوا، نقشه موانع تجمیعی) پیاده‌سازی می‌کند. خروجی این فاز:

1. **مرکز فرماندهی** (`/admin/command-center` + `GET /api/admin/command-center`):
   تصویر زنده و تجمیعی وضعیت شبکه (اعضا، مسائل، تجربه‌ها، اجرای مجدد، حلقه‌ها،
   همکاری‌ها، کمپین‌ها)، الگوها (نوع مانع، وضعیت مسائل، استان‌ها، برچسب‌ها)،
   هشدارها (مسائل بی‌پاسخ ۴۸ساعته، گزارش‌های در انتظار، صف بررسی ناظر، اعتراض‌ها،
   تأیید عضویت، کاربران محدود)، روندهای هفتگی (جاری vs هفته قبل) و **پیشنهاد
   حمایت/Coaching** برای تیم جامعه — همگی تجمیعی و برای هم‌افزایی، نه نظارت تنبیهی.
2. **بازی‌های شبکه‌ای و کمپین‌ها** (`/campaigns` + مدیریت `/admin/campaigns`):
   نسخه‌های سبک و اختیاری از **شش خانواده بازی PDF** (یادگیری، همکاری، شبکه،
   نوآوری، رشد، مأموریت)؛ مشارکت اختیاری (`CampaignParticipation` با کلید یکتا)،
   بدون لیدربورد و بدون پاداش اعتیادآور.
3. **ابزارهای اجرایی (کارخانه محتوا)** (`/tools` + `/tools/[slug]` + مدیریت
   `/admin/tools`): راهنما، چک‌لیست، بسته مداخله و اقلام محتوایی — دانش قابل
   استفاده با مالک/نسخه/تاریخ بازبینی، بدون ورود به قلمرو سیب.
4. **نقشه موانع تجمیعی ناشناس** (`/insights` + `GET /api/insights/barrier-map`):
   شمارش تجمیعی «نوع مانع» مسائل منتشرشده به تفکیک استان — **فقط از کاربرانی که
   رضایت صریح داده‌اند** (`allowDataContribution`)؛ با حکمرانی داده و قابل برگشت.
5. **مقایسه روندها و پیشنهاد حمایت/Coaching**: بخشی از مرکز فرماندهی (روندهای
   هفتگی + پیشنهاد برای تیم جامعه).

**نکته راهبردی:** شاخص موفقیت فاز (در «افق بلند» پس از تثبیت شاخص‌ها و اثبات
مقیاس) به‌صورت ابزار آماده است؛ عدد واقعی آن به استقرار و جامعه واقعی وابسته است.

## ۲. خروجی‌های این فاز (در مخزن)

| سند/فایل                                 | محتوا                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------- |
| Migration `20260905154322_phase14_ecosystem` | مدل‌های `Campaign`، `CampaignParticipation`، `Tool` + ۴ enum + `User.allowDataContribution` |
| `src/lib/constants/campaign.ts`          | شش خانواده بازی، وضعیت‌ها، محدودیت‌های طول                            |
| `src/lib/constants/tool.ts`              | انواع ابزار (راهنما/چک‌لیست/بسته/اقلام)، وضعیت‌ها، محدودیت‌ها        |
| `src/lib/validations/campaign.ts`        | اسکیمای zod (ایجاد/به‌روزرسانی کمپین + رضایت داده)                    |
| `src/lib/validations/tool.ts`            | اسکیمای zod (ایجاد/به‌روزرسانی ابزار)                                |
| `src/lib/campaigns.ts` + تست             | فهرست/جزئیات کمپین، مشارکت/انصراف، سریالایز                           |
| `src/lib/campaigns-admin.ts`             | ایجاد/به‌روزرسانی/تغییر وضعیت کمپین + Audit Log                       |
| `src/lib/tools.ts` + تست                 | فهرست/جزئیات ابزار منتشرشده، اسلاگ، سریالایز                          |
| `src/lib/tools-admin.ts`                 | ایجاد/به‌روزرسانی/تغییر وضعیت ابزار + نسخه + بازبینی + Audit Log      |
| `src/lib/command-center.ts`              | گزارش تجمیعی مرکز فرماندهی (نمای کلی/هشدار/الگو/روند/Coaching)       |
| `src/lib/insights.ts`                    | نقشه موانع تجمیعی (فقط با رضایت) + مدیریت رضایت                       |
| `src/lib/rbac.ts` + تست                  | مجوزهای `campaigns:*`، `tools:*`، `insights:read`، `command-center:view` |
| API عمومی                                | `/api/campaigns(+[id]/participation)`، `/api/tools(+[slug])`، `/api/insights/*` |
| API مدیریت                               | `/api/admin/command-center`، `/api/admin/campaigns(+[id])`، `/api/admin/tools(+[id])` |
| UI کاربر                                 | `/campaigns`، `/tools`، `/tools/[slug]`، `/insights` + کامپوننت‌ها    |
| UI مدیریت                                | `/admin/command-center`، `/admin/campaigns(+new/[id])`، `/admin/tools(+new/[id])` |
| تست‌ها                                   | `campaigns.test.ts`، `tools.test.ts`، `validations/*`، تست‌های RBAC، **Integration** `phase14-ecosystem.test.ts` |
| مستندات                                  | changelog، database-schema، development-roadmap، known-limitations، technical-debt، data-privacy-rules، api-contracts |

## ۳. جزئیات پیاده‌سازی

### ۳.۱ مرکز فرماندهی

- **نمای کلی**: اعضای فعال، اعضای تأییدشده، کمپین‌های فعال، مسائل باز/حل‌شده،
  تجربه‌های منتشرشده، اجرای مجدد، حلقه‌ها و همکاری‌های فعال، گزارش‌های در انتظار.
- **هشدارها** (سطح‌بندی critical/warning/info): مسائل بی‌پاسخ بیش از ۴۸ ساعت،
  گزارش‌های در انتظار (SLA < ۲۴ ساعت)، محتوای نیازمند بررسی ناظر، اعتراض‌های در
  انتظار، درخواست‌های تأیید عضویت، کاربران دارای وضعیت محدود.
- **الگوها**: توزیع نوع مانع، وضعیت مسائل، استان‌های با بیشترین عضو، برچسب‌های
  پرتکرار — از `groupBy` روی داده‌های واقعی.
- **روندها**: مقایسه «۷ روز جاری» vs «۷ روز قبلی» برای مسئله/تجربه/اجرای مجدد/عضو
  جدید با درصد تغییر.
- **پیشنهاد حمایت/Coaching**: استان‌های دارای بیشترین مسئله بی‌پاسخ ۴۸ساعته،
  حلقه‌های فعال بدون عضو، کمپین‌های فعال بدون مشارکت — برای تیم عامل/شورا.

### ۳.۲ کمپین‌ها و بازی‌های شبکه‌ای

- **شش خانواده بازی**: `learning`/`cooperation`/`network`/`innovation`/`growth`/
  `mission` با برچسب/نماد فارسی.
- **مشارکت اختیاری**: هر کاربر فقط یک‌بار (`CampaignParticipation` با کلید یکتا)؛
  عضویت فقط در کمپین `active` و `published`؛ انصراف مجاز است.
- **مدیریت**: ساخت/ویرایش/تغییر وضعیت توسط مدیر با `publishedAt` و Audit Log؛
  کمپین `active` = قابل مشاهده برای اعضا.
- **ممنوعیت‌ها**: بدون لیدربورد، بدون پاداش اعتیادآور، بدون رقابت ناسالم.

### ۳.۳ ابزارهای اجرایی (کارخانه محتوا)

- **انواع ابزار**: `guide` (راهنما)، `checklist` (چک‌لیست)، `intervention` (بسته
  مداخله)، `content_item` (اقلام محتوایی).
- **نسخه و بازبینی**: `version` با هر به‌روزرسانی افزایش و `reviewedAt` در انتشار
  به‌روز می‌شود؛ اسلاگ قابل اشتراک (`abzar-XXXXXXXX`).
- **انتشار**: فقط ابزار `published` با `publishedAt` برای اعضا دیده می‌شود؛
  پیش‌نویس/بایگانی‌شده مخفی‌اند.
- **بدون ورود به قلمرو سیب**: ابزارها «دانش قابل استفاده» هستند، نه ثبت رسمی؛
  بنر هشدار «مدرک رسمی نیست» در صفحه جزئیات نمایش داده می‌شود.

### ۳.۴ نقشه موانع تجمیعی ناشناس

- **رضایت صریح**: فیلد `allowDataContribution` روی `User` (پیش‌فرض false)؛ فقط
  مسائل کاربران دارای رضایت در تجمیع لحاظ می‌شوند.
- **تجمیع ناشناس**: شمارش «نوع مانع» به تفکیک استان از مسائل منتشرشده
  (open/discussing/solved)؛ هیچ داده هویتی، بیمار یا پرونده‌ای بازگردانده نمی‌شود.
- **حکمرانی داده**: صفحه `/insights` شامل توضیح شفاف، سوییچ رضایت قابل برگشت
  (`PATCH /api/insights/data-contribution`) و بخش «قواعد حکمرانی داده».

### ۳.۵ امنیت و کنترل دسترسی

- همه APIهای جدید `requireUser` + `assertPermission` دارند.
- `campaigns:read/join`، `tools:read` و `insights:read` برای اعضا؛
  `campaigns:manage`، `tools:manage` و `command-center:view` فقط admin/super_admin.
- مشارکت کمپین با `assertAccountCanInteract` (کاربر معلق نمی‌تواند مشارکت کند).
- داده‌های مرکز فرماندهی و نقشه موانع **تجمیعی** هستند؛ هیچ داده شخصی در خروجی نیست.

## ۴. ابزارها (در گیت)

| ابزار      | نتیجه                     |
| ---------- | ------------------------- |
| `lint`     | بدون خطا (۰ خطا)          |
| `typecheck`| بدون خطا                  |
| `test:run` | ۳۱۹ تست موفق (+۲۳ تست جدید) |
| `build`    | موفق (مسیرهای `/campaigns`، `/tools*`، `/insights`، `/admin/command-center`، `/admin/campaigns*`، `/admin/tools*` در خروجی) |

## ۵. امنیت و حریم خصوصی

- مجوزهای RBAC سمت سرور برای همه مسیرهای جدید.
- رضایت صریح و قابل برگشت برای مشارکت داده در نقشه موانع؛ بدون «موافقت ضمنی».
- مرکز فرماندهی فقط داده تجمیعی و ناشناس؛ بدون هیچ نظارت تنبیهی فردی/منطقه‌ای.
- هیچ داده بیمار؛ ابزارها و کمپین‌ها بدون قابلیت شبیه سیب.
- Audit Log برای ایجاد/به‌روزرسانی کمپین/ابزار و تغییر رضایت داده.

## ۶. بدهی/تأخیر عمدی (Backlog)

| شناسه | مورد                                                                               | بازپرداخت           |
| ----- | ---------------------------------------------------------------------------------- | ------------------- |
| PH14-1| مرکز فرماندهی و نقشه موانع در هر بارگذاری از DB محاسبه می‌شوند (بدون Cache)        | با مقیاس/مونیتورینگ |
| PH14-2| «نقشه موانع» فعلاً فقط شمارش؛ نقشه جغرافیایی بصری/رندر SVG ساخته نشد               | با مقیاس/نیاز       |
| PH14-3| بازی‌های شبکه‌ای فقط «کمپین + مشارکت» هستند؛ چالش‌ها/ماموریت‌های دارای نتیجه ثبت‌شده در فازهای بعد | با شواهد |
| PH14-4| ابزارها بدون رسانه/فایل ضمیمه و بدون جست‌وجوی داخلی هستند                          | فازهای بعد          |
| PH14-5| عدد واقعی شاخص موفقیت فاز وابسته به استقرار/جامعه واقعی است (ابزار آماده)         | پس از اجرا          |

## ۷. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-14): long-horizon ecosystem (command center,
campaigns, content factory, anonymous barrier map)

- Command center (/admin/command-center + GET /api/admin/command-center):
  live aggregated network overview, patterns (barrier/status/province/tags),
  alerts (48h unanswered, pending reports, review queue, appeals, memberships,
  restricted users), weekly trends (7d vs prev 7d) and community coaching
  suggestions - aggregated & supportive, not punitive
- Campaigns & network games (/campaigns + /admin/campaigns): six PDF game
  families (learning/cooperation/network/innovation/growth/mission), optional
  one-per-user participation (CampaignParticipation unique key), no leaderboard
- Executive tools / content factory (/tools + /tools/[slug] + /admin/tools):
  guide/checklist/intervention/content_item with owner/version/reviewedAt,
  shareable slug, published-only visibility, not-a-Sib disclaimer
- Anonymous aggregated barrier map (/insights + /api/insights/barrier-map):
  aggregate barrier-type counts by province ONLY from consenting users
  (User.allowDataContribution default false), reversible consent toggle
- RBAC: campaigns:read/join/manage, tools:read/manage, insights:read,
  command-center:view; audit logs for campaign/tool/consent changes
- Tests: campaigns/tools serializers+validations, RBAC, DB-backed integration
  (phase14-ecosystem.test.ts) -> 319 total (+23)
- lint/typecheck/test(319)/build all green"
```

## ۸. توقف و انتظار تأیید

طبق مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. موارد «نیازمند
تأیید» (پرداخت، سرویس‌های خارجی، تبلیغ/اسپانسر واقعی، همکاری پژوهشی رسمی با
نهادهای بیرونی، و استقرار واقعی) اجرا نشده‌اند.