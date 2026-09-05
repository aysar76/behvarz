import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const termUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  description: z.string().trim().max(300).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "moderation:terms");
    const { id } = await params;

    const existing = await prisma.sensitiveTerm.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("NOT_FOUND", "واژه یافت نشد");
    }

    const input = validateInput(
      termUpdateSchema,
      await readJsonBody<z.infer<typeof termUpdateSchema>>(request),
    );

    const term = await prisma.sensitiveTerm.update({
      where: { id },
      data: {
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.description !== undefined
          ? { description: input.description || null }
          : {}),
      },
    });

    await auditLog({
      actorId: user.id,
      action: "admin.sensitive-term.update",
      entityType: "SensitiveTerm",
      entityId: id,
      details: { isActive: term.isActive },
      ip,
    });

    return jsonOk({ term });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "moderation:terms");
    const { id } = await params;

    const existing = await prisma.sensitiveTerm.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("NOT_FOUND", "واژه یافت نشد");
    }

    await prisma.sensitiveTerm.delete({ where: { id } });

    await auditLog({
      actorId: user.id,
      action: "admin.sensitive-term.delete",
      entityType: "SensitiveTerm",
      entityId: id,
      details: { term: existing.term },
      ip,
    });

    return jsonOk({});
  } catch (error) {
    return jsonError(error);
  }
}