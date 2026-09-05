import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listPublishedCourses, recommendCourses } from "@/lib/academy";
import { COURSE_LEVEL_LABELS } from "@/lib/constants/academy";
import type { SerializedCourse } from "@/lib/academy";

export const metadata = {
  title: "آکادمی",
};

function CourseCard({ course }: { course: SerializedCourse }) {
  const progress =
    course.lessonsTotal > 0
      ? Math.round((course.lessonsCompleted / course.lessonsTotal) * 100)
      : 0;

  return (
    <Link
      href={`/academy/${course.slug}`}
      className="border-border bg-card shadow-card hover:border-brand-300 focus-visible:outline-ring flex flex-col gap-3 rounded-xl border p-4 transition-colors focus-visible:outline-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="bg-brand-100 text-brand-800 flex size-12 items-center justify-center rounded-lg text-2xl"
          >
            {course.emoji ?? "📘"}
          </span>
          <div>
            <p className="text-foreground font-bold">{course.title}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge tone="brand">{COURSE_LEVEL_LABELS[course.level]}</Badge>
              <Badge tone="neutral">{course.lessonCount} درس</Badge>
              {course.isEnrolled ? (
                <Badge tone="success">
                  {course.completedAt ? "تکمیل‌شده" : "در حال یادگیری"}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground line-clamp-2 text-sm">
        {course.description}
      </p>

      <div className="mt-auto">
        {course.isEnrolled ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">پیشرفت</span>
              <span className="text-foreground font-medium">
                {course.lessonsCompleted}/{course.lessonsTotal}
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline">
            شروع یادگیری
          </Button>
        )}
      </div>
    </Link>
  );
}

export default async function AcademyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const [courses, recommendations] = await Promise.all([
    listPublishedCourses(user.id),
    recommendCourses(user.id),
  ]);

  const recommendedIds = new Set(recommendations.map((c) => c.id));
  const otherCourses = courses.filter((c) => !recommendedIds.has(c.id));

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">آکادمی</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مسیرهای یادگیری کوتاه و کاربردی، متصل به مسائل واقعی شبکه بهورزان.
          </p>
        </header>

        {courses.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">🎓</span>}
            title="هنوز دوره‌ای منتشر نشده است"
            description="به‌زودی مسیرهای یادگیری کوتاه بر اساس مسائل واقعی شبکه منتشر می‌شوند."
          />
        ) : (
          <>
            {recommendations.length > 0 && (
              <section>
                <h2 className="text-foreground mb-3 text-lg font-bold">
                  پیشنهاد برای تو
                </h2>
                <p className="text-muted-foreground mb-4 text-xs">
                  بر اساس علایق، مهارت‌ها و موضوع مسائل/تجربه‌های تو.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendations.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}

            {otherCourses.length > 0 && (
              <section>
                <h2 className="text-foreground mb-3 text-lg font-bold">
                  همه دوره‌ها
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {otherCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
