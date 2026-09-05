"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { PROBLEM_REPORT_REASONS } from "@/lib/constants/problem";

export interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: "problem" | "answer" | "experience";
  targetId: string;
}

export function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
}: ReportDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    if (!reason) {
      setError("دلیل گزارش را انتخاب کنید");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          note: note.trim() || undefined,
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ثبت گزارش");
        return;
      }
      toast({
        title: "گزارش ثبت شد",
        description: "ناظران جامعه آن را بررسی می‌کنند.",
        tone: "success",
      });
      setReason("");
      setNote("");
      onClose();
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="گزارش محتوای نامناسب"
      description="این گزارش فقط توسط ناظران جامعه دیده می‌شود."
    >
      <div className="space-y-4">
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="reportReason"
            className="text-foreground block text-sm font-medium"
          >
            دلیل
          </label>
          <Select
            id="reportReason"
            placeholder="انتخاب دلیل"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            {PROBLEM_REPORT_REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="reportNote"
            className="text-foreground block text-sm font-medium"
          >
            توضیح (اختیاری)
          </label>
          <Textarea
            id="reportNote"
            value={note}
            maxLength={500}
            rows={3}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button loading={submitting} onClick={submit}>
            ثبت گزارش
          </Button>
        </div>
      </div>
    </Modal>
  );
}
