import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { auditLog } from "@/lib/audit";
import { scanSensitiveContent } from "@/lib/content-safety";
import { circleCreateSchema } from "@/lib/validations/circle";
import { CIRCLE_MAX_CAPACITY, CIRCLE_MIN_CAPACITY } from "@/lib/constants/circle";
import { CIRCLE_LIST_INCLUDE, getCircleRow } from "@/lib/circles";
import {
  serializeCircle,
  type CircleRow,
  type SerializedCircle,
} from "@/lib/serializers/circle";
import type { z } from "zod";

type CircleCreateInput = z.infer<typeof circleCreateSchema>;

function circleSensitiveTexts(input: {
  name?: string;
  description?: string;
  topic?: string;
}): string[] {
  return [input.name, input.description, input.topic].filter(
    (value): value is string => Boolean(value),
  );
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const url = new URL(request.url);
    const mine = url.searchParams.get("mine") === "1";
    const q = url.searchParams.get("q")?.trim() ?? "";

    const where: Record<string, unknown> =
      mine && user
        ? {
            status: "active",
            memberships: { some: { userId: user.id, status: "active" } },
          }
        : { status: "active" };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { topic: { contains: q } },
      ];
    }

    const rows = await prisma.circle.findMany({
      where,
      include: CIRCLE_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const circles: SerializedCircle[] = (rows as unknown as CircleRow[]).map(
      (row) => serializeCircle(row, { currentUserId: user.id }),
    );

    return jsonOk({ circles });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "circles:create");

    if (isRateLimited(`circles:create:${user.id}`, 5, 60 * 60 * 1000)) {
      throw new AppError(
        "RATE_LIMITED",
        "تعداد ایجاد حلقه در یک ساعت محدود است؛ کمی بعد تلاش کنید",
      );
    }

    const input = validateInput(
      circleCreateSchema,
      await readJsonBody<CircleCreateInput>(request),
    );

    const capacity = input.capacity ?? 12;
    if (capacity < CIRCLE_MIN_CAPACITY || capacity > CIRCLE_MAX_CAPACITY) {
      throw new AppError("VALIDATION", "ظرفیت حلقه باید بین ۵ تا ۱۲ نفر باشد");
    }

    const sensitive = scanSensitiveContent(...circleSensitiveTexts(input));
    if (sensitive.length > 0) {
      throw new AppError(
        "VALIDATION",
        "محتوای حلقه شامل اطلاعات قابل شناسایی (بیمار یا شخص) است. لطفاً آن را ناشناس‌سازی کنید.",
        { details: { sensitiveMatches: sensitive } },
      );
    }

    const circle = await prisma.$transaction(async (tx) => {
      const created = await tx.circle.create({
        data: {
          name: input.name,
          description: input.description,
          topic: input.topic ?? null,
          province: input.province ?? null,
          capacity,
          facilitatorId: user.id,
        },
        include: CIRCLE_LIST_INCLUDE,
      });
      await tx.circleMembership.create({
        data: {
          circleId: created.id,
          userId: user.id,
          role: "facilitator",
        },
      });
      return created;
    });

    await auditLog({
      actorId: user.id,
      action: "circle.create",
      entityType: "Circle",
      entityId: circle.id,
      details: { name: circle.name },
      ip,
    });

    const full = await getCircleRow(circle.id);
    return jsonOk(
      { circle: serializeCircle(full as CircleRow, { currentUserId: user.id }) },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}