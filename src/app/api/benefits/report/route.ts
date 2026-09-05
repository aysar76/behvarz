import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { assertAccountCanInteract } from "@/lib/moderation";
import { benefitReportSchema } from "@/lib/validations/benefits";
import { reportBenefitProblem } from "@/lib/benefits";
import type { z } from "zod";

type ReportInput = z.infer<typeof benefitReportSchema>;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:use");
    assertAccountCanInteract(user);

    const input = validateInput(
      benefitReportSchema,
      await readJsonBody<ReportInput>(request),
    );

    await reportBenefitProblem(input, user.id);

    return jsonOk({ reported: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}