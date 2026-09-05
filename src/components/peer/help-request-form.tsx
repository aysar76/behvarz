"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { TagInput } from "@/components/problems/tag-input";
import { SensitiveWarning } from "@/components/problems/sensitive-warning";
import { scanSensitiveContent } from "@/lib/content-safety";
import { PROVINCES } from "@/lib/constants/profile";
import { MAX_PROBLEM_TAGS, PROBLEM_BARRIER_TYPES, PROBLEM_TAGS } from "@/lib/constants/problem";
import type { SerializedPeerHelpRequest } from "@/lib/serializers/peer";

export function HelpRequestForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [barrierType, setBarrierType] = useState<
    "resources" | "knowledge" | "process" | "community" | "equipment" | "other"
  >("resources");
  const [tags, setTags] = useState<string[]>([]);
  const [province, setProvince] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sensitiveMatches = useMemo(
    () => scanSensitiveContent(title, description),
    [title, description],
  );

  const fieldLabelClass = "text-foreground block text-sm font-medium";

  async function submit() {
    setError(null);

    if (title.trim().length < 5) {
      setError("عنوان حداقل ۵ کاراکتر باشد");
      return;
    }
    if (description.trim().length < 10) {
      setError("شرح نیاز حداقل ۱۰ کاراکتر باشد");
      return;
    }
    if (sensitiveMatches.length > 0 && !acknowledged) {
      setError("برای ثبت درخواست، هشدار محتوای حساس را تأیید کنید.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/peer/help-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          barrierType,
          tags,
          province: province || undefined,
          sensitiveAcknowledged: sensitiveMatches.length > 0 ? acknowledged : false,
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { helpRequest: SerializedPeerHelpRequest };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ثبت درخواست");
        return;
      }
      toast({ title: "درخواست همیار ثبت شد", tone: "success" });
      router.push(`/peer/${body.data!.helpRequest.id}`);
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="peerTitle" className={fieldLabelClass}>
          عنوان نیاز
        </label>
        <Input
          id="peerTitle"
          value={title}
          maxLength={120}
          placeholder="مثلاً: اجرای برنامه غربالگری فشار خون در روستا"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="peerDescription" className={fieldLabelClass}>
          شرح نیاز
        </label>
        <Textarea
          id="peerDescription"
          value={description}
          maxLength={2000}
          rows={5}
          placeholder="با چه مسئله‌ای مواجهید؟ کدام بخش به تجربه یک همکار نیاز دارد؟ (بدون اطلاعات شناسایی‌کننده)"
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="peerBarrier" className={fieldLabelClass}>
            نوع مانع
          </label>
          <Select
            id="peerBarrier"
            value={barrierType}
            onChange={(event) =>
              setBarrierType(event.target.value as typeof barrierType)
            }
          >
            {PROBLEM_BARRIER_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="peerProvince" className={fieldLabelClass}>
            استان (اختیاری — برای پیشنهاد همیار هم‌استان)
          </label>
          <Select
            id="peerProvince"
            placeholder="سراسری"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
          >
            {PROVINCES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <TagInput
        label="برچسب‌ها"
        value={tags}
        onChange={setTags}
        suggestions={PROBLEM_TAGS}
        max={MAX_PROBLEM_TAGS}
      />

      <SensitiveWarning
        matches={sensitiveMatches}
        acknowledged={acknowledged}
        onAcknowledge={setAcknowledged}
      />

      <Button type="button" loading={submitting} onClick={submit}>
        ثبت درخواست همیار
      </Button>
    </div>
  );
}