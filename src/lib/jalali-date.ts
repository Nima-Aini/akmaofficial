import { isValidJalaaliDate, jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";

export const BLOG_TIME_ZONE = "Asia/Tehran";

export const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
] as const;

export type JalaliDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const tehranGregorianFormatter = new Intl.DateTimeFormat("en-US-u-ca-gregory", {
  timeZone: BLOG_TIME_ZONE,
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

const tehranOffsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BLOG_TIME_ZONE,
  timeZoneName: "longOffset",
});

const jalaliDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
  timeZone: BLOG_TIME_ZONE,
  year: "numeric", month: "long", day: "numeric",
});

const tehranTimeFormatter = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
  timeZone: BLOG_TIME_ZONE,
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function asDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("تاریخ نامعتبر است");
  return date;
}

function numericParts(formatter: Intl.DateTimeFormat, date: Date) {
  return Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>;
}

function tehranOffsetMilliseconds(date: Date) {
  const label = tehranOffsetFormatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value;
  const match = label?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) throw new Error("منطقه زمانی تهران قابل محاسبه نیست");
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return (match[1] === "+" ? minutes : -minutes) * 60_000;
}

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

export function getJalaliMonthLength(year: number, month: number) {
  return jalaaliMonthLength(year, month);
}

export function gregorianToJalaliDateTime(value: Date | string): JalaliDateTimeParts {
  const parts = numericParts(tehranGregorianFormatter, asDate(value));
  const jalali = toJalaali(parts.year, parts.month, parts.day);
  return { year: jalali.jy, month: jalali.jm, day: jalali.jd, hour: parts.hour, minute: parts.minute };
}

export function jalaliToGregorianIso(parts: JalaliDateTimeParts) {
  const { year, month, day, hour, minute } = parts;
  if (
    ![year, month, day, hour, minute].every(Number.isInteger)
    || !isValidJalaaliDate(year, month, day)
    || hour < 0 || hour > 23 || minute < 0 || minute > 59
  ) throw new Error("تاریخ یا ساعت شمسی نامعتبر است");

  const gregorian = toGregorian(year, month, day);
  const wallClockUtc = Date.UTC(gregorian.gy, gregorian.gm - 1, gregorian.gd, hour, minute);
  let instant = new Date(wallClockUtc - tehranOffsetMilliseconds(new Date(wallClockUtc)));
  instant = new Date(wallClockUtc - tehranOffsetMilliseconds(instant));

  const verified = numericParts(tehranGregorianFormatter, instant);
  if (
    verified.year !== gregorian.gy || verified.month !== gregorian.gm || verified.day !== gregorian.gd
    || verified.hour !== hour || verified.minute !== minute
  ) throw new Error("این زمان در منطقه زمانی تهران معتبر نیست");

  return instant.toISOString();
}

export function formatJalaliDate(value: Date | string) {
  return toPersianDigits(jalaliDateFormatter.format(asDate(value)));
}

export function formatJalaliDateTime(value: Date | string) {
  const date = asDate(value);
  return `${formatJalaliDate(date)}، ساعت ${toPersianDigits(tehranTimeFormatter.format(date))}`;
}
