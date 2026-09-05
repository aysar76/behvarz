import { AppShell } from "@/components/shell/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6 py-6">
        <div className="flex flex-col items-center gap-3 py-8">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-10 w-72 rounded-lg" />
          <Skeleton className="h-5 w-96 max-w-full rounded-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}
