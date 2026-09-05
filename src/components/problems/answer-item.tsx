"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThanksButton } from "@/components/interactions/thanks-button";
import { formatRelativeTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type {
  SerializedAnswer,
  SerializedProblem,
} from "@/lib/serializers/problem";

export interface AnswerItemProps {
  answer: SerializedAnswer;
  problem: SerializedProblem;
  isAuthor: boolean;
  onHelpfulToggle: (answerId: string) => void;
  onThanksToggle: (
    answerId: string,
    thanksCount: number,
    isThankedByMe: boolean,
  ) => void;
  onSelectSolution: (answerId: string) => void;
  onReport: (answerId: string) => void;
  busy?: boolean;
}

export function AnswerItem({
  answer,
  problem,
  isAuthor,
  onHelpfulToggle,
  onThanksToggle,
  onSelectSolution,
  onReport,
  busy,
}: AnswerItemProps) {
  const canChoose =
    isAuthor &&
    problem.status !== "solved" &&
    problem.status !== "archived" &&
    !answer.isSelectedSolution;

  return (
    <article
      className={cn(
        "border-border bg-card rounded-xl border p-4",
        answer.isSelectedSolution && "border-brand-400 bg-brand-50/60",
      )}
    >
      {answer.isSelectedSolution && (
        <div className="mb-2">
          <Badge tone="success">راهکار انتخاب‌شده</Badge>
        </div>
      )}

      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <span className="text-foreground text-sm font-semibold">
          {answer.author.displayName ?? "بی‌نام"}
        </span>
        <span aria-hidden="true">•</span>
        <span>{formatRelativeTime(answer.createdAt)}</span>
        {answer.isClarificationRequest && (
          <Badge tone="info">درخواست توضیح</Badge>
        )}
      </div>

      <p className="text-foreground mt-2 text-sm leading-7 whitespace-pre-wrap">
        {answer.body}
      </p>

      {answer.references.length > 0 && (
        <div className="bg-brand-50 border-brand-200 mt-3 rounded-lg border p-3">
          <p className="text-brand-800 text-xs font-bold">
            تجربه‌های ارجاع‌شده
          </p>
          <ul className="mt-1.5 space-y-1">
            {answer.references.map((ref) => (
              <li key={ref.id} className="text-sm">
                <a
                  href={`/experiences/${ref.slug}`}
                  className="text-brand-700 font-medium underline"
                >
                  {ref.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={answer.isHelpfulByMe ? "secondary" : "outline"}
          disabled={busy}
          onClick={() => onHelpfulToggle(answer.id)}
        >
          {answer.helpfulCount > 0
            ? `مفید بود (${answer.helpfulCount})`
            : "مفید بود"}
        </Button>

        <ThanksButton
          targetType="answer"
          targetId={answer.id}
          thanked={answer.isThankedByMe}
          thanksCount={answer.thanksCount}
          disabled={busy}
          onToggle={(thanksCount, thanked) =>
            onThanksToggle(answer.id, thanksCount, thanked)
          }
        />

        {canChoose && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onSelectSolution(answer.id)}
          >
            انتخاب به‌عنوان راهکار
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => onReport(answer.id)}
        >
          گزارش
        </Button>
      </div>
    </article>
  );
}
