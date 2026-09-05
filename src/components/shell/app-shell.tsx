import { AppHeader } from "@/components/shell/app-header";
import { MobileNav } from "@/components/shell/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-10">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
