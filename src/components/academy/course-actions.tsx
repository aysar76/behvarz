"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CourseActions({
  slug,
  courseId,
  enrolled,
}: {
  slug: string;
  courseId: string;
  enrolled: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleEnroll() {
    setLoading(true);
    try {
      const res = await fetch(`/api/academy/${slug}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({
          title: body.error?.message ?? "خطا در ثبت‌نام دوره",
          tone: "danger",
        });
        return;
      }
      toast({ title: "ثبت‌نام شد؛ یادگیری را شروع کن", tone: "success" });
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleEnroll} loading={loading} disabled={enrolled}>
      {enrolled ? "ثبت‌نام شده" : "ثبت‌نام در دوره"}
    </Button>
  );
}
