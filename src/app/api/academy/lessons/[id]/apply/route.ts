import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { recordFieldApplication } from "@/lib/academy";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/auth/session";
import { fieldApplicationSchema } from "@/lib/validations/academy";
import type { z } from "zod";

type ApplyInput = z.infer<typeof fieldApplicationSchema>;

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
      fieldApplicationSchema,
      await readJsonBody<ApplyInput>(request),
    );

    await recordFieldApplication(id, user.id, {
      summary: input.summary,
      outcome: input.outcome,
    });

    await auditLog({
      actorId: user.id,
      action: "academy.fieldApplication",
      entityType: "Lesson",
      entityId: id,
      ip,
    });

    return jsonOk({ recorded: true });
  } catch (error) {
    return jsonError(error);
  }
}
