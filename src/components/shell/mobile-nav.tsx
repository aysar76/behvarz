"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNav } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ناوبری موبایل"
      className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {mobileNav.map((item) => {
          const active = item.href === pathname;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors",
                active ? "text-brand-700" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                  active && "bg-brand-50",
                )}
              >
                <Icon
                  name={item.icon}
                  className={cn("size-[20px]", active && "text-brand-700")}
                />
              </span>
              {item.label}
              {active && (
                <span
                  aria-hidden="true"
                  className="bg-primary absolute top-0 h-0.5 w-8 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}