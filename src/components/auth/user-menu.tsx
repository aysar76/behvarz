"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/auth/session-provider";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className="bg-muted block h-9 w-24 animate-pulse rounded-md"
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className="border-border text-foreground hover:bg-accent focus-visible:outline-ring rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
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
        className="border-border hover:bg-accent focus-visible:outline-ring flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-xs font-bold"
        >
          {displayName.charAt(0)}
        </span>
        <span className="max-w-28 truncate">{displayName}</span>
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
            className="border-border bg-background shadow-popover absolute end-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border"
          >
            <div className="border-b px-4 py-3">
              <p className="text-foreground truncate text-sm font-semibold">
                {displayName}
              </p>
              <p className="text-muted-foreground text-xs" dir="ltr">
                {user.phone}
              </p>
            </div>
            <Link
              role="menuitem"
              href="/me"
              onClick={() => setOpen(false)}
              className="hover:bg-accent focus-visible:outline-ring block px-4 py-2.5 text-sm focus-visible:outline-2"
            >
              پروفایل من
            </Link>
            <Link
              role="menuitem"
              href="/appeals"
              onClick={() => setOpen(false)}
              className="hover:bg-accent focus-visible:outline-ring block px-4 py-2.5 text-sm focus-visible:outline-2"
            >
              اعتراض به تصمیم
            </Link>
            <Link
              role="menuitem"
              href="/notifications/settings"
              onClick={() => setOpen(false)}
              className="hover:bg-accent focus-visible:outline-ring block px-4 py-2.5 text-sm focus-visible:outline-2"
            >
              تنظیمات اعلان
            </Link>
            {user.role === "admin" || user.role === "super_admin" ? (
              <Link
                role="menuitem"
                href="/admin/memberships"
                onClick={() => setOpen(false)}
                className="hover:bg-accent focus-visible:outline-ring block px-4 py-2.5 text-sm focus-visible:outline-2"
              >
                مدیریت درخواست‌های عضویت
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              disabled={loggingOut}
              onClick={handleLogout}
              className={cn(
                "hover:bg-destructive/5 text-destructive w-full px-4 py-2.5 text-right text-sm",
                "focus-visible:outline-ring focus-visible:outline-2",
              )}
            >
              خروج از حساب
            </button>
          </div>
        </>
      )}
    </div>
  );
}
