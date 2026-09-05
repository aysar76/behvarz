import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Icon } from "@/components/ui/icon";
import { AdminLessonQuizManager } from "@/components/admin/academy-lesson-quiz-manager";

export const metadata = {
  title: "آزمونک درس",
};

export default async function AdminLessonQuizPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      quizQuestions: { orderBy: { order: "asc" } },
      course: { select: { id: true, title: true, emoji: true } },
    },
  });

  if (!lesson || lesson.courseId !== id) notFound();

  return (
    <div className="space-y-6">
      <header>
        <Link
          href={`/admin/academy/courses/${id}`}
          className="text-brand-700 hover:text-brand-800 inline-flex items-center gap-1 text-sm font-medium"
        >
          <Icon name="arrow-right" className="size-4" />
          بازگشت به دوره
        </Link>
        <h1 className="text-foreground mt-1 text-2xl font-extrabold">
          آزمونک درس: {lesson.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {lesson.course.title}
        </p>
      </header>

      <AdminLessonQuizManager
        lessonId={lessonId}
        initialQuestions={lesson.quizQuestions}
      />
    </div>
  );
}