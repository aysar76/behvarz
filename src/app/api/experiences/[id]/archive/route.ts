import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { getExperienceRow } from "@/lib/experiences";
import {
  serializeExperience,
  type ExperienceRow,
} from "@/lib/serializers/experience";

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

const REUSE_INCLUDE = {
  user: { select: { id: true, displayName: true } },
} as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "experiences:archive");
    const { id } = await params;

    const experience = await getExperienceRow(id);
    if (!experience) {
      throw new AppError("NOT_FOUND", "تجربه یافت نشد");
    }
    if (experience.authorId !== user.id) {
      throw new AppError(
        "FORBIDDEN",
        "فقط نویسنده می‌تواند تجربه را بایگانی کند",
      );
    }
    if (experience.status === "archived") {
      throw new AppError("CONFLICT", "این تجربه قبلاً بایگانی شده است");
    }
    if (experience.isDraft) {
      throw new AppError(
        "CONFLICT",
        "پیش‌نویس را می‌توانید از صفحه ویرایش حذف یا منتشر کنید",
      );
    }

    await prisma.experience.update({
      where: { id },
      data: { status: "archived" },
    });

    await auditLog({
      actorId: user.id,
      action: "experience.archive",
      entityType: "Experience",
      entityId: id,
      ip,
    });

    const updated = await prisma.experience.findUnique({
      where: { id },
      include: {
        author: { select: AUTHOR_SELECT },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        sourceProblem: { select: { id: true, title: true } },
        reuses: { include: REUSE_INCLUDE, orderBy: { createdAt: "desc" } },
        _count: { select: { references: true, reuses: true } },
      },
    });

    return jsonOk({
      experience: serializeExperience(updated as unknown as ExperienceRow, {
        currentUserId: user.id,
      }),
    });
  } catch (error) {
    return jsonError(error);
  }
}