# گزارش فاز ۱۲ — باشگاه مزایا و مشارکت

**شاخه پیشنهادی:** `phase/12-benefits`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** آماده تأیید (Stage-Gate) — ابزارها سبز

---

## ۱. خلاصه

فاز ۱۲ «باشگاه مزایا و مشارکت» را پیاده‌سازی می‌کند: فهرست ارائه‌دهندگان تأییدشده،
ثبت استفاده غیرحساس و امتیاز رضایت، گزارش مشکل، پنل مدیریت ارائه‌دهندگان، تفکیک
شفاف تبلیغ/اسپانسر از محتوای حرفه‌ای و «بودجه‌ریزی مشارکتی» (گام اولیه: پیشنهاد
اعضا، بررسی صلاحیت، رأی واجدین شرایط، گزارش اجرا و هزینه قابل ممیزی). خروجی این
فاز:

1. **مدل داده و Migration** (`BenefitProvider`, `BenefitUsage`, `BenefitReport`,
   `BudgetProposal`, `BudgetProposalVote`, `BudgetImplementation` + ۶ enum).
2. **باشگاه مزایا** (`/benefits`): فهرست ارائه‌دهندگان تأییدشده با دسته‌بندی،
   میانگین رضایت، صفحه جزئیات با شرایط استفاده و ثبت استفاده/گزارش.
3. **بودجه‌ریزی مشارکتی** (`/budget`): پیشنهاد اعضا، بررسی صلاحیت توسط مدیر،
   رأی‌گیری واجدین شرایط (هر عضو یک رأی) و گزارش اجرا/هزینه قابل ممیزی.
4. **تفکیک شفاف اسپانسر**: فیلد `isSponsored` + بنر هشدار در فهرست/جزئیات؛ بدون
   فروشگاه، کیف پول و سیستم مالی پیچیده.
5. **اعلان‌های جدید**: `budget_proposal_reviewed` و `benefit_report_resolved`.

**نکته راهبردی:** شاخص موفقیت فاز («≥ ۳۰٪ اعضای فعال حداقل یک مزیت دریافت کنند»)
به‌صورت ابزار (ثبت استفاده + شمارش) آماده است؛ عدد واقعی آن وابسته به وجود
ارائه‌دهندگان و کاربران واقعی است.

## ۲. خروجی‌های این فاز (در مخزن)

| سند/فایل                                   | محتوا                                                              |
| ------------------------------------------ | ------------------------------------------------------------------ |
| Migration `20260905143327_phase12_benefits_club` | مدل‌ها و ۶ enum باشگاه مزایا و بودجه                    |
| `src/lib/constants/benefits.ts`            | دسته‌بندی‌ها، وضعیت‌ها، دلایل گزارش، محدودیت‌های طول               |
| `src/lib/validations/benefits.ts`          | اسکیمای zod (ارائه‌دهنده/استفاده/گزارش/پیشنهاد/رأی/اجرا)          |
| `src/lib/benefits.ts`                      | منطق: فهرست/جزئیات، ثبت استفاده، گزارش، پیشنهاد، رأی              |
| `src/lib/benefits-admin.ts`                | تغییر وضعیت، بررسی صلاحیت، گزارش اجرا، رسیدگی به گزارش + اعلان    |
| `src/lib/rbac.ts` + تست                    | مجوزهای `benefits:read/use/propose/manage`                        |
| API عمومی                                  | `/api/benefits(+[id])`، `usage`، `report`، `/api/budget-proposals(+vote)` |
| API مدیریت                                 | `/api/admin/benefits(+[id])`، `reports(+[id])`، `budget-proposals(+review/implement)` |
| UI باشگاه مزایا                            | `/benefits`، `/benefits/[id]` + کامپوننت‌ها                        |
| UI بودجه مشارکتی                           | `/budget` + VoteButton + BudgetProposalForm                       |
| UI مدیریت                                  | `/admin/benefits(+new/[id]/reports)`، `/admin/budget`             |
| تست‌ها                                     | `benefits.test.ts` (serializer) + `validations/benefits.test.ts` + تست‌های RBAC |
| مستندات                                    | changelog، database-schema، development-roadmap، known-limitations، technical-debt |

## ۳. جزئیات پیاده‌سازی

- **تفکیک شفاف تبلیغ**: فیلد `isSponsored` روی ارائه‌دهنده + بنر هشدار در فهرست و
  جزئیات که «این ارائه‌دهنده حمایت مالی شده است؛ محتوای حرفه‌ای مستقل است».
- **ثبت استفاده غیرحساس**: `BenefitUsage` فقط یادداشت اختیاری (بدون اطلاعات
  حساس/مالی) و امتیاز رضایت ۱ تا ۵ دارد؛ میانگین رضایت در فهرست/جزئیات محاسبه و
  نمایش داده می‌شود.
