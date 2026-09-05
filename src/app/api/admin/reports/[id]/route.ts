import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { z } from "zod";
import { recordModerationDecision } from "@/lib/moderation";

const reviewReportSchema = z.object({
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

    const report = await prisma.contentReport.findUnique({ where: { id } });
    if (!report) {
      throw new AppError("NOT_FOUND", "گزارش یافت نشد");
    }
    if (report.status !== "pending" && report.status !== "reviewing") {
      throw new AppError("CONFLICT", "این گزارش قبلاً بررسی شده است");
    }

    const input = validateInput(
      reviewReportSchema,
      await readJsonBody<{ action: "resolve" | "reject"; note?: string }>(
        request,
      ),
    );

    const updated = await prisma.$transaction(async (tx) => {
      const updatedReport = await tx.contentReport.update({
        where: { id },
        data: {
          status: input.action === "resolve" ? "resolved" : "rejected",
          reviewedBy: user.id,
          reviewedAt: new Date(),
          moderatorNote: input.note ?? null,
        },
      });

      if (input.action === "resolve" && report.answerId) {
        await tx.problemAnswer.updateMany({
          where: { id: report.answerId },
          data: { moderation: "hidden", needsReview: false },
        });
      } else if (input.action === "resolve" && report.problemId) {
        await tx.problem.updateMany({
          where: { id: report.problemId },
          data: { moderation: "hidden", needsReview: false },
        });
      } else if (input.action === "resolve" && report.experienceId) {
        await tx.experience.updateMany({
          where: { id: report.experienceId },
          data: { moderation: "hidden", needsReview: false },
        });
      }

      return updatedReport;
    });

    if (input.action === "resolve") {
      await recordModerationDecision({
        moderatorId: user.id,
        targetType:
          report.answerId
            ? "answer"
            : report.problemId
              ? "problem"
              : "experience",
        targetId:
          report.answerId ?? report.problemId ?? report.experienceId ?? "",
        action: "hide_content",
        reason: `تأیید گزارش ${id}`,
        note: input.note,
        ip,
      });
    }

    return jsonOk({ status: updated.status });
  } catch (error) {
    return jsonError(error);
  }
}
