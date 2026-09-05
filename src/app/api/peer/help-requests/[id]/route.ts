import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { peerHelpRequestStatusSchema } from "@/lib/validations/peer";
import { getPeerHelpRequestRow } from "@/lib/peer";
import {
  serializePeerHelpRequest,
  type PeerHelpRequestRow,
} from "@/lib/serializers/peer";
import type { z } from "zod";

type PeerHelpRequestStatusInput = z.infer<
  typeof peerHelpRequestStatusSchema
>;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const row = await getPeerHelpRequestRow(id);
    if (!row) {
      throw new AppError("NOT_FOUND", "درخواست همیار یافت نشد");
    }

    const isRequester = row.requesterId === user.id;
    if (!isRequester && row.status !== "open") {
      throw new AppError("FORBIDDEN", "این درخواست برای شما قابل مشاهده نیست");
    }

    const serialized = serializePeerHelpRequest(row as PeerHelpRequestRow, {
      currentUserId: user.id,
    });

    if (!isRequester) {
      serialized.offers = serialized.offers.filter(
        (offer) => offer.helperId === user.id,
      );
    }

    return jsonOk({ helpRequest: serialized });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "peer:request");
    const { id } = await params;

    const input = validateInput(
      peerHelpRequestStatusSchema,
      await readJsonBody<PeerHelpRequestStatusInput>(request),
    );

    const row = await getPeerHelpRequestRow(id);
    if (!row) {
      throw new AppError("NOT_FOUND", "درخواست همیار یافت نشد");
    }
    if (row.requesterId !== user.id) {
      throw new AppError("FORBIDDEN", "فقط ثبت‌کننده درخواست می‌تواند آن را تغییر دهد");
    }

    if (input.action === "cancel") {
      if (row.status !== "open") {
        throw new AppError("CONFLICT", "این درخواست قابل لغو نیست");
      }
      await prisma.peerHelpRequest.update({
        where: { id },
        data: { status: "canceled" },
      });
    } else {
      throw new AppError("VALIDATION", "عملیات نامعتبر است");
    }

    await auditLog({
      actorId: user.id,
      action: "peer.help-request.cancel",
      entityType: "PeerHelpRequest",
      entityId: id,
      ip,
    });

    return jsonOk({ canceled: true });
  } catch (error) {
    return jsonError(error);
  }
}