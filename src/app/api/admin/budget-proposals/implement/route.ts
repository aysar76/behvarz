import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { requireUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/authorization";
import { getClientIp } from "@/lib/auth/session";
import { budgetImplementationSchema } from "@/lib/validations/benefits";
import { reportImplementation } from "@/lib/benefits-admin";
import type { z } from "zod";

type ImplementationInput = z.infer<typeof budgetImplementationSchema>;

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const user = await requireUser();
    assertPermission(user, "benefits:manage");

    const input = validateInput(
      budgetImplementationSchema,
      await readJsonBody<ImplementationInput>(request),
    );

    await reportImplementation(input, user.id, ip);

    return jsonOk({ reported: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}