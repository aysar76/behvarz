"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/auth/session-provider";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";

const menuItems: { label: string; href: string; icon: IconName }[] = [
  { label: "پروفایل من", href: "/me", icon: "user" },
  { label: "داشبورد رشد من", href: "/growth", icon: "chart" },
  { label: "آکادمی یادگیری", href: "/academy", icon: "graduation" },
  { label: "باشگاه مزایا", href: "/benefits", icon: "gift" },
  { label: "بودجه‌ریزی مشارکتی", href: "/budget", icon: "coins" },
  { label: "کمپین‌ها و بازی‌ها", href: "/campaigns", icon: "target" },
  { label: "ابزارهای اجرایی", href: "/tools", icon: "wrench" },
  { label: "نقشه موانع", href: "/insights", icon: "map-pin" },
  { label: "اعتراض به تصمیم", href: "/appeals", icon: "shield" },
  { label: "تنظیمات اعلان", href: "/notifications/settings", icon: "bell" },
];

export function UserMenu() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className="bg-muted block h-9 w-24 animate-pulse rounded-lg"
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className="border-border text-foreground hover:bg-brand-50 hover:border-brand-300 focus-visible:outline-ring rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        ورود به حساب
      </Link>
    );
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setLoggingOut(false);
    }
    setOpen(false);
    router.replace("/");
    router.refresh();
  }

  const displayName = user.displayName ?? "کاربر";

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="border-border hover:bg-brand-50 hover:border-brand-200 focus-visible:outline-ring flex items-center gap-2 rounded-lg border py-1 pe-3 ps-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-xs font-bold"
        >
          {displayName.charAt(0)}
        </span>
        <span className="max-w-28 truncate">{displayName}</span>
        <span aria-hidden="true" className="text-muted-foreground">
          <Icon name="chevron-down" className="size-3.5" />
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="border-border bg-background shadow-popover absolute end-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border animate-[modal-in_0.15s_ease-out]"
          >
            <div className="border-b bg-muted/30 px-4 py-3">
              <p className="text-foreground truncate text-sm font-bold">
                {displayName}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs" dir="ltr">
                {user.phone}
              </p>
            </div>
            <div className="max-h-[min(60vh,26rem)] overflow-y-auto py-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  role="menuitem"
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent focus-visible:outline-ring flex items-center gap-2.5 px-4 py-2.5 text-sm focus-visible:outline-2"
                >
                  <Icon
                    name={item.icon}
                    className="text-muted-foreground size-4"
                  />
                  {item.label}
                </Link>
              ))}
              {user.role === "admin" || user.role === "super_admin" ? (
                <Link
                  role="menuitem"
                  href="/admin/memberships"
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent focus-visible:outline-ring flex items-center gap-2.5 px-4 py-2.5 text-sm focus-visible:outline-2"
                >
                  <Icon name="shield" className="text-muted-foreground size-4" />
                  مدیریت درخواست‌های عضویت
                </Link>
              ) : null}
            </div>
            <div className="border-t py-1">
              <button
                type="button"
                role="menuitem"
                disabled={loggingOut}
                onClick={handleLogout}
                className={cn(
                  "hover:bg-destructive/5 text-destructive flex w-full items-center gap-2.5 px-4 py-2.5 text-right text-sm",
                  "focus-visible:outline-ring focus-visible:outline-2",
                )}
              >
                <Icon name="logout" className="size-4" />
                خروج از حساب
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}