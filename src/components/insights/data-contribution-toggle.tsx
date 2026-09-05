"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function DataContributionToggle({
  allowDataContribution,
}: {
  allowDataContribution: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(allowDataContribution);

  async function handleToggle(next: boolean) {
    setLoading(true);
    try {
      const res = await fetch("/api/insights/data-contribution", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowDataContribution: next }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در به‌روزرسانی رضایت", tone: "danger" });
        return;
      }
      setAllowed(next);
      toast({
        title: next ? "رضایت شما ثبت شد" : "رضایت شما برداشته شد",
        tone: next ? "success" : "info",
      });
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={allowed}
        disabled={loading}
        onChange={(event) => void handleToggle(event.target.checked)}
        className="mt-0.5 size-4 accent-[var(--color-brand-600)]"
      />
      <span>
        <span className="text-foreground block text-sm font-semibold">
          اجازه استفاده از داده‌های ناشناس من در «نقشه موانع»
        </span>
        <span className="text-muted-foreground mt-0.5 block text-xs leading-5">
          فقط شمارش تجمیعی (نوع مانع و استان) از مسائل منتشرشده استفاده می‌شود؛
          هیچ اطلاعات هویتی، بیمار یا پرونده‌ای شامل نمی‌شود و قابل برگشت است.
        </span>
      </span>
    </label>
  );
}