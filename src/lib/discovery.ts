import { prisma } from "@/lib/db";

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

export interface DiscoveryOptions {
  userId: string;
  limit?: number;
}

export interface DiscoveryResult {
  interestProblems: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    author: { displayName: string | null } | null;
    tags: string[];
  }>;
  unansweredProblems: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    answerCount: number;
    author: { displayName: string | null } | null;
  }>;
  featuredExperiences: Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    createdAt: Date;
    author: { displayName: string | null } | null;
    reuseCount: number;
  }>;
  suggestedCircles: Array<{
    id: string;
    name: string;
    description: string | null;
    topic: string | null;
    province: string | null;
    memberCount: number;
    capacity: number;
  }>;
  unfinished: Array<{
    id: string;
    title: string;
    kind: "draft_problem" | "draft_experience" | "open_help_request";
    createdAt: Date;
  }>;
}

/**
 * الگوریتم کشف دانش — ساده، قابل توضیح و بدون وابستگی به Popularity.
 * بر اساس علایق/مهارت کاربر، اتاق‌های بدون پاسخ، تجربه‌های برگزیده (featured)
 * و حلقه‌های مرتبط با موضوع/استان کاربر. «ادامه فعالیت‌های نیمه‌تمام» شامل
 * پیش‌نویس‌های مسئله/تجربه و درخواست‌های همیاری باز کاربر است.
 */
export async function getDiscovery(
  options: DiscoveryOptions,
): Promise<DiscoveryResult> {
  const user = await prisma.user.findUnique({
    where: { id: options.userId },
    include: {
      interests: { include: { interest: { select: { name: true } } } },
      skills: { include: { skill: { select: { name: true } } } },
    },
  });

  if (!user) {
    return {
      interestProblems: [],
      unansweredProblems: [],
      featuredExperiences: [],
      suggestedCircles: [],
      unfinished: [],
    };
  }

  const interestNames = [
    ...user.interests.map((item) => item.interest.name),
    ...user.skills.map((item) => item.skill.name),
  ];

  const limit = Math.min(10, Math.max(1, options.limit ?? 5));

  const interestTagFilter =
    interestNames.length > 0
      ? { tags: { some: { tag: { name: { in: interestNames } } } } }
      : undefined;

  const [interestProblems, unansweredProblems, featuredExperiences, circles] =
    await Promise.all([
      prisma.problem.findMany({
        where: {
          isDraft: false,
          publishedAt: { not: null },
          moderation: "visible",
          status: { in: ["open", "discussing"] },
          authorId: { not: user.id },
          ...interestTagFilter,
        },
        include: {
          author: { select: AUTHOR_SELECT },
          tags: { include: { tag: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.problem.findMany({
        where: {
          isDraft: false,
          publishedAt: { not: null },
          moderation: "visible",
          status: "open",
          authorId: { not: user.id },
          answers: { none: {} },
        },
        include: {
          author: { select: AUTHOR_SELECT },
          _count: { select: { answers: true } },
        },
        orderBy: { createdAt: "asc" },
        take: limit,
      }),
      prisma.experience.findMany({
        where: {
          isDraft: false,
          publishedAt: { not: null },
          moderation: "visible",
          status: { in: ["featured", "reviewed"] },
          authorId: { not: user.id },
          ...interestTagFilter,
        },
        include: {
          author: { select: AUTHOR_SELECT },
          _count: { select: { reuses: true } },
        },
        orderBy: { reviewedAt: "desc" },
        take: limit,
      }),
      prisma.circle.findMany({
        where: {
          status: "active",
          ...(user.province ? { province: user.province } : {}),
        },
        include: {
          memberships: {
            where: { status: "active" },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

  const [draftProblems, draftExperiences, openHelpRequests] = await Promise.all([
    prisma.problem.findMany({
      where: { authorId: user.id, isDraft: true },
      select: { id: true, title: true, createdAt: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
    prisma.experience.findMany({
      where: { authorId: user.id, isDraft: true },
      select: { id: true, title: true, createdAt: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
    prisma.peerHelpRequest.findMany({
      where: { requesterId: user.id, status: "open" },
      select: { id: true, title: true, createdAt: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
  ]);

  const unfinished: DiscoveryResult["unfinished"] = [
    ...draftProblems.map((item) => ({
      id: item.id,
      title: item.title,
      kind: "draft_problem" as const,
      createdAt: item.createdAt,
    })),
    ...draftExperiences.map((item) => ({
      id: item.id,
      title: item.title,
      kind: "draft_experience" as const,
      createdAt: item.createdAt,
    })),
    ...openHelpRequests.map((item) => ({
      id: item.id,
      title: item.title,
      kind: "open_help_request" as const,
      createdAt: item.createdAt,
    })),
  ].slice(0, limit);

  return {
    interestProblems: interestProblems.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      createdAt: item.createdAt,
      author: item.author,
      tags: item.tags.map((t) => t.tag.name),
    })),
    unansweredProblems: unansweredProblems.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      createdAt: item.createdAt,
      answerCount: item._count.answers,
      author: item.author,
    })),
    featuredExperiences: featuredExperiences.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      status: item.status,
      createdAt: item.createdAt,
      author: item.author,
      reuseCount: item._count.reuses,
    })),
    suggestedCircles: circles.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      topic: item.topic,
      province: item.province,
      memberCount: item.memberships.length,
      capacity: item.capacity,
    })),
    unfinished,
  };
}