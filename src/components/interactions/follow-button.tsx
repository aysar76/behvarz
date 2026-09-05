"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

export interface FollowButtonProps {
  targetType: "tag" | "problem" | "experience" | "user";
  targetId: string;
  following: boolean;
  label?: string;
  size?: "sm" | "md";
  variant?: "outline" | "secondary";
  onToggle?: (following: boolean) => void;
}

export function FollowButton({
  targetType,
  targetId,
  following,
  label,
  size = "sm",
  variant = "outline",
  onToggle,
}: FollowButtonProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [isFollowing, setIsFollowing] = useState(following);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/follows", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { following: boolean };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در عملیات", tone: "danger" });
        return;
      }
      setIsFollowing(body.data!.following);
      onToggle?.(body.data!.following);
      toast({
        title: body.data!.following ? "دنبال شد" : "دنبال‌کردن لغو شد",
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
      variant={isFollowing ? "secondary" : variant}
      loading={busy}
      onClick={() => void toggle()}
    >
      <Icon name={isFollowing ? "check" : "feed"} className="size-3.5" />
      {isFollowing ? "در حال دنبال‌کردن" : (label ?? "دنبال‌کردن")}
    </Button>
  );
}