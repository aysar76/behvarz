import { prisma } from "@/lib/db";
import { randomDigits, safeEqual, sha256 } from "@/lib/crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "attempts" | "invalid" };

export async function issueOtp(phone: string): Promise<string> {
  const code = randomDigits(6);
  await prisma.otpCode.create({
    data: {
      phone,
      codeHash: sha256(code),
      purpose: "login",
      maxAttempts: OTP_MAX_ATTEMPTS,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<OtpVerifyResult> {
  const record = await prisma.otpCode.findFirst({
    where: { phone, purpose: "login", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, reason: "not_found" };
  if (record.expiresAt.getTime() < Date.now())
    return { ok: false, reason: "expired" };
  if (record.attempts >= record.maxAttempts)
    return { ok: false, reason: "attempts" };
  if (!safeEqual(record.codeHash, sha256(code))) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "invalid" };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
}
