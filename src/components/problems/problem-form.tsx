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
import {
  MAX_PROBLEM_TAGS,
  PROBLEM_BARRIER_TYPES,
  PROBLEM_TAGS,
  PROBLEM_URGENCIES,
} from "@/lib/constants/problem";
import type { SerializedProblem } from "@/lib/serializers/problem";

export interface ProblemFormProps {
  mode: "create" | "edit";
  problemId?: string;
  initial?: SerializedProblem;
  onSaved?: (problem: SerializedProblem) => void;
}

type SubmitMode = "publish" | "draft";

export function ProblemForm({
  mode,
  problemId,
  initial,
  onSaved,
}: ProblemFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [context, setContext] = useState(initial?.context ?? "");
  const [barrierType, setBarrierType] = useState<
    "resources" | "knowledge" | "process" | "community" | "equipment" | "other"
  >(initial?.barrierType ?? "resources");
  const [actionsTaken, setActionsTaken] = useState(initial?.actionsTaken ?? "");
  const [expectedOutcome, setExpectedOutcome] = useState(
    initial?.expectedOutcome ?? "",
  );
  const [urgency, setUrgency] = useState<
    "low" | "medium" | "high" | "critical"
  >(initial?.urgency ?? "medium");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [isAnonymous, setIsAnonymous] = useState(initial?.isAnonymous ?? false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<SubmitMode | null>(null);

  const sensitiveMatches = useMemo(
    () =>
      scanSensitiveContent(
        title,
        description,
        context,
        actionsTaken,
        expectedOutcome,
      ),
    [title, description, context, actionsTaken, expectedOutcome],
  );

  async function submit(submitMode: SubmitMode) {
    setError(null);

    if (sensitiveMatches.length > 0 && !acknowledged) {
      setError("برای انتشار، هشدار محتوای حساس را تأیید کنید.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      context: context.trim() || undefined,
      barrierType,
      actionsTaken: actionsTaken.trim() || undefined,
      expectedOutcome: expectedOutcome.trim() || undefined,
      urgency,
      tags,
      isAnonymous,
      isDraft: submitMode === "draft",
      sensitiveAcknowledged: sensitiveMatches.length > 0 ? acknowledged : false,
    };

    setSubmitting(submitMode);
    try {
      const res =
        mode === "create"
          ? await fetch("/api/problems", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/problems/${problemId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      const body = (await res.json()) as {
        ok: boolean;
        data?: { problem: SerializedProblem };
        error?: { message: string; details?: { sensitiveMatches?: unknown } };
      };

      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ثبت مسئله");
        return;
      }

      const problem = body.data?.problem;

      if (mode === "edit" && onSaved && problem) {
        onSaved(problem);
        toast({
          title:
            submitMode === "publish" ? "مسئله منتشر شد" : "پیش‌نویس ذخیره شد",
          tone: "success",
        });
        return;
      }

      if (submitMode === "publish" && problem) {
        toast({ title: "مسئله با موفقیت منتشر شد", tone: "success" });
        router.push(`/problems/${problem.id}`);
      } else {
        toast({ title: "پیش‌نویس ذخیره شد", tone: "success" });
        router.push("/problems?drafts=1");
      }
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setSubmitting(null);
    }
  }

  const fieldLabelClass = "text-foreground block text-sm font-medium";

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
        <label htmlFor="problemTitle" className={fieldLabelClass}>
          عنوان مسئله
        </label>
        <Input
          id="problemTitle"
          value={title}
          maxLength={120}
          placeholder="مثلاً: کاهش پوشش واکسیناسیون در روستای محل خدمت"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="problemDescription" className={fieldLabelClass}>
          شرح مسئله
        </label>
        <Textarea
          id="problemDescription"
          value={description}
          maxLength={2000}
          rows={5}
          placeholder="مسئله چیست؟ چه چیزی و چرا برای شما مسئله شده است؟"
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="barrierType" className={fieldLabelClass}>
            نوع مانع
          </label>
          <Select
            id="barrierType"
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
          <label htmlFor="urgency" className={fieldLabelClass}>
            فوریت
          </label>
          <Select
            id="urgency"
            value={urgency}
            onChange={(event) =>
              setUrgency(event.target.value as typeof urgency)
            }
          >
            {PROBLEM_URGENCIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="context" className={fieldLabelClass}>
          زمینه و شرایط
        </label>
        <Textarea
          id="context"
          value={context}
          maxLength={600}
          rows={3}
          placeholder="شرایط، جمعیت، زمان و محدودیت‌ها (بدون اطلاعات شناسایی‌کننده)"
          onChange={(event) => setContext(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="actionsTaken" className={fieldLabelClass}>
          اقدامات انجام‌شده
        </label>
        <Textarea
          id="actionsTaken"
          value={actionsTaken}
          maxLength={600}
          rows={3}
          placeholder="تاکنون چه راه‌هایی را امتحان کرده‌اید؟"
          onChange={(event) => setActionsTaken(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="expectedOutcome" className={fieldLabelClass}>
          نتیجه مورد انتظار
        </label>
        <Textarea
          id="expectedOutcome"
          value={expectedOutcome}
          maxLength={600}
          rows={3}
          placeholder="دوست دارید به چه نتیجه‌ای برسید؟"
          onChange={(event) => setExpectedOutcome(event.target.value)}
        />
      </div>

      <TagInput
        label="برچسب‌ها"
        value={tags}
        onChange={setTags}
        suggestions={PROBLEM_TAGS}
        max={MAX_PROBLEM_TAGS}
      />

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
          className="accent-brand-600 mt-1"
        />
        <span>
          انتشار ناشناس
          <span className="text-muted-foreground block text-xs">
            نام و محل خدمت شما نمایش داده نمی‌شود.
          </span>
        </span>
      </label>

      <SensitiveWarning
        matches={sensitiveMatches}
        acknowledged={acknowledged}
        onAcknowledge={setAcknowledged}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          loading={submitting !== null}
          onClick={() => submit("publish")}
        >
          {mode === "edit"
            ? initial?.isDraft
              ? "انتشار مسئله"
              : "ذخیره تغییرات"
            : "انتشار مسئله"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={submitting !== null}
          onClick={() => submit("draft")}
        >
          ذخیره پیش‌نویس
        </Button>
      </div>
    </div>
  );
}
