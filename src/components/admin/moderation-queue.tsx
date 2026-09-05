"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";
import { REPORT_STATUS_LABELS } from "@/lib/constants/problem";
import { EXPERIENCE_STATUS_LABELS } from "@/lib/constants/experience";
import type {
  SerializedProblem,
  SerializedReport,
} from "@/lib/serializers/problem";
import type { SerializedExperience } from "@/lib/serializers/experience";
import type { SerializedPeerReport } from "@/lib/serializers/peer";

interface ModerationQueueData {
  problems: SerializedProblem[];
  experiences: SerializedExperience[];
  reports: SerializedReport[];
  peerReports: SerializedPeerReport[];
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
    return body.data ?? { problems: [], experiences: [], reports: [], peerReports: [] };
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

  async function reviewPeerReport(id: string, action: "resolve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/peer-reports/${id}`, {
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

  async function moderateExperience(id: string, action: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/moderation/experiences/${id}`, {
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

  async function reviewExperience(id: string, action: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/experiences/${id}/review`, {
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
      toast({ title: "وضعیت تجربه به‌روزرسانی شد", tone: "success" });
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
        <h2 className="text-foreground mb-3 text-lg font-bold">
          تجربه‌های نیازمند بررسی
        </h2>
        {data.experiences.length === 0 ? (
          <EmptyState
            title="صف بررسی تجربه‌ها خالی است"
            description="تجربه‌ای در انتظار نظارت نیست."
          />
        ) : (
          <div className="space-y-3">
            {data.experiences.map((experience) => (
              <article
                key={experience.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/experiences/${experience.slug}`}
                    className="text-foreground hover:text-brand-700 text-sm font-bold"
                  >
                    {experience.title}
                  </a>
                  {experience.needsReview && (
                    <Badge tone="warning">نیاز به بررسی</Badge>
                  )}
                  {experience.status === "under_review" && (
                    <Badge tone="warning">در بررسی</Badge>
                  )}
                  {experience.moderation !== "visible" && (
                    <Badge tone="danger">غیرقابل‌نمایش</Badge>
                  )}
                  {experience.status === "featured" && (
                    <Badge tone="success">برگزیده</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {experience.author?.displayName ?? "بی‌نام"} {" • "}
                  {EXPERIENCE_STATUS_LABELS[experience.status]} {" • "}
                  {formatRelativeTime(experience.createdAt)}
                </p>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                  {experience.situation}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {experience.status === "under_review" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busyId === experience.id}
                      onClick={() =>
                        reviewExperience(experience.id, "approve")
                      }
                    >
                      تأیید (بررسی‌شده)
                    </Button>
                  )}
                  {experience.status !== "featured" &&
                    experience.status !== "under_review" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busyId === experience.id}
                        onClick={() =>
                          reviewExperience(experience.id, "feature")
                        }
                      >
                        برگزیده‌کردن
                      </Button>
                    )}
                  {experience.moderation === "visible" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busyId === experience.id}
                        onClick={() =>
                          moderateExperience(experience.id, "hide")
                        }
                      >
                        مخفی‌کردن
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        loading={busyId === experience.id}
                        onClick={() =>
                          moderateExperience(experience.id, "remove")
                        }
                      >
                        حذف
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busyId === experience.id}
                      onClick={() =>
                        moderateExperience(experience.id, "unhide")
                      }
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
    <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">
          گزارش‌های همکاری
        </h2>
        {data.peerReports.length === 0 ? (
          <EmptyState
            title="گزارشی در انتظار نیست"
            description="گزارش‌های سوءاستفاده در همکاری‌ها اینجا ظاهر می‌شوند."
          />
        ) : (
          <div className="space-y-3">
            {data.peerReports.map((report) => (
              <article
                key={report.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground text-sm font-bold">
                    {report.targetLabel}
                  </h3>
                  <Badge tone="warning">در انتظار</Badge>
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
                    onClick={() => reviewPeerReport(report.id, "resolve")}
                  >
                    تأیید گزارش
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busyId === report.id}
                    onClick={() => reviewPeerReport(report.id, "reject")}
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
