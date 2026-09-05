import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/dates";
import { EXPERIENCE_STATUS_LABELS } from "@/lib/constants/experience";
import type { SerializedExperience } from "@/lib/serializers/experience";

export function experienceStatusTone(
  status: SerializedExperience["status"],
): "success" | "brand" | "warning" | "neutral" | "info" {
  switch (status) {
    case "featured":
      return "success";
    case "reviewed":
      return "info";
    case "under_review":
      return "warning";
    case "archived":
      return "neutral";
    default:
      return "brand";
  }
}

export function ExperienceCard({
  experience,
}: {
  experience: SerializedExperience;
}) {
  return (
    <article className="border-border bg-card shadow-card rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link
          href={`/experiences/${experience.slug}`}
          className="text-foreground hover:text-brand-700 text-base leading-6 font-bold transition-colors"
        >
          {experience.title}
        </Link>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={experienceStatusTone(experience.status)}>
            {EXPERIENCE_STATUS_LABELS[experience.status]}
          </Badge>
        </div>
      </div>

      <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-6">
        {experience.situation}
      </p>

      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span>{experience.author?.displayName ?? "بی‌نام"}</span>
        <span aria-hidden="true">•</span>
        <span>{formatRelativeTime(experience.createdAt)}</span>
        <span aria-hidden="true">•</span>
        <span>{experience.referenceCount} ارجاع</span>
        <span aria-hidden="true">•</span>
        <span>{experience.reuseCount} اجرای ثبت‌شده</span>
      </div>

      {experience.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {experience.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
}