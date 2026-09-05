"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";
import { REPORT_STATUS_LABELS } from "@/lib/constants/problem";
import type {
  SerializedProblem,
  SerializedReport,
} from "@/lib/serializers/problem";

interface ModerationQueueData {
  problems: SerializedProblem[];
  reports: SerializedReport[];
}

export function ModerationQueue() {
  const { toast } = useToast();
  const [data, setData] = useState<ModerationQueueData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchQueue = useCallback(async (): Promise<ModerationQueueData> => {
    const res = await fetch("/api/admin/moderation", { cache: "no-store" });
    const body = (await res.json()) as {
      ok: boolean;
      data?: ModerationQueueData;
      error?: { message: string };
    };
    if (!res.ok || !body.ok) {
      throw new Error(body.error?.message ?? "خطا در دریافت صف بررسی");
    }
    return body.data ?? { problems: [], reports: [] };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchQueue());
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
    }
  }, [fetchQueue]);

  useEffect(() => {
    let active = true;
    fetchQueue()
      .then((items) => {
        if (active) setData(items);
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
  }, [fetchQueue]);

  async function moderateProblem(id: string, action: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/moderation/problems/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در نظارت", tone: "danger" });
        return;
      }
      toast({ title: "اقدام نظارت ثبت شد", tone: "success" });
      await load();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setBusyId(null);
    }
  }

  async function reviewReport(id: string, action: "resolve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در بررسی", tone: "danger" });
        return;
      }
      toast({ title: "گزارش بررسی شد", tone: "success" });
      await load();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <EmptyState title="خطا در بارگذاری" description={error} />;
  }

  if (!data) {
    return (
      <div className="space-y-3">
        {[0, 1].map((item) => (
          <div
            key={item}
            aria-hidden="true"
            className="border-border bg-muted/40 h-28 animate-pulse rounded-xl border"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">
          مسائل نیازمند بررسی
        </h2>
        {data.problems.length === 0 ? (
          <EmptyState
            title="صف بررسی خالی است"
            description="مسئله‌ای در انتظار نظارت نیست."
          />
        ) : (
          <div className="space-y-3">
            {data.problems.map((problem) => (
              <article
                key={problem.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground text-sm font-bold">
                    {problem.title}
                  </h3>
                  {problem.needsReview && (
                    <Badge tone="warning">نیاز به بررسی</Badge>
                  )}
                  {problem.moderation !== "visible" && (
                    <Badge tone="danger">غیرقابل‌نمایش</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {problem.isAnonymous
                    ? "ناشناس"
                    : (problem.author?.displayName ?? "بی‌نام")}
                  {" • "}
                  {formatRelativeTime(problem.createdAt)}
                </p>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                  {problem.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {problem.moderation === "visible" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busyId === problem.id}
                        onClick={() => moderateProblem(problem.id, "hide")}
                      >
                        مخفی‌کردن
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        loading={busyId === problem.id}
                        onClick={() => moderateProblem(problem.id, "remove")}
                      >
                        حذف
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busyId === problem.id}
                      onClick={() => moderateProblem(problem.id, "unhide")}
                    >
                      نمایش دوباره
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">گزارش‌ها</h2>
        {data.reports.length === 0 ? (
          <EmptyState
            title="گزارشی در انتظار نیست"
            description="گزارش‌های کاربران اینجا ظاهر می‌شوند."
          />
        ) : (
          <div className="space-y-3">
            {data.reports.map((report) => (
              <article
                key={report.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground text-sm font-bold">
                    {report.targetLabel}
                  </h3>
                  <Badge tone="warning">
                    {REPORT_STATUS_LABELS[report.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  گزارش توسط {report.reporterLabel} •{" "}
                  {formatRelativeTime(report.createdAt)}
                </p>
                <p className="text-foreground mt-2 text-sm">
                  دلیل: {report.reason}
                </p>
                {report.note && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    توضیح: {report.note}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busyId === report.id}
                    onClick={() => reviewReport(report.id, "resolve")}
                  >
                    تأیید گزارش
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busyId === report.id}
                    onClick={() => reviewReport(report.id, "reject")}
                  >
                    رد گزارش
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
