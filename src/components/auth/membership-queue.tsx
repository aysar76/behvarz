"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

interface MembershipRequestItem {
  id: string;
  createdAt: string;
  note: string | null;
  user: {
    id: string;
    phone: string;
    displayName: string | null;
    province: string | null;
    city: string | null;
    workYears: string | null;
    bio: string | null;
    createdAt: string;
  };
}

export function MembershipQueue() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<MembershipRequestItem[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async (): Promise<
    MembershipRequestItem[]
  > => {
    const res = await fetch("/api/admin/memberships", { cache: "no-store" });
    const body = (await res.json()) as {
      ok: boolean;
      data?: { requests: MembershipRequestItem[] };
      error?: { message: string };
    };
    if (!res.ok || !body.ok) {
      throw new Error(body.error?.message ?? "خطا در دریافت درخواست‌ها");
    }
    return body.data?.requests ?? [];
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRequests(await fetchRequests());
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
    }
  }, [fetchRequests]);

  useEffect(() => {
    let active = true;
    fetchRequests()
      .then((items) => {
        if (active) setRequests(items);
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
  }, [fetchRequests]);

  async function review(id: string, action: "approve" | "reject") {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/memberships/${id}`, {
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
      toast({
        title: action === "approve" ? "عضویت تأیید شد" : "درخواست رد شد",
        tone: action === "approve" ? "success" : "info",
      });
      await load();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setProcessingId(null);
    }
  }

  if (error) {
    return <EmptyState title="خطا در بارگذاری" description={error} />;
  }

  if (requests === null) {
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

  if (requests.length === 0) {
    return (
      <EmptyState
        title="درخواست در انتظار ندارید"
        description="درخواست‌های جدید تأیید عضویت اینجا ظاهر می‌شوند."
      />
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <article
          key={request.id}
          className="border-border bg-card shadow-card rounded-xl border p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-foreground text-base font-bold">
              {request.user.displayName ?? "بی‌نام"}
            </h2>
            <Badge tone="warning">در انتظار بررسی</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm" dir="ltr">
            {request.user.phone}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {[request.user.province, request.user.city]
              .filter(Boolean)
              .join("، ") || "محل خدمت ثبت نشده"}
            {request.user.workYears
              ? ` • سابقه: ${request.user.workYears}`
              : ""}
          </p>
          {request.user.bio && (
            <p className="text-muted-foreground mt-2 text-sm">
              {request.user.bio}
            </p>
          )}
          {request.note && (
            <p className="bg-accent text-accent-foreground mt-2 rounded-md px-3 py-2 text-xs">
              یادداشت: {request.note}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              loading={processingId === request.id}
              onClick={() => review(request.id, "approve")}
            >
              تأیید عضویت
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={processingId === request.id}
              onClick={() => review(request.id, "reject")}
            >
              رد درخواست
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
