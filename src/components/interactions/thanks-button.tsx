"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

export interface ThanksButtonProps {
  targetType: "answer" | "experience";
  targetId: string;
  thanked: boolean;
  thanksCount: number;
  size?: "sm" | "md";
  disabled?: boolean;
  onToggle?: (thanksCount: number, thanked: boolean) => void;
}

export function ThanksButton({
  targetType,
  targetId,
  thanked,
  thanksCount,
  size = "sm",
  disabled = false,
  onToggle,
}: ThanksButtonProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [isThanked, setIsThanked] = useState(thanked);
  const [count, setCount] = useState(thanksCount);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/thanks", {
        method: isThanked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { thanked: boolean };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در عملیات", tone: "danger" });
        return;
      }
      const nextThanked = body.data!.thanked;
      const nextCount = Math.max(0, count + (nextThanked ? 1 : -1));
      setIsThanked(nextThanked);
      setCount(nextCount);
      onToggle?.(nextCount, nextThanked);
      toast({
        title: nextThanked ? "تشکر حرفه‌ای ثبت شد" : "تشکر حذف شد",
        tone: "success",
      });
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size={size}
      variant={isThanked ? "secondary" : "outline"}
      loading={busy}
      disabled={disabled}
      onClick={() => void toggle()}
    >
      <Icon name="heart" className="size-3.5" />
      {count > 0 ? `تشکر حرفه‌ای (${count})` : "تشکر حرفه‌ای"}
    </Button>
  );
}