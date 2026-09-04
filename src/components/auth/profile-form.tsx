"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ChipSelect } from "@/components/ui/chip-select";
import { useToast } from "@/components/ui/toast";
import type { SessionUser } from "@/components/auth/session-provider";
import {
  INTERESTS,
  MAX_SELECTABLE,
  PROVINCES,
  SKILLS,
  VISIBILITY_OPTIONS,
  WORK_YEARS,
} from "@/lib/constants/profile";
import { cn } from "@/lib/utils";

export function ProfileForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [province, setProvince] = useState(user.province ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [workYears, setWorkYears] = useState(user.workYears ?? "");
  const [skills, setSkills] = useState<string[]>(user.skills);
  const [interests, setInterests] = useState<string[]>(user.interests);
  const [bio, setBio] = useState(user.bio ?? "");
  const [visibility, setVisibility] = useState<
    "public" | "members" | "private"
  >(user.visibility as "public" | "members" | "private");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleSkill(value: string) {
    setSkills((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length >= MAX_SELECTABLE
          ? current
          : [...current, value],
    );
  }

  function toggleInterest(value: string) {
    setInterests((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length >= MAX_SELECTABLE
          ? current
          : [...current, value],
    );
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          province,
          city: city.trim(),
          workYears,
          skills,
          interests,
          bio: bio.trim(),
          visibility,
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
      toast({ title: "پروفایل به‌روزرسانی شد", tone: "success" });
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setSaving(false);
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
        <label
          htmlFor="displayName"
          className="text-foreground block text-sm font-medium"
        >
          نام نمایشی
        </label>
        <Input
          id="displayName"
          value={displayName}
          maxLength={60}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
          <label
            htmlFor="city"
            className="text-foreground block text-sm font-medium"
          >
            شهرستان
          </label>
          <Input
            id="city"
            value={city}
            maxLength={60}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>
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
          value={workYears}
          onChange={(event) => setWorkYears(event.target.value)}
        >
          {WORK_YEARS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      <ChipSelect
        label="مهارت‌ها"
        options={SKILLS}
        selected={skills}
        onToggle={toggleSkill}
        max={MAX_SELECTABLE}
      />

      <ChipSelect
        label="علایق"
        options={INTERESTS}
        selected={interests}
        onToggle={toggleInterest}
        max={MAX_SELECTABLE}
      />

      <div className="space-y-1.5">
        <label
          htmlFor="bio"
          className="text-foreground block text-sm font-medium"
        >
          معرفی کوتاه
        </label>
        <Textarea
          id="bio"
          value={bio}
          maxLength={300}
          rows={3}
          onChange={(event) => setBio(event.target.value)}
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
              visibility === option.value && "border-primary bg-brand-50",
            )}
          >
            <input
              type="radio"
              name="visibility"
              value={option.value}
              checked={visibility === option.value}
              onChange={() => setVisibility(option.value)}
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

      <Button type="button" loading={saving} onClick={save}>
        ذخیره تغییرات
      </Button>
    </div>
  );
}
