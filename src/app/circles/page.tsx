import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CIRCLE_STATUS_LABELS } from "@/lib/constants/circle";

export const metadata = {
  title: "حلقه‌های همیار",
};

export default async function CirclesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const [myMemberships, myJoinRequests, myInvites, circles] = await Promise.all([
    prisma.circleMembership.findMany({
      where: { userId: user.id, status: "active" },
      include: {
        circle: {
          include: {
            facilitator: {
              select: { id: true, displayName: true },
            },
            _count: { select: { memberships: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
      take: 10,
    }),
    prisma.circleJoinRequest.findMany({
      where: { userId: user.id, status: "pending" },
      include: {
        circle: {
          include: {
            facilitator: { select: { id: true, displayName: true } },
            _count: { select: { memberships: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.circleInvite.findMany({
      where: { userId: user.id, status: "pending" },
      include: {
        circle: {
          include: {
            facilitator: { select: { id: true, displayName: true } },
            _count: { select: { memberships: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.circle.findMany({
      where: { status: "active" },
      include: {
        facilitator: { select: { id: true, displayName: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-foreground text-2xl font-extrabold">
              حلقه‌های همیار
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              گروه‌های کوچک ۵ تا ۱۲ نفره برای یادگیری، هم‌افزایی و حل مسئله با
              همکاران هم‌حرفه. همیاری دونفره را از صفحه «همیاری» دنبال کنید.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/peer">
              <Button size="sm" variant="outline">
                درخواست همیاری
              </Button>
            </Link>
            <Link href="/circles/new">
              <Button size="sm">ایجاد حلقه</Button>
            </Link>
          </div>
        </header>

        {myInvites.length > 0 && (
          <section className="border-brand-300 bg-brand-50 rounded-xl border p-4">
            <h2 className="text-brand-800 text-sm font-bold">
              دعوت‌نامه‌های در انتظار شما
            </h2>
            <div className="mt-3 space-y-2">
              {myInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-200 p-3"
                >
                  <div>
                    <Link
                      href={`/circles/${invite.circleId}`}
                      className="text-foreground text-sm font-bold"
                    >
                      {invite.circle.name}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      دعوت از {invite.circle.facilitator.displayName ?? "راهبر"} •{" "}
                      {invite.circle._count.memberships} عضو
                    </p>
                  </div>
                  <Link href={`/circles/${invite.circleId}`}>
                    <Button size="sm" variant="outline">
                      مشاهده دعوت
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            حلقه‌های من
          </h2>
          {myMemberships.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              هنوز به حلقه‌ای نپیوسته‌اید. از فهرست حلقه‌های فعال زیر، درخواست
              عضویت بدهید.
            </p>
          ) : (
            <div className="space-y-3">
              {myMemberships.map((membership) => (
                <CircleCard
                  key={membership.id}
                  id={membership.circleId}
                  name={membership.circle.name}
                  topic={membership.circle.topic}
                  province={membership.circle.province}
                  memberCount={membership.circle._count.memberships}
                  capacity={membership.circle.capacity}
                  facilitator={membership.circle.facilitator.displayName}
                  isFacilitator={membership.role === "facilitator"}
                />
              ))}
            </div>
          )}

          {myJoinRequests.length > 0 && (
            <div className="mt-3 space-y-2">
              {myJoinRequests.map((request) => (
                <div
                  key={request.id}
                  className="border-warning/40 bg-warning/5 text-warning rounded-lg border px-3 py-2 text-sm"
                >
                  درخواست شما برای حلقه «{request.circle.name}» در انتظار تأیید
                  راهبر است.
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            حلقه‌های فعال
          </h2>
          {circles.length === 0 ? (
            <EmptyState
              title="هنوز حلقه‌ای ساخته نشده است"
              description="اولین حلقه همیار را بسازید تا همکاران به آن بپیوندند."
              action={
                <Link href="/circles/new">
                  <Button size="sm">ایجاد اولین حلقه</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {circles.map((circle) => {
                const isMine = myMemberships.some(
                  (membership) => membership.circleId === circle.id,
                );
                return (
                  <CircleCard
                    key={circle.id}
                    id={circle.id}
                    name={circle.name}
                    topic={circle.topic}
                    province={circle.province}
                    memberCount={circle._count.memberships}
                    capacity={circle.capacity}
                    facilitator={circle.facilitator.displayName}
                    isMember={isMine}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function CircleCard({
  id,
  name,
  topic,
  province,
  memberCount,
  capacity,
  facilitator,
  isFacilitator = false,
  isMember = false,
}: {
  id: string;
  name: string;
  topic: string | null;
  province: string | null;
  memberCount: number;
  capacity: number;
  facilitator: string | null;
  isFacilitator?: boolean;
  isMember?: boolean;
}) {
  return (
    <article className="border-border bg-card shadow-card rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        {isFacilitator && <Badge tone="brand">راهبر</Badge>}
        {isMember && <Badge tone="success">عضو هستید</Badge>}
        <Badge tone="neutral">{CIRCLE_STATUS_LABELS.active}</Badge>
      </div>
      <Link
        href={`/circles/${id}`}
        className="text-foreground hover:text-brand-700 mt-2 block text-sm font-bold"
      >
        {name}
      </Link>
      <p className="text-muted-foreground mt-1 text-xs">
        {topic ?? "بدون موضوع"} • {province ?? "سراسری"} •{" "}
        {memberCount} از {capacity} عضو • راهبر: {facilitator ?? "بی‌نام"}
      </p>
    </article>
  );
}