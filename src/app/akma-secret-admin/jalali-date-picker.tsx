"use client";

import { useMemo, useState } from "react";
import {
  PERSIAN_MONTHS,
  formatJalaliDateTime,
  getJalaliMonthLength,
  gregorianToJalaliDateTime,
  jalaliToGregorianIso,
  toPersianDigits,
  type JalaliDateTimeParts,
} from "@/lib/jalali-date";

type Props = { value: string | null; onChange: (value: string | null) => void };

function nowParts() {
  const parts = gregorianToJalaliDateTime(new Date());
  return { ...parts, minute: Math.floor(parts.minute / 5) * 5 };
}

export function JalaliDatePicker({ value, onChange }: Props) {
  const [error, setError] = useState("");
  const parts: JalaliDateTimeParts = value ? gregorianToJalaliDateTime(value) : nowParts();

  const years = useMemo(() => {
    const current = nowParts().year;
    const start = Math.min(current - 10, parts.year - 2);
    const end = Math.max(current + 20, parts.year + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [parts.year]);

  function update(change: Partial<JalaliDateTimeParts>) {
    const next = { ...parts, ...change };
    next.day = Math.min(next.day, getJalaliMonthLength(next.year, next.month));
    try {
      onChange(jalaliToGregorianIso(next));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تاریخ نامعتبر است");
    }
  }

  function enable() {
    const next = nowParts();
    onChange(jalaliToGregorianIso(next));
    setError("");
  }

  return (
    <fieldset className="min-w-0 rounded-2xl border border-line p-4" dir="rtl">
      <legend className="px-2 text-xs font-bold text-muted">تاریخ و ساعت انتشار</legend>
      <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => event.target.checked ? enable() : onChange(null)} />
        زمان‌بندی انتشار
      </label>
      {value ? <>
        <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-5">
          <label className="min-w-0 text-[10px] text-muted"><span className="mb-1 block">روز</span><select aria-label="روز انتشار" className="field min-w-0 px-2 text-center" value={parts.day} onChange={(event) => update({ day: Number(event.target.value) })}>{Array.from({ length: getJalaliMonthLength(parts.year, parts.month) }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{toPersianDigits(day)}</option>)}</select></label>
          <label className="min-w-0 text-[10px] text-muted"><span className="mb-1 block">ماه</span><select aria-label="ماه انتشار" className="field min-w-0 px-2 text-center" value={parts.month} onChange={(event) => update({ month: Number(event.target.value) })}>{PERSIAN_MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
          <label className="min-w-0 text-[10px] text-muted"><span className="mb-1 block">سال</span><select aria-label="سال انتشار" className="field min-w-0 px-2 text-center" value={parts.year} onChange={(event) => update({ year: Number(event.target.value) })}>{years.map((year) => <option key={year} value={year}>{toPersianDigits(year)}</option>)}</select></label>
          <label className="min-w-0 text-[10px] text-muted"><span className="mb-1 block">ساعت</span><select aria-label="ساعت انتشار" className="field min-w-0 px-2 text-center" value={parts.hour} onChange={(event) => update({ hour: Number(event.target.value) })}>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{toPersianDigits(String(hour).padStart(2, "0"))}</option>)}</select></label>
          <label className="min-w-0 text-[10px] text-muted"><span className="mb-1 block">دقیقه</span><select aria-label="دقیقه انتشار" className="field min-w-0 px-2 text-center" value={parts.minute} onChange={(event) => update({ minute: Number(event.target.value) })}>{Array.from({ length: 60 }, (_, minute) => <option key={minute} value={minute}>{toPersianDigits(String(minute).padStart(2, "0"))}</option>)}</select></label>
        </div>
        <p className="mt-3 text-[11px] leading-6 text-muted">{formatJalaliDateTime(value)} — منطقه زمانی تهران</p>
      </> : <p className="mt-3 text-[11px] leading-6 text-muted">بدون زمان‌بندی؛ مقاله منتشرشده بلافاصله قابل نمایش می‌شود.</p>}
      {error && <p role="alert" className="mt-2 text-[11px] text-rose-400">{error}</p>}
    </fieldset>
  );
}
