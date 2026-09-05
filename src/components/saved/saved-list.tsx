"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SaveButton } from "@/components/interactions/save-button";
import { formatRelativeTime } from "@/lib/dates";
import { PROBLEM_STATUS_LABELS } from "@/lib/constants/problem";
import { EXPERIENCE_STATUS_LABELS } from "@/lib/constants/experience";
import type { SerializedProblem } from "@/lib/serializers/problem";
import type { SerializedExperience } from "@/lib/serializers/experience";

interface SavedItem {
  id: string;
  targetType: "problem" | "experience";
  savedAt: string;
  problem: SerializedProblem | null;
  experience: SerializedExperience | null;
}

export function SavedList() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/saved")
      .then((res) => res.json())
      .then(
        (
          body: {
            ok: boolean;
            data?: { items: SavedItem[] };
            error?: { message: string };
          },
        ) => {
          if (cancelled) return;
          if (!body.ok) {
            setError(body.error?.message ?? "خطا در دریافت خواندنی‌ها");
            return;
          }
          setItems(body.data?.items ?? []);
        },
      )
      .catch(() => {
        if (!cancelled) setError("خطا در ارتباط با سرور");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function removeItem(
    targetType: "problem" | "experience",
    targetId: string,
  ) {
    setItems((current) =>
      current.filter(
        (item) =>
          !(
            (item.targetType === targetType &&
              item.problem?.id === targetId) ||
            item.experience?.id === targetId
          ),
      ),
    );
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="چیزی ذخیره نکرده‌اید"
          description="از صفحه هر مسئله یا تجربه، دکمه «ذخیره» را بزنید تا اینجا بیاید."
        />
      ) : (
        items.map((item) => {
          if (item.targetType === "problem" && item.problem) {
            const problem = item.problem;
            return (
              <article
                key={item.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">مسئله</Badge>
                  <Badge tone="neutral">
                    {PROBLEM_STATUS_LABELS[problem.status]}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    ذخیره {formatRelativeTime(item.savedAt)}
                  </span>
                  <div className="mr-auto">
                    <SaveButton
                      targetType="problem"
                      targetId={problem.id}
                      saved
                      onToggle={() => removeItem("problem", problem.id)}
                    />
                  </div>
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
                  {problem.answerCount} پاسخ
                </p>
              </article>
            );
          }

          if (item.targetType === "experience" && item.experience) {
            const experience = item.experience;
            return (
              <article
                key={item.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="success">تجربه</Badge>
                  <Badge tone="neutral">
                    {EXPERIENCE_STATUS_LABELS[experience.status]}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    ذخیره {formatRelativeTime(item.savedAt)}
                  </span>
                  <div className="mr-auto">
                    <SaveButton
                      targetType="experience"
                      targetId={experience.id}
                      saved
                      onToggle={() => removeItem("experience", experience.id)}
                    />
                  </div>
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
                  {experience.reuseCount} اجرا
                </p>
              </article>
            );
          }

          return null;
        })
      )}
    </div>
  );
}