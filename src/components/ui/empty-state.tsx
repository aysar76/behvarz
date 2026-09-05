import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-muted/40 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="bg-brand-100 text-brand-700 mb-1 flex size-12 items-center justify-center rounded-full text-2xl">
          {icon}
        </div>
      )}
      <h3 className="text-foreground text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
