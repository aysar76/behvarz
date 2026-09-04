import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { Logo } from "@/components/shell/logo";

export const metadata = {
  title: "تکمیل پروفایل",
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  if (user.onboardingCompleted) redirect("/me");

  return (
    <main className="bg-muted/40 flex min-h-dvh items-start justify-center px-4 py-10">
      <div className="border-border bg-background shadow-card w-full max-w-xl rounded-2xl border p-6">
        <div className="mb-6 flex items-center gap-3">
          <Logo href="/" />
        </div>
        <h1 className="text-foreground text-xl font-extrabold">
          خوش آمدید؛ پروفایل حرفه‌ای شما
        </h1>
        <p className="text-muted-foreground mt-1 mb-5 text-sm">
          چند قدم کوتاه تا عضویت کامل در جامعه. این اطلاعات برای اتصال شما به
          همکاران مرتبط استفاده می‌شود.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
