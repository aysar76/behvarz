"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  const titleId = useId();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="bg-foreground/40 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={cn(
          "border-border bg-background shadow-popover relative z-10 w-full max-w-md rounded-t-2xl border p-5 sm:rounded-2xl",
          className,
        )}
      >
        {title && (
          <h2 id={titleId} className="text-foreground mb-1 text-lg font-bold">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-muted-foreground mb-4 text-sm">{description}</p>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
