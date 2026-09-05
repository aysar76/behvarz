import { prisma } from "@/lib/db";
import type { ProblemRow } from "@/lib/serializers/problem";

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

export const PROBLEM_DETAIL_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  tags: { include: { tag: { select: { id: true, name: true } } } },
} as const;

export const PROBLEM_LIST_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  tags: { include: { tag: { select: { id: true, name: true } } } },
  _count: { select: { answers: true } },
} as const;

export const ANSWER_DETAIL_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  helpfulMarks: { select: { userId: true } },
  references: {
    include: {
      experience: {
        select: { id: true, slug: true, title: true, status: true },
      },
    },
  },
} as const;

export async function getProblemRow(id: string): Promise<ProblemRow | null> {
  return (await prisma.problem.findUnique({
    where: { id },
    include: PROBLEM_DETAIL_INCLUDE,
  })) as unknown as ProblemRow | null;
}

export async function syncProblemTags(
  problemId: string,
  tagNames: string[],
): Promise<void> {
  const uniqueNames = [
    ...new Set(tagNames.map((name) => name.trim()).filter(Boolean)),
  ];

  const tags = await Promise.all(
    uniqueNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  await prisma.problemTag.deleteMany({ where: { problemId } });
  if (tags.length > 0) {
    await prisma.problemTag.createMany({
      data: tags.map((tag) => ({ problemId, tagId: tag.id })),
    });
  }
}
