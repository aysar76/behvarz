import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50",
  secondary:
    "bg-accent text-accent-foreground hover:bg-brand-100 active:bg-brand-200 disabled:opacity-50",
  outline:
    "border border-input bg-background text-foreground hover:bg-muted active:bg-muted disabled:opacity-50",
  ghost: "text-foreground hover:bg-muted active:bg-muted disabled:opacity-50",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-red-700 active:bg-red-800 disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
  icon: "h-10 w-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:pointer-events-none disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  },
);
