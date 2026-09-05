"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/dates";
import {
  MODERATION_ACTION_LABELS,
  MODERATION_TARGET_LABELS,
} from "@/lib/constants/moderation";

interface DecisionItem {
  id: string;
  moderatorLabel: string;
  targetType: string;
  targetId: string;
  action: string;
  reason: string | null;
  note: string | null;
  createdAt: string;
}

const ACTION_TONES: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  warn: "warning",
  restrict: "warning",
  suspend: "danger",
  lift: "success",
  hide_content: "info",
  unhide_content: "success",
  remove_content: "danger",
  restore_content: "success",
};

export function DecisionsHistory() {
  const [decisions, setDecisions] = useState<DecisionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchDecisions = useCallback(
    async (pageNumber: number): Promise<{ decisions: DecisionItem[]; total: number }> => {
      const res = await fetch(`/api/admin/decisions?page=${pageNumber}`, {
        cache: "no-store",
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { decisions: DecisionItem[]; total: number };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error?.message ?? "خطا در دریافت تاریخچه");
      }
      return {
        decisions: body.data?.decisions ?? [],
        total: body.data?.total ?? 0,
      };
    },
    [],
  );

  useEffect(() => {
    let active = true;
    fetchDecisions(page)
      .then((data) => {
        if (active) {
          setDecisions(data.decisions);
          setTotal(data.total);
        }
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
  }, [page, fetchDecisions]);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        مجموع {total} تصمیم ثبت‌شده.
      </p>

      {error ? (
        <EmptyState title="خطا در بارگذاری" description={error} />
      ) : decisions === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              aria-hidden="true"
              className="border-border bg-muted/40 h-16 animate-pulse rounded-xl border"
            />
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <EmptyState
          title="تصمیمی ثبت نشده است"
          description="اقدامات نظارتی انجام‌شده اینجا نمایش داده می‌شود."
        />
      ) : (
        <>
          <div className="space-y-3">
            {decisions.map((decision) => (
              <article
                key={decision.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={ACTION_TONES[decision.action] ?? "neutral"}>
                    {MODERATION_ACTION_LABELS[decision.action] ?? decision.action}
                  </Badge>
                  <Badge tone="neutral">
                    {MODERATION_TARGET_LABELS[decision.targetType] ??
                      decision.targetType}{" "}
                    <span dir="ltr">#{decision.targetId}</span>
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    توسط {decision.moderatorLabel} •{" "}
                    {formatRelativeTime(decision.createdAt)}
                  </span>
                </div>
                {decision.reason && (
                  <p className="text-foreground mt-2 text-sm">
                    دلیل: {decision.reason}
                  </p>
                )}
                {decision.note && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    یادداشت: {decision.note}
                  </p>
                )}
              </article>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="border-border bg-card text-foreground rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              قبلی
            </button>
            <span className="text-muted-foreground text-sm">صفحه {page}</span>
            <button
              type="button"
              className="border-border bg-card text-foreground rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              disabled={page * 20 >= total}
              onClick={() => setPage((value) => value + 1)}
            >
              بعدی
            </button>
          </div>
        </>
      )}
    </div>
  );
}