import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  href?: string;
}

export function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "text-foreground flex items-center gap-2",
        "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-4",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="from-brand-600 to-brand-400 bg-gradient-to-br text-primary-foreground shadow-md flex size-9 shrink-0 items-center justify-center rounded-xl"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
          aria-hidden="true"
        >
          <path
            d="M5 11.5 12 5l7 6.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 10.5V18h9v-7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.5 18v-4h3v4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-base font-extrabold">{siteConfig.name}</span>
        <span className="text-muted-foreground text-[11px]">
          {siteConfig.tagline}
        </span>
      </span>
    </Link>
  );
}
