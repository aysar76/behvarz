import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin/memberships", label: "تأیید عضویت‌ها" },
  { href: "/admin/moderation", label: "مدیریت محتوا" },
  { href: "/admin/users", label: "کاربران" },
  { href: "/admin/appeals", label: "اعتراض‌ها" },
  { href: "/admin/sensitive-terms", label: "واژه‌های حساس" },
  { href: "/admin/tags", label: "برچسب‌ها" },
  { href: "/admin/decisions", label: "تاریخچه تصمیم‌ها" },
  { href: "/admin/academy", label: "آکادمی" },
  { href: "/admin/benefits", label: "باشگاه مزایا" },
  { href: "/admin/budget", label: "بودجه مشارکتی" },
];

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
      try {
        assertPermission(user, "content:moderate");
        allowed = true;
      } catch {
        try {
          assertPermission(user, "moderation:users");
          allowed = true;
        } catch {
          allowed = false;
        }
      }
    }
  }

  return (
    <AppShell>
      {allowed ? (
        <div className="space-y-6">
          <nav aria-label="ناوبری مدیریت" className="flex flex-wrap gap-2">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "border-border bg-card text-foreground hover:border-brand-300 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      ) : (
        <EmptyState
          title="دسترسی ندارید"
          description="این بخش فقط برای مدیران و ناظران جامعه است."
        />
      )}
    </AppShell>
  );
}
