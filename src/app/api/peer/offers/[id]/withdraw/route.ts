import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "peer:offer");
    const { id } = await params;

    const offer = await prisma.peerOffer.findUnique({
      where: { id },
      select: { helperId: true, helpRequest: { select: { requesterId: true } }, status: true },
    });
    if (!offer) {
      throw new AppError("NOT_FOUND", "پیشنهاد همیار یافت نشد");
    }
    const isInitiator =
      user.id === offer.helperId || user.id === offer.helpRequest.requesterId;
    if (!isInitiator) {
      throw new AppError("FORBIDDEN", "شما در این پیشنهاد نقشی ندارید");
    }
    if (offer.status !== "pending") {
      throw new AppError("CONFLICT", "فقط پیشنهادهای در انتظار قابل پس‌گرفتن هستند");
    }

    await prisma.peerOffer.update({
      where: { id },
      data: { status: "withdrawn", respondedAt: new Date() },
    });

    await auditLog({
      actorId: user.id,
      action: "peer.offer.withdraw",
      entityType: "PeerOffer",
      entityId: id,
      ip,
    });

    return jsonOk({ withdrawn: true });
  } catch (error) {
    return jsonError(error);
  }
}