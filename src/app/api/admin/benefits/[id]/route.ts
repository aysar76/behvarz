import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { benefitProviderUpdateSchema } from "@/lib/validations/benefits";
import { updateProviderStatus } from "@/lib/benefits-admin";
import type { z } from "zod";

type UpdateInput = z.infer<typeof benefitProviderUpdateSchema>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:manage");
    const { id } = await params;

    const current = await prisma.benefitProvider.findUnique({ where: { id } });
    if (!current) {
      throw new AppError("NOT_FOUND", "ارائه‌دهنده یافت نشد");
    }

    const input = validateInput(
      benefitProviderUpdateSchema,
      await readJsonBody<UpdateInput>(request),
    );

    const data: Record<string, unknown> = {};
    const wasApproved = current.status === "approved";
    if (input.name !== undefined) data.name = input.name;
    if (input.category !== undefined) data.category = input.category;
    if (input.description !== undefined) data.description = input.description;
    if (input.terms !== undefined) data.terms = input.terms;
    if (input.website !== undefined) data.website = input.website || null;
    if (input.contactNote !== undefined)
      data.contactNote = input.contactNote || null;
    if (input.logoEmoji !== undefined) data.logoEmoji = input.logoEmoji || null;
    if (input.isSponsored !== undefined) data.isSponsored = input.isSponsored;
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "approved" && !wasApproved) {
        data.publishedAt = new Date();
      }
      if (input.status !== "approved") {
        data.publishedAt = null;
      }
    }

    await prisma.benefitProvider.update({ where: { id }, data });

    await auditLog({
      actorId: user.id,
      action: "benefits.providerUpdate",
      entityType: "BenefitProvider",
      entityId: id,
      ip,
    });

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(_request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:manage");
    const { id } = await params;

    const current = await prisma.benefitProvider.findUnique({ where: { id } });
    if (!current) {
      throw new AppError("NOT_FOUND", "ارائه‌دهنده یافت نشد");
    }
    if (current.status === "approved") {
      throw new AppError(
        "CONFLICT",
        "ارائه‌دهنده تأییدشده را نمی‌توان حذف کرد؛ ابتدا بایگانی کنید",
      );
    }

    await prisma.benefitProvider.delete({ where: { id } });

    await auditLog({
      actorId: user.id,
      action: "benefits.providerDelete",
      entityType: "BenefitProvider",
      entityId: id,
      ip,
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:manage");
    const { id } = await params;

    const body = (await readJsonBody<{ status?: string }>(request)) as {
      status?: "draft" | "approved" | "archived";
    };
    if (!body.status || !["draft", "approved", "archived"].includes(body.status)) {
      throw new AppError("VALIDATION", "وضعیت نامعتبر است");
    }

    await updateProviderStatus(id, body.status);

    await auditLog({
      actorId: user.id,
      action: "benefits.providerStatusChange",
      entityType: "BenefitProvider",
      entityId: id,
      details: { to: body.status },
      ip,
    });

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}