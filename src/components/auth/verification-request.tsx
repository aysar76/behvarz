"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { SessionUser } from "@/components/auth/session-provider";

export function VerificationRequest({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = user.membershipStatus;

  async function request() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/verification-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ثبت درخواست");
        return;
      }
      toast({ title: "درخواست تأیید عضویت ثبت شد", tone: "success" });
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-border bg-muted/30 rounded-xl border p-4">
      <h2 className="text-foreground text-sm font-bold">تأیید عضویت حرفه‌ای</h2>
      {status === "verified" ? (
        <p className="text-success mt-1 text-sm">
          عضویت حرفه‌ای شما تأیید شده است.
        </p>
      ) : status === "pending" ? (
        <p className="text-muted-foreground mt-1 text-sm">
          درخواست شما در انتظار بررسی مدیر است.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground mt-1 text-sm">
            برای نمایش نشان «عضو تأییدشده» در پروفایل، درخواست تأیید عضویت
            بدهید. این تأیید توسط مدیران جامعه انجام می‌شود و معیار رسمی نیست.
          </p>
          {error && (
            <p role="alert" className="text-destructive mt-2 text-xs">
              {error}
            </p>
          )}
          <Button
            type="button"
            size="sm"
            className="mt-3"
            loading={loading}
            onClick={request}
          >
            درخواست تأیید عضویت
          </Button>
        </>
      )}
    </div>
  );
}
