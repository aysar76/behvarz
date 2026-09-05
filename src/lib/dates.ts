const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function div(a: number, b: number): number {
  return Math.floor(a / b);
}

function mod(a: number, b: number): number {
  return a - Math.floor(a / b) * b;
}

export function toJalali(date: Date): JalaliDate {
  let gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  let jy = gy <= 1600 ? 0 : 979;
  gy -= jy <= 0 ? 621 : 1600;

  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) -
    80 +
    gd +
    g_d_m[gm - 1];

  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  jy += div(days - 1, 365);
  if (days > 365) days = (days - 1) % 365;

  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? mod(days, 31) : mod(days - 186, 30));

  return { jy, jm, jd };
}

const MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** «۱۴۰۵/۰۷/۱۲» */
export function formatJalali(date: Date | string): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const { jy, jm, jd } = toJalali(parsed);
  return toPersianDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
}

/** «۱۲ مهر ۱۴۰۵» */
export function formatJalaliLong(date: Date | string): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const { jy, jm, jd } = toJalali(parsed);
  return toPersianDigits(`${jd} ${MONTH_NAMES[jm - 1]} ${jy}`);
}

/** زمان نسبی فارسی: «همین حالا»، «۵ دقیقه پیش»، «۲ روز پیش»؛ برای قدیمی‌ترها تاریخ شمسی. */
export function formatRelativeTime(date: Date | string): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "همین حالا";
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${toPersianDigits(days)} روز پیش`;

  return formatJalali(parsed);
}
