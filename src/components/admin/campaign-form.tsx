"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  CAMPAIGN_FAMILIES,
  CAMPAIGN_STATUSES,
} from "@/lib/constants/campaign";

interface CampaignFormValues {
  family: string;
  title: string;
  description: string;
  status: string;
  startsAt: string;
  endsAt: string;
  isOptional: boolean;
}

const EMPTY: CampaignFormValues = {
  family: "learning",
  title: "",
  description: "",
  status: "draft",
  startsAt: "",
  endsAt: "",
  isOptional: true,
};

export function CampaignForm({
  initial,
  campaignId,
}: {
  initial?: Partial<CampaignFormValues>;
  campaignId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = useState<CampaignFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CampaignFormValues>(
    key: K,
    value: CampaignFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        campaignId ? `/api/admin/campaigns/${campaignId}` : "/api/admin/campaigns",
        {
          method: campaignId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            family: values.family,
            title: values.title,
            description: values.description,
            status: values.status,
            startsAt: values.startsAt || null,
            endsAt: values.endsAt || null,
            isOptional: values.isOptional,
          }),
        },
      );
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ذخیره کمپین");
        return;
      }
      toast({ title: "کمپین ذخیره شد", tone: "success" });
      router.push("/admin/campaigns");
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="campaign-title"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            عنوان کمپین
          </label>
          <input
            id="campaign-title"
            value={values.title}
            onChange={(event) => set("title", event.target.value)}
            maxLength={120}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
            placeholder="مثلاً: مأموریت یک‌ماهه «خانه‌های بهداشت دوستدار»"
          />
        </div>
        <div>
          <label
            htmlFor="campaign-family"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            خانواده بازی
          </label>
          <select
            id="campaign-family"
            value={values.family}
            onChange={(event) => set("family", event.target.value)}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          >
            {CAMPAIGN_FAMILIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.emoji} {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="campaign-description"
          className="text-foreground mb-1 block text-sm font-medium"
        >
          شرح کمپین
        </label>
        <textarea
          id="campaign-description"
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          rows={4}
          maxLength={3000}
          className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          placeholder="هدف کمپین چیست؟ برای چه کسانی و در چه بازه‌ای است؟"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="campaign-status"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            وضعیت
          </label>
          <select
            id="campaign-status"
            value={values.status}
            onChange={(event) => set("status", event.target.value)}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          >
            {CAMPAIGN_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="campaign-starts"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            شروع (اختیاری)
          </label>
          <input
            id="campaign-starts"
            type="datetime-local"
            value={values.startsAt}
            onChange={(event) => set("startsAt", event.target.value)}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          />
        </div>
        <div>
          <label
            htmlFor="campaign-ends"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            پایان (اختیاری)
          </label>
          <input
            id="campaign-ends"
            type="datetime-local"
            value={values.endsAt}
            onChange={(event) => set("endsAt", event.target.value)}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          />
        </div>
      </div>

      <div className="flex items-center pb-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={values.isOptional}
            onChange={(event) => set("isOptional", event.target.checked)}
            className="size-4 accent-[var(--color-brand-600)]"
          />
          اختیاری (مشارکت بدون اجبار و بدون رقابت ناسالم)
        </label>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/campaigns")}
          disabled={loading}
        >
          انصراف
        </Button>
        <Button onClick={() => void handleSubmit()} loading={loading}>
          ذخیره کمپین
        </Button>
      </div>
    </div>
  );
}