- **گزارش مشکل**: `BenefitReport` با دلیل استاندارد؛ جلوگیری از گزارش تکراری در
  انتظار (CONFLICT)؛ رسیدگی توسط مدیر با یادداشت + Audit Log + اعلان به گزارش‌دهنده.
- **بودجه‌ریزی مشارکتی (گام اولیه)**: پیشنهاد توسط عضو (پیش‌نویس)، بررسی صلاحیت
  توسط مدیر با جدول انتقال مجاز (draft → under_review → approved/voting →
  implemented/closed)، رأی‌گیری با کلید یکتا `[proposalId, userId]` (قابل ممیزی)،
  گزارش اجرا/هزینه (`BudgetImplementation`) که وضعیت را به `implemented` می‌برد.
- **ممنوعیت‌ها**: فروشگاه عمومی، کیف پول و سیستم مالی پیچیده ساخته نشد؛ خرید امتیاز
  وجود ندارد؛ هیچ داده بیمار و هیچ قابلیت شبیه سیب اضافه نشد.
- **دسترسی**: `benefits:read/use/propose` برای اعضا؛ `benefits:manage` برای
  admin/super_admin؛ همه APIها با `requireUser` + `assertPermission` + کنترل وضعیت
  حساب (`assertAccountCanCreate/Interact`).
- **اعلان**: بررسی پیشنهاد بودجه و نتیجه گزارش مزیت از طریق `notifyUser` (با احترام
  به تنظیمات اعلان گیرنده و جلوگیری از اعلان به خود).

## ۴. ابزارها (در گیت)

| ابزار      | نتیجه                     |
| ---------- | ------------------------- |
| `lint`     | بدون خطا (۰ خطا)          |
| `typecheck`| بدون خطا                  |
| `test:run` | ۲۶۲ تست موفق (+۲۱ تست جدید)|
| `build`    | موفق (مسیرهای `/benefits`، `/budget` و `/admin/benefits*` در خروجی) |

## ۵. امنیت و حریم خصوصی

- مجوزهای RBAC سمت سرور برای همه مسیرها (`benefits:read/use/propose/manage`).
- `requireUser` + `assertPermission` + `assertAccountCanCreate/Interact` در APIها.
- رأی‌گیری فقط روی پیشنهاد در وضعیت `voting`؛ انتقال وضعیت فقط از مسیر مجاز.
- هیچ داده بیمار؛ ثبت استفاده فقط یادداشت غیرحساس؛ هزینه‌ها بدون جزئیات مالی حساس.
- اسپانسر شفاف است و هرگز به‌عنوان محتوای حرفه‌ای نمایش داده نمی‌شود.

## ۶. بدهی/تأخیر عمدی (Backlog)

| شناسه | مورد                                                                       | بازپرداخت               |
| ----- | -------------------------------------------------------------------------- | ----------------------- |
| PH12-1| رأی‌گیری بدون بازه زمانی خودکار و بدون رأی وزنی                            | بازبینی با شواهد        |
| PH12-2| میانگین رضایت/شمار استفاده بدون Cache (هر بار از DB)                      | فاز ۱۳                  |
| PH12-3| ثبت استفاده بدون تأیید ارائه‌دهنده (برای جلوگیری از بار اداری)            | بازبینی با شواهد        |
| PH12-4| «واجدین شرایط رأی» معیار ساده (عضو فعال) دارد؛ بدون شورای جامعه          | پس از شورای جامعه       |
| PH12-5| عدد واقعی «≥ ۳۰٪ دریافت مزیت» وابسته به اجرا است (ابزار آماده)           | پس از اجرا              |

## ۷. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-12): benefits club & participatory budgeting

- Approved provider list (/benefits) with category/terms/website/contact/
  status + only approved providers visible; avg satisfaction + my usage
- Provider detail (/benefits/[id]) with terms, satisfaction, sponsored
  disclosure banner (isSponsored kept separate from professional content)
- Non-sensitive usage registration + 1-5 satisfaction rating
  (/api/benefits/usage); problem report with reason + dedupe
  (/api/benefits/report) and admin review queue (/admin/benefits/reports)
- Admin provider management (/admin/benefits): CRUD, status transitions
  with publishedAt, approved providers cannot be deleted
- Participatory budgeting (initial step, /budget): member proposals,
  admin eligibility review with allowed status transitions, one-member-
  one-vote (BudgetProposalVote unique key), auditable implementation &
  expense report (BudgetImplementation) -> status implemented
- Admin budget management (/admin/budget) + review/implement APIs
- New notification types budget_proposal_reviewed & benefit_report_resolved
- RBAC benefits:read/use/propose/manage; nav entries (main nav + user
  menu + admin menu); no store/wallet/complex finance
- lint/typecheck/test(262)/build all green"
```

## ۸. توقف و انتظار تأیید

طبق مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. ادامه به فاز ۱۳
(سخت‌سازی، مقیاس و استقرار پایدار) پس از تأیید این فاز.