"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { COURSE_LEVELS, COURSE_STATUSES } from "@/lib/constants/academy";

interface LessonDraft {
  title: string;
  summary: string;
  body: string;
  contentType: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
}

export function AdminCourseForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("beginner");
  const [status, setStatus] = useState("draft");
  const [emoji, setEmoji] = useState("📘");
  const [tagsInput, setTagsInput] = useState("");
  const [lessons, setLessons] = useState<LessonDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addLesson() {
    setLessons((prev) => [
      ...prev,
      { title: "", summary: "", body: "", contentType: "text", questions: [] },
    ]);
  }

  function updateLesson(index: number, patch: Partial<LessonDraft>) {
    setLessons((prev) =>
      prev.map((lesson, i) => (i === index ? { ...lesson, ...patch } : lesson)),
    );
  }

  function addQuestion(lessonIndex: number) {
    setLessons((prev) =>
      prev.map((lesson, i) =>
        i === lessonIndex
          ? {
              ...lesson,
              questions: [
                ...lesson.questions,
                { question: "", options: ["", "", "", ""], correctIndex: 0 },
              ],
            }
          : lesson,
      ),
    );
  }

  function updateQuestion(
    lessonIndex: number,
    questionIndex: number,
    patch: Partial<{ question: string; correctIndex: number }>,
  ) {
    setLessons((prev) =>
      prev.map((lesson, i) =>
        i === lessonIndex
          ? {
              ...lesson,
              questions: lesson.questions.map((q, j) =>
                j === questionIndex ? { ...q, ...patch } : q,
              ),
            }
          : lesson,
      ),
    );
  }

  function updateOption(
    lessonIndex: number,
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) {
    setLessons((prev) =>
      prev.map((lesson, i) =>
        i === lessonIndex
          ? {
              ...lesson,
              questions: lesson.questions.map((q, j) =>
                j === questionIndex
                  ? {
                      ...q,
                      options: q.options.map((opt, k) =>
                        k === optionIndex ? value : opt,
                      ),
                    }
                  : q,
              ),
            }
          : lesson,
      ),
    );
  }

  function removeLesson(index: number) {
    setLessons((prev) => prev.filter((_, i) => i !== index));
  }

  function removeQuestion(lessonIndex: number, questionIndex: number) {
    setLessons((prev) =>
      prev.map((lesson, i) =>
        i === lessonIndex
          ? {
              ...lesson,
              questions: lesson.questions.filter((_, j) => j !== questionIndex),
            }
          : lesson,
      ),
    );
  }

  function validate(): string | null {
    if (slug.trim().length < 3) return "شناسه دوره را وارد کن (حداقل ۳ کاراکتر).";
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return "شناسه دوره فقط حروف کوچک انگلیسی، عدد و خط تیره مجاز است.";
    }
    if (title.trim().length < 3) return "عنوان دوره را وارد کن.";
    if (description.trim().length < 10) {
      return "توضیح دوره باید حداقل ۱۰ کاراکتر باشد.";
    }
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      if (lesson.title.trim().length < 3) return `درس ${i + 1}: عنوان را وارد کن.`;
      if (lesson.body.trim().length < 10) {
        return `درس ${i + 1}: محتوای درس باید حداقل ۱۰ کاراکتر باشد.`;
      }
      for (let j = 0; j < lesson.questions.length; j++) {
        const q = lesson.questions[j];
        if (q.question.trim().length < 3) {
          return `درس ${i + 1}، پرسش ${j + 1}: متن پرسش را وارد کن.`;
        }
        if (q.options.filter((o) => o.trim().length > 0).length < 2) {
          return `درس ${i + 1}، پرسش ${j + 1}: حداقل ۲ گزینه پر کن.`;
        }
      }
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);

    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim(),
      level,
      status,
      emoji: emoji || undefined,
      tags:
        tagsInput
          .split(/[،,]/)
          .map((t) => t.trim())
          .filter(Boolean) || undefined,
      lessons: lessons.map((lesson) => ({
        title: lesson.title.trim(),
        summary: lesson.summary.trim() || undefined,
        body: lesson.body,
        contentType: lesson.contentType,
        quizQuestions:
          lesson.questions.length > 0
            ? lesson.questions.map((q) => ({
                question: q.question.trim(),
                options: q.options.map((o) => ({ text: o.trim() })),
                correctIndex: q.correctIndex,
              }))
            : undefined,
      })),
    };

    try {
      const res = await fetch("/api/admin/academy/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { course?: { id: string; slug: string } };
        error?: { message: string };
      };
      if (!res.ok || !body.ok || !body.data?.course) {
        setError(body.error?.message ?? "خطا در ساخت دوره");
        return;
      }
      toast({
        title: "دوره ساخته شد",
        tone: "success",
      });
      router.push(`/admin/academy/courses/${body.data.course.id}`);
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="border-border bg-card shadow-card space-y-4 rounded-xl border p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-foreground block text-sm font-medium">
              شناسه دوره (اسلاگ)
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. vaccination-communication"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-foreground block text-sm font-medium">
              عنوان دوره
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان مسیر یادگیری"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-foreground block text-sm font-medium">
            توضیح دوره
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="این مسیر چه مسئله‌ای را حل می‌کند؟"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-foreground block text-sm font-medium">
              سطح
            </label>
            <Select value={level} onChange={(e) => setLevel(e.target.value)}>
              {COURSE_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-foreground block text-sm font-medium">
              وضعیت
            </label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {COURSE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-foreground block text-sm font-medium">
              نماد (ایموجی)
            </label>
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-foreground block text-sm font-medium">
            برچسب‌ها (با ویرگول جدا کنید)
          </label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="واکسیناسیون، آموزش سلامت، ..."
          />
        </div>
      </section>

      <section className="border-border bg-card shadow-card rounded-xl border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-lg font-bold">درس‌ها</h2>
          <Button variant="outline" size="sm" onClick={addLesson}>
            + افزودن درس
          </Button>
        </div>

        {lessons.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            هنوز درسی اضافه نشده؛ می‌توانی بعداً از صفحه ویرایش دوره درس اضافه کنی.
          </p>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, li) => (
              <div
                key={li}
                className="border-border rounded-lg border p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Badge tone="brand">درس {li + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLesson(li)}
                  >
                    حذف
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="space-y-1.5">
                      <label className="text-foreground block text-sm font-medium">
                        عنوان درس
                      </label>
                      <Input
                        value={lesson.title}
                        onChange={(e) =>
                          updateLesson(li, { title: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-foreground block text-sm font-medium">
                        نوع محتوا
                      </label>
                      <Select
                        value={lesson.contentType}
                        onChange={(e) =>
                          updateLesson(li, { contentType: e.target.value })
                        }
                      >
                        <option value="text">متنی</option>
                        <option value="audio">صوتی</option>
                        <option value="video">ویدیویی</option>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground block text-sm font-medium">
                      خلاصه درس
                    </label>
                    <Input
                      value={lesson.summary}
                      onChange={(e) =>
                        updateLesson(li, { summary: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground block text-sm font-medium">
                      محتوای درس
                    </label>
                    <Textarea
                      value={lesson.body}
                      onChange={(e) =>
                        updateLesson(li, { body: e.target.value })
                      }
                      minLength={10}
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-foreground text-sm font-semibold">
                        آزمونک
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addQuestion(li)}
                      >
                        + پرسش
                      </Button>
                    </div>
                    {lesson.questions.length === 0 ? (
                      <p className="text-muted-foreground text-xs">
                        بدون آزمونک؛ می‌توانی پرسش اضافه کنی.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {lesson.questions.map((q, qi) => (
                          <div
                            key={qi}
                            className="border-border rounded-md border p-3"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-foreground text-sm font-medium">
                                پرسش {qi + 1}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(li, qi)}
                              >
                                حذف
                              </Button>
                            </div>
                            <Input
                              value={q.question}
                              onChange={(e) =>
                                updateQuestion(li, qi, {
                                  question: e.target.value,
                                })
                              }
                              placeholder="متن پرسش"
                              className="mb-2"
                            />
                            <div className="grid gap-2 sm:grid-cols-2">
                              {q.options.map((opt, oi) => (
                                <label
                                  key={oi}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <input
                                    type="radio"
                                    name={`q${li}-${qi}`}
                                    checked={q.correctIndex === oi}
                                    onChange={() =>
                                      updateQuestion(li, qi, {
                                        correctIndex: oi,
                                      })
                                    }
                                    className="accent-primary"
                                  />
                                  <Input
                                    value={opt}
                                    onChange={(e) =>
                                      updateOption(li, qi, oi, e.target.value)
                                    }
                                    placeholder={`گزینه ${oi + 1}`}
                                    className="h-9"
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={handleSubmit} loading={submitting}>
          ایجاد دوره
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          انصراف
        </Button>
      </div>
    </div>
  );
}
