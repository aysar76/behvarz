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
    <main className="bg-muted/40 flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="border-border bg-background shadow-card w-full max-w-md rounded-2xl border p-6">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo href="/" />
          <p className="text-muted-foreground max-w-xs text-sm">
            با شماره موبایل وارد شوید یا عضو جدید {siteConfig.name} شوید. کد
            تأیید پیامک می‌شود.
          </p>
        </div>
        <OtpForm />
        <p className="text-muted-foreground mt-6 text-center text-xs">
          ورود شما به‌معنای پذیرش قواعد حریم خصوصی و کد رفتار جامعه است.
        </p>
      </div>
    </main>
  );
}
