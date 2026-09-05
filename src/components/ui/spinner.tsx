import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
};

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="در حال بارگذاری"
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
