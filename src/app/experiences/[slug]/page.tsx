import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/shell/app-shell";
import { ExperienceDetail } from "@/components/experiences/experience-detail";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canUser } from "@/lib/auth/authorization";
import { getInteractionState } from "@/lib/interactions";
import {
  serializeExperience,
  type ExperienceRow,
  type SerializedExperience,
} from "@/lib/serializers/experience";

export const metadata = {
  title: "بانک تجربه",
};

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

const REUSE_INCLUDE = {
  user: { select: { id: true, displayName: true } },
} as const;

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const experience = await prisma.experience.findUnique({
    where: { slug },
    include: {
      author: { select: AUTHOR_SELECT },
      tags: { include: { tag: { select: { id: true, name: true } } } },
      sourceProblem: { select: { id: true, title: true } },
      reuses: { include: REUSE_INCLUDE, orderBy: { createdAt: "desc" } },
      references: {
        select: {
          id: true,
          answer: {
            select: {
              id: true,
              problem: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      thanks: {
        where: { userId: user.id },
        select: { targetId: true },
      },
      _count: { select: { references: true, reuses: true } },
    },
  });

  if (!experience) notFound();
  const canModerate = canUser(user, "content:moderate");
  if (experience.moderation !== "visible" && !canModerate) notFound();
  if (experience.isDraft && experience.authorId !== user.id) notFound();

  const tagNames = experience.tags.map((item) => item.tag.name);
  const state = await getInteractionState(user.id);

  let related: SerializedExperience[] = [];
  if (tagNames.length > 0) {
    const relatedRows = await prisma.experience.findMany({
      where: {
        id: { not: experience.id },
        isDraft: false,
        publishedAt: { not: null },
        moderation: "visible",
        status: { not: "archived" },
        tags: { some: { tag: { name: { in: tagNames } } } },
      },
      include: {
        author: { select: AUTHOR_SELECT },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        _count: { select: { references: true, reuses: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    related = (relatedRows as unknown as ExperienceRow[]).map((row) =>
      serializeExperience(row, {
        currentUserId: user.id,
        savedSet: state.savedSet,
        followedSet: state.followedExperiences,
        followedTags: state.followedTags,
      }),
    );
  }

  return (
    <AppShell>
      <ExperienceDetail
        initialExperience={serializeExperience(
          experience as unknown as ExperienceRow,
          {
            currentUserId: user.id,
            savedSet: state.savedSet,
            followedSet: state.followedExperiences,
            followedTags: state.followedTags,
            thankedIds: new Set(experience.thanks.map((item) => item.targetId)),
          },
        )}
        related={related}
        isAuthor={experience.authorId === user.id}
        canModerate={canModerate}
      />
    </AppShell>
  );
}