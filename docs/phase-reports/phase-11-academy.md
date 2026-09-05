# گزارش فاز ۱۱ — آکادمی مسئله‌محور

**شاخه پیشنهادی:** `phase/11-academy`
**تاریخ:** مهر ۱۴۰۵
**وضعیت:** آماده تأیید (Stage-Gate) — ابزارها سبز

---

## ۱. خلاصه

فاز ۱۱ «آکادمی مسئله‌محور» را پیاده‌سازی می‌کند: مسیرهای یادگیری کوتاه، درس‌های
کم‌حجم (متنی/صوتی/ویدیویی)، آزمونک و «ثبت کاربرد میدانی» برای بستن حلقه
«آموزش → سنجش → کاربرد» — بدون LMS سنگین و بدون ادعای مدرک رسمی. خروجی این فاز:

1. **مدل داده و Migration** (`Course`, `Lesson`, `CourseQuizQuestion`,
   `CourseEnrollment`, `LessonProgress`, `QuizAttempt`, `FieldApplication`, `CourseTag`).
2. **حلقه یادگیری کامل**: ثبت‌نام در دوره ← مطالعه درس ← گذراندن آزمونک (تصحیح
   سمت سرور) ← تکمیل درس/دوره ← ثبت کاربرد میدانی.
3. **پیشنهاد آموزش بر اساس مسائل/مهارت‌ها** (`recommendCourses` از برچسب‌های
   علایق/مهارت/مسائل/تجربه‌ها — بدون Popularity).
4. **مدیریت محتوا** (`/admin/academy`): ساخت/ویرایش دوره، درس و آزمونک با مجوز
   `academy:manage`؛ محتوا مالک/نسخه/تاریخ بازبینی دارد.
5. **آماده‌سازی دوره پولی**: فیلد `isPaid` بدون درگاه پرداخت.

**نکته راهبردی:** شاخص موفقیت فاز («≥ ۴۰٪ از تکمیل‌کنندگان، کاربرد آموزش را در
میدان ثبت کنند») به‌صورت ابزار (ثبت کاربرد میدانی + شمارش) آماده است؛ عدد واقعی
آن وابسته به وجود دوره‌ها و کاربران واقعی است.

## ۲. خروجی‌های این فاز (در مخزن)

| سند/فایل                                   | محتوا                                                              |
| ------------------------------------------ | ------------------------------------------------------------------ |
| Migration `20260905131544_phase11_academy` | مدل‌ها و ۵ enum آکادمی                                             |
| `src/lib/constants/academy.ts`             | برچسب‌ها، سطح/وضعیت/نوع محتوا/نتیجه، محدودیت‌های طول               |
| `src/lib/validations/academy.ts`           | اسکیمای zod (دوره/درس/آزمونک/کاربرد میدانی)                        |
| `src/lib/academy.ts`                       | منطق: فهرست/جزئیات، ثبت‌نام، تکمیل درس، تصحیح آزمونک، کاربرد میدانی، پیشنهاد |
| `src/lib/academy-admin.ts`                 | همگام‌سازی برچسب دوره                                              |
| `src/lib/rbac.ts` + تست                    | مجوزهای `academy:read/learn/manage`                                |
| API عمومی                                  | `/api/academy`، `[slug]`، `[slug]/enroll`، `lessons/[id]/{complete,quiz,apply}` |
| API مدیریت                                 | `/api/admin/academy/courses(+[id])`، `lessons(+[lessonId])`، `lessons/[lessonId]/quiz` |
| UI یادگیری                                 | `/academy`، `/academy/[slug]`، `/academy/lessons/[id]` + کامپوننت‌ها |
| UI مدیریت                                  | `/admin/academy`، `new`، `courses/[id]`، `courses/[id]/lessons/[lessonId]` |
| تست‌ها                                     | `academy.test.ts` (serializer) + `validations/academy.test.ts` + تست‌های RBAC |
| مستندات                                    | changelog، database-schema، development-roadmap، known-limitations، technical-debt |

## ۳. جزئیات پیاده‌سازی

- **امنیت آزمونک**: گزینه‌های صحیح (JSON) هرگز به کلاینت ارسال نمی‌شوند؛
  `getCourseDetail`/`getLessonForLearning` فقط متن گزینه‌ها را می‌فرستند و
  `gradeQuiz` روی سرور تصحیح می‌کند (قبولی = همه پاسخ‌ها درست).
