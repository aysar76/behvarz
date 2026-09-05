import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { formatRelativeTime } from "@/lib/dates";
import {
  PROBLEM_BARRIER_LABELS,
  PROBLEM_STATUS_LABELS,
  PROBLEM_URGENCY_LABELS,
} from "@/lib/constants/problem";
import type { SerializedProblem } from "@/lib/serializers/problem";

export function ProblemCard({ problem }: { problem: SerializedProblem }) {
  const urgencyTone =
    problem.urgency === "critical" || problem.urgency === "high"
      ? ("danger" as const)
      : problem.urgency === "medium"
        ? ("warning" as const)
        : ("neutral" as const);

  const statusTone =
    problem.status === "solved"
      ? ("success" as const)
      : problem.status === "archived"
        ? ("neutral" as const)
        : ("brand" as const);

  return (
    <article className="border-border bg-card shadow-card hover:shadow-md hover:border-brand-200 group rounded-xl border p-4 transition-all duration-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link
          href={`/problems/${problem.id}`}
          className="text-foreground hover:text-brand-700 text-base leading-6 font-bold transition-colors"
        >
          {problem.title}
        </Link>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={statusTone}>{PROBLEM_STATUS_LABELS[problem.status]}</Badge>
          <Badge tone={urgencyTone}>
            فوریت: {PROBLEM_URGENCY_LABELS[problem.urgency]}
          </Badge>
        </div>
      </div>

      <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-6">
        {problem.description}
      </p>

      <div className="text-muted-foreground mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="user" className="size-3.5" />
          {problem.isAnonymous
            ? "ناشناس"
            : (problem.author?.displayName ?? "بی‌نام")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="clock" className="size-3.5" />
          {formatRelativeTime(problem.createdAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="target" className="size-3.5" />
          {PROBLEM_BARRIER_LABELS[problem.barrierType]}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="messages" className="size-3.5" />
          {problem.answerCount} پاسخ
        </span>
      </div>

      {problem.tags.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {problem.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
}