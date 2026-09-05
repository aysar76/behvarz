import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid = false, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "bg-background text-foreground min-h-[96px] w-full rounded-md border px-3 py-2 text-sm",
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
  },
);
