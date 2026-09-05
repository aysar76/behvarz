import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { lessonCreateSchema } from "@/lib/validations/academy";
import type { z } from "zod";

type CreateLessonInput = z.infer<typeof lessonCreateSchema>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "academy:manage");
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!course) {
      throw new AppError("NOT_FOUND", "دوره یافت نشد");
    }

    const input = validateInput(
      lessonCreateSchema,
      await readJsonBody<CreateLessonInput>(request),
    );
    if (input.courseId !== id) {
      throw new AppError("VALIDATION", "شناسه دوره نامعتبر است");
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId: id,
        title: input.lesson.title,
        summary: input.lesson.summary ?? null,
        body: input.lesson.body,
        contentType: input.lesson.contentType,
        mediaUrl: input.lesson.mediaUrl ?? null,
        durationMinutes: input.lesson.durationMinutes ?? null,
        order: input.lesson.order ?? 0,
        isOptional: input.lesson.isOptional ?? false,
        quizQuestions:
          input.lesson.quizQuestions && input.lesson.quizQuestions.length > 0
            ? {
                create: input.lesson.quizQuestions.map((q, index) => ({
                  question: q.question,
                  options: q.options,
                  correctIndex: q.correctIndex,
                  explanation: q.explanation ?? null,
                  order: index,
                })),
              }
            : undefined,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "academy.lessonCreate",
      entityType: "Lesson",
      entityId: lesson.id,
      details: { courseId: id },
      ip,
    });

    return jsonOk({ lesson: { id: lesson.id } }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
