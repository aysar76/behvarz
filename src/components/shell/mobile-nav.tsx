"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, mobileNav } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      {open && (
        <div
          aria-hidden="true"
          onClick={close}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <div
        className={cn(
          "border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 backdrop-blur-xl lg:hidden",
          open && "z-50",
        )}
      >
        {open && (
          <div
            id="mobile-more-panel"
            role="region"
            aria-label="دسترسی سریع"
            className="shadow-popover border-border bg-background animate-[sheet-up_0.2s_ease-out] rounded-t-2xl border-b px-4 pb-2 pt-3"
          >
            <div className="bg-muted-foreground/20 mx-auto mb-3 h-1 w-10 rounded-full" />
            <p className="text-muted-foreground px-1 pb-1.5 text-xs font-medium">
              دسترسی سریع
            </p>
            <div className="grid grid-cols-3 gap-1">
              {mainNav.map((item) => {
                const active = item.href === pathname;
                if (item.disabled) {
                  return (
                    <span
                      key={item.href}
                      aria-disabled="true"
                      title="به‌زودی"
                      className="text-muted-foreground/40 flex cursor-not-allowed flex-col items-center gap-1 rounded-xl px-2 py-3 text-[11px] font-medium"
                    >
                      <Icon name={item.icon} className="size-5" />
                      {item.label}
                    </span>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-[11px] font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-800"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon
                      name={item.icon}
                      className={cn("size-5", active && "text-brand-700")}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <nav aria-label="ناوبری موبایل">
          <div className="mx-auto grid max-w-lg grid-cols-6 pb-[env(safe-area-inset-bottom)]">
            {mobileNav.map((item) => {
              const active = item.href === pathname;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
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

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-more-panel"
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors",
                open ? "text-brand-700" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                  open && "bg-brand-50",
                )}
              >
                <Icon
                  name={open ? "x" : "menu"}
                  className={cn("size-[20px]", open && "text-brand-700")}
                />
              </span>
              {open ? "بستن" : "بیشتر"}
              {open && (
                <span
                  aria-hidden="true"
                  className="bg-primary absolute top-0 h-0.5 w-8 rounded-full"
                />
              )}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}