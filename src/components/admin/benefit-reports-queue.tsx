"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";
import { BENEFIT_REPORT_STATUS_TONES } from "@/lib/constants/benefits";

interface BenefitReportItem {
  id: string;
  providerId: string;
  providerName: string;
  providerEmoji: string | null;
  reporterName: string | null;
  reason: string;
  reasonLabel: string;
  note: string | null;
  status: string;
  statusLabel: string;
  moderatorNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export function BenefitReportsQueue({
  initialReports,
}: {
  initialReports: BenefitReportItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [reports] = useState(initialReports);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function review(reportId: string, status: string) {
    setPending((current) => ({ ...current, [reportId]: true }));
    try {
      const res = await fetch(`/api/admin/benefits/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, moderatorNote: notes[reportId] || undefined }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در ثبت نتیجه", tone: "danger" });
        return;
      }
      toast({
        title: status === "resolved" ? "گزارش بررسی‌شده ثبت شد" : "گزارش رد شد",
        tone: "success",
      });
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setPending((current) => ({ ...current, [reportId]: false }));
    }
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="list" className="size-6" />}
        title="گزارشی در انتظار نیست"
        description="وقتی عضوی از مزیتی گزارش مشکل ثبت کند، اینجا دیده می‌شود."
      />
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => {
        const tone =
          BENEFIT_REPORT_STATUS_TONES[
            report.status as keyof typeof BENEFIT_REPORT_STATUS_TONES
          ] ?? "neutral";
        const isPending = report.status === "pending";
        return (
          <article
            key={report.id}
            className="border-border bg-card shadow-card rounded-xl border p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span aria-hidden="true">{report.providerEmoji ?? "🏢"}</span>
                <span className="text-foreground font-semibold">
                  {report.providerName}
                </span>
                <Badge tone="info">{report.reasonLabel}</Badge>
                <Badge tone={tone}>{report.statusLabel}</Badge>
              </div>
              <span className="text-muted-foreground text-xs">
                {report.reporterName ?? "بی‌نام"} • {formatRelativeTime(report.createdAt)}
              </span>
            </div>

            {report.note && (
              <p className="text-muted-foreground mt-2 text-sm">{report.note}</p>
            )}

            {report.moderatorNote && (
              <p className="bg-muted/50 text-muted-foreground mt-2 rounded-md p-2 text-xs">
                یادداشت ناظر: {report.moderatorNote}
              </p>
            )}

            {isPending ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={notes[report.id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [report.id]: event.target.value,
                    }))
                  }
                  placeholder="یادداشت ناظر (اختیاری)"
                  maxLength={1000}
                  className="border-input bg-background focus-visible:outline-ring min-w-0 flex-1 rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void review(report.id, "resolved")}
                  loading={pending[report.id]}
                >
                  بررسی‌شده
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void review(report.id, "rejected")}
                  disabled={pending[report.id]}
                >
                  رد
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground mt-2 text-xs">
                نتیجه در {formatRelativeTime(report.reviewedAt ?? report.createdAt)}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}