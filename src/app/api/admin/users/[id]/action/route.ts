import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { z } from "zod";
import { recordModerationDecision } from "@/lib/moderation";

const userActionSchema = z.object({
  action: z.enum(["warn", "restrict", "suspend", "lift"]),
  reason: z.string().trim().min(3, "دلیل باید حداقل ۳ کاراکتر باشد").max(500),
});

const ACTION_STATUS = {
  warn: "warned",
  restrict: "restricted",
  suspend: "suspended",
  lift: "active",
} as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const moderator = await requireUser();
    assertPermission(moderator, "moderation:users");
    const { id } = await params;

    const input = validateInput(
      userActionSchema,
      await readJsonBody<z.infer<typeof userActionSchema>>(request),
    );

    if (id === moderator.id) {
      throw new AppError("VALIDATION", "نمی‌توانید روی حساب خودتان اقدام کنید");
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new AppError("NOT_FOUND", "کاربر یافت نشد");
    }

    if (target.role === "super_admin") {
      throw new AppError(
        "FORBIDDEN",
        "مدیر ارشد قابل محدودسازی توسط دیگران نیست",
      );
    }

    await prisma.user.update({
      where: { id },
      data: {
        accountStatus: ACTION_STATUS[input.action],
        accountStatusReason: input.reason,
        accountStatusAt: new Date(),
      },
    });

    await recordModerationDecision({
      moderatorId: moderator.id,
      targetType: "user",
      targetId: id,
      action: input.action,
      reason: input.reason,
      ip,
    });

    return jsonOk({});
  } catch (error) {
    return jsonError(error);
  }
}