import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { getInteractionState } from "@/lib/interactions";
import {
  serializeProblem,
  type ProblemRow,
} from "@/lib/serializers/problem";
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

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "all";
    const limit = Math.min(30, Math.max(1, Number(url.searchParams.get("limit")) || 10));

    const state = await getInteractionState(user.id);

    const followedTags = [...state.followedTags];
    const followedUsers = [...state.followedUsers];

    const commonWhere = {
      isDraft: false,
      publishedAt: { not: null },
      moderation: "visible",
    };

    const relevanceWhere: Record<string, unknown> = { ...commonWhere };
    if (followedTags.length > 0 || followedUsers.length > 0) {
      const relevance = [];
      if (followedTags.length > 0) {
        relevance.push({
          tags: { some: { tag: { name: { in: followedTags } } } },
        });
      }
      if (followedUsers.length > 0) {
        relevance.push({ authorId: { in: followedUsers } });
      }
      relevanceWhere.OR = relevance;
    }

    const fetchProblems = type === "all" || type === "problems";
    const fetchExperiences = type === "all" || type === "experiences";

    const [problems, experiences] = await Promise.all([
      fetchProblems
        ? prisma.problem.findMany({
            where: relevanceWhere,
            include: {
              author: { select: AUTHOR_SELECT },
              tags: { include: { tag: { select: { id: true, name: true } } } },
              _count: { select: { answers: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
          })
        : Promise.resolve([]),
      fetchExperiences
        ? prisma.experience.findMany({
            where: {
              ...relevanceWhere,
              status: { not: "archived" },
            },
            include: {
              author: { select: AUTHOR_SELECT },
              tags: { include: { tag: { select: { id: true, name: true } } } },
              _count: { select: { references: true, reuses: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
          })
        : Promise.resolve([]),
    ]);

    const serializedProblems = (problems as unknown as ProblemRow[]).map(
      (row) =>
        serializeProblem(row, {
          currentUserId: user.id,
          savedSet: state.savedSet,
          followedSet: state.followedProblems,
          followedTags: state.followedTags,
        }),
    );
    const serializedExperiences = (experiences as unknown as ExperienceRow[]).map(
      (row) =>
        serializeExperience(row, {
          currentUserId: user.id,
          savedSet: state.savedSet,
          followedSet: state.followedExperiences,
          followedTags: state.followedTags,
        }),
    );

    return jsonOk({
      hasFollowedTopics: followedTags.length > 0 || followedUsers.length > 0,
      problems: serializedProblems,
      experiences: serializedExperiences,
    });
  } catch (error) {
    return jsonError(error);
  }
}