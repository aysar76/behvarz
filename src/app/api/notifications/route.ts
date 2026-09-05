import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { getInteractionState } from "@/lib/interactions";
import { serializeProblem, type ProblemRow } from "@/lib/serializers/problem";
import {
  serializeExperience,
  type ExperienceRow,
} from "@/lib/serializers/experience";
import {
  serializeNotification,
  type NotificationRow,
} from "@/lib/serializers/notification";

const ACTOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread") === "1";
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));

    const [notifications, unreadCount, state] = await Promise.all([
      prisma.notification.findMany({
        where: unreadOnly ? { userId: user.id, read: false } : { userId: user.id },
        include: { actor: { select: ACTOR_SELECT } },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
      getInteractionState(user.id),
    ]);

    const notificationRows = notifications as unknown as NotificationRow[];

    const problemTargets = notificationRows
      .filter((n) => n.targetType === "problem" && n.targetId)
      .map((n) => n.targetId as string);
    const experienceTargets = notificationRows
      .filter((n) => n.targetType === "experience" && n.targetId)
      .map((n) => n.targetId as string);

    const [problems, experiences] = await Promise.all([
      problemTargets.length > 0
        ? prisma.problem.findMany({
            where: { id: { in: problemTargets } },
            include: {
              author: { select: ACTOR_SELECT },
              tags: { include: { tag: { select: { id: true, name: true } } } },
              _count: { select: { answers: true } },
            },
          })
        : Promise.resolve([]),
      experienceTargets.length > 0
        ? prisma.experience.findMany({
            where: { id: { in: experienceTargets } },
            include: {
              author: { select: ACTOR_SELECT },
              tags: { include: { tag: { select: { id: true, name: true } } } },
              _count: { select: { references: true, reuses: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const problemById = new Map(
      (problems as unknown as ProblemRow[]).map((row) => [
        row.id,
        serializeProblem(row, {
          currentUserId: user.id,
          savedSet: state.savedSet,
          followedSet: state.followedProblems,
          followedTags: state.followedTags,
        }),
      ]),
    );
    const experienceBySlug = new Map(
      (experiences as unknown as ExperienceRow[]).map((row) => [
        row.slug,
        serializeExperience(row, {
          currentUserId: user.id,
          savedSet: state.savedSet,
          followedSet: state.followedExperiences,
          followedTags: state.followedTags,
        }),
      ]),
    );

    const serialized = notificationRows.map((row) => {
      const item = serializeNotification(row);
      let problem = null;
      let experience = null;
      if (item.targetType === "problem" && item.targetId) {
        problem = problemById.get(item.targetId) ?? null;
      }
      if (item.targetType === "experience" && item.targetId) {
        experience = experienceBySlug.get(item.targetId) ?? null;
      }
      return { ...item, problem, experience };
    });

    return jsonOk({ notifications: serialized, unreadCount });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
    };

    if (body.id) {
      const notification = await prisma.notification.findUnique({
        where: { id: body.id },
      });
      if (!notification || notification.userId !== user.id) {
        throw new AppError("NOT_FOUND", "اعلان یافت نشد");
      }
      await prisma.notification.update({
        where: { id: body.id },
        data: { read: true, readAt: new Date() },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true, readAt: new Date() },
      });
    }

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}