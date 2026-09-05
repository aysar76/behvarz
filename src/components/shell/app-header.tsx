"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shell/logo";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-2 px-4">
        <Logo />

        <nav
          aria-label="ناوبری اصلی"
          className="hidden items-center gap-0.5 lg:flex"
        >
          {mainNav.map((item) => {
            const active = item.href === pathname;
            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  aria-disabled="true"
                  className="text-muted-foreground/50 cursor-not-allowed rounded-md px-2 py-2 text-[13px] font-medium"
                  title="به‌زودی"
                >
                  {item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/search"
            aria-label="جست‌وجو"
            title="جست‌وجو"
            className={cn(
              "text-muted-foreground hover:bg-muted hover:text-foreground flex size-10 items-center justify-center rounded-md text-lg transition-colors",
              pathname === "/search" && "text-foreground bg-muted",
            )}
          >
            <span aria-hidden="true">🔎</span>
          </Link>
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
