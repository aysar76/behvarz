"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ناوبری موبایل"
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-6">
        {mainNav.map((item) => {
          const active = item.href === pathname;
          if (item.disabled) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                className="text-muted-foreground/40 flex cursor-not-allowed flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
              >
                <span className="text-lg leading-none">•</span>
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
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="text-lg leading-none">•</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
