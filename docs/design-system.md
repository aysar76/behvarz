# سیستم طراحی (Design System) — فاز ۱

**وضعیت:** پیاده‌سازی‌شده — تاریخ: مهر ۱۴۰۵

## اصول بصری

> حس بصری محصول: «جامعه حرفه‌ای، اعتماد و رشد» — نه پنل اداری و نه فانتزی.

- **رنگ برند:** سبز (`brand`) — نماد سلامت، رشد و اعتماد.
- **RTL کامل:** زبان `fa`، جهت `rtl` در ریشه (`src/app/layout.tsx`).
- **Mobile-First:** کامپوننت‌ها و صفحات از پایین‌ترین عرض طراحی می‌شوند.
- **کم‌مصرف:** بدون کتابخانه سنگین UI؛ کامپوننت‌ها سبک و بومی هستند.

## فونت

- **Vazirmatn** (نسخه Variable) به‌صورت self-host در `src/fonts/vazirmatn-variable.woff2` از طریق `next/font/local` بارگذاری می‌شود.
- بدون درخواست شبکه به سرور خارجی.

## توکن‌ها

توکن‌ها در `src/app/globals.css` با `@theme` (Tailwind v4) تعریف شده‌اند:

| دسته           | توکن‌ها                                                                                                                                  | کاربرد                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| رنگ برند       | `brand-50` تا `brand-950`                                                                                                                | تم اصلی                                             |
| رنگ‌های معنایی | `background`, `foreground`, `card`, `muted`, `border`, `input`, `ring`, `primary`, `accent`, `destructive`, `success`, `warning`, `info` | کلاس‌هایی مثل `bg-primary`, `text-muted-foreground` |
| فونت           | `--font-sans` → Vazirmatn                                                                                                                | تایپوگرافی پیش‌فرض                                  |
| گوشه           | `radius-sm/md/lg/xl/2xl/full`                                                                                                            | `rounded-*`                                         |
| سایه           | `shadow-card`, `shadow-popover`                                                                                                          | سطوح و پاپ‌اورها                                    |

## کامپوننت‌های پایه (`src/components/ui`)

| کامپوننت     | ویژگی‌ها                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------- |
| `Button`     | واریانت‌ها: primary, secondary, outline, ghost, destructive؛ سایز sm/md/lg/icon؛ حالت loading |
| `Input`      | حالت invalid (قرمز) + `aria-invalid`                                                          |
| `Textarea`   | مشابه Input                                                                                   |
| `Badge`      | تن‌ها: neutral, brand, success, warning, danger, info                                         |
| `Spinner`    | سایز sm/md/lg؛ `role="status"`                                                                |
| `Skeleton`   | پس‌زمینه `bg-muted` + انیمیشن pulse                                                           |
| `Modal`      | دیالوگ با backdrop، بستن با Escape، قفل اسکرول، Portal                                        |
| `Tabs`       | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` با نقش‌های ARIA                              |
| `Toast`      | `ToastProvider` + `useToast`؛ تن‌های info/success/warning/danger؛ خودکار بسته‌شدن             |
| `EmptyState` | آیکون + عنوان + توضیح + اکشن                                                                  |

## App Shell

- `src/components/shell/`:
  - `app-shell.tsx` — چیدمان کلی (Header + main + ناوبری موبایل)
  - `app-header.tsx` — هدر چسبان؛ ناوبری دسکتاپ؛ دکمه ورود (غیرفعال تا فاز ۲)
  - `mobile-nav.tsx` — نوار پایین موبایل
  - `logo.tsx` — برند
- مسیرهای آینده در `src/config/site.ts` به‌صورت `disabled` (به‌زودی) تعریف شده‌اند.

## صفحات وضعیت

- `src/app/loading.tsx` — Skeleton
- `src/app/not-found.tsx` — 404 با EmptyState
- `src/app/error.tsx` — Error Boundary با دکمه تلاش دوباره
- `src/app/global-error.tsx` — خطای سطح ریشه
- `src/app/ui/page.tsx` — پیش‌نمایش همه کامپوننت‌ها (`/ui`)

## استاندارد استفاده

1. هر کامپوننت جدید ابتدا در `src/components/ui` ساخته و در `/ui` بررسی می‌شود.
2. استایل فقط با توکن‌ها و کلاس‌های Tailwind؛ بدون رنگ هاردکد.
3. دسترس‌پذیری: `focus-visible` برای همه عناصر تعاملی، `aria-*` مناسب، متن معنادار.
4. RTL از ابتدا؛ از مقادیر `right/left` مطلق پرهیز و از `start/end` یا منطقی استفاده کنید.
