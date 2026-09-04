import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { verifyOtp } from "@/lib/auth/otp";
import {
  createSession,
  getClientIp,
  setSessionCookie,
} from "@/lib/auth/session";
import { auditLog } from "@/lib/audit";
import { serializeUser } from "@/lib/serializers";
import { verifyOtpSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const { phone, code } = validateInput(
      verifyOtpSchema,
      await readJsonBody<{ phone: string; code: string }>(request),
    );
    const normalized = phone.trim();

    const result = await verifyOtp(normalized, code);
    if (!result.ok) {
      const message =
        result.reason === "invalid"
          ? "کد واردشده نادرست است"
          : result.reason === "attempts"
            ? "تلاش‌های ناموفق زیاد بود؛ دوباره درخواست کد دهید"
            : "کد منقضی شده؛ دوباره درخواست کد دهید";
      throw new AppError("VALIDATION", message);
    }

    const user = await prisma.user.upsert({
      where: { phone: normalized },
      update: {},
      create: { phone: normalized, role: "member" },
    });

    const token = await createSession(user.id, {
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    await setSessionCookie(token);

    await auditLog({
      actorId: user.id,
      action: "auth.signin",
      entityType: "User",
      entityId: user.id,
      ip,
    });

    return jsonOk({ user: serializeUser(user) });
  } catch (error) {
    return jsonError(error);
  }
}
