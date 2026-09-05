export interface SensitiveMatch {
  code: string;
  label: string;
}

interface Pattern {
  code: string;
  label: string;
  regex: RegExp;
}

const PATTERNS: Pattern[] = [
  {
    code: "national_id",
    label: "کد ملی یا شماره ۱۰ رقمی",
    regex: /(^|\D)\d{10}(\D|$)/,
  },
  {
    code: "phone",
    label: "شماره تماس",
    regex: /09\d{9}/,
  },
  {
    code: "long_number",
    label: "شماره/شناسه بلند",
    regex: /(^|\D)\d{12,}(\D|$)/,
  },
  {
    code: "patient_term",
    label: "واژهٔ شناسایی‌کننده (پرونده/شناسنامه)",
    regex:
      /(کد ملی|شماره ملی|شناسنامه|شماره پرونده|کد پرونده|کد بیمار|نام بیمار|نام خانوادگی بیمار|نشانی|آدرس منزل|آدرس کامل|شماره تماس)/i,
  },
  {
    code: "first_last_name",
    label: "الگوی «نام + نام خانوادگی»",
    regex:
      /([\u0600-\u06FF]{3,})\s+([\u0600-\u06FF]{3,})\s+([\u0600-\u06FF]{3,})\s+(بهورز|مراقب|مادر|بیمار|خانم|آقا)/i,
  },
];

const ARABIC_TO_ASCII: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

/** ارقام فارسی/عربی به ارقام انگلیسی برای شناسایی الگوهای عددی. */
function normalizeDigits(text: string): string {
  return text.replace(/[۰-۹٠-٩]/g, (digit) => ARABIC_TO_ASCII[digit] ?? digit);
}

/** شناسایی الگوهای محتوای حساس (اطلاعات قابل شناسایی بیمار/اشخاص) در متن. */
export function scanSensitiveContent(...texts: string[]): SensitiveMatch[] {
  const found: SensitiveMatch[] = [];
  const seen = new Set<string>();

  for (const text of texts) {
    if (!text) continue;
    const normalized = normalizeDigits(text);
    for (const pattern of PATTERNS) {
      if (seen.has(pattern.code)) continue;
      if (pattern.regex.test(normalized)) {
        seen.add(pattern.code);
        found.push({ code: pattern.code, label: pattern.label });
      }
    }
  }

  return found;
}

export function hasSensitiveContent(...texts: string[]): boolean {
  return scanSensitiveContent(...texts).length > 0;
}
