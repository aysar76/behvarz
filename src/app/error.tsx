"use client";

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
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
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
  );
}
