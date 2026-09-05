"use client";

import { AppShell } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <div className="py-16">
        <EmptyState
          icon={<span aria-hidden="true">!</span>}
          title="خطایی رخ داد"
          description={
            error.digest
              ? "مشکلی در نمایش این صفحه پیش آمد. دوباره تلاش کنید؛ در صورت تکرار، با ما در میان بگذارید."
              : "مشکلی در نمایش این صفحه پیش آمد. دوباره تلاش کنید."
          }
          action={
            <Button variant="outline" onClick={reset}>
              تلاش دوباره
            </Button>
          }
        />
      </div>
    </AppShell>
  );
}
