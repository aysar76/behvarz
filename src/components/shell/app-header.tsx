"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shell/logo";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Icon } from "@/components/ui/icon";

function DesktopMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="relative hidden lg:block xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="border-border text-foreground hover:bg-brand-50 hover:border-brand-200 focus-visible:outline-ring flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Icon name="menu" className="size-[18px]" />
        منو
        <span aria-hidden="true" className="text-muted-foreground">
          <Icon name="chevron-down" className="size-3.5" />
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={close}
          />
          <div
            role="menu"
            className="border-border bg-background shadow-popover absolute end-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border animate-[modal-in_0.15s_ease-out]"
          >
            <div className="max-h-[min(70vh,30rem)] overflow-y-auto py-1">
              {mainNav.map((item) => {
                const active = item.href === pathname;
                if (item.disabled) {
                  return (
                    <span
                      key={item.href}
                      aria-disabled="true"
                      role="menuitem"
                      title="به‌زودی"
                      className="text-muted-foreground/40 flex cursor-not-allowed items-center gap-2.5 px-4 py-2.5 text-sm font-medium"
                    >
                      <Icon
                        name={item.icon}
                        className="text-muted-foreground/40 size-4"
                      />
                      {item.label}
                    </span>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    role="menuitem"
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "hover:bg-accent focus-visible:outline-ring flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium focus-visible:outline-2",
                      active && "bg-brand-50 text-brand-800",
                    )}
                  >
                    <Icon
                      name={item.icon}
                      className={cn(
                        "text-muted-foreground size-4",
                        active && "text-brand-700",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />

        <nav
          aria-label="ناوبری اصلی"
          className="hidden items-center gap-1 whitespace-nowrap break-keep overflow-x-auto xl:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {mainNav.map((item) => {
            const active = item.href === pathname;
            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  aria-disabled="true"
                  className="text-muted-foreground/40 cursor-not-allowed rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap"
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
                  "relative rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
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
          <DesktopMenu />
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