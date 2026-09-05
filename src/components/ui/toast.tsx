"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastTone = "info" | "success" | "warning" | "danger";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (toast: Omit<ToastItem, "id" | "tone"> & { tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return context;
}

const toneIcon: Record<ToastTone, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  danger: "✕",
};

const toneClasses: Record<ToastTone, string> = {
  info: "border-info/30 text-info",
  success: "border-brand-300 text-brand-700",
  warning: "border-amber-300 text-amber-800",
  danger: "border-red-300 text-red-700",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ title, description, tone = "info" }) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, title, description, tone }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "danger" ? "alert" : "status"}
            className={cn(
              "bg-background shadow-popover pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3",
              toneClasses[toast.tone],
            )}
          >
            <span aria-hidden="true" className="mt-0.5 text-sm font-bold">
              {toneIcon[toast.tone]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-semibold">
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="بستن"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => dismiss(toast.id)}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
