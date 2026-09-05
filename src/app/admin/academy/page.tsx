import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { serializeCourse, type CourseRow } from "@/lib/academy";
import { COURSE_STATUS_TONES, COURSE_STATUS_LABELS } from "@/lib/constants/academy";

export const metadata = {
  title: "مدیریت آکادمی",
};

export default async function AdminAcademyPage() {
  const courses = await prisma.course.findMany({
    include: {
      owner: {
        select: {
          id: true,
          displayName: true,
          province: true,
          city: true,
          membershipStatus: true,
          role: true,
        },
      },
      tags: { include: { tag: { select: { id: true, name: true } } } },
      _count: { select: { lessons: true, enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-extrabold">
            مدیریت آکادمی
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ایجاد و مدیریت دوره‌ها، درس‌ها و آزمونک‌های آکادمی مسئله‌محور.
          </p>
        </div>
        <Link href="/admin/academy/new">
          <Button>دوره جدید</Button>
        </Link>
      </header>

      {courses.length === 0 ? (
        <EmptyState
          title="دوره‌ای ثبت نشده است"
          description="با ساختن نخستین دوره، آکادمی را راه‌اندازی کن."
          action={
            <Link href="/admin/academy/new">
              <Button>ساخت دوره جدید</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right font-medium">دوره</th>
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-right font-medium">درس‌ها</th>
                <th className="px-4 py-3 text-right font-medium">ثبت‌نام</th>
                <th className="px-4 py-3 text-right font-medium">مالک</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((raw) => {
                const course = serializeCourse(raw as unknown as CourseRow);
                const tone = COURSE_STATUS_TONES[course.status as keyof typeof COURSE_STATUS_TONES];
                return (
                  <tr key={course.id} className="hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/academy/courses/${course.id}`}
                        className="text-foreground hover:text-brand-700 inline-flex items-center gap-2 font-semibold"
                      >
                        <span
                          aria-hidden="true"
                          className="bg-brand-50 text-brand-700 border-brand-100 flex size-7 shrink-0 items-center justify-center rounded-lg border"
                        >
                          <Icon name="book" className="size-3.5" />
                        </span>
                        {course.title}
                      </Link>
                      <p className="text-muted-foreground mt-0.5 text-xs" dir="ltr">
                        /{course.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tone ?? "neutral"}>
                        {COURSE_STATUS_LABELS[course.status as keyof typeof COURSE_STATUS_LABELS]}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {course.lessonCount}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {course.enrollmentCount}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {course.owner?.displayName ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
