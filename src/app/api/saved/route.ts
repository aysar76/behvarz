import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import {
  serializeProblem,
  type ProblemRow,
} from "@/lib/serializers/problem";
import {
  serializeExperience,
  type ExperienceRow,
} from "@/lib/serializers/experience";
import { getInteractionState } from "@/lib/interactions";

const AUTHOR_SELECT = {
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
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("pageSize")) || 20),
    );

    const state = await getInteractionState(user.id);

    const [savedItems, total] = await Promise.all([
      prisma.savedItem.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.savedItem.count({ where: { userId: user.id } }),
    ]);

    const problemIds = savedItems
      .filter((item) => item.targetType === "problem")
      .map((item) => item.targetId);
    const experienceIds = savedItems
      .filter((item) => item.targetType === "experience")
      .map((item) => item.targetId);

    const [problems, experiences] = await Promise.all([
      problemIds.length > 0
        ? prisma.problem.findMany({
            where: { id: { in: problemIds } },
            include: {
              author: { select: AUTHOR_SELECT },
              tags: { include: { tag: { select: { id: true, name: true } } } },
              _count: { select: { answers: true } },
            },
          })
        : Promise.resolve([]),
      experienceIds.length > 0
        ? prisma.experience.findMany({
            where: { id: { in: experienceIds } },
            include: {
              author: { select: AUTHOR_SELECT },
              tags: { include: { tag: { select: { id: true, name: true } } } },
              _count: { select: { references: true, reuses: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const problemMap = new Map(
      problems.map((problem) => [
        problem.id,
        serializeProblem(problem as unknown as ProblemRow, {
          currentUserId: user.id,
          savedSet: state.savedSet,
          followedSet: state.followedProblems,
          followedTags: state.followedTags,
        }),
      ]),
    );
    const experienceMap = new Map(
      experiences.map((experience) => [
        experience.id,
        serializeExperience(experience as unknown as ExperienceRow, {
          currentUserId: user.id,
          savedSet: state.savedSet,
          followedSet: state.followedExperiences,
          followedTags: state.followedTags,
        }),
      ]),
    );

    const items = savedItems.map((item) =>
      item.targetType === "problem"
        ? {
            id: item.id,
            targetType: item.targetType,
            savedAt: item.createdAt.toISOString(),
            problem: problemMap.get(item.targetId) ?? null,
            experience: null,
          }
        : {
            id: item.id,
            targetType: item.targetType,
            savedAt: item.createdAt.toISOString(),
            problem: null,
            experience: experienceMap.get(item.targetId) ?? null,
          },
    );

    return jsonOk({
      items,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    return jsonError(error);
  }
}