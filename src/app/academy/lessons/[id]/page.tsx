import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLessonForLearning } from "@/lib/academy";
import { LessonLearner } from "@/components/academy/lesson-learner";
import { LESSON_CONTENT_TYPE_LABELS } from "@/lib/constants/academy";

export const metadata = {
  title: "درس آکادمی",
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  const { id } = await params;

  let data;
  try {
    data = await getLessonForLearning(id, user.id);
  } catch {
    notFound();
  }

  const { lesson, course, prevLesson, nextLesson } = data;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/academy/${course.slug}`}
            className="text-brand-700 hover:text-brand-800 text-sm font-medium"
          >
            ← بازگشت به دوره
          </Link>
          <Badge tone="neutral">{LESSON_CONTENT_TYPE_LABELS[lesson.contentType]}</Badge>
        </div>

        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            {lesson.title}
          </h1>
          {lesson.summary ? (
            <p className="text-muted-foreground mt-1 text-sm">{lesson.summary}</p>
          ) : null}
        </header>

        <LessonLearner
          lesson={lesson}
          courseId={course.id}
          courseSlug={course.slug}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
        />
      </div>
    </AppShell>
  );
}
