"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { FIELD_APPLICATION_OUTCOMES } from "@/lib/constants/academy";
import type { LessonForLearning } from "@/lib/academy";

interface LessonLearnerProps {
  lesson: LessonForLearning;
  courseId: string;
  courseSlug: string;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
}

type QuizState = "idle" | "submitting" | "passed" | "failed";

export function LessonLearner({
  lesson,
  courseId,
  courseSlug,
  prevLesson,
  nextLesson,
}: LessonLearnerProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [answers, setAnswers] = useState<number[]>(
    lesson.quizQuestions.map(() => -1),
  );
  const [quizState, setQuizState] = useState<QuizState>(
    lesson.quizPassed ? "passed" : "idle",
  );
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [completing, setCompleting] = useState(false);

  const [applyOpen, setApplyOpen] = useState(false);
  const [applySummary, setApplySummary] = useState("");
  const [applyOutcome, setApplyOutcome] = useState("successful");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyRecorded, setApplyRecorded] = useState(false);

  const hasQuiz = lesson.quizQuestions.length > 0;
  const isComplete = lesson.progressStatus === "completed";
  const allAnswered =
    hasQuiz && answers.every((a) => a >= 0) && quizState !== "passed";

  async function handleQuizSubmit() {
    if (!allAnswered) return;
    setQuizState("submitting");
    try {
      const res = await fetch(`/api/academy/lessons/${lesson.id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { score: number; total: number; passed: boolean };
        error?: { message: string };
      };
      if (!res.ok || !body.ok || !body.data) {
        toast({
          title: body.error?.message ?? "خطا در ثبت آزمونک",
          tone: "danger",
        });
        setQuizState("idle");
        return;
      }
      setQuizResult({ score: body.data.score, total: body.data.total });
      setQuizState(body.data.passed ? "passed" : "failed");
      if (body.data.passed) {
        toast({ title: "آفرین! آزمونک را گذراندی", tone: "success" });
      }
    } catch {
      setQuizState("idle");
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/academy/lessons/${lesson.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { completed: boolean; courseCompleted: boolean };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({
          title: body.error?.message ?? "خطا در ثبت تکمیل درس",
          tone: "danger",
        });
        return;
      }
      toast({
        title: body.data?.courseCompleted
          ? "دوره کامل شد! کاربرد میدانی را ثبت کن"
          : "درس تکمیل شد",
        tone: "success",
      });
      router.refresh();
      if (body.data?.courseCompleted) {
        setApplyOpen(true);
      }
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setCompleting(false);
    }
  }

  async function handleApply() {
    if (applySummary.trim().length < 5) {
      toast({ title: "خلاصه کاربرد را کامل بنویس", tone: "warning" });
      return;
    }
    setApplySubmitting(true);
    try {
      const res = await fetch(`/api/academy/lessons/${lesson.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          summary: applySummary,
          outcome: applyOutcome,
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({
          title: body.error?.message ?? "خطا در ثبت کاربرد میدانی",
          tone: "danger",
        });
        return;
      }
      setApplyRecorded(true);
      toast({ title: "کاربرد میدانی ثبت شد", tone: "success" });
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    } finally {
      setApplySubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-border bg-card shadow-card rounded-xl border p-5">
        <article className="prose prose-sm prose-brand max-w-none whitespace-pre-wrap leading-7 text-foreground">
          {lesson.body}
        </article>

        {lesson.contentType !== "text" && lesson.mediaUrl ? (
          <div className="mt-4">
            {lesson.contentType === "video" ? (
              <video
                controls
                preload="metadata"
                src={lesson.mediaUrl}
                className="aspect-video w-full rounded-lg"
              />
            ) : (
              <audio controls src={lesson.mediaUrl} className="w-full" />
            )}
          </div>
        ) : null}
      </div>

      {hasQuiz ? (
        <section className="border-border bg-card shadow-card rounded-xl border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-foreground text-lg font-bold">آزمونک</h2>
            {quizState === "passed" ? (
              <Badge tone="success">قبول‌شده</Badge>
            ) : quizState === "failed" ? (
              <Badge tone="danger">تلاش مجدد</Badge>
            ) : null}
          </div>

          {quizState === "passed" ? (
            <p className="text-success text-sm">
              آزمونک را با موفقیت گذراندی.
            </p>
          ) : (
            <div className="space-y-4">
              {lesson.quizQuestions.map((q, qIndex) => (
                <fieldset key={q.id}>
                  <legend className="text-foreground mb-2 text-sm font-semibold">
                    {qIndex + 1}. {q.question}
                  </legend>
                  <div className="space-y-2">
                    {q.options.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                          answers[qIndex] === oIndex
                            ? "border-brand-300 bg-brand-50"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={answers[qIndex] === oIndex}
                          onChange={() =>
                            setAnswers((prev) => {
                              const next = [...prev];
                              next[qIndex] = oIndex;
                              return next;
                            })
                          }
                          className="accent-primary"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}

              {quizResult ? (
                <p
                  className={
                    quizState === "failed"
                      ? "text-destructive text-sm"
                      : "text-success text-sm"
                  }
                >
                  نتیجه: {quizResult.score} از {quizResult.total}
                  {quizState === "failed"
                    ? " — برای قبولی باید به همه پرسش‌ها پاسخ درست دهی."
                    : ""}
                </p>
              ) : null}

              <Button
                onClick={handleQuizSubmit}
                loading={quizState === "submitting"}
                disabled={!allAnswered}
              >
                {quizState === "failed" ? "تلاش دوباره" : "ثبت پاسخ"}
              </Button>
            </div>
          )}
        </section>
      ) : null}

      {isComplete ? (
        <section className="border-success/30 bg-success/5 border rounded-xl p-5">
          <h2 className="text-foreground text-lg font-bold">درس تکمیل شد</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            این درس را کامل کرده‌ای. اگر آن را در میدان به کار بردی، نتیجه را
            ثبت کن تا حلقه «آموزش → سنجش → کاربرد» بسته شود.
          </p>
          {!applyRecorded ? (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => setApplyOpen(true)}
            >
              ثبت کاربرد میدانی
            </Button>
          ) : (
            <p className="text-success mt-3 text-sm">کاربرد میدانی ثبت شد. ✦</p>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {hasQuiz && quizState !== "passed" ? (
            <p className="text-muted-foreground text-sm">
              برای تکمیل درس، ابتدا آزمونک را با موفقیت بگذران.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              با مطالعه کامل این درس، آن را تکمیل کن.
            </p>
          )}
          <Button
            onClick={handleComplete}
            loading={completing}
            disabled={hasQuiz && quizState !== "passed"}
          >
            تکمیل درس
          </Button>
        </section>
      )}

      {applyOpen ? (
        <section className="border-border bg-card shadow-card rounded-xl border p-5">
          <h2 className="text-foreground mb-3 text-lg font-bold">
            ثبت کاربرد میدانی
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-foreground block text-sm font-medium">
                خلاصه کاربرد
              </label>
              <Textarea
                value={applySummary}
                onChange={(e) => setApplySummary(e.target.value)}
                placeholder="این آموزش را در کدام موقعیت میدانی به کار بردی؟ نتیجه چه بود؟"
                maxLength={800}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-foreground block text-sm font-medium">
                نتیجه کاربرد
              </label>
              <Select
                value={applyOutcome}
                onChange={(e) => setApplyOutcome(e.target.value)}
              >
                {FIELD_APPLICATION_OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              onClick={handleApply}
              loading={applySubmitting}
            >
              ثبت کاربرد میدانی
            </Button>
          </div>
        </section>
      ) : null}

      {isComplete && !applyOpen && !applyRecorded ? (
        <p className="text-muted-foreground text-xs">
          ثبت کاربرد میدانی به جامعه کمک می‌کند تا اثر واقعی آموزش‌ها را ببیند.
        </p>
      ) : null}

      <nav className="flex items-center justify-between gap-3">
        {prevLesson ? (
          <Link href={`/academy/lessons/${prevLesson.id}`}>
            <Button variant="outline" size="sm">
              → درس قبل: {prevLesson.title}
            </Button>
          </Link>
        ) : (
          <span />
        )}
        {nextLesson ? (
          <Link href={`/academy/lessons/${nextLesson.id}`}>
            <Button size="sm">درس بعد: {nextLesson.title} ←</Button>
          </Link>
        ) : (
          <Link href={`/academy/${courseSlug}`}>
            <Button size="sm">بازگشت به دوره</Button>
          </Link>
        )}
      </nav>
    </div>
  );
}
