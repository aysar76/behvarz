"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shell/logo";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Icon } from "@/components/ui/icon";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />

        <nav
          aria-label="ناوبری اصلی"
          className="hidden items-center gap-0.5 overflow-x-auto lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {mainNav.map((item) => {
            const active = item.href === pathname;
            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  aria-disabled="true"
                  className="text-muted-foreground/40 cursor-not-allowed rounded-lg px-2.5 py-2 text-[13px] font-medium"
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
                  "relative rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-800"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="bg-primary absolute inset-x-2.5 -bottom-px h-0.5 rounded-full"
                  />
                )}
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
              "text-muted-foreground hover:bg-muted hover:text-foreground flex size-10 items-center justify-center rounded-lg transition-colors",
              pathname === "/search" && "bg-brand-50 text-brand-800",
            )}
          >
            <Icon name="search" className="size-[18px]" />
          </Link>
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}