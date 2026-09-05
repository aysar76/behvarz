"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/dates";
import { ACCOUNT_STATUS_LABELS, MODERATION_TARGET_LABELS } from "@/lib/constants/moderation";

interface AppealQueueItem {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  decisionNote: string | null;
  createdAt: string;
  user: {
    id: string;
    displayName: string | null;
    phone: string;
    accountStatus: string;
  };
}

export function AdminAppealsQueue() {
  const { toast } = useToast();
  const [appeals, setAppeals] = useState<AppealQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const fetchAppeals = useCallback(async (): Promise<AppealQueueItem[]> => {
    const res = await fetch("/api/admin/appeals", { cache: "no-store" });
    const body = (await res.json()) as {
      ok: boolean;
      data?: { appeals: AppealQueueItem[] };
      error?: { message: string };
    };
    if (!res.ok || !body.ok) {
      throw new Error(body.error?.message ?? "خطا در دریافت اعتراض‌ها");
    }
    return body.data?.appeals ?? [];
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      setAppeals(await fetchAppeals());
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
    }
  }, [fetchAppeals]);

  useEffect(() => {
    let active = true;
    fetchAppeals()
      .then((items) => {
        if (active) setAppeals(items);
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

  async function decide(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/appeals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note[id]?.trim() }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در بررسی", tone: "danger" });
        return;
      }
      toast({
        title: action === "approve" ? "اعتراض پذیرفته شد" : "اعتراض رد شد",
        tone: action === "approve" ? "success" : "info",
      });
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

  if (appeals === null) {
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

  if (appeals.length === 0) {
    return (
      <EmptyState
        title="اعتراض در انتظار ندارید"
        description="اعتراض‌های جدید کاربران اینجا ظاهر می‌شوند."
      />
    );
  }

  return (
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
            <Badge tone="warning">در انتظار</Badge>
            <Badge tone="neutral">
              {ACCOUNT_STATUS_LABELS[
                appeal.user.accountStatus as keyof typeof ACCOUNT_STATUS_LABELS
              ] ?? appeal.user.accountStatus}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            توسط {appeal.user.displayName ?? "بی‌نام"} ({appeal.user.phone}) •{" "}
            {formatRelativeTime(appeal.createdAt)}
          </p>
          <p className="text-foreground mt-2 text-sm">{appeal.reason}</p>
          <div className="mt-3 space-y-2">
            <Input
              value={note[appeal.id] ?? ""}
              onChange={(event) =>
                setNote((prev) => ({
                  ...prev,
                  [appeal.id]: event.target.value,
                }))
              }
              placeholder="یادداشت تصمیم (اختیاری)..."
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                loading={busyId === appeal.id}
                onClick={() => decide(appeal.id, "approve")}
              >
                پذیرش اعتراض
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === appeal.id}
                onClick={() => decide(appeal.id, "reject")}
              >
                رد اعتراض
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}