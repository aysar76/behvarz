import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { circleMeetingUpdateSchema } from "@/lib/validations/circle";
import { assertCircleMember } from "@/lib/circles";
import type { z } from "zod";

type CircleMeetingUpdateInput = z.infer<typeof circleMeetingUpdateSchema>;

function parseScheduledAt(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; meetingId: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "circles:meeting");
    const { id, meetingId } = await params;

    const input = validateInput(
      circleMeetingUpdateSchema,
      await readJsonBody<CircleMeetingUpdateInput>(request),
    );

    await assertCircleMember(id, user.id);

    const meeting = await prisma.circleMeeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting || meeting.circleId !== id) {
      throw new AppError("NOT_FOUND", "جلسه یافت نشد");
    }

    const membership = await prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId: id, userId: user.id } },
      select: { role: true, status: true },
    });
    const isFacilitator =
      membership?.status === "active" && membership.role === "facilitator";
    if (!isFacilitator && meeting.createdById !== user.id) {
      throw new AppError(
        "FORBIDDEN",
        "فقط راهبر حلقه یا ثبت‌کننده جلسه می‌تواند آن را ویرایش کند",
      );
    }

    const updated = await prisma.circleMeeting.update({
      where: { id: meetingId },
      data: {
        title: input.title ?? meeting.title,
        agenda: input.agenda === undefined ? meeting.agenda : input.agenda,
        scheduledAt:
          input.scheduledAt === undefined
            ? meeting.scheduledAt
            : parseScheduledAt(input.scheduledAt),
        summary: input.summary === undefined ? meeting.summary : input.summary,
      },
    });

    await auditLog({
      actorId: user.id,
      action: "circle.meeting.update",
      entityType: "Circle",
      entityId: id,
      details: { meetingId },
      ip,
    });

    return jsonOk({
      meeting: {
        id: updated.id,
        title: updated.title,
        agenda: updated.agenda,
        scheduledAt: updated.scheduledAt?.toISOString() ?? null,
        summary: updated.summary,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}