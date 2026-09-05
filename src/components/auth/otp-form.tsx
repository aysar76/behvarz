"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PHONE_PATTERN = /^09\d{9}$/;
const RESEND_SECONDS = 60;

type Step = "phone" | "code";

interface FieldErrors {
  phone?: string;
  code?: string;
}

function toPersianDigits(value: string): string {
  return value.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

export function OtpForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startResendCountdown() {
    setResendIn(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((value) => {
        if (value <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }

  async function requestCode() {
    setError(null);
    setFieldErrors({});

    const trimmed = phone.trim();
    if (!PHONE_PATTERN.test(trimmed)) {
      setFieldErrors({ phone: "شماره موبایل معتبر نیست (مثال: 09123456789)" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { devCode?: string };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "خطا در ارسال کد؛ دوباره تلاش کنید");
        return;
      }
      if (body.data?.devCode) {
        setDevCode(body.data.devCode);
      } else {
        setDevCode(null);
      }
      setCode("");
      setStep("code");
      startResendCountdown();
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setFieldErrors({});

    const trimmed = phone.trim();
    if (!/^\d{6}$/.test(code.trim())) {
      setFieldErrors({ code: "کد باید ۶ رقم باشد" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed, code: code.trim() }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        data?: { user: { onboardingCompleted: boolean } };
        error?: { message: string };
      };
      if (!res.ok || !body.ok) {
        setError(body.error?.message ?? "کد تأیید نشد؛ دوباره تلاش کنید");
        return;
      }
      const user = body.data?.user;
      router.replace(user?.onboardingCompleted ? "/me" : "/onboarding");
    } catch {
      setError("خطا در ارتباط با سرور؛ دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="space-y-5">
      {error && (
        <p
          role="alert"
          aria-live="assertive"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-3 py-2.5 text-sm leading-6"
        >
          {error}
        </p>
      )}

      {step === "phone" ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="text-foreground block text-sm font-medium"
            >
              شماره موبایل
            </label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              dir="ltr"
              className="h-12 text-base tracking-wide"
              placeholder="09123456789"
              value={phone}
              invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
              onChange={(event) => setPhone(event.target.value)}
            />
            {fieldErrors.phone && (
              <p
                id="phone-error"
                className="text-destructive text-xs font-medium"
              >
                {fieldErrors.phone}
              </p>
            )}
          </div>
          <Button
            type="button"
            fullWidth
            className="h-12 text-base"
            loading={loading}
            onClick={requestCode}
          >
            دریافت کد تأیید
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="code"
              className="text-foreground block text-sm font-medium"
            >
              کد تأیید ۶ رقمی
            </label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              dir="ltr"
              className="h-12 text-base tracking-[0.4em]"
              placeholder="------"
              maxLength={6}
              value={code}
              invalid={Boolean(fieldErrors.code)}
              aria-describedby={fieldErrors.code ? "code-error" : undefined}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            {fieldErrors.code && (
              <p
                id="code-error"
                className="text-destructive text-xs font-medium"
              >
                {fieldErrors.code}
              </p>
            )}
            {devCode && (
              <div
                aria-live="polite"
                className="border-brand-200 bg-brand-50 text-brand-900 flex flex-wrap items-center gap-x-2 rounded-lg border px-3 py-2.5 text-sm leading-6"
              >
                <span>کد تأیید موقت:</span>
                <span
                  dir="ltr"
                  className="text-brand-800 bg-brand-100 rounded-md px-2 py-0.5 font-bold tracking-widest select-all"
                >
                  {toPersianDigits(devCode)}
                </span>
              </div>
            )}
          </div>
          <Button
            type="button"
            fullWidth
            className="h-12 text-base"
            loading={loading}
            onClick={verifyCode}
          >
            ورود
          </Button>
          <div className="border-border flex items-center justify-between gap-3 border-t pt-4 text-sm">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setStep("phone");
                setError(null);
              }}
            >
              تغییر شماره
            </button>
            <button
              type="button"
              disabled={resendIn > 0}
              onClick={requestCode}
              className="text-primary hover:text-brand-700 disabled:text-muted-foreground/60 transition-colors disabled:cursor-not-allowed"
            >
              {resendIn > 0
                ? `ارسال مجدد تا ${resendIn} ثانیه`
                : "ارسال مجدد کد"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
