import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import {
  lessonDeleteSchema,
  lessonUpdateSchema,
} from "@/lib/validations/academy";
import type { z } from "zod";

type UpdateLessonInput = z.infer<typeof lessonUpdateSchema>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "academy:manage");
    const { id, lessonId } = await params;

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson || lesson.courseId !== id) {
      throw new AppError("NOT_FOUND", "درس یافت نشد");
    }

    const input = validateInput(
      lessonUpdateSchema,
      await readJsonBody<UpdateLessonInput>(request),
    );

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.summary !== undefined) data.summary = input.summary || null;
    if (input.body !== undefined) data.body = input.body;
    if (input.contentType !== undefined) data.contentType = input.contentType;
    if (input.mediaUrl !== undefined) data.mediaUrl = input.mediaUrl || null;
    if (input.durationMinutes !== undefined)
      data.durationMinutes = input.durationMinutes ?? null;
    if (input.order !== undefined) data.order = input.order;
    if (input.isOptional !== undefined) data.isOptional = input.isOptional;

    await prisma.lesson.update({ where: { id: lessonId }, data });

    await auditLog({
      actorId: user.id,
      action: "academy.lessonUpdate",
      entityType: "Lesson",
      entityId: lessonId,
      details: { courseId: id },
      ip,
    });

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  const ip = getClientIp(_request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "academy:manage");
    const { id, lessonId } = await params;

    const input = validateInput(lessonDeleteSchema, { courseId: id });

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson || lesson.courseId !== input.courseId) {
      throw new AppError("NOT_FOUND", "درس یافت نشد");
    }

    await prisma.lesson.delete({ where: { id: lessonId } });

    await auditLog({
      actorId: user.id,
      action: "academy.lessonDelete",
      entityType: "Lesson",
      entityId: lessonId,
      details: { courseId: id },
      ip,
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
