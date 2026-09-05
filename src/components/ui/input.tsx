import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "bg-background text-foreground h-11 w-full rounded-lg border px-3 text-sm",
        "placeholder:text-muted-foreground",
        "transition-all duration-150",
        "hover:border-brand-300",
        "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-1",
        invalid
          ? "border-destructive hover:border-destructive focus-visible:outline-destructive"
          : "border-input",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
