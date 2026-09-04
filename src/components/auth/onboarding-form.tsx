"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ChipSelect } from "@/components/ui/chip-select";
import {
  INTERESTS,
  MAX_SELECTABLE,
  PROVINCES,
  SKILLS,
  VISIBILITY_OPTIONS,
  WORK_YEARS,
} from "@/lib/constants/profile";
import { cn } from "@/lib/utils";

const STEPS = [
  "نام شما",
  "محل خدمت و سابقه",
  "مهارت‌ها و علایق",
  "معرفی و حریم خصوصی",
];

interface OnboardingFormState {
  displayName: string;
  province: string;
  city: string;
  workYears: string;
  skills: string[];
  interests: string[];
  bio: string;
  visibility: "public" | "members" | "private";
}

const EMPTY: OnboardingFormState = {
  displayName: "",
  province: "",
  city: "",
  workYears: "",
  skills: [],
  interests: [],
  bio: "",
  visibility: "members",
};

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingFormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof OnboardingFormState>(
    key: K,
    value: OnboardingFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function toggle(listKey: "skills" | "interests", value: string) {
    setForm((current) => {
      const list = current[listKey];
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : list.length >= MAX_SELECTABLE
          ? list
          : [...list, value];
      return { ...current, [listKey]: next };
    });
    setError(null);
  }

  function validateStep(index: number): string | null {
    switch (index) {
      case 0:
        if (form.displayName.trim().length < 2) {
          return "نام نمایشی حداقل ۲ کاراکتر باشد";
        }
        return null;
      case 1:
        if (!form.province) return "استان را انتخاب کنید";
        if (form.city.trim().length < 1) return "شهرستان را وارد کنید";
        if (!form.workYears) return "بازه سابقه کاری را انتخاب کنید";
        return null;
      default:
        return null;
    }
  }

  function goNext() {
    const validation = validateStep(step);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);
    } else {
      void submit();
    }
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          province: form.province,
          city: form.city.trim(),
          workYears: form.workYears,
          skills: form.skills,
          interests: form.interests,
          bio: form.bio.trim(),
          visibility: form.visibility,
        }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ذخیره پروفایل");
        return;
      }
      router.replace("/me");
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <ol
        aria-label="مراحل تکمیل پروفایل"
        className="flex items-center gap-1.5"
      >
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 flex-col gap-1">
            <span
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "h-1 rounded-full transition-colors",
                index <= step ? "bg-primary" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "text-[11px]",
                index === step
                  ? "text-primary font-semibold"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {error && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}

      {step === 0 && (
        <div className="space-y-1.5">
          <label
            htmlFor="displayName"
            className="text-foreground block text-sm font-medium"
          >
            نام نمایشی
          </label>
          <Input
            id="displayName"
            value={form.displayName}
            maxLength={60}
            placeholder="مثلاً: مریم احمدی"
            onChange={(event) => update("displayName", event.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            چگونه در جامعه دیده می‌شوید؟ نیازی به نام کامل نیست.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="province"
              className="text-foreground block text-sm font-medium"
            >
              استان
            </label>
            <Select
              id="province"
              placeholder="انتخاب استان"
              value={form.province}
              onChange={(event) => update("province", event.target.value)}
            >
              {PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="city"
              className="text-foreground block text-sm font-medium"
            >
              شهرستان
            </label>
            <Input
              id="city"
              value={form.city}
              maxLength={60}
              placeholder="مثلاً: سبزوار"
              onChange={(event) => update("city", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="workYears"
              className="text-foreground block text-sm font-medium"
            >
              سابقه کاری
            </label>
            <Select
              id="workYears"
              placeholder="انتخاب بازه سابقه"
              value={form.workYears}
              onChange={(event) => update("workYears", event.target.value)}
            >
              {WORK_YEARS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <ChipSelect
            label="مهارت‌ها (اختیاری)"
            options={SKILLS}
            selected={form.skills}
            onToggle={(value) => toggle("skills", value)}
            max={MAX_SELECTABLE}
          />
          <ChipSelect
            label="علایق (اختیاری)"
            options={INTERESTS}
            selected={form.interests}
            onToggle={(value) => toggle("interests", value)}
            max={MAX_SELECTABLE}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="bio"
              className="text-foreground block text-sm font-medium"
            >
              معرفی کوتاه (اختیاری)
            </label>
            <Textarea
              id="bio"
              value={form.bio}
              maxLength={300}
              rows={3}
              placeholder="چند جمله درباره تجربه و دغدغه حرفه‌ای‌تان…"
              onChange={(event) => update("bio", event.target.value)}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-foreground block text-sm font-medium">
              چه کسی پروفایل شما را ببیند؟
            </legend>
            {VISIBILITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "border-border flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                  form.visibility === option.value &&
                    "border-primary bg-brand-50",
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={form.visibility === option.value}
                  onChange={() => update("visibility", option.value)}
                  className="accent-brand-600 mt-1"
                />
                <span>
                  <span className="text-foreground block text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={goBack}>
            قبلی
          </Button>
        )}
        <Button
          type="button"
          fullWidth={step === 0}
          className={step > 0 ? "flex-1" : undefined}
          loading={submitting}
          onClick={goNext}
        >
          {step === STEPS.length - 1 ? "تکمیل پروفایل" : "ادامه"}
        </Button>
      </div>
    </div>
  );
}
