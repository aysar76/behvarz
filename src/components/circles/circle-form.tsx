"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { PROVINCES } from "@/lib/constants/profile";
import {
  CIRCLE_MAX_CAPACITY,
  CIRCLE_MIN_CAPACITY,
} from "@/lib/constants/circle";
import type { SerializedCircle } from "@/lib/serializers/circle";

export function CircleForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [province, setProvince] = useState("");
  const [capacity, setCapacity] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldLabelClass = "text-foreground block text-sm font-medium";

  async function submit() {
    setError(null);

    if (name.trim().length < 3) {
      setError("نام حلقه حداقل ۳ کاراکتر باشد");
      return;
    }
    if (description.trim().length < 10) {
      setError("توضیح حلقه حداقل ۱۰ کاراکتر باشد");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          topic: topic.trim() || undefined,
          province: province || undefined,
          capacity,
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { circle: SerializedCircle };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ایجاد حلقه");
        return;
      }
      toast({ title: "حلقه ساخته شد", tone: "success" });
      router.push(`/circles/${body.data!.circle.id}`);
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setSubmitting(false);
    }
  }

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
        <label htmlFor="circleName" className={fieldLabelClass}>
          نام حلقه
        </label>
        <Input
          id="circleName"
          value={name}
          maxLength={80}
          placeholder="مثلاً: حلقه بهورزان خراسان شمالی"
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="circleDescription" className={fieldLabelClass}>
          هدف و توضیح حلقه
        </label>
        <Textarea
          id="circleDescription"
          value={description}
          maxLength={800}
          rows={4}
          placeholder="حلقه حول چه مسئله یا موضوعی دور هم جمع می‌شود؟ (بدون اطلاعات شناسایی‌کننده)"
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="circleTopic" className={fieldLabelClass}>
            موضوع (اختیاری)
          </label>
          <Input
            id="circleTopic"
            value={topic}
            maxLength={80}
            placeholder="مثلاً: آموزش سلامت"
            onChange={(event) => setTopic(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="circleProvince" className={fieldLabelClass}>
            استان (اختیاری)
          </label>
          <Select
            id="circleProvince"
            placeholder="سراسری"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
          >
            {PROVINCES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="circleCapacity" className={fieldLabelClass}>
            ظرفیت ({CIRCLE_MIN_CAPACITY} تا {CIRCLE_MAX_CAPACITY})
          </label>
          <Select
            id="circleCapacity"
            value={String(capacity)}
            onChange={(event) => setCapacity(Number(event.target.value))}
          >
            {Array.from(
              { length: CIRCLE_MAX_CAPACITY - CIRCLE_MIN_CAPACITY + 1 },
              (_, index) => index + CIRCLE_MIN_CAPACITY,
            ).map((value) => (
              <option key={value} value={value}>
                {value} نفر
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Button type="button" loading={submitting} onClick={submit}>
        ایجاد حلقه
      </Button>
    </div>
  );
}