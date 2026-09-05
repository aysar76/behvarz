import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { requireCooperationParticipant } from "@/lib/peer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "peer:cooperate");
    const { id } = await params;

    const cooperation = await requireCooperationParticipant(id, user.id);
    if (cooperation.status !== "active") {
      throw new AppError("CONFLICT", "این همکاری قبلاً پایان یافته است");
    }

    await prisma.peerCooperation.update({
      where: { id },
      data: { status: "closed", closedAt: new Date() },
    });

    await auditLog({
      actorId: user.id,
      action: "peer.cooperation.close",
      entityType: "PeerCooperation",
      entityId: id,
      ip,
    });

    return jsonOk({ closed: true });
  } catch (error) {
    return jsonError(error);
  }
}