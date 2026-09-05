import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { OtpForm } from "@/components/auth/otp-form";
import { Logo } from "@/components/shell/logo";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "ورود و ثبت‌نام",
};

export default async function AuthPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.onboardingCompleted ? "/me" : "/onboarding");
  }

  return (
    <main className="bg-muted/40 font-vazirmatn flex min-h-dvh items-center justify-center px-4 py-8 sm:py-10">
      <div className="border-border bg-background shadow-card relative w-full max-w-md overflow-hidden rounded-2xl border">
        <div
          aria-hidden="true"
          className="from-brand-600 to-brand-400 h-1.5 bg-gradient-to-l"
        />
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Logo href="/" />
            <h1 className="text-foreground text-xl font-bold">
              ورود و ثبت‌نام
            </h1>
            <p className="text-muted-foreground max-w-xs text-sm leading-6">
              برای ورود یا عضویت در {siteConfig.name}، شماره موبایل خود را وارد
              کنید.
            </p>
          </div>
          <OtpForm />
          <p className="text-muted-foreground mt-6 text-center text-xs leading-5">
            ورود شما به‌معنای پذیرش قواعد حریم خصوصی و کد رفتار جامعه است.
          </p>
        </div>
      </div>
    </main>
  );
}
