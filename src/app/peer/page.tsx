import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatRelativeTime } from "@/lib/dates";
import {
  PEER_COOPERATION_STATUS_LABELS,
  PEER_HELP_REQUEST_STATUS_LABELS,
} from "@/lib/constants/peer";
import { PROBLEM_BARRIER_LABELS } from "@/lib/constants/problem";

export const metadata = {
  title: "همیاری",
};

export default async function PeerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const [myRequests, openRequests, myOffers, cooperations] = await Promise.all([
    prisma.peerHelpRequest.findMany({
      where: { requesterId: user.id, status: { not: "canceled" } },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
          },
        },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.peerHelpRequest.findMany({
      where: { status: "open", requesterId: { not: user.id } },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
          },
        },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.peerOffer.findMany({
      where: {
        helperId: user.id,
        status: { in: ["pending", "accepted"] },
      },
      include: {
        helpRequest: {
          include: {
            requester: {
              select: {
                id: true,
                displayName: true,
                province: true,
                city: true,
                membershipStatus: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.peerCooperation.findMany({
      where: {
        OR: [{ requesterId: user.id }, { helperId: user.id }],
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
          },
        },
        helper: {
          select: {
            id: true,
            displayName: true,
            province: true,
            city: true,
            membershipStatus: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const myActiveCooperations = cooperations.filter(
    (cooperation) => cooperation.status === "active",
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-foreground text-2xl font-extrabold">
              همیاری
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              وقتی مسئله‌ای دارید، همیاری با تجربه مشابه پیدا کنید؛ یا خودتان
              برای درخواست‌های باز، پیشنهاد همیاری بدهید. گفت‌وگوها محدود و
              موضوع‌محور است.
            </p>
          </div>
          <Link href="/peer/new">
            <Button>درخواست همیار</Button>
          </Link>
        </header>

        {myActiveCooperations.length > 0 && (
          <section>
            <h2 className="text-foreground mb-3 text-lg font-bold">
              همکاری‌های در جریان
            </h2>
            <div className="space-y-3">
              {myActiveCooperations.map((cooperation) => (
                <article
                  key={cooperation.id}
                  className="border-border bg-card shadow-card rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">در جریان</Badge>
                  </div>
                  <Link
                    href={`/peer/cooperations/${cooperation.id}`}
                    className="text-foreground hover:text-brand-700 mt-2 block text-sm font-bold"
                  >
                    {cooperation.requesterId === user.id
                      ? "همکاری با " + (cooperation.helper.displayName ?? "همیار")
                      : "همیاری برای " +
                        (cooperation.requester.displayName ?? "درخواست‌دهنده")}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {cooperation.goal ?? "هدف هنوز تعیین نشده است"}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            درخواست‌های همیار من
          </h2>
          {myRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              هنوز درخواست همیار ثبت نکرده‌اید.
            </p>
          ) : (
            <div className="space-y-3">
              {myRequests.map((request) => (
                <article
                  key={request.id}
                  className="border-border bg-card shadow-card rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        request.status === "open"
                          ? "info"
                          : request.status === "matched"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {PEER_HELP_REQUEST_STATUS_LABELS[request.status]}
                    </Badge>
                    <Badge tone="neutral">
                      {request._count.offers} پیشنهاد
                    </Badge>
                  </div>
                  <Link
                    href={`/peer/${request.id}`}
                    className="text-foreground hover:text-brand-700 mt-2 block text-sm font-bold"
                  >
                    {request.title}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {PROBLEM_BARRIER_LABELS[request.barrierType]} •{" "}
                    {formatRelativeTime(request.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {myOffers.length > 0 && (
          <section>
            <h2 className="text-foreground mb-3 text-lg font-bold">
              پیشنهادهای همیاری من
            </h2>
            <div className="space-y-3">
              {myOffers.map((offer) => (
                <article
                  key={offer.id}
                  className="border-border bg-card rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={offer.status === "accepted" ? "success" : "warning"}
                    >
                      {offer.status === "accepted" ? "پذیرفته‌شده" : "در انتظار پاسخ"}
                    </Badge>
                  </div>
                  <Link
                    href={`/peer/${offer.helpRequestId}`}
                    className="text-foreground hover:text-brand-700 mt-2 block text-sm font-bold"
                  >
                    {offer.helpRequest.title}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-xs">
                    درخواست‌دهنده:{" "}
                    {offer.helpRequest.requester.displayName ?? "بی‌نام"}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            درخواست‌های باز دیگران
          </h2>
          {openRequests.length === 0 ? (
            <EmptyState
              title="درخواست باز دیگری نیست"
              description="همین حالا درخواست همیار ثبت کنید یا بعداً برای درخواست‌های دیگران پیشنهاد بدهید."
              action={
                <Link href="/peer/new">
                  <Button size="sm">ثبت درخواست همیار</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {openRequests.map((request) => (
                <article
                  key={request.id}
                  className="border-border bg-card shadow-card rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">در انتظار همیار</Badge>
                    <Badge tone="neutral">
                      {request._count.offers} پیشنهاد
                    </Badge>
                  </div>
                  <Link
                    href={`/peer/${request.id}`}
                    className="text-foreground hover:text-brand-700 mt-2 block text-sm font-bold"
                  >
                    {request.title}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {request.requester.displayName ?? "بی‌نام"}
                    {request.requester.province
                      ? ` — ${request.requester.province}`
                      : ""}{" "}
                    • {PROBLEM_BARRIER_LABELS[request.barrierType]} •{" "}
                    {formatRelativeTime(request.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {cooperations.length > 0 && (
          <section>
            <h2 className="text-foreground mb-3 text-lg font-bold">
              تاریخچه همکاری‌ها
            </h2>
            <div className="space-y-2">
              {cooperations.map((cooperation) => (
                <Link
                  key={cooperation.id}
                  href={`/peer/cooperations/${cooperation.id}`}
                  className="border-border bg-card flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="text-foreground font-semibold">
                    {cooperation.requesterId === user.id
                      ? (cooperation.helper.displayName ?? "همیار")
                      : (cooperation.requester.displayName ?? "درخواست‌دهنده")}
                  </span>
                  <Badge tone="neutral">
                    {PEER_COOPERATION_STATUS_LABELS[cooperation.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}