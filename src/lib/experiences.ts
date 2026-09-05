import { prisma } from "@/lib/db";
import type { ExperienceRow } from "@/lib/serializers/experience";

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

export const EXPERIENCE_DETAIL_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  tags: { include: { tag: { select: { id: true, name: true } } } },
  sourceProblem: { select: { id: true, title: true } },
} as const;

export const EXPERIENCE_LIST_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  tags: { include: { tag: { select: { id: true, name: true } } } },
  _count: {
    select: { references: true, reuses: true },
  },
} as const;

export async function getExperienceRow(
  id: string,
): Promise<ExperienceRow | null> {
  return (await prisma.experience.findUnique({
    where: { id },
    include: EXPERIENCE_DETAIL_INCLUDE,
  })) as unknown as ExperienceRow | null;
}

export async function syncExperienceTags(
  experienceId: string,
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

  await prisma.experienceTag.deleteMany({ where: { experienceId } });
  if (tags.length > 0) {
    await prisma.experienceTag.createMany({
      data: tags.map((tag) => ({ experienceId, tagId: tag.id })),
    });
  }
}