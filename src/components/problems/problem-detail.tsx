"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ProblemForm } from "@/components/problems/problem-form";
import { AnswerItem } from "@/components/problems/answer-item";
import { AnswerForm } from "@/components/problems/answer-form";
import { ReportDialog } from "@/components/problems/report-dialog";
import { formatRelativeTime } from "@/lib/dates";
import {
  PROBLEM_BARRIER_LABELS,
  PROBLEM_RESULT_OUTCOMES,
  PROBLEM_RESULT_OUTCOME_LABELS,
  PROBLEM_STATUS_LABELS,
  PROBLEM_URGENCY_LABELS,
} from "@/lib/constants/problem";
import type { ProblemStatus } from "@/generated/prisma/client";
import type {
  SerializedAnswer,
  SerializedProblem,
} from "@/lib/serializers/problem";

export interface ProblemDetailProps {
  initialProblem: SerializedProblem;
  related: SerializedProblem[];
  isAuthor: boolean;
  canModerate: boolean;
}

export function ProblemDetail({
  initialProblem,
  related,
  isAuthor,
  canModerate,
}: ProblemDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [problem, setProblem] = useState<SerializedProblem>(initialProblem);
  const [editing, setEditing] = useState(false);
  const [processingAnswerId, setProcessingAnswerId] = useState<string | null>(
    null,
  );
  const [solutionAnswerId, setSolutionAnswerId] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState("");
  const [conclusionError, setConclusionError] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultOutcome, setResultOutcome] = useState("successful");
  const [resultSummary, setResultSummary] = useState("");
  const [resultError, setResultError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    type: "problem" | "answer";
    id: string;
  } | null>(null);

  const isLocked = problem.status === "archived";

  function updateAnswer(answerId: string, patch: Partial<SerializedAnswer>) {
    setProblem((current) => ({
      ...current,
      answers: current.answers.map((answer) =>
        answer.id === answerId ? { ...answer, ...patch } : answer,
      ),
    }));
  }

  async function toggleHelpful(answerId: string) {
    setProcessingAnswerId(answerId);
    try {
      const res = await fetch(
        `/api/problems/${problem.id}/answers/${answerId}/helpful`,
        { method: "POST" },
      );
      const body = (await res.json()) as {
        ok: boolean;
        data?: { helpfulCount: number; isHelpfulByMe: boolean };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({ title: body.error?.message ?? "خطا در ثبت", tone: "danger" });
        return;
      }
      updateAnswer(answerId, {
        helpfulCount: body.data!.helpfulCount,
        isHelpfulByMe: body.data!.isHelpfulByMe,
      });
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setProcessingAnswerId(null);
    }
  }

  async function submitSolution() {
    if (!solutionAnswerId) return;
    setConclusionError(null);
    if (conclusion.trim().length < 5) {
      setConclusionError("جمع‌بندی باید حداقل ۵ کاراکتر باشد");
      return;
    }
    setProcessingAnswerId(solutionAnswerId);
    try {
      const res = await fetch(`/api/problems/${problem.id}/select-solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answerId: solutionAnswerId,
          conclusion: conclusion.trim(),
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { problem: SerializedProblem };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setConclusionError(body.error?.message ?? "خطا در ثبت راهکار");
        return;
      }
      setProblem(body.data!.problem);
      setSolutionAnswerId(null);
      setConclusion("");
      toast({ title: "راهکار انتخاب و مسئله حل‌شده شد", tone: "success" });
    } catch {
      setConclusionError("خطا در ارتباط با سرور");
    } finally {
      setProcessingAnswerId(null);
    }
  }

  async function archiveProblem() {
    setProcessingAnswerId("__archive__");
    try {
      const res = await fetch(`/api/problems/${problem.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: "archived", note: "بایگانی توسط نویسنده" }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { problem: SerializedProblem };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({
          title: body.error?.message ?? "خطا در بایگانی",
          tone: "danger",
        });
        return;
      }
      setProblem(body.data!.problem);
      toast({ title: "مسئله بایگانی شد", tone: "success" });
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setProcessingAnswerId(null);
    }
  }

  async function submitResult() {
    setResultError(null);
    if (resultSummary.trim().length < 5) {
      setResultError("خلاصه نتیجه باید حداقل ۵ کاراکتر باشد");
      return;
    }
    setProcessingAnswerId("__result__");
    try {
      const res = await fetch(`/api/problems/${problem.id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultOutcome,
          resultSummary: resultSummary.trim(),
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { problem: SerializedProblem };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setResultError(body.error?.message ?? "خطا در ثبت نتیجه");
        return;
      }
      setProblem(body.data!.problem);
      setResultOpen(false);
      setResultSummary("");
      toast({ title: "نتیجه اجرا ثبت شد", tone: "success" });
    } catch {
      setResultError("خطا در ارتباط با سرور");
    } finally {
      setProcessingAnswerId(null);
    }
  }

  function onAnswerSubmitted(
    answer: SerializedAnswer,
    problemStatus: ProblemStatus,
  ) {
    setProblem((current) => ({
      ...current,
      status: problemStatus,
      answerCount: current.answerCount + 1,
      answers: [...current.answers, answer],
    }));
    router.refresh();
  }

  function onEdited(saved: SerializedProblem) {
    setProblem(saved);
    setEditing(false);
    router.refresh();
  }

  const statusTone =
    problem.status === "solved"
      ? ("success" as const)
      : problem.status === "archived"
        ? ("neutral" as const)
        : ("brand" as const);

  const urgencyTone =
    problem.urgency === "critical" || problem.urgency === "high"
      ? ("danger" as const)
      : problem.urgency === "medium"
        ? ("warning" as const)
        : ("neutral" as const);

  return (
    <div className="space-y-6">
      <article className="border-border bg-card shadow-card rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone}>
              {PROBLEM_STATUS_LABELS[problem.status]}
            </Badge>
            <Badge tone={urgencyTone}>
              فوریت: {PROBLEM_URGENCY_LABELS[problem.urgency]}
            </Badge>
            {problem.isAnonymous && <Badge tone="info">ناشناس</Badge>}
          </div>

          {canModerate && problem.moderation !== "visible" && (
            <Badge tone="danger">غیرقابل‌نمایش (نظارت)</Badge>
          )}
        </div>

        <h1 className="text-foreground mt-3 text-2xl leading-relaxed font-extrabold">
          {problem.title}
        </h1>

        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-foreground text-sm font-semibold">
            {problem.isAnonymous
              ? "ناشناس"
              : (problem.author?.displayName ?? "بی‌نام")}
          </span>
          {!problem.isAnonymous && problem.author?.province && (
            <>
              <span aria-hidden="true">•</span>
              <span>{problem.author.province}</span>
            </>
          )}
          <span aria-hidden="true">•</span>
          <span>{formatRelativeTime(problem.createdAt)}</span>
          <span aria-hidden="true">•</span>
          <span>{PROBLEM_BARRIER_LABELS[problem.barrierType]}</span>
        </div>

        {problem.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {problem.tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <p className="text-foreground mt-4 text-sm leading-7 whitespace-pre-wrap">
          {problem.description}
        </p>

        {problem.context && (
          <section className="bg-accent text-accent-foreground mt-4 rounded-lg p-4">
            <h2 className="text-sm font-bold">زمینه و شرایط</h2>
            <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">
              {problem.context}
            </p>
          </section>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {problem.actionsTaken && (
            <section>
              <h2 className="text-foreground text-sm font-bold">
                اقدامات انجام‌شده
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6 whitespace-pre-wrap">
                {problem.actionsTaken}
              </p>
            </section>
          )}
          {problem.expectedOutcome && (
            <section>
              <h2 className="text-foreground text-sm font-bold">
                نتیجه مورد انتظار
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6 whitespace-pre-wrap">
                {problem.expectedOutcome}
              </p>
            </section>
          )}
        </div>

        {problem.needsReview && (
          <div className="border-warning/40 bg-warning/5 text-warning mt-4 rounded-lg border p-3 text-sm">
            این مسئله برای بررسی محتوای حساس در صف ناظر قرار دارد.
          </div>
        )}

        {problem.conclusion && (
          <section className="border-brand-300 bg-brand-50 mt-4 rounded-lg border p-4">
            <h2 className="text-brand-800 text-sm font-bold">
              جمع‌بندی راهکار
            </h2>
            <p className="text-brand-900 mt-1 text-sm leading-6 whitespace-pre-wrap">
              {problem.conclusion}
            </p>
          </section>
        )}

        {problem.resultSummary && (
          <section className="border-border bg-muted/40 mt-4 rounded-lg border p-4">
            <h2 className="text-foreground text-sm font-bold">
              نتیجه اجرا
              {problem.resultOutcome && (
                <Badge
                  tone={
                    problem.resultOutcome === "successful"
                      ? "success"
                      : problem.resultOutcome === "partial"
                        ? "warning"
                        : "danger"
                  }
                  className="mr-2"
                >
                  {PROBLEM_RESULT_OUTCOME_LABELS[problem.resultOutcome]}
                </Badge>
              )}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6 whitespace-pre-wrap">
              {problem.resultSummary}
            </p>
          </section>
        )}

        {isAuthor && !editing && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              ویرایش مسئله
            </Button>
            {problem.status === "solved" && !problem.resultSummary && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setResultOpen(true)}
              >
                ثبت نتیجه اجرا
              </Button>
            )}
            {!isLocked && (
              <Button
                size="sm"
                variant="ghost"
                loading={processingAnswerId === "__archive__"}
                onClick={archiveProblem}
              >
                بایگانی مسئله
              </Button>
            )}
          </div>
        )}

        {editing && (
          <div className="border-border mt-5 border-t pt-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-foreground text-lg font-bold">
                ویرایش مسئله
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                بستن
              </Button>
            </div>
            <ProblemForm
              mode="edit"
              problemId={problem.id}
              initial={problem}
              onSaved={onEdited}
            />
          </div>
        )}
      </article>

      <section>
        <h2 className="text-foreground mb-3 text-lg font-bold">
          پاسخ‌ها ({problem.answers.length})
        </h2>

        {problem.answers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            هنوز پاسخی ثبت نشده است. اولین پاسخ را شما بدهید.
          </p>
        ) : (
          <div className="space-y-3">
            {problem.answers.map((answer) => (
              <AnswerItem
                key={answer.id}
                answer={answer}
                problem={problem}
                isAuthor={isAuthor}
                busy={processingAnswerId === answer.id}
                onHelpfulToggle={(answerId) => void toggleHelpful(answerId)}
                onSelectSolution={(answerId) => setSolutionAnswerId(answerId)}
                onReport={(answerId) =>
                  setReportTarget({ type: "answer", id: answerId })
                }
              />
            ))}
          </div>
        )}

        {!isLocked && (
          <div className="border-border bg-card shadow-card mt-4 rounded-xl border p-4">
            <h3 className="text-foreground mb-3 text-base font-bold">
              پاسخ خود را ثبت کنید
            </h3>
            <AnswerForm
              problemId={problem.id}
              onSubmitted={onAnswerSubmitted}
            />
          </div>
        )}
      </section>

      {problem.statusHistory.length > 0 && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            تاریخچه وضعیت
          </h2>
          <ol className="space-y-2">
            {problem.statusHistory.map((change) => (
              <li
                key={change.id}
                className="border-border text-muted-foreground rounded-lg border px-3 py-2 text-sm"
              >
                {change.from ? `${PROBLEM_STATUS_LABELS[change.from]} ← ` : ""}
                {PROBLEM_STATUS_LABELS[change.to]} —{" "}
                {formatRelativeTime(change.createdAt)}
                {change.note && (
                  <span className="block text-xs"> {change.note}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-bold">
            مسئله‌های مرتبط
          </h2>
          <div className="space-y-3">
            {related.map((item) => (
              <article
                key={item.id}
                className="border-border bg-card shadow-card rounded-xl border p-4"
              >
                <a
                  href={`/problems/${item.id}`}
                  className="text-foreground hover:text-brand-700 text-sm font-bold"
                >
                  {item.title}
                </a>
                <p className="text-muted-foreground mt-1 text-xs">
                  {PROBLEM_STATUS_LABELS[item.status]} • {item.answerCount} پاسخ
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReportTarget({ type: "problem", id: problem.id })}
        >
          گزارش این مسئله
        </Button>
      </div>

      <Modal
        open={solutionAnswerId !== null}
        onClose={() => setSolutionAnswerId(null)}
        title="انتخاب راهکار و جمع‌بندی"
        description="با انتخاب این پاسخ، مسئله «حل‌شده» می‌شود. جمع‌بندی کوتاهی بنویسید تا برای دیگران قابل استفاده باشد."
      >
        <div className="space-y-4">
          {conclusionError && (
            <p role="alert" className="text-destructive text-sm">
              {conclusionError}
            </p>
          )}
          <div className="space-y-1.5">
            <label
              htmlFor="conclusion"
              className="text-foreground block text-sm font-medium"
            >
              جمع‌بندی
            </label>
            <Textarea
              id="conclusion"
              value={conclusion}
              maxLength={800}
              rows={4}
              placeholder="چه راهکاری نتیجه داد؟ چه چیزی را به همکاران پیشنهاد می‌کنید؟"
              onChange={(event) => setConclusion(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSolutionAnswerId(null)}>
              انصراف
            </Button>
            <Button
              loading={processingAnswerId !== null}
              onClick={() => void submitSolution()}
            >
              تأیید راهکار
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        title="ثبت نتیجه اجرا"
        description="نتیجه اجرای راهکار در میدان را ثبت کنید؛ این نتیجه به دانش جامعه تبدیل می‌شود."
      >
        <div className="space-y-4">
          {resultError && (
            <p role="alert" className="text-destructive text-sm">
              {resultError}
            </p>
          )}
          <div className="space-y-1.5">
            <label
              htmlFor="resultOutcome"
              className="text-foreground block text-sm font-medium"
            >
              نتیجه
            </label>
            <Select
              id="resultOutcome"
              value={resultOutcome}
              onChange={(event) => setResultOutcome(event.target.value)}
            >
              {PROBLEM_RESULT_OUTCOMES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="resultSummary"
              className="text-foreground block text-sm font-medium"
            >
              خلاصه نتیجه
            </label>
            <Textarea
              id="resultSummary"
              value={resultSummary}
              maxLength={800}
              rows={4}
              placeholder="چه اتفاقی افتاد؟ چه چیزی مفید بود و چه چیزی نه؟"
              onChange={(event) => setResultSummary(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setResultOpen(false)}>
              انصراف
            </Button>
            <Button
              loading={processingAnswerId === "__result__"}
              onClick={() => void submitResult()}
            >
              ثبت نتیجه
            </Button>
          </div>
        </div>
      </Modal>

      {reportTarget && (
        <ReportDialog
          open={reportTarget !== null}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </div>
  );
}
