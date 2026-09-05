"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { COURSE_LEVELS, COURSE_STATUSES } from "@/lib/constants/academy";
import { formatJalali } from "@/lib/dates";

interface InitialLesson {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  contentType: string;
  mediaUrl: string | null;
  durationMinutes: number | null;
  order: number;
  isOptional: boolean;
  quizQuestions: {
    id: string;
    question: string;
    options: unknown;
    correctIndex: number;
    explanation: string | null;
    order: number;
  }[];
  _count?: { applications: number };
}

interface InitialCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  status: string;
  emoji: string | null;
  isPaid: boolean;
  relatedProblemId: string | null;
  relatedExperienceId: string | null;
  version: number;
  reviewedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    displayName: string | null;
    membershipStatus: string;
  } | null;
  tags: { tag: { id: string; name: string } }[];
  lessons: InitialLesson[];
  _count?: { enrollments: number };
}

export function AdminCourseEditManager({
  initialCourse,
}: {
  initialCourse: InitialCourse;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState(initialCourse.title);
  const [description, setDescription] = useState(initialCourse.description);
  const [level, setLevel] = useState(initialCourse.level);
  const [status, setStatus] = useState(initialCourse.status);
  const [emoji, setEmoji] = useState(initialCourse.emoji ?? "");
  const [tagsInput, setTagsInput] = useState(
    initialCourse.tags.map((t) => t.tag.name).join("، "),
  );
  const lessons = initialCourse.lessons;
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newLessonOpen, setNewLessonOpen] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: "",
    summary: "",
    body: "",
    contentType: "text",
  });
  const [creatingLesson, setCreatingLesson] = useState(false);

  async function handleSaveCourse() {
    if (title.trim().length < 3) {
      setError("عنوان دوره را وارد کن.");
      return;
    }
    if (description.trim().length < 10) {
      setError("توضیح دوره باید حداقل ۱۰ کاراکتر باشد.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/academy/courses/${initialCourse.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            level,
            status,
            emoji: emoji || undefined,
            tags: tagsInput
              .split(/[،,]/)
              .map((t) => t.trim())
              .filter(Boolean),
          }),
        },
      );
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ذخیره دوره");
        return;
      }
      toast({ title: "دوره ذخیره شد", tone: "success" });
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLesson() {
    if (newLesson.title.trim().length < 3) {
      setError("عنوان درس را وارد کن.");
      return;
    }
    if (newLesson.body.trim().length < 10) {
      setError("محتوای درس باید حداقل ۱۰ کاراکتر باشد.");
      return;
    }
    setError(null);
    setCreatingLesson(true);
    try {
      const res = await fetch(
        `/api/admin/academy/courses/${initialCourse.id}/lessons`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: initialCourse.id,
            lesson: {
              title: newLesson.title.trim(),
              summary: newLesson.summary.trim() || undefined,
              body: newLesson.body,
              contentType: newLesson.contentType,
            },
          }),
        },
      );
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در افزودن درس");
        return;
      }
      toast({ title: "درس اضافه شد", tone: "success" });
      setNewLesson({ title: "", summary: "", body: "", contentType: "text" });
      setNewLessonOpen(false);
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setCreatingLesson(false);
    }
  }

  async function handleDeleteLesson(lessonId: string, lessonTitle: string) {
    if (!window.confirm(`درس «${lessonTitle}» حذف شود؟`)) return;
    try {
      const res = await fetch(
        `/api/admin/academy/courses/${initialCourse.id}/lessons/${lessonId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: initialCourse.id }),
        },
      );
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({
          title: body.error?.message ?? "خطا در حذف درس",
          tone: "danger",
        });
        return;
      }
      toast({ title: "درس حذف شد", tone: "success" });
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    }
  }

  async function handlePublish() {
    const target = status === "published" ? "draft" : "published";
    try {
      const res = await fetch(
        `/api/admin/academy/courses/${initialCourse.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: target }),
        },
      );
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        toast({
          title: body.error?.message ?? "خطا در تغییر وضعیت",
          tone: "danger",
        });
        return;
      }
      toast({
        title: target === "published" ? "دوره منتشر شد" : "دوره به پیش‌نویس برگشت",
        tone: "success",
      });
      router.refresh();
    } catch {
      toast({ title: "خطا در ارتباط با سرور", tone: "danger" });
    }
  }

  return (
    <div className="space-y-6">
      <section className="border-border bg-card shadow-card space-y-4 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-foreground text-lg font-bold">اطلاعات دوره</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              نسخه {initialCourse.version} • بازبینی{" "}
              {initialCourse.reviewedAt
                ? formatJalali(initialCourse.reviewedAt)
                : "—"}
              {" • "}
              {initialCourse._count?.enrollments ?? 0} ثبت‌نام
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublish}
            >
              {status === "published" ? "بازگشت به پیش‌نویس" : "انتشار دوره"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-foreground block text-sm font-medium">
              عنوان دوره
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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
            توضیح دوره
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <div className="space-y-1.5">
          <label className="text-foreground block text-sm font-medium">
            برچسب‌ها
          </label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="واکسیناسیون، آموزش سلامت، ..."
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveCourse} loading={saving}>
            ذخیره تغییرات
          </Button>
        </div>
      </section>

      <section className="border-border bg-card shadow-card rounded-xl border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-lg font-bold">درس‌ها</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewLessonOpen((v) => !v)}
          >
            + افزودن درس
          </Button>
        </div>

        {newLessonOpen ? (
          <div className="border-border mb-4 space-y-3 rounded-lg border p-4">
            <p className="text-foreground text-sm font-semibold">درس جدید</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <label className="text-foreground block text-sm font-medium">
                  عنوان درس
                </label>
                <Input
                  value={newLesson.title}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-foreground block text-sm font-medium">
                  نوع محتوا
                </label>
                <Select
                  value={newLesson.contentType}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, contentType: e.target.value })
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
                خلاصه
              </label>
              <Input
                value={newLesson.summary}
                onChange={(e) =>
                  setNewLesson({ ...newLesson, summary: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-foreground block text-sm font-medium">
                محتوا
              </label>
              <Textarea
                value={newLesson.body}
                onChange={(e) =>
                  setNewLesson({ ...newLesson, body: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddLesson}
                loading={creatingLesson}
              >
                افزودن درس
              </Button>
              <Button
                variant="outline"
                onClick={() => setNewLessonOpen(false)}
              >
                انصراف
              </Button>
            </div>
          </div>
        ) : null}

        {lessons.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            هنوز درسی برای این دوره ثبت نشده است.
          </p>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="border-border rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full text-xs font-bold">
                      {index + 1}
                    </span>
                    <p className="text-foreground font-semibold">{lesson.title}</p>
                    {lesson.quizQuestions.length > 0 ? (
                      <Badge tone="info">
                        {lesson.quizQuestions.length} پرسش
                      </Badge>
                    ) : null}
                    {lesson._count && lesson._count.applications > 0 ? (
                      <Badge tone="success">
                        {lesson._count.applications} کاربرد
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/academy/courses/${initialCourse.id}/lessons/${lesson.id}`}
                      className="text-brand-700 hover:text-brand-800 text-sm font-medium"
                    >
                      مدیریت آزمونک
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
                {lesson.summary ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {lesson.summary}
                  </p>
                ) : null}
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
    </div>
  );
}