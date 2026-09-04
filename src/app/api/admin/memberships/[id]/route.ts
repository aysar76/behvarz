import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { reviewMembershipSchema } from "@/lib/validations/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const { id } = await params;
    const admin = await requireUser();
    assertPermission(admin, "membership:review");

    const { action, note } = validateInput(
      reviewMembershipSchema,
      await readJsonBody<{ action: "approve" | "reject"; note?: string }>(
        request,
      ),
    );

    const membershipRequest = await prisma.membershipRequest.findUnique({
      where: { id },
    });
    if (!membershipRequest) {
      throw new AppError("NOT_FOUND", "درخواست یافت نشد");
    }
    if (membershipRequest.status !== "pending") {
      throw new AppError("CONFLICT", "این درخواست قبلاً بررسی شده است");
    }

    const status = action === "approve" ? "verified" : "rejected";
    const userStatus = action === "approve" ? "verified" : "rejected";
    const newRole = action === "approve" ? "verified_member" : undefined;

    await prisma.$transaction([
      prisma.membershipRequest.update({
        where: { id },
        data: {
          status,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          note,
        },
      }),
      prisma.user.update({
        where: { id: membershipRequest.userId },
        data: {
          membershipStatus: userStatus,
          ...(newRole ? { role: newRole } : {}),
        },
      }),
    ]);

    await auditLog({
      actorId: admin.id,
      action: `membership.${action}`,
      entityType: "MembershipRequest",
      entityId: id,
      details: { userId: membershipRequest.userId, note },
      ip,
    });

    return jsonOk({});
  } catch (error) {
    return jsonError(error);
  }
}
