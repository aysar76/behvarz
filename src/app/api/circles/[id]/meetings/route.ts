import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { circleMeetingCreateSchema } from "@/lib/validations/circle";
import { assertCircleMember } from "@/lib/circles";
import type { z } from "zod";

type CircleMeetingCreateInput = z.infer<typeof circleMeetingCreateSchema>;

function parseScheduledAt(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "circles:meeting");
    const { id } = await params;

    if (isRateLimited(`circles:meetings:${user.id}`, 20, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد ثبت جلسه در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const input = validateInput(
      circleMeetingCreateSchema,
      await readJsonBody<CircleMeetingCreateInput>(request),
    );

    await assertCircleMember(id, user.id);

    const meeting = await prisma.circleMeeting.create({
      data: {
        circleId: id,
        title: input.title,
        agenda: input.agenda ?? null,
        scheduledAt: parseScheduledAt(input.scheduledAt),
        summary: input.summary ?? null,
        createdById: user.id,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "circle.meeting.create",
      entityType: "Circle",
      entityId: id,
      details: { meetingId: meeting.id },
      ip,
    });

    return jsonOk(
      {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          agenda: meeting.agenda,
          scheduledAt: meeting.scheduledAt?.toISOString() ?? null,
          summary: meeting.summary,
          createdByLabel: user.displayName ?? "بی‌نام",
          createdAt: meeting.createdAt.toISOString(),
          isMine: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}