"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  BENEFIT_PROVIDER_CATEGORIES,
  BENEFIT_PROVIDER_STATUSES,
} from "@/lib/constants/benefits";

interface ProviderFormValues {
  name: string;
  category: string;
  description: string;
  terms: string;
  website: string;
  contactNote: string;
  logoEmoji: string;
  isSponsored: boolean;
  status: string;
}

const EMPTY: ProviderFormValues = {
  name: "",
  category: "other",
  description: "",
  terms: "",
  website: "",
  contactNote: "",
  logoEmoji: "",
  isSponsored: false,
  status: "draft",
};

export function BenefitProviderForm({
  initial,
  providerId,
}: {
  initial?: Partial<ProviderFormValues>;
  providerId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = useState<ProviderFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProviderFormValues>(
    key: K,
    value: ProviderFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        providerId ? `/api/admin/benefits/${providerId}` : "/api/admin/benefits",
        {
          method: providerId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ذخیره ارائه‌دهنده");
        return;
      }
      toast({ title: "ذخیره شد", tone: "success" });
      router.push("/admin/benefits");
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
            htmlFor="provider-name"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            نام ارائه‌دهنده
          </label>
          <input
            id="provider-name"
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            maxLength={120}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
            placeholder="مثلاً: شرکت بیمه سلامت"
          />
        </div>
        <div>
          <label
            htmlFor="provider-category"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            دسته‌بندی
          </label>
          <select
            id="provider-category"
            value={values.category}
            onChange={(event) => set("category", event.target.value)}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          >
            {BENEFIT_PROVIDER_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.emoji} {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="provider-description"
          className="text-foreground mb-1 block text-sm font-medium"
        >
          توضیح
        </label>
        <textarea
          id="provider-description"
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          rows={3}
          maxLength={2000}
          className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          placeholder="چه خدماتی ارائه می‌دهد؟ به چه کسانی؟"
        />
      </div>

      <div>
        <label
          htmlFor="provider-terms"
          className="text-foreground mb-1 block text-sm font-medium"
        >
          شرایط استفاده
        </label>
        <textarea
          id="provider-terms"
          value={values.terms}
          onChange={(event) => set("terms", event.target.value)}
          rows={3}
          maxLength={4000}
          className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          placeholder="شرایط و نحوه استفاده از مزیت..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="provider-website"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            وب‌سایت (اختیاری)
          </label>
          <input
            id="provider-website"
            value={values.website}
            onChange={(event) => set("website", event.target.value)}
            maxLength={300}
            dir="ltr"
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
            placeholder="https://..."
          />
        </div>
        <div>
          <label
            htmlFor="provider-emoji"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            نماد (اختیاری)
          </label>
          <input
            id="provider-emoji"
            value={values.logoEmoji}
            onChange={(event) => set("logoEmoji", event.target.value)}
            maxLength={8}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
            placeholder="🏥"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="provider-contact"
          className="text-foreground mb-1 block text-sm font-medium"
        >
          نکته تماس (اختیاری)
        </label>
        <textarea
          id="provider-contact"
          value={values.contactNote}
          onChange={(event) => set("contactNote", event.target.value)}
          rows={2}
          maxLength={500}
          className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          placeholder="نحوه هماهنگی با ارائه‌دهنده..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="provider-status"
            className="text-foreground mb-1 block text-sm font-medium"
          >
            وضعیت
          </label>
          <select
            id="provider-status"
            value={values.status}
            onChange={(event) => set("status", event.target.value)}
            className="border-input bg-background focus-visible:outline-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          >
            {BENEFIT_PROVIDER_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={values.isSponsored}
              onChange={(event) => set("isSponsored", event.target.checked)}
              className="size-4 accent-[var(--color-brand-600)]"
            />
            اسپانسر (تفکیک شفاف تبلیغ از محتوای حرفه‌ای)
          </label>
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/benefits")}
          disabled={loading}
        >
          انصراف
        </Button>
        <Button onClick={() => void handleSubmit()} loading={loading}>
          ذخیره ارائه‌دهنده
        </Button>
      </div>
    </div>
  );
}