import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { HelpRequestForm } from "@/components/peer/help-request-form";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = {
  title: "درخواست همیار",
};

export default async function NewHelpRequestPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <h1 className="text-foreground text-2xl font-extrabold">
            درخواست همیار
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            نیاز خود را به‌صورت ساختاریافته ثبت کنید تا همکارِ دارای تجربه
            مشابه، پیشنهاد همیاری بدهد یا شما برای او دعوت بفرستید.
          </p>
        </header>
        <div className="border-border bg-card shadow-card rounded-xl border p-5">
          <HelpRequestForm />
        </div>
      </div>
    </AppShell>
  );
}