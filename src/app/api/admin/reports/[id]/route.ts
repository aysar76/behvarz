import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

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

    const updated = await prisma.contentReport.update({
      where: { id },
      data: {
        status: input.action === "resolve" ? "resolved" : "rejected",
        reviewedBy: user.id,
        reviewedAt: new Date(),
        moderatorNote: input.note ?? null,
      },
    });

    await auditLog({
      actorId: user.id,
      action: `report.${input.action}`,
      entityType: "ContentReport",
      entityId: id,
      details: { targetId: report.answerId ?? report.problemId },
      ip,
    });

    return jsonOk({ status: updated.status });
  } catch (error) {
    return jsonError(error);
  }
}
