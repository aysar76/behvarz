import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { assertAccountCanCreate } from "@/lib/moderation";
import { benefitUsageSchema } from "@/lib/validations/benefits";
import { registerBenefitUsage } from "@/lib/benefits";
import type { z } from "zod";

type UsageInput = z.infer<typeof benefitUsageSchema>;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:use");
    assertAccountCanCreate(user);

    const input = validateInput(
      benefitUsageSchema,
      await readJsonBody<UsageInput>(request),
    );

    await registerBenefitUsage(input, user.id);

    return jsonOk({ registered: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}