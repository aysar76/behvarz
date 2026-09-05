"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/constants/notification";
import type { NotificationType } from "@/generated/prisma/client";

interface Preference {
  type: NotificationType;
  enabled: boolean;
}

interface PreferencesResponse {
  preferences: Preference[];
}

const ORDER: NotificationType[] = [
  "problem_answer",
  "answer_mention",
  "solution_selected",
  "circle_join_accepted",
  "circle_invite",
  "circle_meeting",
  "cooperation_offer",
  "cooperation_message",
  "cooperation_complete",
  "appeal_decision",
];

export function NotificationSettings() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Record<NotificationType, boolean> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/me/notification-preferences", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { ok: boolean; data?: PreferencesResponse }) => {
        if (!active || !body.ok) return;
        const map = {} as Record<NotificationType, boolean>;
        for (const item of body.data?.preferences ?? []) {
          map[item.type] = item.enabled;
        }
        setPreferences(map);
      })
      .catch(() => setError("خطا در دریافت تنظیمات"));
    return () => {
      active = false;
    };
  }, []);

  function toggle(type: NotificationType) {
    setPreferences((current) =>
      current
        ? { ...current, [type]: !current[type] }
        : current,
    );
  }

  async function save() {
    if (!preferences) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: ORDER.map((type) => ({ type, enabled: preferences[type] })),
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error?.message ?? "خطا در ذخیره تنظیمات");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  if (error && !preferences) {
    return <EmptyState title="خطا" description={error} />;
  }

  if (!preferences) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            aria-hidden="true"
            className="border-border bg-muted/40 h-16 animate-pulse rounded-xl border"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {ORDER.map((type) => (
          <label
            key={type}
            className="border-border bg-card shadow-card flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4"
          >
            <span className="text-sm font-medium">{NOTIFICATION_TYPE_LABELS[type]}</span>
            <input
              type="checkbox"
              checked={preferences[type]}
              onChange={() => toggle(type)}
              className="size-5 accent-[var(--color-brand-600)]"
            />
          </label>
        ))}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center gap-2">
        <Button onClick={() => void save()} loading={saving}>
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  );
}