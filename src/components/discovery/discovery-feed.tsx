"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatRelativeTime } from "@/lib/dates";
import { PROBLEM_STATUS_LABELS } from "@/lib/constants/problem";
import { EXPERIENCE_STATUS_LABELS } from "@/lib/constants/experience";

interface DiscoveryResult {
  interestProblems: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    author: { displayName: string | null } | null;
    tags: string[];
  }>;
  unansweredProblems: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    answerCount: number;
    author: { displayName: string | null } | null;
  }>;
  featuredExperiences: Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    createdAt: string;
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
    createdAt: string;
  }>;
}

function DiscoverySection({
  icon,
  title,
  hint,
  children,
}: {
  icon: IconName;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="bg-brand-50 text-brand-700 border-brand-100 flex size-8 items-center justify-center rounded-lg border"
        >
          <Icon name={icon} className="size-4" />
        </span>
        <div>
          <h2 className="text-foreground text-sm font-bold leading-tight">
            {title}
          </h2>
          {hint && (
            <p className="text-muted-foreground text-xs leading-tight">
              {hint}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function MiniCard({
  href,
  badges,
  title,
  meta,
}: {
  href: string;
  badges?: React.ReactNode;
  title: string;
  meta: string;
}) {
  return (
    <article className="border-border bg-card shadow-card hover:shadow-md hover:border-brand-200 rounded-xl border p-3.5 transition-all duration-200">
      {badges && <div className="flex flex-wrap gap-1.5">{badges}</div>}
      <Link
        href={href}
        className="text-foreground hover:text-brand-700 mt-1.5 block text-sm leading-6 font-bold transition-colors"
      >
        {title}
      </Link>
      <p className="text-muted-foreground mt-0.5 text-xs">{meta}</p>
    </article>
  );
}

export function DiscoveryFeed() {
  const [data, setData] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/discover", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { ok: boolean; data?: DiscoveryResult }) => {
        if (!active) return;
        if (!body.ok) {
          setError("خطا در دریافت پیشنهادها");
          return;
        }
        setData(body.data ?? null);
      })
      .catch(() => setError("خطا در ارتباط با سرور"));
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <EmptyState title="خطا" description={error} />;
  }

  if (!data) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            aria-hidden="true"
            className="border-border bg-muted/40 h-32 animate-pulse rounded-xl border"
          />
        ))}
      </div>
    );
  }

  const isEmpty =
    data.interestProblems.length === 0 &&
    data.unansweredProblems.length === 0 &&
    data.featuredExperiences.length === 0 &&
    data.suggestedCircles.length === 0 &&
    data.unfinished.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={<Icon name="compass" className="size-6" />}
        title="هنوز پیشنهادی نیست"
        description="وقتی مسائل و تجربه‌های بیشتری ثبت شوند، پیشنهادهای مرتبط با علایق شما اینجا ظاهر می‌شوند."
        action={
          <Link href="/problems/new">
            <Button>اولین مسئله را مطرح کنید</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {data.unfinished.length > 0 && (
        <DiscoverySection
          icon="edit"
          title="ادامه فعالیت‌های نیمه‌تمام"
          hint="جایی که کار را نیمه رها کردید"
        >
          {data.unfinished.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              className="border-border bg-card shadow-card hover:shadow-md hover:border-brand-200 flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all duration-200"
            >
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-bold">
                  {item.title}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {item.kind === "draft_problem"
                    ? "پیش‌نویس مسئله"
                    : item.kind === "draft_experience"
                      ? "پیش‌نویس تجربه"
                      : "درخواست همیاری باز"}
                  {" • "}
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
              <Link
                href={
                  item.kind === "draft_problem"
                    ? `/problems/${item.id}`
                    : item.kind === "draft_experience"
                      ? `/experiences/${item.id}`
                      : `/peer/${item.id}`
                }
                className="text-brand-700 hover:text-brand-800 inline-flex shrink-0 items-center gap-1 text-sm font-semibold"
              >
                ادامه
                <Icon name="arrow-left" className="size-3.5" />
              </Link>
            </div>
          ))}
        </DiscoverySection>
      )}

      {data.interestProblems.length > 0 && (
        <DiscoverySection
          icon="question"
          title="مسائل مرتبط با علایق شما"
          hint="بر اساس علایق و حوزه‌های تجربه شما"
        >
          {data.interestProblems.map((item) => (
            <MiniCard
              key={item.id}
              href={`/problems/${item.id}`}
              badges={
                <>
                  <Badge tone="brand">مسئله</Badge>
                  <Badge tone="neutral">
                    {PROBLEM_STATUS_LABELS[
                      item.status as keyof typeof PROBLEM_STATUS_LABELS
                    ]}
                  </Badge>
                </>
              }
              title={item.title}
              meta={`${item.author?.displayName ?? "بی‌نام"} • ${formatRelativeTime(item.createdAt)}`}
            />
          ))}
        </DiscoverySection>
      )}

      {data.unansweredProblems.length > 0 && (
        <DiscoverySection
          icon="messages"
          title="مسائل بی‌پاسخ (نیازمند کمک)"
          hint="این مسائل منتظر تخصص شما هستند"
        >
          {data.unansweredProblems.map((item) => (
            <MiniCard
              key={item.id}
              href={`/problems/${item.id}`}
              badges={<Badge tone="warning">بدون پاسخ</Badge>}
              title={item.title}
              meta={`${item.author?.displayName ?? "بی‌نام"} • ${formatRelativeTime(item.createdAt)}`}
            />
          ))}
        </DiscoverySection>
      )}

      {data.featuredExperiences.length > 0 && (
        <DiscoverySection
          icon="sparkles"
          title="تجربه‌های برگزیده"
          hint="تجربه‌های با بیشترین اجرای موفق"
        >
          {data.featuredExperiences.map((item) => (
            <MiniCard
              key={item.id}
              href={`/experiences/${item.slug}`}
              badges={
                <>
                  <Badge tone="success">تجربه</Badge>
                  <Badge tone="neutral">
                    {EXPERIENCE_STATUS_LABELS[
                      item.status as keyof typeof EXPERIENCE_STATUS_LABELS
                    ]}
                  </Badge>
                </>
              }
              title={item.title}
              meta={`${item.author?.displayName ?? "بی‌نام"} • ${formatRelativeTime(item.createdAt)} • ${item.reuseCount} اجرا`}
            />
          ))}
        </DiscoverySection>
      )}

      {data.suggestedCircles.length > 0 && (
        <DiscoverySection
          icon="users"
          title="حلقه‌های پیشنهادی"
          hint="گروه‌های کوچک مرتبط با علایق شما"
        >
          {data.suggestedCircles.map((item) => (
            <MiniCard
              key={item.id}
              href={`/circles/${item.id}`}
              badges={<Badge tone="brand">حلقه همیار</Badge>}
              title={item.name}
              meta={`${item.memberCount} عضو از ${item.capacity}${item.province ? ` • ${item.province}` : ""}${item.topic ? ` • ${item.topic}` : ""}`}
            />
          ))}
        </DiscoverySection>
      )}
    </div>
  );
}