import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { gradeQuiz } from "@/lib/academy";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/auth/session";
import { quizSubmitSchema } from "@/lib/validations/academy";
import type { z } from "zod";

type QuizInput = z.infer<typeof quizSubmitSchema>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "academy:learn");
    const { id } = await params;

    const input = validateInput(
      quizSubmitSchema,
      await readJsonBody<QuizInput>(request),
    );

    const result = await gradeQuiz(id, user.id, input.answers);

    await auditLog({
      actorId: user.id,
      action: "academy.quizAttempt",
      entityType: "Lesson",
      entityId: id,
      details: { ...result },
      ip,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
