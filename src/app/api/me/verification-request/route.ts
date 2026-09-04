import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { membershipRequestSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "profile:request-verification");

    const { note } = validateInput(
      membershipRequestSchema,
      await readJsonBody<{ note?: string }>(request),
    );

    if (user.membershipStatus === "verified") {
      throw new AppError("CONFLICT", "عضویت شما قبلاً تأیید شده است");
    }
    if (user.membershipStatus === "pending") {
      const existing = await prisma.membershipRequest.findFirst({
        where: { userId: user.id, status: "pending" },
      });
      if (existing) {
        throw new AppError("CONFLICT", "درخواست شما در انتظار بررسی مدیر است");
      }
    }

    await prisma.membershipRequest.create({
      data: { userId: user.id, note },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { membershipStatus: "pending" },
    });

    await auditLog({
      actorId: user.id,
      action: "membership.request",
      entityType: "User",
      entityId: user.id,
      details: { note },
      ip,
    });

    return jsonOk({});
  } catch (error) {
    return jsonError(error);
  }
}
