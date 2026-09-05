import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: IconName;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        {icon && (
          <span
            aria-hidden="true"
            className="from-brand-50 to-brand-100/60 bg-gradient-to-br border-brand-100 text-brand-700 shadow-sm mt-0.5 hidden size-12 shrink-0 items-center justify-center rounded-2xl border sm:flex"
          >
            <Icon name={icon} className="size-6" />
          </span>
        )}
        <div>
          <h1 className="text-foreground text-2xl font-extrabold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm leading-6">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}