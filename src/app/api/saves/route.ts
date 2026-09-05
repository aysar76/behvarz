import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { assertAccountCanInteract } from "@/lib/moderation";
import { saveSchema } from "@/lib/validations/interaction";
import type { z } from "zod";

type SaveInput = z.infer<typeof saveSchema>;

async function resolveTarget(
  input: SaveInput,
): Promise<{ label: string }> {
  if (input.targetType === "problem") {
    const problem = await prisma.problem.findUnique({
      where: { id: input.targetId },
      select: {
        id: true,
        title: true,
        isDraft: true,
        moderation: true,
        publishedAt: true,
      },
    });
    if (
      !problem ||
      problem.isDraft ||
      problem.moderation !== "visible" ||
      problem.publishedAt === null
    ) {
      throw new AppError("NOT_FOUND", "مسئله یافت نشد");
    }
    return { label: problem.title };
  }

  const experience = await prisma.experience.findUnique({
    where: { id: input.targetId },
    select: {
      id: true,
      title: true,
      isDraft: true,
      moderation: true,
      publishedAt: true,
      status: true,
    },
  });
  if (
    !experience ||
    experience.isDraft ||
    experience.moderation !== "visible" ||
    experience.publishedAt === null ||
    experience.status === "archived"
  ) {
    throw new AppError("NOT_FOUND", "تجربه یافت نشد");
  }
  return { label: experience.title };
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "interactions:save");
    assertAccountCanInteract(user);

    const input = validateInput(
      saveSchema,
      await readJsonBody<SaveInput>(request),
    );

    const target = await resolveTarget(input);

    const existing = await prisma.savedItem.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: user.id,
          targetType: input.targetType,
          targetId: input.targetId,
        },
      },
    });
    if (existing) {
      throw new AppError("CONFLICT", "این مورد را قبلاً ذخیره کرده‌اید");
    }

    await prisma.savedItem.create({
      data: {
        userId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "interaction.save",
      entityType: `SavedItem:${input.targetType}`,
      entityId: input.targetId,
      details: { label: target.label },
      ip,
    });

    return jsonOk({ saved: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "interactions:save");
    assertAccountCanInteract(user);

    const input = validateInput(
      saveSchema,
      await readJsonBody<SaveInput>(request),
    );

    const deleted = await prisma.savedItem.deleteMany({
      where: {
        userId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
      },
    });

    if (deleted.count === 0) {
      throw new AppError("NOT_FOUND", "این مورد را ذخیره نکرده‌اید");
    }

    await auditLog({
      actorId: user.id,
      action: "interaction.unsave",
      entityType: `SavedItem:${input.targetType}`,
      entityId: input.targetId,
      ip,
    });

    return jsonOk({ saved: false });
  } catch (error) {
    return jsonError(error);
  }
}