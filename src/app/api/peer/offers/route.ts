import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { peerOfferCreateSchema } from "@/lib/validations/peer";
import { requireOpenHelpRequest } from "@/lib/peer";
import type { z } from "zod";

type PeerOfferCreateInput = z.infer<typeof peerOfferCreateSchema>;

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "peer:offer");

    if (isRateLimited(`peer:offers:${user.id}`, 15, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد پیشنهاد همیاری در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const input = validateInput(
      peerOfferCreateSchema,
      await readJsonBody<PeerOfferCreateInput>(request),
    );

    const requestRow = await requireOpenHelpRequest(input.helpRequestId);

    const isRequester = requestRow.requesterId === user.id;

    let helperId: string;
    let initiator: "requester" | "helper";

    if (isRequester) {
      if (!input.helperId) {
        throw new AppError(
          "VALIDATION",
          "برای دعوت همیار، عضو موردنظر را انتخاب کنید",
        );
      }
      if (input.helperId === user.id) {
        throw new AppError("VALIDATION", "نمی‌توانید خودتان را دعوت کنید");
      }
      helperId = input.helperId;
      initiator = "requester";
    } else {
      helperId = user.id;
      initiator = "helper";
    }

    const helper = await prisma.user.findUnique({
      where: { id: helperId },
      select: { id: true, onboardingCompleted: true },
    });
    if (!helper || !helper.onboardingCompleted) {
      throw new AppError("NOT_FOUND", "همیار موردنظر یافت نشد");
    }

    const existing = await prisma.peerOffer.findUnique({
      where: {
        helpRequestId_helperId: {
          helpRequestId: input.helpRequestId,
          helperId,
        },
      },
    });
    if (existing?.status === "pending") {
      throw new AppError("CONFLICT", "این پیشنهاد قبلاً ثبت شده و در انتظار پاسخ است");
    }
    if (existing?.status === "accepted") {
      throw new AppError("CONFLICT", "همیاری با این عضو قبلاً آغاز شده است");
    }

    let offer;
    if (existing) {
      offer = await prisma.peerOffer.update({
        where: { id: existing.id },
        data: { initiator, message: input.message ?? null, status: "pending", respondedAt: null },
      });
    } else {
      offer = await prisma.peerOffer.create({
        data: {
          helpRequestId: input.helpRequestId,
          helperId,
          initiator,
          message: input.message ?? null,
        },
      });
    }

    await auditLog({
      actorId: user.id,
      action: `peer.offer.${initiator}`,
      entityType: "PeerOffer",
      entityId: offer.id,
      details: { helpRequestId: input.helpRequestId, helperId },
      ip,
    });

    return jsonOk({ offerId: offer.id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}