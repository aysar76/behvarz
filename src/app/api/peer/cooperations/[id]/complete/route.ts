import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { scanSensitiveContent } from "@/lib/content-safety";
import { peerCooperationCompleteSchema } from "@/lib/validations/peer";
import { requireCooperationParticipant } from "@/lib/peer";
import type { z } from "zod";

type PeerCooperationCompleteInput = z.infer<
  typeof peerCooperationCompleteSchema
>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "peer:cooperate");
    const { id } = await params;

    const input = validateInput(
      peerCooperationCompleteSchema,
      await readJsonBody<PeerCooperationCompleteInput>(request),
    );

    const cooperation = await requireCooperationParticipant(id, user.id);
    if (cooperation.status !== "active") {
      throw new AppError("CONFLICT", "این همکاری قبلاً پایان یافته است");
    }

    if (scanSensitiveContent(input.outcomeSummary).length > 0) {
      throw new AppError(
        "VALIDATION",
        "خلاصه نتیجه شامل اطلاعات قابل شناسایی (بیمار یا شخص) است. لطفاً آن را ناشناس‌سازی کنید.",
      );
    }

    const isRequester = cooperation.requesterId === user.id;

    const data: Record<string, unknown> = { outcomeSummary: input.outcomeSummary };
    if (isRequester) {
      if (input.requesterRating !== undefined) {
        data.requesterRating = input.requesterRating;
      }
    } else {
      if (input.helperRating !== undefined) {
        data.helperRating = input.helperRating;
      }
    }

    const otherPartyRatingProvided = isRequester
      ? cooperation.helperRating !== null
      : cooperation.requesterRating !== null;

    const bothRated =
      (data.requesterRating !== undefined || cooperation.requesterRating !== null) &&
      (data.helperRating !== undefined || cooperation.helperRating !== null);

    if (otherPartyRatingProvided || bothRated) {
      data.status = "completed";
      data.completedAt = new Date();
    }

    const updated = await prisma.peerCooperation.update({
      where: { id },
      data,
    });

    if (cooperation.helpRequestId) {
      await prisma.peerHelpRequest.updateMany({
        where: { id: cooperation.helpRequestId, status: "matched" },
        data: { status: "completed" },
      });
    }

    await auditLog({
      actorId: user.id,
      action: "peer.cooperation.complete",
      entityType: "PeerCooperation",
      entityId: id,
      ip,
    });

    return jsonOk({ status: updated.status, completedAt: updated.completedAt?.toISOString() ?? null });
  } catch (error) {
    return jsonError(error);
  }
}