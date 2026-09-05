import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { z } from "zod";
import {
  assertAppealOwnership,
  assertNoPendingAppeal,
  serializeDecision,
  type DecisionRow,
  type SerializedDecision,
} from "@/lib/moderation";

const appealCreateSchema = z.object({
  targetType: z.enum(["problem", "answer", "experience", "account"]),
  targetId: z.string().trim().min(1).max(64).optional(),
  reason: z
    .string()
    .trim()
    .min(10, "توضیح اعتراض باید حداقل ۱۰ کاراکتر باشد")
    .max(800, "توضیح اعتراض حداکثر ۸۰۰ کاراکتر"),
});

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();

    if (isRateLimited(`appeals:create:${user.id}`, 3, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد اعتراض‌های شما در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const input = validateInput(
      appealCreateSchema,
      await readJsonBody<z.infer<typeof appealCreateSchema>>(request),
    );

    const normalizedTargetId =
      input.targetType === "account"
        ? user.id
        : (input.targetId as string);

    await assertAppealOwnership({
      userId: user.id,
      targetType: input.targetType,
      targetId: normalizedTargetId,
    });
    await assertNoPendingAppeal({
      userId: user.id,
      targetType: input.targetType,
      targetId: normalizedTargetId,
    });

    const appeal = await prisma.appeal.create({
      data: {
        userId: user.id,
        targetType: input.targetType,
        targetId: normalizedTargetId,
        reason: input.reason,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "appeal.create",
      entityType: "Appeal",
      entityId: appeal.id,
      details: {
        targetType: input.targetType,
        targetId: normalizedTargetId,
      },
      ip,
    });

    return jsonOk({ id: appeal.id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export interface AppealRow {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  decisionNote: string | null;
  decidedAt: Date | null;
  createdAt: Date;
}

export interface SerializedAppeal {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  decisionNote: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export function serializeAppeal(appeal: AppealRow): SerializedAppeal {
  return {
    id: appeal.id,
    targetType: appeal.targetType,
    targetId: appeal.targetId,
    reason: appeal.reason,
    status: appeal.status,
    decisionNote: appeal.decisionNote,
    createdAt: appeal.createdAt.toISOString(),
    decidedAt: appeal.decidedAt?.toISOString() ?? null,
  };
}

export async function GET() {
  try {
    const user = await requireUser();

    const [appeals, decisions] = await Promise.all([
      prisma.appeal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.moderationDecision.findMany({
        where: { targetType: "user", targetId: user.id },
        include: {
          moderator: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const serializedDecisions: SerializedDecision[] = (
      decisions as unknown as DecisionRow[]
    ).map(serializeDecision);

    return jsonOk({
      appeals: (appeals as unknown as AppealRow[]).map(serializeAppeal),
      decisions: serializedDecisions,
    });
  } catch (error) {
    return jsonError(error);
  }
}