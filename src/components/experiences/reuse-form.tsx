"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { EXPERIENCE_REUSE_OUTCOMES } from "@/lib/constants/experience";
import type { ExperienceReuseOutcome } from "@/generated/prisma/client";
import type { SerializedExperience } from "@/lib/serializers/experience";

export interface ReuseFormProps {
  open: boolean;
  onClose: () => void;
  experienceId: string;
  initial?: SerializedExperience["myReuse"] | null;
  onSaved: (experience: SerializedExperience) => void;
}

export function ReuseForm({
  open,
  onClose,
  experienceId,
  initial,
  onSaved,
}: ReuseFormProps) {
  const { toast } = useToast();
  const [outcome, setOutcome] = useState<ExperienceReuseOutcome>(
    initial?.outcome ?? "successful",
  );
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    if (summary.trim().length < 5) {
      setError("خلاصه نتیجه باید حداقل ۵ کاراکتر باشد");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/experiences/${experienceId}/reuse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, summary: summary.trim() }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { experience: SerializedExperience };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ثبت اجرای مجدد");
        return;
      }
      toast({
        title: initial ? "نتیجه اجرای مجدد به‌روزرسانی شد" : "اجرای مجدد ثبت شد",
        description: "این نتیجه به اعتبار تجربه و اعتماد جامعه اضافه می‌شود.",
        tone: "success",
      });
      onSaved(body.data!.experience);
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
      title={initial ? "ویرایش نتیجه اجرا" : "«این تجربه را اجرا کردم»"}
      description="نتیجه اجرای این تجربه را در شرایط خودتان ثبت کنید؛ حتی نتیجه «موفق نبود» هم دانش ارزشمندی برای جامعه است."
    >
      <div className="space-y-4">
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="reuseOutcome"
            className="text-foreground block text-sm font-medium"
          >
            نتیجه اجرا
          </label>
          <Select
            id="reuseOutcome"
            value={outcome}
            onChange={(event) =>
              setOutcome(event.target.value as ExperienceReuseOutcome)
            }
          >
            {EXPERIENCE_REUSE_OUTCOMES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="reuseSummary"
            className="text-foreground block text-sm font-medium"
          >
            خلاصه نتیجه
          </label>
          <Textarea
            id="reuseSummary"
            value={summary}
            maxLength={800}
            rows={4}
            placeholder="چه اتفاقی افتاد؟ کدام بخش برای شما نتیجه داد؟"
            onChange={(event) => setSummary(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button loading={submitting} onClick={submit}>
            ثبت نتیجه
          </Button>
        </div>
      </div>
    </Modal>
  );
}