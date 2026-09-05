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
        "border-border bg-muted/30 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="bg-brand-50 text-brand-700 border-brand-100 mb-2 flex size-14 items-center justify-center rounded-2xl border shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-foreground text-base font-bold">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-sm text-sm leading-6">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
