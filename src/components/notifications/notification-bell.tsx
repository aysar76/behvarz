"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/auth/session-provider";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export function NotificationBell() {
  const { user } = useSession();
  const pathname = usePathname();
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch("/api/notifications?limit=1", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { ok: boolean; data?: { unreadCount: number } }) => {
        if (!active || !body.ok) return;
        setUnread(body.data?.unreadCount ?? 0);
      })
      .catch(() => {
        // بی‌صدا
      });
    return () => {
      active = false;
    };
  }, [user, pathname]);

  const isActive = pathname === "/notifications";

  return (
    <Link
      href="/notifications"
      aria-label="اعلان‌ها"
      title="اعلان‌ها"
      className={cn(
        "text-muted-foreground hover:bg-muted hover:text-foreground relative flex size-10 items-center justify-center rounded-lg transition-colors",
        isActive && "bg-brand-50 text-brand-800",
      )}
    >
      <Icon name="bell" className="size-[18px]" />
      {unread !== null && unread > 0 && (
        <span className="bg-destructive text-destructive-foreground absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2 ring-background">
          {unread > 9 ? "۹+" : unread}
        </span>
      )}
    </Link>
  );
}