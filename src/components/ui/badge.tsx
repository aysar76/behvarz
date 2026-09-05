import { cn } from "@/lib/utils";

type BadgeTone =
  "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground border border-border/70",
  brand: "bg-brand-50 text-brand-800 border border-brand-200",
  success: "bg-green-50 text-green-800 border border-green-200",
  warning: "bg-amber-50 text-amber-800 border border-amber-200",
  danger: "bg-red-50 text-red-800 border border-red-200",
  info: "bg-sky-50 text-sky-800 border border-sky-200",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
