"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-background text-foreground min-h-dvh font-sans">
        <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center px-4">
          <EmptyState
            icon={<span aria-hidden="true">!</span>}
            title="خطای ناگهانی"
            description="خطایی در سطح برنامه رخ داد. لطفاً صفحه را دوباره بارگذاری کنید."
            action={
              <Button variant="outline" onClick={reset}>
                بارگذاری دوباره
              </Button>
            }
          />
        </div>
      </body>
    </html>
  );
}
