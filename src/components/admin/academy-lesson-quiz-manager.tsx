"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface QuizQuestion {
  id: string;
  question: string;
  options: unknown;
  correctIndex: number;
  explanation: string | null;
  order: number;
}

interface QuestionDraft {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function AdminLessonQuizManager({
  lessonId,
  initialQuestions,
}: {
  lessonId: string;
  initialQuestions: QuizQuestion[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [drafts, setDrafts] = useState<QuestionDraft[]>(() =>
    initialQuestions.map((q) => ({
      question: q.question,
      options: (q.options as { text: string }[]).map((o) => o.text),
      correctIndex: q.correctIndex,
      explanation: q.explanation ?? "",
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    setDrafts((prev) => [
      ...prev,
      { question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" },
    ]);
  }

  function removeQuestion(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setDrafts((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) {
    setDrafts((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, oi) =>
                oi === optionIndex ? value : opt,
              ),
            }
          : q,
      ),
    );
  }

  function validate(): string | null {
    for (let i = 0; i < drafts.length; i++) {
      const q = drafts[i];
      if (q.question.trim().length < 3) return `پرسش ${i + 1}: متن را وارد کن.`;
      if (q.options.filter((o) => o.trim().length > 0).length < 2) {
        return `پرسش ${i + 1}: حداقل ۲ گزینه پر کن.`;
      }
      if (q.correctIndex >= q.options.length || !q.options[q.correctIndex].trim()) {
        return `پرسش ${i + 1}: گزینه صحیح را مشخص کن.`;
      }
    }
    return null;
  }

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/academy/lessons/${lessonId}/quiz`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: drafts.map((q) => ({
            question: q.question.trim(),
            options: q.options.map((o) => ({ text: o.trim() })),
            correctIndex: q.correctIndex,
            explanation: q.explanation.trim() || undefined,
          })),
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ذخیره آزمونک");
        return;
      }
      toast({ title: "آزمونک ذخیره شد", tone: "success" });
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="border-border bg-card shadow-card rounded-xl border p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-lg font-bold">پرسش‌های آزمونک</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              گزینه صحیح فقط سمت سرور ذخیره می‌شود و هرگز به کاربر نمایش داده نمی‌شود.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addQuestion}>
            + پرسش
          </Button>
        </div>

        {drafts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            این درس آزمونک ندارد. با افزودن پرسش، آزمونک درس فعال می‌شود.
          </p>
        ) : (
          <div className="space-y-4">
            {drafts.map((q, qi) => (
              <div key={qi} className="border-border rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Badge tone="brand">پرسش {qi + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(qi)}
                  >
                    حذف
                  </Button>
                </div>
                <div className="space-y-3">
                  <Input
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(qi, { question: e.target.value })
                    }
                    placeholder="متن پرسش"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="radio"
                          name={`q-${qi}`}
                          checked={q.correctIndex === oi}
                          onChange={() =>
                            updateQuestion(qi, { correctIndex: oi })
                          }
                          className="accent-primary"
                          title="گزینه صحیح"
                        />
                        <Input
                          value={opt}
                          onChange={(e) =>
                            updateOption(qi, oi, e.target.value)
                          }
                          placeholder={`گزینه ${oi + 1}`}
                          className="h-9"
                        />
                      </label>
                    ))}
                  </div>
                  <Input
                    value={q.explanation}
                    onChange={(e) =>
                      updateQuestion(qi, { explanation: e.target.value })
                    }
                    placeholder="توضیح (اختیاری)"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error ? (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button onClick={handleSave} loading={saving} disabled={drafts.length === 0}>
          ذخیره آزمونک
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          انصراف
        </Button>
      </div>
    </div>
  );
}