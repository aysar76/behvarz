"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { TagInput } from "@/components/problems/tag-input";
import { SensitiveWarning } from "@/components/problems/sensitive-warning";
import { scanSensitiveContent } from "@/lib/content-safety";
import {
  EXPERIENCE_TAGS,
  MAX_EXPERIENCE_TAGS,
} from "@/lib/constants/experience";
import type { SerializedExperience } from "@/lib/serializers/experience";

export interface ExperienceFormProps {
  mode: "create" | "edit";
  experienceId?: string;
  initial?: SerializedExperience;
  onSaved?: (experience: SerializedExperience) => void;
}

type SubmitMode = "publish" | "draft";

export function ExperienceForm({
  mode,
  experienceId,
  initial,
  onSaved,
}: ExperienceFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [situation, setSituation] = useState(initial?.situation ?? "");
  const [conditions, setConditions] = useState(initial?.conditions ?? "");
  const [action, setAction] = useState(initial?.action ?? "");
  const [resources, setResources] = useState(initial?.resources ?? "");
  const [challenges, setChallenges] = useState(initial?.challenges ?? "");
  const [result, setResult] = useState(initial?.result ?? "");
  const [lessons, setLessons] = useState(initial?.lessons ?? "");
  const [suggestion, setSuggestion] = useState(initial?.suggestion ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<SubmitMode | null>(null);

  const sensitiveMatches = useMemo(
    () =>
      scanSensitiveContent(
        title,
        situation,
        conditions,
        action,
        resources,
        challenges,
        result,
        lessons,
        suggestion,
      ),
    [
      title,
      situation,
      conditions,
      action,
      resources,
      challenges,
      result,
      lessons,
      suggestion,
    ],
  );

  async function submit(submitMode: SubmitMode) {
    setError(null);

    if (sensitiveMatches.length > 0 && !acknowledged) {
      setError("برای انتشار، هشدار محتوای حساس را تأیید کنید.");
      return;
    }

    const payload = {
      title: title.trim(),
      situation: situation.trim(),
      conditions: conditions.trim() || undefined,
      action: action.trim(),
      resources: resources.trim() || undefined,
      challenges: challenges.trim() || undefined,
      result: result.trim(),
      lessons: lessons.trim() || undefined,
      suggestion: suggestion.trim() || undefined,
      tags,
      isDraft: submitMode === "draft",
      sensitiveAcknowledged: sensitiveMatches.length > 0 ? acknowledged : false,
    };

    setSubmitting(submitMode);
    try {
      const res =
        mode === "create"
          ? await fetch("/api/experiences", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/experiences/${experienceId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      const body = (await res.json()) as {
        ok: boolean;
        data?: { experience: SerializedExperience };
        error?: { message: string };
      };

      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ثبت تجربه");
        return;
      }

      const experience = body.data?.experience;

      if (mode === "edit" && onSaved && experience) {
        onSaved(experience);
        toast({
          title:
            submitMode === "publish" ? "تجربه منتشر شد" : "پیش‌نویس ذخیره شد",
          tone: "success",
        });
        return;
      }

      if (submitMode === "publish" && experience) {
        toast({ title: "تجربه با موفقیت منتشر شد", tone: "success" });
        router.push(`/experiences/${experience.slug}`);
      } else {
        toast({ title: "پیش‌نویس ذخیره شد", tone: "success" });
        router.push("/experiences?drafts=1");
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
        <label htmlFor="experienceTitle" className={fieldLabelClass}>
          عنوان تجربه
        </label>
        <Input
          id="experienceTitle"
          value={title}
          maxLength={120}
          placeholder="مثلاً: افزایش پوشش واکسیناسیون با دعوت چهره‌به‌چهره"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="experienceSituation" className={fieldLabelClass}>
          مسئله یا موقعیت
        </label>
        <Textarea
          id="experienceSituation"
          value={situation}
          maxLength={2000}
          rows={4}
          placeholder="در چه مسئله یا موقعیتی به این تجربه رسیدید؟ (بدون اطلاعات شناسایی‌کننده)"
          onChange={(event) => setSituation(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="experienceConditions" className={fieldLabelClass}>
          شرایط و زمینه
        </label>
        <Textarea
          id="experienceConditions"
          value={conditions}
          maxLength={800}
          rows={3}
          placeholder="جمعیت، امکانات، زمان و محدودیت‌ها (بدون مشخصات قابل شناسایی)"
          onChange={(event) => setConditions(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="experienceAction" className={fieldLabelClass}>
          اقدامی که انجام دادید
        </label>
        <Textarea
          id="experienceAction"
          value={action}
          maxLength={2000}
          rows={5}
          placeholder="دقیقاً چه کاری انجام دادید؟ گام‌به‌گام توضیح دهید تا قابل بازتولید باشد."
          onChange={(event) => setAction(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="experienceResources" className={fieldLabelClass}>
          منابع و ابزارهای استفاده‌شده
        </label>
        <Textarea
          id="experienceResources"
          value={resources}
          maxLength={800}
          rows={2}
          placeholder="برگه‌های آموزشی، ابزار، نیروی انسانی و..."
          onChange={(event) => setResources(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="experienceChallenges" className={fieldLabelClass}>
          چالش‌ها
        </label>
        <Textarea
          id="experienceChallenges"
          value={challenges}
          maxLength={800}
          rows={3}
          placeholder="با چه موانعی روبه‌رو شدید و چگونه از آن‌ها عبور کردید؟"
          onChange={(event) => setChallenges(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="experienceResult" className={fieldLabelClass}>
          نتیجه
        </label>
        <Textarea
          id="experienceResult"
          value={result}
          maxLength={2000}
          rows={4}
          placeholder="چه نتیجه‌ای گرفتید؟ چه چیزی تغییر کرد؟"
          onChange={(event) => setResult(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="experienceLessons" className={fieldLabelClass}>
          درس‌آموخته‌ها
        </label>
        <Textarea
          id="experienceLessons"
          value={lessons}
          maxLength={800}
          rows={3}
          placeholder="اگر دوباره شروع کنید، چه چیزی را متفاوت انجام می‌دهید؟"
          onChange={(event) => setLessons(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="experienceSuggestion" className={fieldLabelClass}>
          پیشنهاد برای دیگران
        </label>
        <Textarea
          id="experienceSuggestion"
          value={suggestion}
          maxLength={800}
          rows={3}
          placeholder="به همکاری که این وضعیت را دارد چه توصیه‌ای می‌کنید؟"
          onChange={(event) => setSuggestion(event.target.value)}
        />
      </div>

      <TagInput
        label="برچسب‌ها"
        value={tags}
        onChange={setTags}
        suggestions={EXPERIENCE_TAGS}
        max={MAX_EXPERIENCE_TAGS}
      />

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
              ? "انتشار تجربه"
              : "ذخیره تغییرات"
            : "انتشار تجربه"}
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