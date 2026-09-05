import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/interactions/follow-button";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getInteractionState } from "@/lib/interactions";
import { formatRelativeTime } from "@/lib/dates";
import {
  serializeCapitalProfile,
  type CapitalUserRow,
} from "@/lib/serializers/capital";
import { EXPERIENCE_STATUS_LABELS } from "@/lib/constants/experience";
import { ROLE_LABELS } from "@/lib/rbac";

export const metadata = {
  title: "سرمایه حرفه‌ای",
};

const badgeToneClass: Record<
  string,
  { bg: string; text: string }
> = {
  brand: { bg: "bg-brand-100", text: "text-brand-800" },
  success: { bg: "bg-green-100", text: "text-green-800" },
  info: { bg: "bg-sky-100", text: "text-sky-800" },
  warning: { bg: "bg-amber-100", text: "text-amber-800" },
  neutral: { bg: "bg-muted", text: "text-muted-foreground" },
};

export default async function UserCapitalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/auth");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      province: true,
      city: true,
      bio: true,
      workYears: true,
      role: true,
      membershipStatus: true,
      visibility: true,
      onboardingCompleted: true,
    },
  });

  if (!user || !user.onboardingCompleted) notFound();
  if (user.visibility === "private" && user.id !== viewer.id) notFound();

  assertPermission(viewer, "profile:read:other");

  const state = await getInteractionState(viewer.id);
  const isFollowing = state.followedUsers.has(user.id);

  const [experiences, solvedProblems, reuseCount, thanksCount] =
    await Promise.all([
      prisma.experience.findMany({
        where: {
          authorId: user.id,
          isDraft: false,
          publishedAt: { not: null },
          moderation: "visible",
          status: {
            in: ["user_generated", "under_review", "reviewed", "featured"],
          },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          thanksCount: true,
          reuses: { select: { outcome: true } },
          _count: { select: { references: true, reuses: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.problem.findMany({
        where: {
          authorId: user.id,
          status: "solved",
          isDraft: false,
          moderation: "visible",
          publishedAt: { not: null },
        },
        select: {
          id: true,
          title: true,
          status: true,
          conclusion: true,
          solvedAt: true,
        },
        orderBy: { solvedAt: "desc" },
        take: 50,
      }),
      prisma.experienceReuse.count({
        where: { experience: { authorId: user.id }, outcome: "successful" },
      }),
      prisma.professionalThanks.count({ where: { receivedById: user.id } }),
    ]);

  const profile = serializeCapitalProfile({
    user: user as CapitalUserRow,
    experiences,
    solvedProblems,
    successfulReuseCount: reuseCount,
    thanksReceivedCount: thanksCount,
  });

  const isOwnProfile = user.id === viewer.id;
  const location = [user.province, user.city].filter(Boolean).join("، ");

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="border-border bg-card shadow-card rounded-xl border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-foreground text-2xl font-extrabold">
                  {profile.user.displayName ?? "بی‌نام"}
                </h1>
                <Badge tone="brand">
                  {ROLE_LABELS[profile.user.role as keyof typeof ROLE_LABELS]}
                </Badge>
                {profile.user.isVerified && (
                  <Badge tone="success">عضو تأییدشده</Badge>
                )}
              </div>
              {location && (
                <p className="text-muted-foreground mt-1 text-sm">
                  محل خدمت: {location}
                </p>
              )}
              {profile.user.bio && (
                <p className="text-foreground mt-3 text-sm leading-6">
                  {profile.user.bio}
                </p>
              )}
            </div>
            {!isOwnProfile && (
              <FollowButton
                targetType="user"
                targetId={user.id}
                following={isFollowing}
                label="دنبال‌کردن عضو"
              />
            )}
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ["publishedExperiences", "تجربه منتشرشده"],
              ["solvedProblems", "مسئله حل‌شده"],
              ["validReferences", "ارجاع معتبر"],
              ["successfulReusesByOthers", "اجرای موفق توسط دیگران"],
              ["thanksReceived", "تشکر حرفه‌ای"],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className="border-border bg-card shadow-card rounded-xl border p-3 text-center"
            >
              <div className="text-foreground text-2xl font-extrabold">
                {profile.stats[key]}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">{label}</div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            نشان‌های مبتنی بر شواهد
          </h2>
          {profile.badges.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              هنوز نشانی ثبت نشده است؛ با ثبت تجربه و حل مسئله، نشان‌ها
              به‌دست می‌آیند.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge) => {
                const tone = badgeToneClass[badge.tone] ?? badgeToneClass.neutral;
                return (
                  <div
                    key={badge.id}
                    className={`${tone.bg} ${tone.text} rounded-lg px-3 py-2`}
                    title={badge.description}
                  >
                    <p className="text-sm font-bold">{badge.label}</p>
                    <p className="mt-0.5 max-w-[220px] text-xs opacity-80">
                      {badge.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {profile.experiences.length > 0 && (
          <section>
            <h2 className="text-foreground mb-3 text-lg font-bold">
              تجربه‌های منتشرشده
            </h2>
            <div className="space-y-3">
              {profile.experiences.map((experience) => (
                <article
                  key={experience.id}
                  className="border-border bg-card shadow-card rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/experiences/${experience.slug}`}
                      className="text-foreground hover:text-brand-700 text-sm font-bold"
                    >
                      {experience.title}
                    </Link>
                    <Badge
                      tone={
                        experience.status === "featured"
                          ? "success"
                          : experience.status === "reviewed"
                            ? "brand"
                            : "neutral"
                      }
                    >
                      {EXPERIENCE_STATUS_LABELS[experience.status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {experience.referenceCount} ارجاع •{" "}
                    {experience.reuseSuccessCount} اجرای موفق •{" "}
                    {experience.thanksCount} تشکر
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {profile.solvedProblems.length > 0 && (
          <section>
            <h2 className="text-foreground mb-3 text-lg font-bold">
              مسائل حل‌شده
            </h2>
            <div className="space-y-3">
              {profile.solvedProblems.map((problem) => (
                <article
                  key={problem.id}
                  className="border-border bg-card shadow-card rounded-xl border p-4"
                >
                  <Link
                    href={`/problems/${problem.id}`}
                    className="text-foreground hover:text-brand-700 text-sm font-bold"
                  >
                    {problem.title}
                  </Link>
                  {problem.solvedAt && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      حل‌شده {formatRelativeTime(problem.solvedAt)}
                    </p>
                  )}
                  {problem.conclusion && (
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {problem.conclusion}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}