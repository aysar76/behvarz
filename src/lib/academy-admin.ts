import { prisma } from "@/lib/db";

/**
 * همگام‌سازی برچسب‌های یک دوره (upsert برچسب و بازنویسی رابطه‌ها).
 */
export async function syncCourseTags(
  courseId: string,
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

  await prisma.courseTag.deleteMany({ where: { courseId } });
  if (tags.length > 0) {
    await prisma.courseTag.createMany({
      data: tags.map((tag) => ({ courseId, tagId: tag.id })),
    });
  }
}
