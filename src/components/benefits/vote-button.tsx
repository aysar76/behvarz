"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { toPersianDigits } from "@/lib/dates";

export function VoteButton({
  proposalId,
  voteCount,
  myVote,
}: {
  proposalId: string;
  voteCount: number;
  myVote: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(voteCount);
  const [voted, setVoted] = useState(myVote);

  async function handleVote() {
    setLoading(true);
    try {
      const res = await fetch(`/api/budget-proposals/${proposalId}/vote`, {
        method: "POST",
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { count: number };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در ثبت رأی", tone: "danger" });
        return;
      }
      setVoted(true);
      setCount(body.data?.count ?? count);
      toast({ title: "رأی شما ثبت شد", tone: "success" });
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
        variant={voted ? "secondary" : "primary"}
        onClick={() => void handleVote()}
        loading={loading}
        disabled={voted}
      >
        {voted ? "رأی داده‌ای" : "رأی می‌دهم"}
      </Button>
      <span className="text-muted-foreground text-xs">
        {toPersianDigits(count)} رأی
      </span>
    </div>
  );
}