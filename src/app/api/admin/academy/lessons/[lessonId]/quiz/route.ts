import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { quizQuestionSchema } from "@/lib/validations/academy";
import { z } from "zod";

const quizUpdateSchema = z.object({
  questions: z.array(quizQuestionSchema),
});

type QuizUpdateInput = z.infer<typeof quizUpdateSchema>;

/**
 * جایگزینی کامل آزمونک یک درس (حذف پرسش‌های قبلی و نوشتن پرسش‌های جدید).
 * پرسش‌های آزمونک همیشه سمت سرور ذخیره و تصحیح می‌شوند.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "academy:manage");
    const { lessonId } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!lesson) {
      throw new AppError("NOT_FOUND", "درس یافت نشد");
    }

    const input = validateInput(
      quizUpdateSchema,
      await readJsonBody<QuizUpdateInput>(request),
    );

    await prisma.$transaction([
      prisma.courseQuizQuestion.deleteMany({ where: { lessonId } }),
      prisma.courseQuizQuestion.createMany({
        data: input.questions.map((q, index) => ({
          lessonId,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? null,
          order: index,
        })),
      }),
    ]);

    await auditLog({
      actorId: user.id,
      action: "academy.quizUpdate",
      entityType: "Lesson",
      entityId: lessonId,
      details: { questionCount: input.questions.length },
      ip,
    });

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}