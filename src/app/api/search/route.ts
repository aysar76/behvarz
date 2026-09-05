import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/current-user";
import { searchAll, type SearchType } from "@/lib/search";
import { getInteractionState } from "@/lib/interactions";
import { serializeProblem, type ProblemRow } from "@/lib/serializers/problem";
import {
  serializeExperience,
  type ExperienceRow,
} from "@/lib/serializers/experience";
import { serializeUserSearch, type SearchUserRow } from "@/lib/serializers/user-search";

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

const SEARCH_TYPES: SearchType[] = [
  "all",
  "problems",
  "experiences",
  "circles",
  "members",
];

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const typeParam = url.searchParams.get("type") ?? "all";
    const type: SearchType = SEARCH_TYPES.includes(typeParam as SearchType)
      ? (typeParam as SearchType)
      : "all";
    const tag = url.searchParams.get("tag");
    const province = url.searchParams.get("province");
    const status = url.searchParams.get("status");
    const limit = Number(url.searchParams.get("limit")) || 10;

    if (q.length === 0 && !tag && !province) {
      return jsonOk({
        query: q,
        suggestedTags: await getSuggestedTags(user.id),
        problems: [],
        experiences: [],
        circles: [],
        members: [],
        hasResults: false,
      });
    }

    const results = await searchAll({ q, type, tag, province, status, limit });

    const problemIds = results.problems.map((item) => item.id);
    const experienceIds = results.experiences.map((item) => item.id);
    const circleIds = results.circles.map((item) => item.id);
    const memberIds = results.members.map((item) => item.id);

    const [problems, experiences, circles, members, state] = await Promise.all([
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
      circleIds.length > 0
        ? prisma.circle.findMany({
            where: { id: { in: circleIds } },
            include: {
              facilitator: {
                select: { id: true, displayName: true, province: true },
              },
              _count: { select: { memberships: true } },
            },
          })
        : Promise.resolve([]),
      memberIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: memberIds } },
            select: {
              id: true,
              displayName: true,
              province: true,
              city: true,
              workYears: true,
              membershipStatus: true,
              role: true,
            },
          })
        : Promise.resolve([]),
      getInteractionState(user.id),
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
    const serializedCircles = (circles as unknown as Array<{
      id: string;
      name: string;
      description: string;
      topic: string | null;
      province: string | null;
      capacity: number;
      status: string;
      createdAt: Date;
      facilitator: { id: string; displayName: string | null; province: string | null };
      _count?: { memberships: number };
    }>).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      topic: row.topic,
      province: row.province,
      capacity: row.capacity,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      facilitatorLabel: row.facilitator.displayName ?? "بی‌نام",
      memberCount: row._count?.memberships ?? 0,
    }));
    const serializedMembers = (members as unknown as SearchUserRow[]).map(
      (row) => serializeUserSearch(row),
    );

    return jsonOk({
      query: q,
      type,
      problems: serializedProblems,
      experiences: serializedExperiences,
      circles: serializedCircles,
      members: serializedMembers,
      hasResults:
        serializedProblems.length > 0 ||
        serializedExperiences.length > 0 ||
        serializedCircles.length > 0 ||
        serializedMembers.length > 0,
      suggestedTags: await getSuggestedTags(user.id),
    });
  } catch (error) {
    return jsonError(error);
  }
}

async function getSuggestedTags(userId: string): Promise<string[]> {
  const follows = await prisma.follow.findMany({
    where: { userId, targetType: "tag" },
    select: { targetId: true },
    take: 8,
  });
  return follows.map((item) => item.targetId);
}