import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { z } from "zod";
import { recordModerationDecision } from "@/lib/moderation";

const reviewPeerReportSchema = z.object({
  action: z.enum(["resolve", "reject"]),
  note: z.string().trim().max(300).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "reports:review");
    const { id } = await params;

    const report = await prisma.peerCooperationReport.findUnique({
      where: { id },
      include: {
        cooperation: { select: { id: true, requesterId: true, helperId: true } },
      },
    });
    if (!report) {
      throw new AppError("NOT_FOUND", "گزارش یافت نشد");
    }
    if (report.status !== "pending") {
      throw new AppError("CONFLICT", "این گزارش قبلاً بررسی شده است");
    }

    const input = validateInput(
      reviewPeerReportSchema,
      await readJsonBody<z.infer<typeof reviewPeerReportSchema>>(request),
    );

    const updated = await prisma.peerCooperationReport.update({
      where: { id },
      data: {
        status: input.action === "resolve" ? "resolved" : "rejected",
        reviewedAt: new Date(),
      },
    });

    await auditLog({
      actorId: user.id,
      action: `peer.report.${input.action}`,
      entityType: "PeerCooperationReport",
      entityId: id,
      details: {
        cooperationId: report.cooperationId,
        note: input.note,
      },
      ip,
    });

    if (input.action === "resolve") {
      const reportedUserId =
        report.reporterId === report.cooperation.requesterId
          ? report.cooperation.helperId
          : report.cooperation.requesterId;
      await recordModerationDecision({
        moderatorId: user.id,
        targetType: "user",
        targetId: reportedUserId,
        action: "warn",
        reason: `گزارش تأییدشده در همکاری ${report.cooperationId}`,
        note: input.note,
        ip,
      });
    }

    return jsonOk({ status: updated.status });
  } catch (error) {
    return jsonError(error);
  }
}