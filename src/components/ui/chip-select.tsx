"use client";

import { cn } from "@/lib/utils";

export interface ChipSelectProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  label?: string;
  max?: number;
  error?: string;
  className?: string;
}

export function ChipSelect({
  options,
  selected,
  onToggle,
  label,
  max,
  error,
  className,
}: ChipSelectProps) {
  const atLimit = max !== undefined && selected.length >= max;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <span className="text-foreground block text-sm font-medium">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          const disabled = !isSelected && atLimit;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onToggle(option)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input bg-background text-muted-foreground hover:border-brand-300 hover:text-foreground",
                disabled &&
                  "hover:border-input hover:text-muted-foreground cursor-not-allowed opacity-40",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
