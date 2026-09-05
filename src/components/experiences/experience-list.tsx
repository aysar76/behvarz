"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { EXPERIENCE_TAGS } from "@/lib/constants/experience";
import { cn } from "@/lib/utils";
import type { ExperienceStatus } from "@/generated/prisma/client";
import type { SerializedExperience } from "@/lib/serializers/experience";

type StatusFilter = "all" | ExperienceStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "featured", label: "برگزیده" },
  { value: "reviewed", label: "بررسی‌شده" },
  { value: "user_generated", label: "تجربه شخصی" },
  { value: "under_review", label: "در بررسی" },
  { value: "archived", label: "بایگانی‌شده" },
];

export function ExperienceList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const drafts = searchParams.get("drafts") === "1";

  const [status, setStatus] = useState<StatusFilter>("all");
  const [tag, setTag] = useState("");
  const [experiences, setExperiences] = useState<SerializedExperience[] | null>(
    null,
  );
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (
      targetPage: number,
    ): Promise<{
      experiences: SerializedExperience[];
      hasMore: boolean;
    }> => {
      const params = new URLSearchParams({ page: String(targetPage) });
      if (status !== "all") params.set("status", status);
      if (tag) params.set("tag", tag);
      if (drafts) params.set("drafts", "1");

      const res = await fetch(`/api/experiences?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { experiences: SerializedExperience[]; hasMore: boolean };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error?.message ?? "خطا در دریافت تجربه‌ها");
      }
      return {
        experiences: body.data?.experiences ?? [],
        hasMore: body.data?.hasMore ?? false,
      };
    },
    [status, tag, drafts],
  );

  const load = useCallback(
    async (targetPage: number, append: boolean) => {
      setError(null);
      setLoading(true);
      if (!append) setExperiences(null);
      try {
        const result = await fetchPage(targetPage);
        setExperiences((current) =>
          append && current
            ? [...current, ...result.experiences]
            : result.experiences,
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
        setExperiences(result.experiences);
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
    router.replace(next ? "/experiences?drafts=1" : "/experiences");
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
            {EXPERIENCE_TAGS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && <EmptyState title="خطا در بارگذاری" description={error} />}

      {!error && experiences === null && (
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

      {!error && experiences !== null && experiences.length === 0 && (
        <EmptyState
          icon={<Icon name="book" className="size-6" />}
          title={drafts ? "پیش‌نویسی ندارید" : "هنوز تجربه‌ای ثبت نشده"}
          description={
            drafts
              ? "تجربه‌هایی که پیش‌نویس نگه داشته‌اید اینجا ظاهر می‌شوند."
              : "اولین تجربه میدانی خود را با جامعه در میان بگذارید."
          }
          action={
            <Link href="/experiences/new">
              <Button>{drafts ? "ثبت تجربه" : "ثبت تجربه میدانی"}</Button>
            </Link>
          }
        />
      )}

      {experiences !== null && experiences.length > 0 && (
        <div className="space-y-3">
          {experiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
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