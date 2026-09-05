import { AppError } from "@/lib/errors";
import { jsonError, jsonOk, readJsonBody } from "@/lib/api";
import { validateInput } from "@/lib/validation";
import { issueOtp } from "@/lib/auth/otp";
import { getOtpProvider } from "@/lib/auth/otp-provider";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { requestOtpSchema } from "@/lib/validations/auth";

const PHONE_RATE = { limit: 3, windowMs: 10 * 60 * 1000 };
const IP_RATE = { limit: 10, windowMs: 10 * 60 * 1000 };

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  try {
    const { phone } = validateInput(
      requestOtpSchema,
      await readJsonBody<{ phone: string }>(request),
    );
    const normalized = phone.trim();

    if (
      isRateLimited(
        `otp:ip:${ip ?? "unknown"}`,
        IP_RATE.limit,
        IP_RATE.windowMs,
      )
    ) {
      throw new AppError(
        "RATE_LIMITED",
        "درخواست‌های زیادی دارید؛ چند دقیقه دیگر تلاش کنید",
      );
    }
    if (
      isRateLimited(
        `otp:phone:${normalized}`,
        PHONE_RATE.limit,
        PHONE_RATE.windowMs,
      )
    ) {
      throw new AppError(
        "RATE_LIMITED",
        "به‌زودی می‌توانید کد جدید بگیرید؛ کمی صبر کنید",
      );
    }

    const code = await issueOtp(normalized);
    const result = await getOtpProvider().send(normalized, code);

    return jsonOk({
      sent: result.ok,
      ...(env.DEV_SHOW_OTP && result.devCode
        ? { devCode: result.devCode }
        : {}),
    });
  } catch (error) {
    return jsonError(error);
  }
}
