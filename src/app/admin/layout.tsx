import { AppShell } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  let allowed = false;
  if (user) {
    try {
      assertPermission(user, "membership:review");
      allowed = true;
    } catch {
      allowed = false;
    }
  }

  return (
    <AppShell>
      {allowed ? (
        children
      ) : (
        <EmptyState
          title="دسترسی ندارید"
          description="این بخش فقط برای مدیران جامعه است."
        />
      )}
    </AppShell>
  );
}
