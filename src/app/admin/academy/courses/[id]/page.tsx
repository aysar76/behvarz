import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Icon } from "@/components/ui/icon";
import { AdminCourseEditManager } from "@/components/admin/academy-course-edit-manager";

export const metadata = {
  title: "ویرایش دوره",
};

export default async function AdminAcademyCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
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
      lessons: {
        include: {
          quizQuestions: { orderBy: { order: "asc" } },
          _count: { select: { applications: true } },
        },
        orderBy: { order: "asc" },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) notFound();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/academy"
            className="text-brand-700 hover:text-brand-800 inline-flex items-center gap-1 text-sm font-medium"
          >
            <Icon name="arrow-right" className="size-4" />
            مدیریت آکادمی
          </Link>
          <h1 className="text-foreground mt-1 flex items-center gap-2 text-2xl font-extrabold">
            <span
              aria-hidden="true"
              className="bg-brand-50 text-brand-700 border-brand-100 flex size-9 items-center justify-center rounded-xl border"
            >
              <Icon name="book" className="size-4" />
            </span>
            {course.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm" dir="ltr">
            /{course.slug}
          </p>
        </div>
      </header>

      <AdminCourseEditManager initialCourse={course} />
    </div>
  );
}