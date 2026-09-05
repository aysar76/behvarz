import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { scanSensitiveContent } from "@/lib/content-safety";
import { peerHelpRequestSchema } from "@/lib/validations/peer";
import {
  PEER_HELP_REQUEST_DETAIL_INCLUDE,
  PEER_HELP_REQUEST_LIST_INCLUDE,
} from "@/lib/peer";
import {
  serializePeerHelpRequest,
  type PeerHelpRequestRow,
  type SerializedPeerHelpRequest,
} from "@/lib/serializers/peer";
import type { z } from "zod";

type PeerHelpRequestInput = z.infer<typeof peerHelpRequestSchema>;

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const mineWhere: Record<string, unknown> = { requesterId: user.id };
    if (status && status !== "all") {
      mineWhere.status = status;
    }

    const [mine, open] = await Promise.all([
      prisma.peerHelpRequest.findMany({
        where: mineWhere,
        include: PEER_HELP_REQUEST_LIST_INCLUDE,
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.peerHelpRequest.findMany({
        where: { status: "open", requesterId: { not: user.id } },
        include: PEER_HELP_REQUEST_LIST_INCLUDE,
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    const serialize = (rows: PeerHelpRequestRow[]): SerializedPeerHelpRequest[] =>
      rows.map((row) =>
        serializePeerHelpRequest(row, { currentUserId: user.id }),
      );

    return jsonOk({
      mine: serialize(mine as unknown as PeerHelpRequestRow[]),
      open: serialize(open as unknown as PeerHelpRequestRow[]),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "peer:request");

    if (isRateLimited(`peer:help-requests:${user.id}`, 10, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد درخواست همیار در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const input = validateInput(
      peerHelpRequestSchema,
      await readJsonBody<PeerHelpRequestInput>(request),
    );

    const sensitive = scanSensitiveContent(input.title, input.description);
    if (sensitive.length > 0) {
      if (input.sensitiveAcknowledged !== true) {
        throw new AppError(
          "VALIDATION",
          "محتوا شامل اطلاعات قابل شناسایی (بیمار یا شخص) است. لطفاً آن را ناشناس‌سازی کنید یا تأیید کنید.",
          { details: { sensitiveMatches: sensitive } },
        );
      }
    }

    const requestRow = await prisma.peerHelpRequest.create({
      data: {
        requesterId: user.id,
        title: input.title,
        description: input.description,
        barrierType: input.barrierType,
        tags:
          input.tags && input.tags.length > 0 ? input.tags : undefined,
        province: input.province ?? null,
      },
      include: PEER_HELP_REQUEST_DETAIL_INCLUDE,
    });

    await auditLog({
      actorId: user.id,
      action: "peer.help-request.create",
      entityType: "PeerHelpRequest",
      entityId: requestRow.id,
      details: { barrierType: input.barrierType },
      ip,
    });

    return jsonOk(
      {
        helpRequest: serializePeerHelpRequest(
          requestRow as unknown as PeerHelpRequestRow,
          { currentUserId: user.id },
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}