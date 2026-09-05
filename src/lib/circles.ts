import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { CircleRow } from "@/lib/serializers/circle";

const USER_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
} as const;

export const CIRCLE_USER_SELECT = USER_SELECT;

export const CIRCLE_LIST_INCLUDE = {
  facilitator: { select: USER_SELECT },
  _count: { select: { memberships: true } },
} as const;

export const CIRCLE_DETAIL_INCLUDE = {
  facilitator: { select: USER_SELECT },
  memberships: {
    include: { user: { select: USER_SELECT } },
    orderBy: { joinedAt: "asc" as const },
  },
  joinRequests: {
    include: { user: { select: USER_SELECT } },
    orderBy: { createdAt: "asc" as const },
  },
  invites: {
    include: { user: { select: USER_SELECT } },
    orderBy: { createdAt: "asc" as const },
  },
  meetings: {
    include: { createdBy: { select: { id: true, displayName: true } } },
    orderBy: { createdAt: "desc" as const },
  },
  _count: { select: { memberships: true } },
} as const;

export async function getCircleRow(id: string): Promise<CircleRow | null> {
  return (await prisma.circle.findUnique({
    where: { id },
    include: CIRCLE_DETAIL_INCLUDE,
  })) as unknown as CircleRow | null;
}

export async function requireActiveCircle(id: string): Promise<CircleRow> {
  const circle = await getCircleRow(id);
  if (!circle || circle.status === "archived") {
    throw new AppError("NOT_FOUND", "حلقه یافت نشد");
  }
  return circle;
}

export async function getActiveMembership(
  circleId: string,
  userId: string,
): Promise<{ id: string; role: string; status: string } | null> {
  return prisma.circleMembership.findUnique({
    where: { circleId_userId: { circleId, userId } },
    select: { id: true, role: true, status: true },
  });
}

export async function assertCircleMember(
  circleId: string,
  userId: string,
): Promise<void> {
  const membership = await getActiveMembership(circleId, userId);
  if (!membership || membership.status !== "active") {
    throw new AppError("FORBIDDEN", "برای این عملیات باید عضو حلقه باشید");
  }
}

export async function assertCircleFacilitator(
  circleId: string,
  userId: string,
): Promise<void> {
  const membership = await getActiveMembership(circleId, userId);
  if (
    !membership ||
    membership.status !== "active" ||
    membership.role !== "facilitator"
  ) {
    throw new AppError(
      "FORBIDDEN",
      "فقط راهبر حلقه می‌تواند این عملیات را انجام دهد",
    );
  }
}

export async function countActiveMembers(circleId: string): Promise<number> {
  return prisma.circleMembership.count({
    where: { circleId, status: "active" },
  });
}