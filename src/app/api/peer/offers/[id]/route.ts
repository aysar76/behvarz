import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { peerOfferRespondSchema } from "@/lib/validations/peer";
import type { z } from "zod";

type PeerOfferRespondInput = z.infer<typeof peerOfferRespondSchema>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "peer:offer");
    const { id } = await params;

    const input = validateInput(
      peerOfferRespondSchema,
      await readJsonBody<PeerOfferRespondInput>(request),
    );

    const offer = await prisma.peerOffer.findUnique({
      where: { id },
      include: { helpRequest: { select: { requesterId: true, status: true } } },
    });
    if (!offer) {
      throw new AppError("NOT_FOUND", "پیشنهاد همیار یافت نشد");
    }
    if (offer.status !== "pending") {
      throw new AppError("CONFLICT", "این پیشنهاد قبلاً بررسی شده است");
    }

    const responderId =
      offer.initiator === "requester" ? offer.helperId : offer.helpRequest.requesterId;
    if (user.id !== responderId) {
      throw new AppError("FORBIDDEN", "فقط طرف مقابل این پیشنهاد می‌تواند پاسخ دهد");
    }

    if (offer.helpRequest.status !== "open") {
      throw new AppError("CONFLICT", "درخواست همیار دیگر پذیرای پاسخ نیست");
    }

    if (input.action === "accept") {
      await prisma.$transaction(async (tx) => {
        await tx.peerOffer.update({
          where: { id },
          data: { status: "accepted", respondedAt: new Date() },
        });
        await tx.peerHelpRequest.update({
          where: { id: offer.helpRequestId },
          data: { status: "matched" },
        });
        await tx.peerCooperation.create({
          data: {
            helpRequestId: offer.helpRequestId,
            requesterId: offer.helpRequest.requesterId,
            helperId: offer.helperId,
          },
        });
        await tx.peerOffer.updateMany({
          where: {
            helpRequestId: offer.helpRequestId,
            status: "pending",
            id: { not: offer.id },
          },
          data: { status: "rejected", respondedAt: new Date() },
        });
      });
    } else {
      await prisma.peerOffer.update({
        where: { id },
        data: { status: "rejected", respondedAt: new Date() },
      });
    }

    await auditLog({
      actorId: user.id,
      action: `peer.offer.${input.action}`,
      entityType: "PeerOffer",
      entityId: id,
      details: { helpRequestId: offer.helpRequestId, helperId: offer.helperId },
      ip,
    });

    return jsonOk({ responded: true, action: input.action });
  } catch (error) {
    return jsonError(error);
  }
}