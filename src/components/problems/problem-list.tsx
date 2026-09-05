"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { ProblemCard } from "@/components/problems/problem-card";
import { PROBLEM_TAGS } from "@/lib/constants/problem";
import { cn } from "@/lib/utils";
import type { ProblemStatus } from "@/generated/prisma/client";
import type { SerializedProblem } from "@/lib/serializers/problem";

type StatusFilter = "all" | ProblemStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "open", label: "باز" },
  { value: "discussing", label: "در حال بررسی" },
  { value: "solved", label: "حل‌شده" },
  { value: "archived", label: "بایگانی‌شده" },
];

export function ProblemList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const drafts = searchParams.get("drafts") === "1";

  const [status, setStatus] = useState<StatusFilter>("all");
  const [tag, setTag] = useState("");
  const [problems, setProblems] = useState<SerializedProblem[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (
      targetPage: number,
    ): Promise<{
      problems: SerializedProblem[];
      hasMore: boolean;
    }> => {
      const params = new URLSearchParams({ page: String(targetPage) });
      if (status !== "all") params.set("status", status);
      if (tag) params.set("tag", tag);
      if (drafts) params.set("drafts", "1");

      const res = await fetch(`/api/problems?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { problems: SerializedProblem[]; hasMore: boolean };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error?.message ?? "خطا در دریافت مسائل");
      }
      return {
        problems: body.data?.problems ?? [],
        hasMore: body.data?.hasMore ?? false,
      };
    },
    [status, tag, drafts],
  );

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      setError(null);
      setLoading(true);
      if (!append) setProblems(null);
      try {
        const result = await fetchPage(targetPage);
        setProblems((current) =>
          append && current
            ? [...current, ...result.problems]
            : result.problems,
        );
        setHasMore(result.hasMore);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    let active = true;
    fetchPage(1)
      .then((result) => {
        if (!active) return;
        setProblems(result.problems);
        setHasMore(result.hasMore);
        setPage(1);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "خطا در ارتباط با سرور",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [fetchPage]);

  function toggleDrafts() {
    const next = !drafts;
    router.replace(next ? "/problems?drafts=1" : "/problems");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="فیلتر وضعیت"
          >
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.value}
                role="tab"
                aria-selected={status === item.value}
                onClick={() => setStatus(item.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  status === item.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input bg-background text-muted-foreground hover:border-brand-300 hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleDrafts}
            aria-pressed={drafts}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              drafts
                ? "bg-brand-100 text-brand-800 border-brand-300"
                : "border-input bg-background text-muted-foreground hover:border-brand-300 hover:text-foreground",
            )}
          >
            پیش‌نویس‌های من
          </button>
        </div>

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
      </div>

      {error && <EmptyState title="خطا در بارگذاری" description={error} />}

      {!error && problems === null && (
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

      {!error && problems !== null && problems.length === 0 && (
        <EmptyState
          icon={<Icon name="question" className="size-6" />}
          title={drafts ? "پیش‌نویسی ندارید" : "هنوز مسئله‌ای ثبت نشده"}
          description={
            drafts
              ? "مسئله‌هایی که پیش‌نویس نگه داشته‌اید اینجا ظاهر می‌شوند."
              : "اولین کسی باشید که مسئله واقعی خود را با جامعه در میان می‌گذارد."
          }
          action={
            <Link href="/problems/new">
              <Button>{drafts ? "ثبت مسئله" : "مطرح‌کردن مسئله"}</Button>
            </Link>
          }
        />
      )}

      {problems !== null && problems.length > 0 && (
        <div className="space-y-3">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                loading={loading}
                onClick={() => void load(page + 1, true)}
              >
                نمایش موارد بیشتر
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
