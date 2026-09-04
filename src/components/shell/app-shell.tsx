import { getCurrentUser } from "@/lib/auth/current-user";
import {
  SessionProvider,
  type SessionUser,
} from "@/components/auth/session-provider";
import { ToastProvider } from "@/components/ui/toast";
import { AppHeader } from "@/components/shell/app-header";
import { MobileNav } from "@/components/shell/mobile-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const initialUser: SessionUser | null = user
    ? {
        id: user.id,
        phone: user.phone,
        role: user.role,
        membershipStatus: user.membershipStatus,
        displayName: user.displayName,
        province: user.province,
        city: user.city,
        workYears: user.workYears,
        bio: user.bio,
        visibility: user.visibility,
        onboardingCompleted: user.onboardingCompleted,
        skills: [],
        interests: [],
        createdAt: user.createdAt.toISOString(),
      }
    : null;

  return (
    <SessionProvider initialUser={initialUser}>
      <ToastProvider>
        <div className="flex min-h-dvh flex-col">
          <AppHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-10">
            {children}
          </main>
          <MobileNav />
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}
