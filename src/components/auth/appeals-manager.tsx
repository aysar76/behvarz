"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";
import { MODERATION_ACTION_LABELS, MODERATION_TARGET_LABELS } from "@/lib/constants/moderation";

interface AppealItem {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  decisionNote: string | null;
  createdAt: string;
  decidedAt: string | null;
}

interface DecisionItem {
  id: string;
  moderatorLabel: string;
  targetType: string;
  targetId: string;
  action: string;
  reason: string | null;
  createdAt: string;
}

const APPEAL_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  approved: "پذیرفته‌شده",
  rejected: "ردشده",
};

const APPEAL_STATUS_TONES: Record<string, "neutral" | "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export function AppealsManager() {
  const { toast } = useToast();
  const [appeals, setAppeals] = useState<AppealItem[] | null>(null);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [targetType, setTargetType] = useState("problem");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");

  const fetchAppeals = useCallback(async (): Promise<{
    appeals: AppealItem[];
    decisions: DecisionItem[];
  }> => {
    const res = await fetch("/api/appeals", { cache: "no-store" });
    const body = (await res.json()) as {
      ok: boolean;
      data?: { appeals: AppealItem[]; decisions: DecisionItem[] };
      error?: { message: string };
    };
    if (!res.ok || !body.ok) {
      throw new Error(body.error?.message ?? "خطا در دریافت اعتراض‌ها");
    }
    return {
      appeals: body.data?.appeals ?? [],
      decisions: body.data?.decisions ?? [],
    };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAppeals();
      setAppeals(data.appeals);
      setDecisions(data.decisions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
    }
  }, [fetchAppeals]);

  useEffect(() => {
    let active = true;
    fetchAppeals()
      .then((data) => {
        if (active) {
          setAppeals(data.appeals);
          setDecisions(data.decisions);
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
  }, [fetchAppeals]);

  async function submitAppeal() {
    if (targetType !== "account" && !targetId.trim()) {
      toast({ title: "شناسه هدف را وارد کنید", tone: "danger" });
      return;
    }
    if (reason.trim().length < 10) {
      toast({ title: "توضیح اعتراض باید حداقل ۱۰ کاراکتر باشد", tone: "danger" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId: targetType === "account" ? undefined : targetId.trim(),
          reason,
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در ثبت اعتراض", tone: "danger" });
        return;
      }
      toast({ title: "اعتراض ثبت شد", tone: "success" });
      setReason("");
      await load();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="border-border bg-card shadow-card rounded-xl border p-5">
        <h2 className="text-foreground mb-1 text-lg font-bold">
          ثبت اعتراض جدید
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          اگر فکر می‌کنید تصمیمی درباره محتوای شما یا وضعیت حساب شما نادرست
          بوده، می‌توانید اعتراض ثبت کنید. ناظران بررسی می‌کنند.
        </p>
        <div className="space-y-3">
          <Select
            value={targetType}
            onChange={(event) => setTargetType(event.target.value)}
            aria-label="نوع هدف"
          >
            <option value="problem">مسئله</option>
            <option value="answer">پاسخ</option>
            <option value="experience">تجربه</option>
            <option value="account">وضعیت حساب من</option>
          </Select>
          {targetType !== "account" && (
            <Input
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              placeholder="شناسه محتوا (از آدرس صفحه مسئله/تجربه)"
              dir="ltr"
            />
          )}
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="توضیح دهید چرا این تصمیم را نادرست می‌دانید..."
            rows={4}
          />
          <Button onClick={submitAppeal} loading={submitting}>
            ثبت اعتراض
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">اعتراض‌های من</h2>
        {error ? (
          <EmptyState title="خطا در بارگذاری" description={error} />
        ) : appeals === null ? (
          <div className="space-y-3">
            {[0, 1].map((item) => (
              <div
                key={item}
                aria-hidden="true"
                className="border-border bg-muted/40 h-24 animate-pulse rounded-xl border"
              />
            ))}
          </div>
        ) : appeals.length === 0 ? (
          <EmptyState
            title="اعتراضی ثبت نکرده‌اید"
            description="اعتراض‌های شما اینجا نمایش داده می‌شود."
          />
        ) : (
          <div className="space-y-3">
            {appeals.map((appeal) => (
              <article
                key={appeal.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground text-sm font-bold">
                    {MODERATION_TARGET_LABELS[appeal.targetType] ?? appeal.targetType}{" "}
                    <span dir="ltr" className="text-muted-foreground">
                      #{appeal.targetId}
                    </span>
                  </h3>
                  <Badge tone={APPEAL_STATUS_TONES[appeal.status] ?? "neutral"}>
                    {APPEAL_STATUS_LABELS[appeal.status] ?? appeal.status}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeTime(appeal.createdAt)}
                  </span>
                </div>
                <p className="text-foreground mt-2 text-sm">{appeal.reason}</p>
                {appeal.decisionNote && (
                  <p className="bg-accent text-accent-foreground mt-2 rounded-md px-3 py-2 text-xs">
                    پاسخ ناظر: {appeal.decisionNote}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {decisions.length > 0 && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            تصمیم‌های ناظر درباره حساب من
          </h2>
          <div className="space-y-3">
            {decisions.map((decision) => (
              <article
                key={decision.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">
                    {MODERATION_ACTION_LABELS[decision.action] ?? decision.action}
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
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}