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
import { Icon, type IconName } from "@/components/ui/icon";

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

const toneIcon: Record<ToastTone, IconName> = {
  info: "info",
  success: "check-circle",
  warning: "alert",
  danger: "alert",
};

const toneIconClasses: Record<ToastTone, string> = {
  info: "text-info",
  success: "text-brand-700",
  warning: "text-amber-700",
  danger: "text-red-700",
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
              "bg-background shadow-popover pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3",
              "animate-[toast-in_0.2s_ease-out]",
              toneClasses[toast.tone],
            )}
          >
            <span
              aria-hidden="true"
              className={cn("mt-0.5", toneIconClasses[toast.tone])}
            >
              <Icon name={toneIcon[toast.tone]} className="size-5" />
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
              className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
              onClick={() => dismiss(toast.id)}
            >
              <Icon name="x" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
