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
import { peerMessageSchema } from "@/lib/validations/peer";
import { requireCooperationParticipant } from "@/lib/peer";
import { serializePeerMessage } from "@/lib/serializers/peer";
import type { z } from "zod";

type PeerMessageInput = z.infer<typeof peerMessageSchema>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "peer:cooperate");
    const { id } = await params;

    if (isRateLimited(`peer:messages:${user.id}`, 40, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد پیام در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const input = validateInput(
      peerMessageSchema,
      await readJsonBody<PeerMessageInput>(request),
    );

    const cooperation = await requireCooperationParticipant(id, user.id);
    if (cooperation.status !== "active") {
      throw new AppError("CONFLICT", "همکاری پایان یافته است؛ امکان ارسال پیام نیست");
    }

    if (scanSensitiveContent(input.body).length > 0) {
      throw new AppError(
        "VALIDATION",
        "پیام شامل اطلاعات قابل شناسایی (بیمار یا شخص) است. لطفاً آن را ناشناس‌سازی کنید.",
      );
    }

    const message = await prisma.peerMessage.create({
      data: {
        cooperationId: id,
        senderId: user.id,
        body: input.body,
      },
      include: { sender: { select: { id: true, displayName: true } } },
    });

    await auditLog({
      actorId: user.id,
      action: "peer.message.create",
      entityType: "PeerCooperation",
      entityId: id,
      ip,
    });

    return jsonOk(
      {
        message: serializePeerMessage(
          message as unknown as {
            id: string;
            senderId: string;
            body: string;
            createdAt: Date;
            sender: { id: string; displayName: string | null };
          },
          user.id,
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}