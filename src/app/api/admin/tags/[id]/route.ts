import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const tagUpdateSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "tags:manage");
    const { id } = await params;

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("NOT_FOUND", "برچسب یافت نشد");
    }

    const input = validateInput(
      tagUpdateSchema,
      await readJsonBody<z.infer<typeof tagUpdateSchema>>(request),
    );

    const tag = await prisma.tag.update({
      where: { id },
      data: { isActive: input.isActive },
    });

    await auditLog({
      actorId: user.id,
      action: input.isActive ? "admin.tag.activate" : "admin.tag.deactivate",
      entityType: "Tag",
      entityId: id,
      details: { name: tag.name },
      ip,
    });

    return jsonOk({ tag });
  } catch (error) {
    return jsonError(error);
  }
}