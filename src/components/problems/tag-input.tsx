"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  max?: number;
  label?: string;
  error?: string;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  max,
  label,
  error,
  className,
}: TagInputProps) {
  const [text, setText] = useState("");

  const atLimit = max !== undefined && value.length >= max;

  function addTag(raw: string) {
    const tag = raw.trim().replace(/,/g, "");
    if (!tag) return;
    setText("");
    if (value.includes(tag)) return;
    if (max !== undefined && value.length >= max) return;
    onChange([...value, tag]);
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  const availableSuggestions = suggestions.filter(
    (item) => !value.includes(item),
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <span className="text-foreground block text-sm font-medium">
          {label}
        </span>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="bg-brand-100 text-brand-800 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                aria-label={`حذف برچسب ${tag}`}
                className="text-brand-700 hover:text-destructive"
                onClick={() => removeTag(tag)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        value={text}
        disabled={atLimit}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addTag(text);
          }
        }}
        placeholder={
          atLimit ? `حداکثر ${max} برچسب` : "برچسب بنویسید و Enter بزنید"
        }
        className="bg-background text-foreground border-input focus-visible:outline-ring h-11 w-full rounded-md border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />

      {!atLimit && availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableSuggestions.slice(0, 8).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => addTag(item)}
              className="text-muted-foreground hover:text-foreground hover:border-brand-300 border-border rounded-full border px-2.5 py-1 text-xs transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
