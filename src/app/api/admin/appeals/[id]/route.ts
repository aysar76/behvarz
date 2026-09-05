import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { z } from "zod";
import { recordModerationDecision } from "@/lib/moderation";
import { notifyUser } from "@/lib/notifications";

const appealDecisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(300).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const moderator = await requireUser();
    assertPermission(moderator, "moderation:appeals");
    const { id } = await params;

    const appeal = await prisma.appeal.findUnique({ where: { id } });
    if (!appeal) {
      throw new AppError("NOT_FOUND", "اعتراض یافت نشد");
    }
    if (appeal.status !== "pending") {
      throw new AppError("CONFLICT", "این اعتراض قبلاً بررسی شده است");
    }

    const input = validateInput(
      appealDecisionSchema,
      await readJsonBody<z.infer<typeof appealDecisionSchema>>(request),
    );

    const approved = input.action === "approve";

    await prisma.$transaction(async (tx) => {
      await tx.appeal.update({
        where: { id },
        data: {
          status: approved ? "approved" : "rejected",
          decisionNote: input.note ?? null,
          decidedBy: moderator.id,
          decidedAt: new Date(),
        },
      });

      if (approved) {
        if (appeal.targetType === "problem") {
          await tx.problem.updateMany({
            where: { id: appeal.targetId },
            data: { moderation: "visible", needsReview: false },
          });
        } else if (appeal.targetType === "answer") {
          await tx.problemAnswer.updateMany({
            where: { id: appeal.targetId },
            data: { moderation: "visible", needsReview: false },
          });
        } else if (appeal.targetType === "experience") {
          await tx.experience.updateMany({
            where: { id: appeal.targetId },
            data: { moderation: "visible", needsReview: false },
          });
        } else if (appeal.targetType === "account") {
          await tx.user.updateMany({
            where: { id: appeal.targetId },
            data: {
              accountStatus: "active",
              accountStatusReason: null,
              accountStatusAt: null,
            },
          });
        }
      }
    });

    if (approved) {
      await recordModerationDecision({
        moderatorId: moderator.id,
        targetType:
          appeal.targetType === "account"
            ? "user"
            : (appeal.targetType as "problem" | "answer" | "experience"),
        targetId: appeal.targetId,
        action: appeal.targetType === "account" ? "lift" : "restore_content",
        reason: `پذیرش اعتراض ${appeal.id}`,
        note: input.note,
        ip,
      });
    }

    await notifyUser({
      userId: appeal.userId,
      type: "appeal_decision",
      actorId: moderator.id,
      title: approved ? "اعتراض شما پذیرفته شد" : "اعتراض شما رد شد",
      body: input.note ?? null,
      targetType: "appeal",
      targetId: appeal.id,
    });

    return jsonOk({ status: approved ? "approved" : "rejected" });
  } catch (error) {
    return jsonError(error);
  }
}