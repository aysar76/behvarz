import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { peerCooperationGoalSchema } from "@/lib/validations/peer";
import { requireCooperationParticipant } from "@/lib/peer";
import {
  serializePeerCooperation,
  serializePeerMessage,
  type PeerMessageRow,
} from "@/lib/serializers/peer";
import type { z } from "zod";

type PeerCooperationGoalInput = z.infer<typeof peerCooperationGoalSchema>;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const cooperation = await requireCooperationParticipant(id, user.id);

    return jsonOk({
      cooperation: serializePeerCooperation(cooperation as unknown as Parameters<
        typeof serializePeerCooperation
      >[0]),
      messages: (cooperation.messages as unknown as PeerMessageRow[]).map(
        (message) => serializePeerMessage(message, user.id),
      ),
    });
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
    assertPermission(user, "peer:cooperate");
    const { id } = await params;

    const input = validateInput(
      peerCooperationGoalSchema,
      await readJsonBody<PeerCooperationGoalInput>(request),
    );

    const cooperation = await requireCooperationParticipant(id, user.id);
    if (cooperation.status !== "active") {
      throw new AppError("CONFLICT", "این همکاری دیگر در جریان نیست");
    }

    await prisma.peerCooperation.update({
      where: { id },
      data: { goal: input.goal },
    });

    await auditLog({
      actorId: user.id,
      action: "peer.cooperation.goal",
      entityType: "PeerCooperation",
      entityId: id,
      ip,
    });

    return jsonOk({ goal: input.goal });
  } catch (error) {
    return jsonError(error);
  }
}