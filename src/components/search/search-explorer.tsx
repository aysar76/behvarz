"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/dates";
import { PROVINCES } from "@/lib/constants/profile";
import { PROBLEM_TAGS } from "@/lib/constants/problem";
import {
  PROBLEM_STATUS_LABELS,
  PROBLEM_URGENCY_LABELS,
} from "@/lib/constants/problem";
import { EXPERIENCE_STATUS_LABELS } from "@/lib/constants/experience";
import type { SerializedProblem } from "@/lib/serializers/problem";
import type { SerializedExperience } from "@/lib/serializers/experience";
import type { SerializedSearchUser } from "@/lib/serializers/user-search";
import { cn } from "@/lib/utils";

type SearchType = "all" | "problems" | "experiences" | "circles" | "members";

interface SearchCircle {
  id: string;
  name: string;
  description: string;
  topic: string | null;
  province: string | null;
  capacity: number;
  status: string;
  createdAt: string;
  facilitatorLabel: string;
  memberCount: number;
}

interface SearchResponse {
  query: string;
  type: SearchType;
  problems: SerializedProblem[];
  experiences: SerializedExperience[];
  circles: SearchCircle[];
  members: SerializedSearchUser[];
  hasResults: boolean;
  suggestedTags: string[];
}

const TYPE_TABS: { value: SearchType; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "problems", label: "مسائل" },
  { value: "experiences", label: "تجربه‌ها" },
  { value: "circles", label: "حلقه‌ها" },
  { value: "members", label: "اعضا" },
];

