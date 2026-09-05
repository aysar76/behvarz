"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CampaignJoinButton({
  campaignId,
  isParticipating,
  participationCount,
}: {
  campaignId: string;
  isParticipating: boolean;
  participationCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(isParticipating);
  const [count, setCount] = useState(participationCount);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/participation`,
        { method: joined ? "DELETE" : "POST" },
      );
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در ثبت مشارکت", tone: "danger" });
        return;
      }
      const next = !joined;
      setJoined(next);
      setCount((value) => value + (next ? 1 : -1));
      toast({
        title: next ? "در کمپین ثبت شد" : "مشارکت لغو شد",
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
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={joined ? "secondary" : "primary"}
        onClick={() => void handleToggle()}
        loading={loading}
      >
        {joined ? "انصراف از کمپین" : "شرکت می‌کنم"}
      </Button>
      <span className="text-muted-foreground text-xs">
        {count.toLocaleString("fa-IR")} مشارکت
      </span>
    </div>
  );
}