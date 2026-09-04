import { logger } from "@/lib/logger";

export interface OtpSendResult {
  ok: boolean;
  devCode?: string;
}

export interface OtpProvider {
  readonly name: string;
  send(phone: string, code: string): Promise<OtpSendResult>;
}

export class DevOtpProvider implements OtpProvider {
  readonly name = "dev";

  async send(phone: string, code: string): Promise<OtpSendResult> {
    // در توسعه OTP واقعی ارسال نمی‌شود؛ کد در لاگ و پاسخ API (فقط dev) دیده می‌شود.
    logger.info("otp", `dev otp for ${phone}`, { code });
    return { ok: true, devCode: code };
  }
}

export function getOtpProvider(): OtpProvider {
  const configured = process.env.OTP_PROVIDER ?? "dev";
  switch (configured) {
    default:
      return new DevOtpProvider();
  }
}