function SuggestedTags({ onPick }: { onPick: (tag: string) => void }) {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/search", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { ok: boolean; data?: SearchResponse }) => {
        if (!active || !body.ok) return;
        setTags(body.data?.suggestedTags ?? []);
      })
      .catch(() => {
        // بی‌صدا
      });
    return () => {
      active = false;
    };
  }, []);

  if (tags.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="border-input bg-background text-muted-foreground hover:text-foreground rounded-full border px-3 py-1 text-sm"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function SearchExplorer() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("all");
  const [tag, setTag] = useState("");
  const [province, setProvince] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const hasSearched = useRef(false);

  const runSearch = useCallback(
    async (targetQuery: string) => {
      const params = new URLSearchParams();
      if (targetQuery.trim()) params.set("q", targetQuery.trim());
      params.set("type", type);
      if (tag) params.set("tag", tag);
      if (province) params.set("province", province);
      if (status) params.set("status", status);

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
        });
        const body = (await res.json()) as {
          ok: boolean;
          data?: SearchResponse;
          error?: { message: string };
        };
        if (!res.ok || !body.ok) {
          throw new Error(body.error?.message ?? "خطا در جست‌وجو");
        }
        setData(body.data ?? null);
        setSearched(true);
        hasSearched.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    },
    [type, tag, province, status],
  );

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void runSearch(query);
  };

  useEffect(() => {
    if (!hasSearched.current) return;
    void runSearch(query);
  }, [runSearch, query]);

  const hasActiveFilters = Boolean(tag || province || status);

  return (
    <div className="space-y-5">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="flex-1">
          <Input
            aria-label="عبارت جست‌وجو"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثلاً: واکسیناسیون، کمبود تجهیزات، آموزش سلامت..."
          />
        </div>
        <Button type="submit" loading={loading} disabled={!query.trim() && !hasActiveFilters}>
          جست‌وجو
        </Button>
      </form>

      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="نوع جست‌وجو"
      >
        {TYPE_TABS.map((item) => (
          <button
            key={item.value}
            role="tab"
            aria-selected={type === item.value}
            onClick={() => setType(item.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              type === item.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input bg-background text-muted-foreground hover:border-brand-300 hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="max-w-xs">
          <Select
            aria-label="فیلتر برچسب"
            value={tag}
            onChange={(event) => setTag(event.target.value)}
          >
            <option value="">همه برچسب‌ها</option>
            {PROBLEM_TAGS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        <div className="max-w-xs">
          <Select
            aria-label="فیلتر استان"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
          >
            <option value="">همه استان‌ها</option>
            {PROVINCES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        {(type === "all" || type === "problems") && (
          <div className="max-w-xs">
            <Select
              aria-label="فیلتر وضعیت مسئله"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">همه وضعیت‌ها</option>
              {(
                Object.keys(PROBLEM_STATUS_LABELS) as Array<
                  keyof typeof PROBLEM_STATUS_LABELS
                >
              ).map((key) => (
                <option key={key} value={key}>
                  {PROBLEM_STATUS_LABELS[key]}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {error && <EmptyState title="خطا در جست‌وجو" description={error} />}

      {loading && !data && (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              aria-hidden="true"
              className="border-border bg-muted/40 h-32 animate-pulse rounded-xl border"
            />
          ))}
        </div>
      )}

      {!loading && !searched && data === null && (
        <div className="border-border bg-card shadow-card rounded-xl border p-5">
          <p className="text-muted-foreground text-sm">
            برای یافتن دانش، عبارت، برچسب یا استان را وارد کنید. برچسب‌های
            دنبال‌شده‌تان پیشنهاد می‌شوند.
          </p>
          <SuggestedTags onPick={(value) => setTag(value)} />
        </div>
      )}

      {!loading && searched && data && !data.hasResults && (
        <EmptyState
          icon={<span aria-hidden="true">🔎</span>}
          title="نتیجه‌ای یافت نشد"
          description={
            query
              ? `برای «${query}» نتیجه‌ای پیدا نشد. عبارت را ساده‌تر کنید یا برچسب/استان دیگری را امتحان کنید.`
              : "فیلتری انتخاب کنید تا نتایج نمایش داده شود."
          }
        />
      )}

      {data && data.hasResults && (
        <div className="space-y-6">
          {data.problems.length > 0 &&
            (type === "all" || type === "problems") && (
              <section>
                <h2 className="text-foreground mb-2 text-sm font-bold">
                  مسائل ({data.problems.length})
                </h2>
                <div className="space-y-3">
                  {data.problems.map((problem) => (
                    <article
                      key={problem.id}
                      className="border-border bg-card shadow-card rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="brand">مسئله</Badge>
                        <Badge tone="neutral">
                          {PROBLEM_STATUS_LABELS[problem.status]}
                        </Badge>
                        <Badge tone="info">
                          {PROBLEM_URGENCY_LABELS[problem.urgency]}
                        </Badge>
                      </div>
                      <Link
                        href={`/problems/${problem.id}`}
                        className="text-foreground hover:text-brand-700 mt-2 block text-sm font-bold"
                      >
                        {problem.title}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {problem.isAnonymous
                          ? "ناشناس"
                          : (problem.author?.displayName ?? "بی‌نام")}
                        {" • "}
                        {formatRelativeTime(problem.createdAt)}
                        {" • "}
                        {problem.answerCount} پاسخ
                      </p>
                      {problem.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {problem.tags.map((item) => (
                            <Badge key={item} tone="neutral">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

          {data.experiences.length > 0 &&
            (type === "all" || type === "experiences") && (
              <section>
                <h2 className="text-foreground mb-2 text-sm font-bold">
                  تجربه‌ها ({data.experiences.length})
                </h2>
                <div className="space-y-3">
                  {data.experiences.map((experience) => (
                    <article
                      key={experience.id}
                      className="border-border bg-card shadow-card rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="success">تجربه</Badge>
                        <Badge tone="neutral">
                          {EXPERIENCE_STATUS_LABELS[experience.status]}
                        </Badge>
                      </div>
                      <Link
                        href={`/experiences/${experience.slug}`}
                        className="text-foreground hover:text-brand-700 mt-2 block text-sm font-bold"
                      >
                        {experience.title}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {experience.author?.displayName ?? "بی‌نام"}
                        {" • "}
                        {formatRelativeTime(experience.createdAt)}
                        {" • "}
                        {experience.reuseCount} اجرا
                      </p>
                      {experience.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {experience.tags.map((item) => (
                            <Badge key={item} tone="neutral">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

          {data.circles.length > 0 &&
            (type === "all" || type === "circles") && (
              <section>
                <h2 className="text-foreground mb-2 text-sm font-bold">
                  حلقه‌ها ({data.circles.length})
                </h2>
                <div className="space-y-3">
                  {data.circles.map((circle) => (
                    <article
                      key={circle.id}
                      className="border-border bg-card shadow-card rounded-xl border p-4"
                    >
                      <Link
                        href={`/circles/${circle.id}`}
                        className="text-foreground hover:text-brand-700 block text-sm font-bold"
                      >
                        {circle.name}
                      </Link>
                      {circle.description && (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          {circle.description}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-1 text-xs">
                        {circle.facilitatorLabel}
                        {" • "}
                        {circle.memberCount} عضو
                        {circle.province ? ` • ${circle.province}` : ""}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}

          {data.members.length > 0 && (type === "all" || type === "members") && (
            <section>
              <h2 className="text-foreground mb-2 text-sm font-bold">
                اعضا ({data.members.length})
              </h2>
              <div className="space-y-3">
                {data.members.map((member) => (
                  <article
                    key={member.id}
                    className="border-border bg-card shadow-card rounded-xl border p-4"
                  >
                    <Link
                      href={`/users/${member.id}`}
                      className="text-foreground hover:text-brand-700 flex items-center gap-2 text-sm font-bold"
                    >
                      {member.displayName ?? "بی‌نام"}
                      {member.isVerified && <Badge tone="success">تأییدشده</Badge>}
                    </Link>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {[member.province, member.city].filter(Boolean).join("، ") ||
                        "محل خدمت نامشخص"}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}