import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { assertAccountCanInteract } from "@/lib/moderation";
import { reportSchema } from "@/lib/validations/problem";
import type { z } from "zod";

type ReportInput = z.infer<typeof reportSchema>;

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "problems:report");
    assertAccountCanInteract(user);

    if (isRateLimited(`reports:create:${user.id}`, 5, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد گزارش‌های شما در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const input = validateInput(
      reportSchema,
      await readJsonBody<ReportInput>(request),
    );

    if (input.targetType === "problem") {
      const problem = await prisma.problem.findUnique({
        where: { id: input.targetId },
      });
      if (!problem || problem.moderation !== "visible") {
        throw new AppError("NOT_FOUND", "مسئله یافت نشد");
      }
    } else if (input.targetType === "experience") {
      const experience = await prisma.experience.findUnique({
        where: { id: input.targetId },
      });
      if (!experience || experience.moderation !== "visible") {
        throw new AppError("NOT_FOUND", "تجربه یافت نشد");
      }
    } else {
      const answer = await prisma.problemAnswer.findUnique({
        where: { id: input.targetId },
      });
      if (!answer || answer.moderation !== "visible") {
        throw new AppError("NOT_FOUND", "پاسخ یافت نشد");
      }
    }

    const duplicate = await prisma.contentReport.findFirst({
      where: {
        reporterId: user.id,
        status: { in: ["pending", "reviewing"] },
        problemId: input.targetType === "problem" ? input.targetId : null,
        answerId: input.targetType === "answer" ? input.targetId : null,
        experienceId:
          input.targetType === "experience" ? input.targetId : null,
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new AppError(
        "CONFLICT",
        "شما قبلاً این محتوا را گزارش کرده‌اید و در انتظار بررسی است",
      );
    }

    const report = await prisma.contentReport.create({
      data: {
        reporterId: user.id,
        problemId: input.targetType === "problem" ? input.targetId : null,
        answerId: input.targetType === "answer" ? input.targetId : null,
        experienceId:
          input.targetType === "experience" ? input.targetId : null,
        reason: input.reason,
        note: input.note ?? null,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "report.create",
      entityType: "ContentReport",
      entityId: report.id,
      details: {
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
      },
      ip,
    });

    return jsonOk({ id: report.id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
