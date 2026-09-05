"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shell/logo";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Logo />

        <nav
          aria-label="ناوبری اصلی"
          className="hidden items-center gap-1 md:flex"
        >
          {mainNav.map((item) => {
            const active = item.href === pathname;
            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  aria-disabled="true"
                  className="text-muted-foreground/50 cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium"
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
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
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

        <div className="hidden md:block">
          <button
            type="button"
            disabled
            className="border-border text-muted-foreground/50 cursor-not-allowed rounded-md border px-4 py-2 text-sm font-medium"
            title="ورود — از فاز ۲ فعال می‌شود"
          >
            ورود به حساب
          </button>
        </div>
      </div>
    </header>
  );
}
