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
        "bg-background text-foreground h-11 w-full rounded-md border px-3 text-sm",
        "placeholder:text-muted-foreground",
        "transition-colors",
        "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
        invalid
          ? "border-destructive focus-visible:outline-destructive"
          : "border-input",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
