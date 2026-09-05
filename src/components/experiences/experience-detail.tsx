"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";
import { ExperienceForm } from "@/components/experiences/experience-form";
import { ReuseForm } from "@/components/experiences/reuse-form";
import { ReportDialog } from "@/components/problems/report-dialog";
import { FollowButton } from "@/components/interactions/follow-button";
import { SaveButton } from "@/components/interactions/save-button";
import { ThanksButton } from "@/components/interactions/thanks-button";
import { experienceStatusTone } from "@/components/experiences/experience-card";
import { formatRelativeTime } from "@/lib/dates";
import {
  EXPERIENCE_REUSE_OUTCOME_LABELS,
  EXPERIENCE_STATUS_LABELS,
} from "@/lib/constants/experience";
import type { SerializedExperience } from "@/lib/serializers/experience";

export interface ExperienceDetailProps {
  initialExperience: SerializedExperience;
  related: SerializedExperience[];
  isAuthor: boolean;
  canModerate: boolean;
}

export function ExperienceDetail({
  initialExperience,
  related,
  isAuthor,
  canModerate,
}: ExperienceDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [experience, setExperience] =
    useState<SerializedExperience>(initialExperience);
  const [editing, setEditing] = useState(false);
  const [reuseOpen, setReuseOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isArchived = experience.status === "archived";
  const canEdit = isAuthor && !isArchived && experience.moderation !== "removed";
  const canReuse =
    !isAuthor &&
    !isArchived &&
    experience.isDraft === false &&
    experience.moderation === "visible";

  async function archiveExperience() {
    setBusy(true);
    try {
      const res = await fetch(`/api/experiences/${experience.id}/archive`, {
        method: "POST",
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { experience: SerializedExperience };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در بایگانی", tone: "danger" });
        return;
      }
      setExperience(body.data!.experience);
      toast({ title: "تجربه بایگانی شد", tone: "success" });
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  async function reviewExperience(action: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/experiences/${experience.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { experience: SerializedExperience };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در بررسی", tone: "danger" });
        return;
      }
      setExperience(body.data!.experience);
      toast({ title: "وضعیت تجربه به‌روزرسانی شد", tone: "success" });
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  function onSaved(saved: SerializedExperience) {
    setExperience(saved);
    setEditing(false);
    router.refresh();
  }

  function onReuseSaved(saved: SerializedExperience) {
    setExperience(saved);
    router.refresh();
  }

  function toggleFollow(following: boolean) {
    setExperience((current) => ({ ...current, isFollowedByMe: following }));
  }

  function toggleSaved(saved: boolean) {
    setExperience((current) => ({ ...current, isSavedByMe: saved }));
  }

  function toggleThanks(thanksCount: number, isThankedByMe: boolean) {
    setExperience((current) => ({ ...current, thanksCount, isThankedByMe }));
  }

  const fields: { label: string; value?: string | null }[] = [
    { label: "شرایط و زمینه", value: experience.conditions },
    { label: "منابع و ابزارها", value: experience.resources },
    { label: "چالش‌ها", value: experience.challenges },
    { label: "درس‌آموخته‌ها", value: experience.lessons },
    { label: "پیشنهاد برای دیگران", value: experience.suggestion },
  ];

  return (
    <div className="space-y-6">
      <article className="border-border bg-card shadow-card rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={experienceStatusTone(experience.status)}>
              {EXPERIENCE_STATUS_LABELS[experience.status]}
            </Badge>
            {experience.status !== "reviewed" &&
              experience.status !== "featured" && (
                <Badge tone="neutral">تجربه شخصی</Badge>
              )}
            {experience.isDraft && <Badge tone="warning">پیش‌نویس</Badge>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!experience.isDraft && (
              <>
                <FollowButton
                  targetType="experience"
                  targetId={experience.id}
                  following={experience.isFollowedByMe}
                  onToggle={toggleFollow}
                />
                <SaveButton
                  targetType="experience"
                  targetId={experience.id}
                  saved={experience.isSavedByMe}
                  onToggle={toggleSaved}
                />
              </>
            )}
            {canModerate && experience.moderation !== "visible" && (
              <Badge tone="danger">غیرقابل‌نمایش (نظارت)</Badge>
            )}
          </div>
        </div>

        <h1 className="text-foreground mt-3 text-2xl leading-relaxed font-extrabold">
          {experience.title}
        </h1>

        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {experience.author ? (
            <span className="text-foreground inline-flex items-center gap-1.5 text-sm font-semibold">
              <Icon name="user" className="size-4" />
              <Link
                href={`/users/${experience.author.id}`}
                className="hover:text-brand-700 transition-colors"
              >
                {experience.author.displayName ?? "بی‌نام"}
              </Link>
            </span>
          ) : (
            <span className="text-foreground inline-flex items-center gap-1.5 text-sm font-semibold">
              <Icon name="user" className="size-4" />
              بی‌نام
            </span>
          )}
          {experience.author?.province && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="map-pin" className="size-3.5" />
              {experience.author.province}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" className="size-3.5" />
            {formatRelativeTime(experience.createdAt)}
          </span>
        </div>

        {experience.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {experience.tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <section className="mt-4">
          <h2 className="text-foreground text-sm font-bold">
            مسئله یا موقعیت
          </h2>
          <p className="text-foreground mt-1 text-sm leading-7 whitespace-pre-wrap">
            {experience.situation}
          </p>
        </section>

        <div className="mt-4 space-y-4">
          {fields
            .filter((field) => field.value)
            .map((field) => (
              <section key={field.label}>
                <h2 className="text-foreground text-sm font-bold">
                  {field.label}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm leading-6 whitespace-pre-wrap">
                  {field.value}
                </p>
              </section>
            ))}
        </div>

        <section className="border-brand-300 bg-brand-50 mt-4 rounded-lg border p-4">
          <h2 className="text-brand-800 text-sm font-bold">
            اقدامی که انجام شد
          </h2>
          <p className="text-brand-900 mt-1 text-sm leading-6 whitespace-pre-wrap">
            {experience.action}
          </p>
        </section>

        <section className="border-border bg-muted/40 mt-4 rounded-lg border p-4">
          <h2 className="text-foreground text-sm font-bold">نتیجه</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6 whitespace-pre-wrap">
            {experience.result}
          </p>
        </section>

        {experience.sourceProblemTitle && (
          <div className="text-muted-foreground mt-4 text-sm">
            برگرفته از مسئله{" "}
            <Link
              href={`/problems/${experience.sourceProblemId}`}
              className="text-brand-700 font-semibold underline"
            >
              {experience.sourceProblemTitle}
            </Link>
          </div>
        )}

        {experience.needsReview && (
          <div className="border-warning/40 bg-warning/5 text-warning mt-4 rounded-lg border p-3 text-sm">
            این تجربه برای بررسی محتوای حساس در صف ناظر قرار دارد.
          </div>
        )}

        {!experience.isDraft && (
          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="border-border bg-muted/30 rounded-xl border p-3 text-center">
              <div className="text-foreground inline-flex items-center gap-1.5 text-2xl font-extrabold">
                <Icon name="link" className="size-5 text-brand-600" />
                {experience.referenceCount}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                ارجاع در مسائل واقعی
              </div>
            </div>
            <div className="border-border bg-muted/30 rounded-xl border p-3 text-center">
              <div className="text-foreground inline-flex items-center gap-1.5 text-2xl font-extrabold">
                <Icon name="check-circle" className="size-5 text-brand-600" />
                {experience.reuseCount}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                اجرای ثبت‌شده
              </div>
            </div>
            <div className="border-border bg-muted/30 rounded-xl border p-3 text-center">
              <div className="text-foreground inline-flex items-center gap-1.5 text-2xl font-extrabold">
                <Icon name="star" className="size-5 text-brand-600" />
                {experience.reuseSuccessCount}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                اجرای موفق
              </div>
            </div>
          </section>
        )}

        {!experience.isDraft && (
          <div className="mt-4">
            <ThanksButton
              targetType="experience"
              targetId={experience.id}
              thanked={experience.isThankedByMe}
              thanksCount={experience.thanksCount}
              onToggle={toggleThanks}
            />
          </div>
        )}

        {canEdit && !editing && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              ویرایش تجربه
            </Button>
            {!experience.isDraft && (
              <Button
                size="sm"
                variant="ghost"
                loading={busy}
                onClick={() => void archiveExperience()}
              >
                بایگانی تجربه
              </Button>
            )}
          </div>
        )}

        {editing && (
          <div className="border-border mt-5 border-t pt-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-foreground text-lg font-bold">
                ویرایش تجربه
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                بستن
              </Button>
            </div>
            <ExperienceForm
              mode="edit"
              experienceId={experience.id}
              initial={experience}
              onSaved={onSaved}
            />
          </div>
        )}

        {canReuse && (
          <div className="mt-5">
            <Button
              loading={busy}
              onClick={() => setReuseOpen(true)}
            >
              {experience.isReusedByMe
                ? "ویرایش نتیجه اجرای من"
                : "این تجربه را اجرا کردم"}
            </Button>
            <p className="text-muted-foreground mt-2 text-xs">
              ثبت نتیجه اجرای مجدد، اعتبار این تجربه را برای دیگران نشان می‌دهد.
            </p>
          </div>
        )}

        {canModerate && !experience.isDraft && (
          <div className="border-border mt-5 border-t pt-4">
            <h3 className="text-foreground mb-2 text-sm font-bold">
              بررسی کیفیت (ناظر)
            </h3>
            <div className="flex flex-wrap gap-2">
              {experience.status !== "reviewed" &&
                experience.status !== "featured" && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busy}
                    onClick={() => void reviewExperience("approve")}
                  >
                    تأیید (بررسی‌شده)
                  </Button>
                )}
              {experience.status !== "featured" && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={busy}
                  onClick={() => void reviewExperience("feature")}
                >
                  برگزیده‌کردن
                </Button>
              )}
              {experience.status === "featured" && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busy}
                  onClick={() => void reviewExperience("unfeature")}
                >
                  حذف از برگزیده‌ها
                </Button>
              )}
              {experience.status === "archived" && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busy}
                  onClick={() => void reviewExperience("unarchive")}
                >
                  خارج‌کردن از بایگانی
                </Button>
              )}
            </div>
          </div>
        )}

        {experience.isDraft && (
          <div className="border-warning/40 bg-warning/5 text-warning mt-5 rounded-lg border p-3 text-sm">
            این تجربه پیش‌نویس است و فقط برای شما نمایش داده می‌شود.
          </div>
        )}
      </article>

      {!experience.isDraft && experience.reuses.length > 0 && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            نتایج اجرای مجدد ({experience.reuseCount})
          </h2>
          <div className="space-y-3">
            {experience.reuses.map((reuse) => (
              <article
                key={reuse.id}
                className="border-border bg-card shadow-card hover:shadow-md rounded-xl border p-4 transition-all duration-200"
              >
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="text-foreground inline-flex items-center gap-1.5 text-sm font-semibold">
                    <Icon name="user" className="size-4" />
                    {reuse.user.displayName ?? "بی‌نام"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="clock" className="size-3.5" />
                    {formatRelativeTime(reuse.createdAt)}
                  </span>
                  <Badge
                    tone={
                      reuse.outcome === "successful"
                        ? "success"
                        : reuse.outcome === "partial"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {EXPERIENCE_REUSE_OUTCOME_LABELS[reuse.outcome]}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-2 text-sm leading-6 whitespace-pre-wrap">
                  {reuse.summary}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            تجربه‌های مرتبط
          </h2>
          <div className="space-y-3">
            {related.map((item) => (
              <article
                key={item.id}
                className="border-border bg-card shadow-card hover:shadow-md hover:border-brand-200 rounded-xl border p-4 transition-all duration-200"
              >
                <Link
                  href={`/experiences/${item.slug}`}
                  className="text-foreground hover:text-brand-700 block text-sm font-bold transition-colors"
                >
                  {item.title}
                </Link>
                <p className="text-muted-foreground mt-1 text-xs">
                  {EXPERIENCE_STATUS_LABELS[item.status]} • {item.reuseCount}{" "}
                  اجرای ثبت‌شده
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {!experience.isDraft && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReportOpen(true)}
          >
            گزارش این تجربه
          </Button>
        </div>
      )}

      <ReuseForm
        open={reuseOpen}
        onClose={() => setReuseOpen(false)}
        experienceId={experience.id}
        initial={experience.myReuse}
        onSaved={onReuseSaved}
      />

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="experience"
        targetId={experience.id}
      />
    </div>
  );
}