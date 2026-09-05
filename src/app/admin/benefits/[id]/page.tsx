import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { BenefitProviderForm } from "@/components/admin/benefit-provider-form";
import { toPersianDigits } from "@/lib/dates";

export const metadata = {
  title: "ویرایش ارائه‌دهنده",
};

export default async function AdminBenefitProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const provider = await prisma.benefitProvider.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          membershipStatus: true,
          role: true,
        },
      },
      _count: { select: { usages: true, reports: true } },
    },
  });

  if (!provider) notFound();

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/admin/benefits"
          className="text-brand-700 hover:text-brand-800 text-sm font-medium"
        >
          ← مدیریت باشگاه مزایا
        </Link>
        <h1 className="text-foreground mt-1 text-2xl font-extrabold">
          {provider.logoEmoji ?? ""} {provider.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {toPersianDigits(provider._count?.usages ?? 0)} استفاده •{" "}
          {toPersianDigits(provider._count?.reports ?? 0)} گزارش
        </p>
      </header>

      <BenefitProviderForm
        providerId={provider.id}
        initial={{
          name: provider.name,
          category: provider.category,
          description: provider.description,
          terms: provider.terms,
          website: provider.website ?? "",
          contactNote: provider.contactNote ?? "",
          logoEmoji: provider.logoEmoji ?? "",
          isSponsored: provider.isSponsored,
          status: provider.status,
        }}
      />
    </div>
  );
}