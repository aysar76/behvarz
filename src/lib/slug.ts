import { randomBytes } from "crypto";

const SLUG_ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** یک شناسه کوتاه تصادفی برای استفاده در URL (بدون کاراکترهای گیج‌کننده). */
export function generateShortToken(length = 8): string {
  const bytes = randomBytes(length);
  let token = "";
  for (let i = 0; i < length; i++) {
    token += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return token;
}

/** اسلاگ قابل اشتراک برای یک تجربه (پیشوند فارسی + توکن کوتاه). */
export function generateExperienceSlug(): string {
  return `tajrobe-${generateShortToken()}`;
}

export function isExperienceSlug(value: string): boolean {
  return /^tajrobe-[A-Za-z0-9]{8}$/.test(value);
}