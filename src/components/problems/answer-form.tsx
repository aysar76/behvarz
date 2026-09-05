"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { SensitiveWarning } from "@/components/problems/sensitive-warning";
import { scanSensitiveContent } from "@/lib/content-safety";
import type { ProblemStatus } from "@/generated/prisma/client";
import type { SerializedAnswer } from "@/lib/serializers/problem";

export interface AnswerFormProps {
  problemId: string;
  onSubmitted: (answer: SerializedAnswer, problemStatus: ProblemStatus) => void;
}

export function AnswerForm({ problemId, onSubmitted }: AnswerFormProps) {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [isClarificationRequest, setIsClarificationRequest] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sensitiveMatches = useMemo(() => scanSensitiveContent(body), [body]);

  async function submit() {
    setError(null);
    if (body.trim().length < 10) {
      setError("پاسخ باید حداقل ۱۰ کاراکتر باشد");
      return;
    }
    if (sensitiveMatches.length > 0 && !acknowledged) {
      setError("برای ارسال، هشدار محتوای حساس را تأیید کنید.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/problems/${problemId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          isClarificationRequest,
          sensitiveAcknowledged:
            sensitiveMatches.length > 0 ? acknowledged : false,
        }),
      });
      const result = (await res.json()) as {
        ok: boolean;
        data?: {
          answer: SerializedAnswer;
          problemStatus: ProblemStatus;
        };
        error?: { message: string };
      };
      if (!res.ok || !result.ok) {
        setError(result.error?.message ?? "خطا در ثبت پاسخ");
        return;
      }
      toast({ title: "پاسخ ثبت شد", tone: "success" });
      setBody("");
      setIsClarificationRequest(false);
      setAcknowledged(false);
      onSubmitted(result.data!.answer, result.data!.problemStatus);
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="answerBody"
          className="text-foreground block text-sm font-medium"
        >
          پاسخ شما
        </label>
        <Textarea
          id="answerBody"
          value={body}
          maxLength={2000}
          rows={4}
          placeholder="تجربه، پیشنهاد یا توضیح خود را بنویسید. بدون اطلاعات قابل شناسایی بیمار."
          onChange={(event) => setBody(event.target.value)}
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={isClarificationRequest}
          onChange={(event) => setIsClarificationRequest(event.target.checked)}
          className="accent-brand-600 mt-1"
        />
        <span>
          این پیام «درخواست توضیح» است
          <span className="text-muted-foreground block text-xs">
            برای روشن‌کردن جزئیات مسئله؛ نه ارائه راهکار.
          </span>
        </span>
      </label>

      <SensitiveWarning
        matches={sensitiveMatches}
        acknowledged={acknowledged}
        onAcknowledge={setAcknowledged}
      />

      <Button loading={submitting} onClick={submit}>
        ثبت پاسخ
      </Button>
    </div>
  );
}