- **حلقه کامل**: تکمیل درس با آزمونک فقط پس از قبولی مجاز است (`completeLesson`).
  با تکمیل همه درس‌های الزامی، دوره خودکار تکمیل می‌شود (`CourseEnrollment.completedAt`).
- **محتوا مالک/نسخه/بازبینی**: `ownerId`، `version` (افزایش در هر ویرایش) و
  `reviewedAt` هنگام هر تغییر ثبت می‌شود.
- **حریم خصوصی/محدوده**: هیچ داده بیمار و هیچ قابلیت شبیه سیب اضافه نشد؛
  جلسات زنده (نیازمند بلادرنگ) عمداً در backlog ماند؛ گواهی داخلی برای جلوگیری از
  برداشت «مدرک رسمی» ساخته نشد و به شواهد نیازمند است.
- **دسترسی**: درس‌های دوره منتشرشده فقط برای ثبت‌نام‌شده‌ها (یا مدیر/مالک)؛
  دوره‌های پیش‌نویس فقط برای مدیر/مالک دیده می‌شوند.

## ۴. ابزارها (در گیت)

| ابزار      | نتیجه                     |
| ---------- | ------------------------- |
| `lint`     | بدون خطا (۰ خطا)          |
| `typecheck`| بدون خطا                  |
| `test:run` | ۲۴۱ تست موفق (+۲۲ تست جدید)|
| `build`    | موفق (مسیرهای `/academy` و `/admin/academy` در خروجی) |

## ۵. امنیت و حریم خصوصی

- گزینه صحیح آزمونک فقط سمت سرور؛ عدم ارسال `correctIndex` به کلاینت.
- مجوزهای RBAC سمت سرور برای همه مسیرها (`academy:read/learn/manage`).
- `assertPermission` + `requireUser` در همه APIها؛ قواعد مالکیت و وضعیت دوره در سرور.
- هیچ داده بیمار در مدل داده؛ هیچ درگاه پرداخت و هیچ فروشگاهی اضافه نشد.

## ۶. بدهی/تأخیر عمدی (Backlog)

| شناسه | مورد                                                                       | بازپرداخت               |
| ----- | -------------------------------------------------------------------------- | ----------------------- |
| PH11-1| آزمونک فقط چندگزینه‌ای و «قبولی = همه درست»                                | بازبینی با شواهد        |
| PH11-2| پیشنهاد دوره فقط تطابق برچسب (بدون امتیازدهی ترکیبی)                       | بازبینی با شواهد        |
| PH11-3| پرسش‌ها/پیشرفت بدون Cache خوانده می‌شوند                                   | فاز ۱۳                  |
| PH11-4| جلسات زنده ساخته نشد (بدون WebSocket در MVP)                                | فاز ۱۳/بعد              |
| PH11-5| گواهی داخلی ساخته نشد تا برداشت «مدرک رسمی» نشود                           | پس از شواهد و خط مشی    |
| PH11-6| عدد واقعی «≥ ۴۰٪ کاربرد میدانی» وابسته به اجرا است (ابزار آماده)           | پس از اجرا              |

## ۷. پیشنهاد Commit

```
git add -A
git commit -m "feat(phase-11): problem-based academy

- Learning paths (/academy, /academy/[slug]) with level/status/tags/
  emoji, linked problem & experience (case study), publishedAt
- Short lessons (text/audio/video) with summary/body/mediaUrl/duration/
  order, optional flag, prev/next navigation
- Lesson quiz: server-side grading only; correct answers never sent to
  the client; pass = all correct (QuizAttempt per try)
- Progress: LessonProgress (not_started/in_progress/completed + quizPassed),
  CourseEnrollment.completedAt auto-set when all required lessons done
- Field application recording closes the learn -> assess -> apply loop
  (FieldApplication with outcome); ready for the >=40% field-application KPI
- Course recommendation from profile interests/skills and problem/
  experience tags (no popularity)
- Admin content management (/admin/academy): courses, lessons, quiz
  CRUD with academy:manage permission; owner/version/reviewedAt tracked;
  published courses cannot be deleted
- Paid-course readiness: isPaid field, no payment gateway
- RBAC academy:read/learn/manage; nav entries (main nav + user menu +
  admin menu); lint/typecheck/test(241)/build all green"
```

## ۸. توقف و انتظار تأیید

طبق مدل Stage-Gate، این فاز **متوقف** می‌شود تا خروجی تأیید شود. ادامه به فاز ۱۲
(باشگاه مزایا و مشارکت) پس از تأیید این فاز.