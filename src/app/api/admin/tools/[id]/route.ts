import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { toolUpdateSchema } from "@/lib/validations/tool";
import { updateTool } from "@/lib/tools-admin";
import { prisma } from "@/lib/db";
import type { z } from "zod";

type UpdateInput = z.infer<typeof toolUpdateSchema>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "tools:manage");
    const { id } = await params;

    const current = await prisma.tool.findUnique({ where: { id } });
    if (!current) {
      throw new AppError("NOT_FOUND", "ابزار یافت نشد");
    }

    const input = validateInput(
      toolUpdateSchema,
      await readJsonBody<UpdateInput>(request),
    );

    await updateTool(id, input, user.id, ip);

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}