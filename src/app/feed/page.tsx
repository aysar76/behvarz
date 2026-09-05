import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { FollowButton } from "@/components/interactions/follow-button";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getInteractionState } from "@/lib/interactions";
import { formatRelativeTime } from "@/lib/dates";
import {
  serializeProblem,
  type ProblemRow,
} from "@/lib/serializers/problem";
import {
  serializeExperience,
  type ExperienceRow,
} from "@/lib/serializers/experience";
import { PROBLEM_STATUS_LABELS } from "@/lib/constants/problem";
import { EXPERIENCE_STATUS_LABELS } from "@/lib/constants/experience";

export const metadata = {
  title: "خوراک حرفه‌ای",
};

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  province: true,
  city: true,
  membershipStatus: true,
  role: true,
} as const;

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const state = await getInteractionState(user.id);
  const followedTags = [...state.followedTags];
  const followedUsers = [...state.followedUsers];

  const commonWhere: Record<string, unknown> = {
    isDraft: false,
    publishedAt: { not: null },
    moderation: "visible",
  };

  const relevanceWhere: Record<string, unknown> = { ...commonWhere };
  if (followedTags.length > 0 || followedUsers.length > 0) {
    const relevance: Record<string, unknown>[] = [];
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

  const [problems, experiences] = await Promise.all([
    prisma.problem.findMany({
      where: relevanceWhere,
      include: {
        author: { select: AUTHOR_SELECT },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.experience.findMany({
      where: { ...relevanceWhere, status: { not: "archived" } },
      include: {
        author: { select: AUTHOR_SELECT },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        _count: { select: { references: true, reuses: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const serializedProblems = (problems as unknown as ProblemRow[]).map((row) =>
    serializeProblem(row, {
      currentUserId: user.id,
      savedSet: state.savedSet,
      followedSet: state.followedProblems,
      followedTags: state.followedTags,
    }),
  );
  const serializedExperiences = (
    experiences as unknown as ExperienceRow[]
  ).map((row) =>
    serializeExperience(row, {
      currentUserId: user.id,
      savedSet: state.savedSet,
      followedSet: state.followedExperiences,
      followedTags: state.followedTags,
    }),
  );

  const hasFollowedTopics = followedTags.length > 0 || followedUsers.length > 0;
  const hasContent = serializedProblems.length > 0 || serializedExperiences.length > 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="خوراک حرفه‌ای"
          description="تازه‌ترین مسائل و تجربه‌ها بر اساس موضوع‌ها و اعضایی که دنبال می‌کنید؛ نه بر اساس محبوبیت."
          icon="feed"
          actions={
            <Link href="/saved">
              <Button variant="outline">خواندنی‌های من</Button>
            </Link>
          }
        />

        {followedTags.length > 0 && (
          <section>
            <h2 className="text-foreground mb-2 text-sm font-bold">
              موضوع‌های دنبال‌شده
            </h2>
            <div className="flex flex-wrap gap-2">
              {followedTags.map((tag) => (
                <div key={tag} className="flex items-center gap-1">
                  <Badge tone="brand">{tag}</Badge>
                  <FollowButton
                    targetType="tag"
                    targetId={tag}
                    following
                    size="sm"
                    label="دنبال‌کردن"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {!hasFollowedTopics && (
          <div className="border-brand-200 bg-brand-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm text-brand-800">
            <Icon name="info" className="size-4 shrink-0" />
            هنوز موضوع یا عضوی را دنبال نکرده‌اید؛ برای دیدن خوراک مرتبط، از
            صفحه مسائل یا تجربه‌ها «دنبال‌کردن» را بزنید.
          </div>
        )}

        {!hasContent ? (
          <EmptyState
            icon={<Icon name="feed" className="size-6" />}
            title="خوراکی برای نمایش نیست"
            description="مسئله‌ای مطرح کنید، تجربه‌ای ثبت کنید یا موضوع‌ها را دنبال کنید تا اینجا به‌روز شود."
          />
        ) : (
          <div className="space-y-3">
            {serializedProblems.map((problem) => (
              <article
                key={problem.id}
                className="border-border bg-card shadow-card hover:shadow-md hover:border-brand-200 rounded-xl border p-4 transition-all duration-200"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="brand">مسئله</Badge>
                  <Badge tone="neutral">
                    {PROBLEM_STATUS_LABELS[problem.status]}
                  </Badge>
                </div>
                <Link
                  href={`/problems/${problem.id}`}
                  className="text-foreground hover:text-brand-700 mt-2 block text-sm leading-6 font-bold transition-colors"
                >
                  {problem.title}
                </Link>
                <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="user" className="size-3.5" />
                    {problem.isAnonymous
                      ? "ناشناس"
                      : (problem.author?.displayName ?? "بی‌نام")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" className="size-3.5" />
                    {formatRelativeTime(problem.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="messages" className="size-3.5" />
                    {problem.answerCount} پاسخ
                  </span>
                </p>
                {problem.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {problem.tags.map((tag) => (
                      <Badge key={tag} tone="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </article>
            ))}

            {serializedExperiences.map((experience) => (
              <article
                key={experience.id}
                className="border-border bg-card shadow-card hover:shadow-md hover:border-brand-200 rounded-xl border p-4 transition-all duration-200"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="success">تجربه</Badge>
                  <Badge tone="neutral">
                    {EXPERIENCE_STATUS_LABELS[experience.status]}
                  </Badge>
                </div>
                <Link
                  href={`/experiences/${experience.slug}`}
                  className="text-foreground hover:text-brand-700 mt-2 block text-sm leading-6 font-bold transition-colors"
                >
                  {experience.title}
                </Link>
                <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="user" className="size-3.5" />
                    {experience.author?.displayName ?? "بی‌نام"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" className="size-3.5" />
                    {formatRelativeTime(experience.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="check-circle" className="size-3.5" />
                    {experience.reuseCount} اجرا
                  </span>
                </p>
                {experience.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {experience.tags.map((tag) => (
                      <Badge key={tag} tone="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}