import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCourseDetail } from "@/lib/academy";
import { COURSE_LEVEL_LABELS } from "@/lib/constants/academy";
import { CourseActions } from "@/components/academy/course-actions";
import { formatJalali } from "@/lib/dates";
import { canUser } from "@/lib/auth/authorization";

export const metadata = {
  title: "دوره آکادمی",
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  const { slug } = await params;

  let detail;
  try {
    detail = await getCourseDetail(slug, user.id);
  } catch {
    notFound();
  }

  const { course, lessons } = detail;
  const isManager = canUser(user, "academy:manage");

  const progress =
    course.lessonsTotal > 0
      ? Math.round((course.lessonsCompleted / course.lessonsTotal) * 100)
      : 0;

  const completedLessonIds = new Set(
    lessons.filter((l) => l.progressStatus === "completed").map((l) => l.id),
  );
  const nextLesson = lessons.find((l) => !completedLessonIds.has(l.id));

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/academy"
          className="text-brand-700 hover:text-brand-800 text-sm font-medium"
        >
          ← بازگشت به آکادمی
        </Link>

        <header className="border-border bg-card shadow-card rounded-xl border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="bg-brand-100 text-brand-800 flex size-16 shrink-0 items-center justify-center rounded-xl text-4xl"
              >
                {course.emoji ?? "📘"}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">
                    {COURSE_LEVEL_LABELS[course.level]}
                  </Badge>
                  <Badge tone="neutral">{course.lessonCount} درس</Badge>
                  {course.isPaid ? <Badge tone="warning">دوره پولی</Badge> : null}
                </div>
                <h1 className="text-foreground mt-2 text-2xl font-extrabold">
                  {course.title}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                  {course.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {course.tags.map((tag) => (
              <Badge key={tag} tone="info">
                {tag}
              </Badge>
            ))}
          </div>

          {course.relatedProblemTitle && (
            <p className="text-muted-foreground mt-4 text-sm">
              مرتبط با مسئله:{" "}
              <Link
                href={`/problems/${course.relatedProblemId}`}
                className="text-brand-700 hover:text-brand-800 font-medium"
              >
                {course.relatedProblemTitle}
              </Link>
            </p>
          )}
          {course.relatedExperienceTitle && (
            <p className="text-muted-foreground mt-1 text-sm">
              مطالعه موردی از تجربه:{" "}
              <Link
                href={`/experiences/${course.relatedExperienceSlug}`}
                className="text-brand-700 hover:text-brand-800 font-medium"
              >
                {course.relatedExperienceTitle}
              </Link>
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {course.isEnrolled ? (
              <div className="flex-1 min-w-52 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">پیشرفت دوره</span>
                  <span className="text-foreground font-medium">
                    {course.lessonsCompleted}/{course.lessonsTotal} درس
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {course.completedAt ? (
                  <p className="text-success text-xs">
                    این دوره در {formatJalali(course.completedAt)} تکمیل شد.
                  </p>
                ) : null}
              </div>
            ) : (
              <CourseActions
                slug={course.slug}
                courseId={course.id}
                enrolled={false}
              />
            )}
          </div>
        </header>

        {isManager ? (
          <div className="flex justify-end">
            <Link href={`/admin/academy/courses/${course.id}`}>
              <Button variant="outline" size="sm">
                مدیریت دوره
              </Button>
            </Link>
          </div>
        ) : null}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-foreground text-lg font-bold">درس‌ها</h2>
            {nextLesson && course.isEnrolled ? (
              <Link href={`/academy/lessons/${nextLesson.id}`}>
                <Button size="sm">ادامه یادگیری</Button>
              </Link>
            ) : null}
          </div>

          {lessons.length === 0 ? (
            <EmptyState
              title="درس‌های این دوره هنوز آماده نشده‌اند"
              description="محتوا به‌زودی توسط متخصصان بررسی و منتشر می‌شود."
            />
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => {
                const baseClass =
                  "border-border bg-card shadow-card block rounded-xl border p-4" +
                  (course.isEnrolled
                    ? " hover:border-brand-300 transition-colors"
                    : " opacity-70");
                const content = (
                  <>
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          lesson.progressStatus === "completed"
                            ? "bg-success text-success-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                            : "bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        }
                      >
                        {lesson.progressStatus === "completed"
                          ? "✓"
                          : index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-foreground truncate font-semibold">
                            {lesson.title}
                          </p>
                          {lesson.isOptional ? (
                            <Badge tone="neutral">اختیاری</Badge>
                          ) : null}
                          {lesson.quizQuestions.length > 0 ? (
                            <Badge tone="info">آزمونک</Badge>
                          ) : null}
                        </div>
                        {lesson.summary ? (
                          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                            {lesson.summary}
                          </p>
                        ) : null}
                      </div>
                      {lesson.progressStatus === "completed" ? (
                        <Badge tone="success">تکمیل‌شده</Badge>
                      ) : lesson.progressStatus === "in_progress" ? (
                        <Badge tone="brand">در حال یادگیری</Badge>
                      ) : (
                        <Badge tone="neutral">شروع‌نشده</Badge>
                      )}
                    </div>
                  </>
                );
                return course.isEnrolled ? (
                  <Link key={lesson.id} href={`/academy/lessons/${lesson.id}`} className={baseClass}>
                    {content}
                  </Link>
                ) : (
                  <div key={lesson.id} className={baseClass}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
