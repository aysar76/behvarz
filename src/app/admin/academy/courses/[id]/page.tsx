import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
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
            className="text-brand-700 hover:text-brand-800 text-sm font-medium"
          >
            ← مدیریت آکادمی
          </Link>
          <h1 className="text-foreground mt-1 text-2xl font-extrabold">
            {course.emoji ?? "📘"} {course.title}
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