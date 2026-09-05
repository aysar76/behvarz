"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/dates";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/constants/notification";
import type { NotificationType } from "@/generated/prisma/client";
import type { SerializedProblem } from "@/lib/serializers/problem";
import type { SerializedExperience } from "@/lib/serializers/experience";
import { cn } from "@/lib/utils";

interface SerializedNotification {
  id: string;
  type: NotificationType;
  actorLabel: string | null;
  title: string;
  body: string | null;
  targetType: "problem" | "answer" | "experience" | "circle" | "cooperation" | "appeal" | "budget_proposal" | "benefit_provider" | null;
  targetId: string | null;
  read: boolean;
  createdAt: string;
  problem: SerializedProblem | null;
  experience: SerializedExperience | null;
}

interface NotificationsResponse {
  notifications: SerializedNotification[];
  unreadCount: number;
}

function targetHref(item: SerializedNotification): string | null {
  if (item.targetType === "problem" && item.problem) {
    return `/problems/${item.problem.id}`;
  }
  if (item.targetType === "experience" && item.experience) {
    return `/experiences/${item.experience.slug}`;
  }
  if (item.targetType === "circle" && item.targetId) {
    return `/circles/${item.targetId}`;
  }
  if (item.targetType === "cooperation" && item.targetId) {
    return `/peer/cooperations/${item.targetId}`;
  }
  if (item.targetType === "appeal") {
    return "/appeals";
  }
  if (item.targetType === "budget_proposal") {
    return "/budget";
  }
  if (item.targetType === "benefit_provider") {
    return "/benefits";
  }
  if (item.targetType === "answer" && item.problem) {
    return `/problems/${item.problem.id}`;
  }
  return null;
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<
    SerializedNotification[] | null
  >(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const body = (await res.json()) as {
        ok: boolean;
        data?: NotificationsResponse;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در دریافت اعلان‌ها");
        return false;
      }
      setNotifications(body.data?.notifications ?? []);
      setUnreadCount(body.data?.unreadCount ?? 0);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/notifications", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { ok: boolean; data?: NotificationsResponse }) => {
        if (!active) return;
        if (body.ok) {
          setNotifications(body.data?.notifications ?? []);
          setUnreadCount(body.data?.unreadCount ?? 0);
        } else {
          setError("خطا در دریافت اعلان‌ها");
        }
      })
      .catch(() => {
        if (active) setError("خطا در ارتباط با سرور");
      });
    return () => {
      active = false;
    };
  }, []);

  async function markRead(id?: string) {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    });
    const body = (await res.json()) as { ok: boolean };
    if (!body.ok) return;
    await fetchData();
  }

  if (error) {
    return <EmptyState title="خطا در بارگذاری" description={error} />;
  }

  if (notifications === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            aria-hidden="true"
            className="border-border bg-muted/40 h-24 animate-pulse rounded-xl border"
          />
        ))}
      </div>
    );
  }

  if (notifications !== null && notifications.length === 0) {
    return (
      <EmptyState
        icon={<span aria-hidden="true">🔔</span>}
        title="اعلانی ندارید"
        description="وقتی کسی به مسئله شما پاسخ دهد، راهکارتان انتخاب شود یا شما را به حلقه دعوت کنند، اعلان می‌گیرید."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {unreadCount > 0 && (
          <Badge tone="brand">{unreadCount} خوانده‌نشده</Badge>
        )}
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={() => void markRead()}>
            خواندن همه
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications?.map((item) => {
          const href = targetHref(item);
          const inner = (
            <article
              className={cn(
                "border-border bg-card shadow-card rounded-xl border p-4",
                !item.read && "border-brand-300 bg-brand-50/40",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={item.read ? "neutral" : "brand"}>
                  {NOTIFICATION_TYPE_LABELS[item.type]}
                </Badge>
                {!item.read && <Badge tone="info">جدید</Badge>}
              </div>
              <h3 className="text-foreground mt-2 text-sm font-bold">
                {item.title}
              </h3>
              {item.body && (
                <p className="text-muted-foreground mt-1 text-xs">{item.body}</p>
              )}
              <p className="text-muted-foreground mt-2 text-xs">
                {item.actorLabel ? `${item.actorLabel} • ` : ""}
                {formatRelativeTime(item.createdAt)}
              </p>
            </article>
          );
          return (
            <div key={item.id}>
              {href ? (
                <Link
                  href={href}
                  onClick={() => {
                    if (!item.read) void markRead(item.id);
                  }}
                  className="block"
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!item.read) void markRead(item.id);
                  }}
                  className="block w-full text-right"
                >
                  {inner}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}