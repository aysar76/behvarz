"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
        icon={<span aria-hidden="true">🧭</span>}
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
        <section>
          <h2 className="text-foreground mb-2 text-sm font-bold">
            ادامه فعالیت‌های نیمه‌تمام
          </h2>
          <div className="space-y-2">
            {data.unfinished.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="border-border bg-card shadow-card flex items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div>
                  <p className="text-foreground text-sm font-bold">{item.title}</p>
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
                  className="text-brand-700 hover:text-brand-800 shrink-0 text-sm font-medium"
                >
                  ادامه
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.interestProblems.length > 0 && (
        <section>
          <h2 className="text-foreground mb-2 text-sm font-bold">
            مسائل مرتبط با علایق شما
          </h2>
          <div className="space-y-3">
            {data.interestProblems.map((item) => (
              <article
                key={item.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">مسئله</Badge>
                  <Badge tone="neutral">
                    {PROBLEM_STATUS_LABELS[item.status as keyof typeof PROBLEM_STATUS_LABELS]}
                  </Badge>
                </div>
                <Link
                  href={`/problems/${item.id}`}
                  className="text-foreground hover:text-brand-700 mt-2 block text-sm font-bold"
                >
                  {item.title}
                </Link>
                <p className="text-muted-foreground mt-1 text-xs">
                  {item.author?.displayName ?? "بی‌نام"}
                  {" • "}
                  {formatRelativeTime(item.createdAt)}
                </p>
                {item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <Badge key={tag} tone="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {data.unansweredProblems.length > 0 && (
        <section>
          <h2 className="text-foreground mb-2 text-sm font-bold">
            مسائل بی‌پاسخ (نیازمند کمک)
          </h2>
          <div className="space-y-3">
            {data.unansweredProblems.map((item) => (
              <article
                key={item.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="warning">بدون پاسخ</Badge>
                </div>
                <Link
                  href={`/problems/${item.id}`}
                  className="text-foreground hover:text-brand-700 mt-2 block text-sm font-bold"
                >
                  {item.title}
                </Link>
                <p className="text-muted-foreground mt-1 text-xs">
                  {item.author?.displayName ?? "بی‌نام"}
                  {" • "}
                  {formatRelativeTime(item.createdAt)}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {data.featuredExperiences.length > 0 && (
        <section>
          <h2 className="text-foreground mb-2 text-sm font-bold">
            تجربه‌های برگزیده
          </h2>
          <div className="space-y-3">
            {data.featuredExperiences.map((item) => (
              <article
                key={item.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="success">تجربه</Badge>
                  <Badge tone="neutral">
                    {EXPERIENCE_STATUS_LABELS[item.status as keyof typeof EXPERIENCE_STATUS_LABELS]}
                  </Badge>
                </div>
                <Link
                  href={`/experiences/${item.slug}`}
                  className="text-foreground hover:text-brand-700 mt-2 block text-sm font-bold"
                >
                  {item.title}
                </Link>
                <p className="text-muted-foreground mt-1 text-xs">
                  {item.author?.displayName ?? "بی‌نام"}
                  {" • "}
                  {formatRelativeTime(item.createdAt)}
                  {" • "}
                  {item.reuseCount} اجرا
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {data.suggestedCircles.length > 0 && (
        <section>
          <h2 className="text-foreground mb-2 text-sm font-bold">
            حلقه‌های پیشنهادی
          </h2>
          <div className="space-y-3">
            {data.suggestedCircles.map((item) => (
              <article
                key={item.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <Link
                  href={`/circles/${item.id}`}
                  className="text-foreground hover:text-brand-700 block text-sm font-bold"
                >
                  {item.name}
                </Link>
                {item.description && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {item.description}
                  </p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  {item.memberCount} عضو از {item.capacity}
                  {item.province ? ` • ${item.province}` : ""}
                  {item.topic ? ` • ${item.topic}` : ""}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}