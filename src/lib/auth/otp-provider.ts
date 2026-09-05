export interface OtpSendResult {
  ok: boolean;
  devCode?: string;
}

export interface OtpProvider {
  readonly name: string;
  send(phone: string, code: string): Promise<OtpSendResult>;
}

// حالت توسعه: پیامک ارسال نمی‌شود؛ فقط در صورتی که DEV_SHOW_OTP=true باشد
// کد برای نمایش در UI داخل پاسخ API برگردانده می‌شود (هرگز لاگ نمی‌شود).
export class DevOtpProvider implements OtpProvider {
  readonly name = "dev";

  async send(phone: string, code: string): Promise<OtpSendResult> {
    return { ok: true, devCode: code };
  }
}

// حالت بدون سرویس پیامک: هیچ درخواستی به SMS Provider ارسال نمی‌شود و
// کد در پاسخ API، لاگ یا رابط کاربری افشا نمی‌شود.
export class NoopOtpProvider implements OtpProvider {
  readonly name = "noop";

  async send(): Promise<OtpSendResult> {
    return { ok: true };
  }
}

// نقطه اتصال سرویس پیامک (آینده): با تنظیم OTP_PROVIDER="sms" و متغیرهای
// سرویس پیامک، این تابع ارائه‌دهنده واقعی را برمی‌گرداند. تا آن زمان null
// است تا هیچ درخواستی به سرویس پیامک ارسال نشود و DEV_SHOW_OTP=false بماند.
function getSmsProvider(): OtpProvider | null {
  return null;
}

export function getOtpProvider(): OtpProvider {
  const smsProvider = getSmsProvider();
  if (smsProvider) return smsProvider;

  // کد فقط وقتی در UI نمایش داده می‌شود که DEV_SHOW_OTP دقیقاً true باشد.
  if (process.env.DEV_SHOW_OTP === "true") {
    return new DevOtpProvider();
  }
  return new NoopOtpProvider();
}
