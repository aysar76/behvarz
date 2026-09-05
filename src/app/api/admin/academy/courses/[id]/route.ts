import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { courseUpdateSchema } from "@/lib/validations/academy";
import { syncCourseTags } from "@/lib/academy-admin";
import type { z } from "zod";

type UpdateCourseInput = z.infer<typeof courseUpdateSchema>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "academy:manage");
    const { id } = await params;

    const current = await prisma.course.findUnique({ where: { id } });
    if (!current) {
      throw new AppError("NOT_FOUND", "دوره یافت نشد");
    }

    const input = validateInput(
      courseUpdateSchema,
      await readJsonBody<UpdateCourseInput>(request),
    );

    if (input.slug && input.slug !== current.slug) {
      const existing = await prisma.course.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });
      if (existing) {
        throw new AppError("CONFLICT", "این شناسه دوره از قبل استفاده شده است");
      }
    }

    const data: Record<string, unknown> = {};
    const wasPublished = current.status === "published";
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.level !== undefined) data.level = input.level;
    if (input.emoji !== undefined) data.emoji = input.emoji || null;
    if (input.relatedProblemId !== undefined)
      data.relatedProblemId = input.relatedProblemId || null;
    if (input.relatedExperienceId !== undefined)
      data.relatedExperienceId = input.relatedExperienceId || null;
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "published" && !wasPublished) {
        data.publishedAt = new Date();
      }
      if (input.status !== "published") {
        data.publishedAt = null;
      }
    }

    data.version = { increment: 1 };
    data.reviewedAt = new Date();

    await prisma.course.update({ where: { id }, data });

    if (input.tags !== undefined) {
      await syncCourseTags(id, input.tags);
    }

    await auditLog({
      actorId: user.id,
      action: "academy.courseUpdate",
      entityType: "Course",
      entityId: id,
      ip,
    });

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(_request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "academy:manage");
    const { id } = await params;

    const current = await prisma.course.findUnique({ where: { id } });
    if (!current) {
      throw new AppError("NOT_FOUND", "دوره یافت نشد");
    }
    if (current.status === "published") {
      throw new AppError(
        "CONFLICT",
        "دوره منتشرشده را نمی‌توان حذف کرد؛ ابتدا آن را بایگانی کنید",
      );
    }

    await prisma.course.delete({ where: { id } });

    await auditLog({
      actorId: user.id,
      action: "academy.courseDelete",
      entityType: "Course",
      entityId: id,
      ip,
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
