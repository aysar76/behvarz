"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export interface SaveButtonProps {
  targetType: "problem" | "experience";
  targetId: string;
  saved: boolean;
  size?: "sm" | "md";
  onToggle?: (saved: boolean) => void;
}

export function SaveButton({
  targetType,
  targetId,
  saved,
  size = "sm",
  onToggle,
}: SaveButtonProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/saves", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { saved: boolean };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در عملیات", tone: "danger" });
        return;
      }
      setIsSaved(body.data!.saved);
      onToggle?.(body.data!.saved);
      toast({
        title: body.data!.saved ? "در خواندنی‌ها ذخیره شد" : "از خواندنی‌ها حذف شد",
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
      variant={isSaved ? "secondary" : "ghost"}
      loading={busy}
      onClick={() => void toggle()}
    >
      {isSaved ? "ذخیره شد" : "ذخیره"}
    </Button>
  );
}