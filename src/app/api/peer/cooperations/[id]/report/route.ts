import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { peerCooperationReportSchema } from "@/lib/validations/peer";
import { requireCooperationParticipant } from "@/lib/peer";
import type { z } from "zod";

type PeerCooperationReportInput = z.infer<typeof peerCooperationReportSchema>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "peer:cooperate");
    const { id } = await params;

    if (isRateLimited(`peer:reports:${user.id}`, 5, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد گزارش‌های شما در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const input = validateInput(
      peerCooperationReportSchema,
      await readJsonBody<PeerCooperationReportInput>(request),
    );

    await requireCooperationParticipant(id, user.id);

    const existing = await prisma.peerCooperationReport.findFirst({
      where: { cooperationId: id, reporterId: user.id, status: "pending" },
    });
    if (existing) {
      throw new AppError("CONFLICT", "شما قبلاً این همکاری را گزارش کرده‌اید");
    }

    const report = await prisma.peerCooperationReport.create({
      data: {
        cooperationId: id,
        reporterId: user.id,
        reason: input.reason,
        note: input.note ?? null,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "peer.cooperation.report",
      entityType: "PeerCooperation",
      entityId: id,
      details: { reportId: report.id, reason: input.reason },
      ip,
    });

    return jsonOk({ id: report.id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}