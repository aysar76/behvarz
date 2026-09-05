import { prisma } from "@/lib/db";

export type SearchType = "all" | "problems" | "experiences" | "circles" | "members";

export interface SearchFilters {
  q: string;
  type: SearchType;
  tag?: string | null;
  province?: string | null;
  status?: string | null;
  limit: number;
}

export interface SearchResults {
  problems: Array<{ id: string; title: string; createdAt: Date }>;
  experiences: Array<{ id: string; slug: string; title: string; createdAt: Date }>;
  circles: Array<{ id: string; name: string; description: string | null; createdAt: Date }>;
  members: Array<{ id: string; displayName: string | null; province: string | null; city: string | null }>;
}

/**
 * جست‌وجوی ساده مسائل/تجربه‌ها/حلقه‌ها/اعضا.
 * در SQLite از LIKE استفاده می‌شود (بدون سرویس Full-Text خارجی). محدودیت‌های
 * Full-Text فارسی در docs/known-limitations.md ثبت شده‌اند.
 */
export async function searchAll(filters: SearchFilters): Promise<SearchResults> {
  const q = filters.q.trim();

  const containsWhere = (fields: string[]) => {
    if (!q) return undefined;
    return {
      OR: fields.map((field) => ({ [field]: { contains: q } })),
    };
  };

  const tagWhere = filters.tag
    ? { tags: { some: { tag: { name: filters.tag, isActive: true } } } }
    : undefined;

  const provinceWhere = filters.province
    ? { province: filters.province }
    : undefined;

  const limit = Math.min(20, Math.max(1, filters.limit));

  const results: SearchResults = {
    problems: [],
    experiences: [],
    circles: [],
    members: [],
  };

  const fetchProblems = filters.type === "all" || filters.type === "problems";
  const fetchExperiences =
    filters.type === "all" || filters.type === "experiences";
  const fetchCircles = filters.type === "all" || filters.type === "circles";
  const fetchMembers = filters.type === "all" || filters.type === "members";

  const [problems, experiences, circles, members] = await Promise.all([
    fetchProblems
      ? prisma.problem.findMany({
          where: {
            ...containsWhere(["title", "description", "context"]),
            ...tagWhere,
            isDraft: false,
            publishedAt: { not: null },
            moderation: "visible",
            ...(filters.status ? { status: filters.status as never } : {}),
          },
          select: { id: true, title: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : Promise.resolve([]),
    fetchExperiences
      ? prisma.experience.findMany({
          where: {
            ...containsWhere(["title", "situation", "action"]),
            ...tagWhere,
            isDraft: false,
            publishedAt: { not: null },
            moderation: "visible",
            status: { not: "archived" },
          },
          select: { id: true, slug: true, title: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : Promise.resolve([]),
    fetchCircles
      ? prisma.circle.findMany({
          where: {
            ...containsWhere(["name", "description", "topic"]),
            ...provinceWhere,
            status: "active",
          },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : Promise.resolve([]),
    fetchMembers
      ? prisma.user.findMany({
          where: {
            ...containsWhere(["displayName", "province", "city"]),
            ...provinceWhere,
            onboardingCompleted: true,
            visibility: { not: "private" },
            accountStatus: "active",
          },
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : Promise.resolve([]),
  ]);

  results.problems = problems;
  results.experiences = experiences;
  results.circles = circles;
  results.members = members;

  return results;
}