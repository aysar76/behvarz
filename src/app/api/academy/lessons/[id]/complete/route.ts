import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { completeLesson } from "@/lib/academy";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/auth/session";
import { lessonCompleteSchema } from "@/lib/validations/academy";
import type { z } from "zod";

type CompleteInput = z.infer<typeof lessonCompleteSchema>;

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
      lessonCompleteSchema,
      await readJsonBody<CompleteInput>(request),
    );

    const { courseCompleted } = await completeLesson(
      id,
      input.courseId,
      user.id,
    );

    await auditLog({
      actorId: user.id,
      action: "academy.lessonComplete",
      entityType: "Lesson",
      entityId: id,
      details: { courseCompleted },
      ip,
    });

    return jsonOk({ completed: true, courseCompleted });
  } catch (error) {
    return jsonError(error);
  }
}
