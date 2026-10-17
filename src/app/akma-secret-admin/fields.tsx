"use client";

import { Bold, ImagePlus, Loader2, Monitor, Palette, Plus, Redo2, RotateCcw, Smartphone, Trash2, Undo2, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { IMAGE_GUIDELINES, type ImageGuidelineKey } from "@/lib/image-guidelines";
import {
  TEXT_REGION_BACKDROP_CLASSES,
  TEXT_REGION_LABELS,
  TEXT_REGION_POSITIONS,
  type TextRegionPosition,
} from "@/lib/text-region";
import {
  getResponsiveFocalPoint,
  getResponsiveTextRegion,
  type ImageFocalPoint,
  type ResponsiveImageSettings,
} from "@/lib/responsive-image";
import {
  getPreviewTextLayoutClass,
  ResponsiveBannerMedia,
  ResponsiveTextRegionBackdrop,
} from "@/components/responsive-banner";
import { RichText } from "@/components/rich-text";
import {
  applyRichTextMark,
  normalizeRichTextValue,
  replaceRichTextPlainText,
  RICH_TEXT_COLORS,
  richTextToPlainText,
  type RichTextValue,
} from "@/lib/rich-text";

export function RichTextEditor({
  label,
  value,
  richValue,
  onChange,
  rows = 1,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  richValue?: RichTextValue;
  onChange: (plain: string, rich: RichTextValue) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [customColor, setCustomColor] = useState("#780B18");
  const [history, setHistory] = useState<RichTextValue[]>([]);
  const [future, setFuture] = useState<RichTextValue[]>([]);
  const normalized = normalizeRichTextValue(richValue, value);

  function selection() {
    const node = inputRef.current;
    return { start: node?.selectionStart ?? 0, end: node?.selectionEnd ?? value.length };
  }

  function apply(mark: { bold?: boolean | null; color?: string | null }) {
    const { start, end } = selection();
    const effectiveEnd = start === end ? value.length : end;
    const effectiveStart = start === end ? 0 : start;
    const next = applyRichTextMark(normalized, effectiveStart, effectiveEnd, mark);
    setHistory((items) => [...items.slice(-29), normalized]);
    setFuture([]);
    onChange(richTextToPlainText(next), next);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(effectiveStart, effectiveEnd);
    });
  }

  function restore(next: RichTextValue, direction: "undo" | "redo") {
    if (direction === "undo") {
      setHistory((items) => items.slice(0, -1));
      setFuture((items) => [normalized, ...items].slice(0, 30));
    } else {
      setFuture((items) => items.slice(1));
      setHistory((items) => [...items.slice(-29), normalized]);
    }
    onChange(richTextToPlainText(next), next);
  }

  const shared = {
    ref: inputRef as never,
    className: `field ${rows > 1 ? "resize-y leading-7" : ""}`,
    value,
    placeholder,
    dir: "rtl" as const,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const plain = event.target.value;
      setHistory((items) => [...items.slice(-29), normalized]);
      setFuture([]);
      onChange(plain, replaceRichTextPlainText(normalized, plain));
    },
  };

  return (
    <div className="space-y-2 rounded-2xl border border-line bg-bg/40 p-3" data-rich-text-editor>
      <span className="block text-xs font-bold text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label={`قالب‌بندی ${label}`}>
        <button type="button" title="بولد کردن" aria-label="بولد کردن" onMouseDown={(event) => event.preventDefault()} onClick={() => apply({ bold: true })} className="grid size-9 place-items-center rounded-lg border border-line hover:border-accent hover:text-accent"><Bold size={15} /></button>
        <div className="flex items-center gap-1 rounded-lg border border-line px-2 py-1" title="انتخاب رنگ متن">
          <Palette size={14} className="text-muted" />
          {RICH_TEXT_COLORS.map((color) => <button key={color.value} type="button" title={color.label} aria-label={`رنگ ${color.label}`} onMouseDown={(event) => event.preventDefault()} onClick={() => apply({ color: color.value })} className="size-5 rounded-full border border-black/15" style={{ backgroundColor: color.value }} />)}
          <input type="color" aria-label="رنگ سفارشی" value={customColor} onChange={(event) => { setCustomColor(event.target.value); apply({ color: event.target.value }); }} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" />
        </div>
        <button type="button" title="حذف قالب‌بندی" aria-label="حذف قالب‌بندی" onMouseDown={(event) => event.preventDefault()} onClick={() => apply({ bold: null, color: null })} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line px-3 text-[10px] font-bold text-muted hover:border-accent hover:text-accent"><RotateCcw size={13} /> حذف قالب‌بندی</button>
        <button type="button" title="واگرد" aria-label="واگرد" disabled={!history.length} onMouseDown={(event) => event.preventDefault()} onClick={() => history.at(-1) && restore(history.at(-1)!, "undo")} className="grid size-9 place-items-center rounded-lg border border-line disabled:opacity-30"><Undo2 size={14} /></button>
        <button type="button" title="انجام مجدد" aria-label="انجام مجدد" disabled={!future.length} onMouseDown={(event) => event.preventDefault()} onClick={() => future[0] && restore(future[0], "redo")} className="grid size-9 place-items-center rounded-lg border border-line disabled:opacity-30"><Redo2 size={14} /></button>
      </div>
      {rows > 1 ? <textarea {...shared} rows={rows} /> : <input {...shared} type="text" />}
      <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm leading-7" aria-label={`پیش‌نمایش ${label}`}>
        <RichText value={normalized} fallback={value || "پیش‌نمایش متن"} />
      </div>
      <p className="text-[10px] leading-5 text-muted">بخشی از متن را انتخاب کنید؛ اگر انتخابی وجود نداشته باشد، قالب‌بندی روی کل متن اعمال می‌شود.</p>
      {hint ? <span className="block text-[10px] text-muted">{hint}</span> : null}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  dir,
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-muted">{label}</span>
      <input
        type={type}
        className="field"
        value={value}
        dir={dir}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        {...(type === "number" ? { inputMode: "numeric" } : {})}
      />
      {hint && <span className="mt-1 block text-[10px] text-muted">{hint}</span>}
    </label>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  rows = 5,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-muted">{label}</span>
      <textarea
        className="field resize-y leading-7"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="mt-1 block text-[10px] text-muted">{hint}</span>}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-xs font-bold transition-colors hover:border-accent"
    >
      <span
        className={`relative h-5.5 w-10 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4.5 rounded-full bg-bg transition-all ${
            checked ? "right-0.5" : "right-5"
          }`}
        />
      </span>
      {label}
    </button>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-muted">{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextRegionControl({
  label = "ناحیه نمایش متن",
  value,
  onChange,
  image,
  variant = "banner",
}: {
  label?: string;
  value: TextRegionPosition;
  onChange: (value: TextRegionPosition) => void;
  image?: string;
  variant?: "banner" | "product";
}) {
  const guidance = variant === "product"
    ? "در کارت محصول، اطلاعات داخل یک لایه شیشه‌ای نیمه‌شفاف قرار می‌گیرند و تصویر زیر آن کمی نرم می‌شود. جزئیات مهم یا متن آماده را در ناحیه انتخاب‌شده قرار ندهید."
    : "بخشی که برای متن انتخاب می‌کنید روی خود تصویر کمی مات می‌شود و متن در همان ناحیه نمایش داده خواهد شد. هنگام طراحی یا آپلود تصویر، آن قسمت را خلوت نگه دارید.";

  return (
    <div className="space-y-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
      <Select
        label={label}
        value={value}
        onChange={(next) => onChange(next as TextRegionPosition)}
        options={TEXT_REGION_POSITIONS.map((position) => ({
          value: position,
          label: TEXT_REGION_LABELS[position],
        }))}
      />
      <div className="space-y-1 text-[10px] leading-5 text-muted">
        <p>{guidance}</p>
        <p className="font-bold text-ink">ناحیه متن این تصویر: {TEXT_REGION_LABELS[value]}</p>
        <p>ناحیه متن قابل انتخاب است و برای بهترین نتیجه باید در فایل طراحی خلوت بماند. اگر تصویر دارای متن آماده است، آن را در این بخش قرار ندهید مگر عامدانه.</p>
      </div>
      <div
        className={`relative isolate overflow-hidden rounded-xl border border-line bg-cover bg-center ${variant === "product" ? "aspect-square max-w-56" : "aspect-[16/7] w-full"}`}
        style={{ backgroundImage: image ? `url(${image})` : "linear-gradient(135deg,#4A0811,#C86A73)" }}
        data-text-region-preview={value}
        aria-label={`پیش‌نمایش ناحیه متن: ${TEXT_REGION_LABELS[value]}`}
      >
        <span className={`absolute z-10 backdrop-blur-[3px] ${TEXT_REGION_BACKDROP_CLASSES[value]}`} />
        <span className="absolute inset-0 z-20 grid place-items-center p-4 text-center text-[10px] font-black text-white drop-shadow-md">
          ناحیه امن متن
        </span>
      </div>
    </div>
  );
}

export function FocalPointControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: ImageFocalPoint;
  onChange: (value: ImageFocalPoint) => void;
}) {
  const point = value ?? { x: 50, y: 50 };
  const set = (patch: Partial<ImageFocalPoint>) => onChange({ ...point, ...patch });
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-ink">{label}</span>
        <button type="button" onClick={() => onChange({ x: 50, y: 50 })} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line px-3 text-[10px] font-bold text-muted hover:border-accent hover:text-accent">
          <RotateCcw size={12} /> بازنشانی به مرکز
        </button>
      </div>
      <label className="block text-[10px] font-bold text-muted">
        افقی: <b className="text-ink">{point.x}٪</b>
        <input aria-label={`${label} افقی`} type="range" min="0" max="100" value={point.x} onChange={(event) => set({ x: Number(event.target.value) })} className="mt-2 block w-full accent-[var(--accent)]" />
      </label>
      <label className="block text-[10px] font-bold text-muted">
        عمودی: <b className="text-ink">{point.y}٪</b>
        <input aria-label={`${label} عمودی`} type="range" min="0" max="100" value={point.y} onChange={(event) => set({ y: Number(event.target.value) })} className="mt-2 block w-full accent-[var(--accent)]" />
      </label>
      <p className="text-[10px] leading-5 text-muted">این کنترل فقط محل برش و تمرکز سوژه را تغییر می‌دهد و تصویر را کشیده یا بدشکل نمی‌کند.</p>
    </div>
  );
}

const PREVIEW_WIDTHS = [
  { width: 360, label: "موبایل ۳۶۰" },
  { width: 390, label: "موبایل ۳۹۰" },
  { width: 430, label: "موبایل ۴۳۰" },
  { width: 768, label: "تبلت" },
  { width: 1440, label: "دسکتاپ" },
] as const;

export function ResponsiveBannerDesign({
  value,
  onChange,
  desktopGuideline,
  mobileGuideline = "heroMobile",
  kind = "banners",
  previewTitle,
  previewSubtitle,
  previewCta,
  previewTitleRichText,
  previewSubtitleRichText,
  previewCtaRichText,
  fallback,
  desktopTextFallback = "right",
  mobileTextFallback = "bottom",
  category = false,
}: {
  value: Partial<ResponsiveImageSettings> & { image: string };
  onChange: (patch: Partial<ResponsiveImageSettings>) => void;
  desktopGuideline: ImageGuidelineKey;
  mobileGuideline?: ImageGuidelineKey;
  kind?: "banners" | "hero";
  previewTitle: string;
  previewSubtitle?: string;
  previewCta?: string;
  previewTitleRichText?: RichTextValue;
  previewSubtitleRichText?: RichTextValue;
  previewCtaRichText?: RichTextValue;
  fallback: string;
  desktopTextFallback?: TextRegionPosition;
  mobileTextFallback?: TextRegionPosition;
  category?: boolean;
}) {
  const [previewWidth, setPreviewWidth] = useState(390);
  const [showSafeRegion, setShowSafeRegion] = useState(true);
  const viewport = previewWidth < 768 ? "mobile" : "desktop";
  const textPosition = getResponsiveTextRegion(value, viewport, desktopTextFallback, mobileTextFallback);
  const previewHeight = category ? previewWidth : viewport === "mobile" ? Math.round(previewWidth * 1.18) : Math.min(500, Math.round(previewWidth * 0.36));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-bg/60 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-line pb-3 text-sm font-black text-ink"><Monitor size={16} /> طراحی دسکتاپ</div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ImageUploader label="تصویر دسکتاپ" value={value.image} onChange={(next) => onChange({ image: typeof next === "string" ? next : (next[0] ?? "") })} kind={kind} guideline={desktopGuideline} hint="تصویر فعلی شما حفظ می‌شود و نیازی به آپلود مجدد نیست." />
          <div className="space-y-4">
            <FocalPointControl label="موقعیت تصویر دسکتاپ" value={getResponsiveFocalPoint(value, "desktop")} onChange={(desktopObjectPosition) => onChange({ desktopObjectPosition })} />
            <TextRegionControl label="موقعیت متن دسکتاپ" value={getResponsiveTextRegion(value, "desktop", desktopTextFallback, mobileTextFallback)} onChange={(textRegionPosition) => onChange({ textRegionPosition })} image={value.image || fallback} />
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-[10px] leading-5 text-muted">هنگام طراحی تصویر دسکتاپ، قسمت مشخص‌شده برای عنوان، توضیحات و دکمه را خلوت نگه دارید.</p>
      </div>

      <div className="rounded-2xl border border-line bg-bg/60 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-line pb-3 text-sm font-black text-ink"><Smartphone size={16} /> طراحی موبایل</div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ImageUploader label="تصویر موبایل" value={value.mobileImage || ""} onChange={(next) => onChange({ mobileImage: typeof next === "string" ? next : (next[0] ?? "") })} kind={kind} guideline={mobileGuideline} hint="در صورت عدم انتخاب یا حذف، تصویر دسکتاپ با برش کنترل‌شده نمایش داده می‌شود." />
          <div className="space-y-4">
            <FocalPointControl label="موقعیت تصویر موبایل" value={getResponsiveFocalPoint(value, "mobile")} onChange={(mobileObjectPosition) => onChange({ mobileObjectPosition })} />
            <TextRegionControl label="موقعیت متن موبایل" value={getResponsiveTextRegion(value, "mobile", desktopTextFallback, mobileTextFallback)} onChange={(mobileTextRegionPosition) => onChange({ mobileTextRegionPosition })} image={value.mobileImage || value.image || fallback} />
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-[10px] leading-5 text-muted">هنگام طراحی تصویر موبایل، سوژه اصلی را خارج از محدوده متن قرار دهید تا در صفحه گوشی تصویر و نوشته‌ها روی یکدیگر نیفتند.</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5" data-responsive-banner-preview>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h4 className="text-sm font-black text-ink">پیش‌نمایش واقعی بنر</h4><p className="mt-1 text-[10px] text-muted">منبع تصویر، crop، نقطه تمرکز، blur، متن و CTA همین تنظیمات را نمایش می‌دهند.</p></div>
          <button type="button" onClick={() => setShowSafeRegion((current) => !current)} aria-pressed={showSafeRegion} className={`min-h-10 rounded-xl border px-4 text-[10px] font-bold ${showSafeRegion ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"}`}>نمایش محدوده امن متن</button>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="اندازه پیش‌نمایش">
          {PREVIEW_WIDTHS.map((item) => <button key={item.width} type="button" onClick={() => setPreviewWidth(item.width)} aria-pressed={previewWidth === item.width} className={`min-h-10 rounded-xl border px-3 text-[10px] font-bold ${previewWidth === item.width ? "border-accent bg-accent text-on-accent" : "border-line text-muted hover:border-accent"}`}>{item.label}</button>)}
        </div>
        <div className="overflow-x-auto rounded-2xl bg-bg p-3">
          <div className="relative isolate mx-auto shrink-0 overflow-hidden rounded-2xl bg-[#4A0811] text-white shadow-lg" style={{ width: `${previewWidth}px`, height: `${previewHeight}px`, maxWidth: "none" }} data-preview-width={previewWidth}>
            <ResponsiveBannerMedia settings={value} fallback={fallback} mode={viewport} alt="" />
            <ResponsiveTextRegionBackdrop settings={value} desktopFallback={desktopTextFallback} mobileFallback={mobileTextFallback} mode={viewport} />
            {showSafeRegion ? <span aria-hidden="true" className={`pointer-events-none absolute z-20 border-2 border-dashed border-amber-300/90 ${TEXT_REGION_BACKDROP_CLASSES[textPosition]}`}><span className="absolute right-3 top-3 rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black text-stone-900">ناحیه مخصوص متن</span></span> : null}
            <div className={`relative z-10 flex size-full p-5 ${getPreviewTextLayoutClass(textPosition)}`}>
              <div className={`${textPosition === "right" || textPosition === "left" ? "w-[58%]" : "w-full max-w-[680px]"} space-y-3 drop-shadow-[0_2px_10px_rgba(0,0,0,.7)]`}>
                <strong className={`${viewport === "mobile" ? "text-2xl" : "text-4xl"} block font-black leading-tight`}><RichText value={previewTitleRichText} fallback={previewTitle || "عنوان بنر"} /></strong>
                {previewSubtitle ? <RichText as="p" className={`${viewport === "mobile" ? "text-xs" : "text-sm"} leading-6 text-white/90`} value={previewSubtitleRichText} fallback={previewSubtitle} /> : null}
                {previewCta ? <span className="inline-flex min-h-10 items-center rounded-full bg-white px-5 text-xs font-black text-[#8E111E]"><RichText value={previewCtaRichText} fallback={previewCta} /></span> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-transparent"
        />
        <input
          className="field flex-1"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  richItems,
  onRichChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  richItems?: RichTextValue[];
  onRichChange?: (items: RichTextValue[]) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold text-muted">{label}</span>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2">
            {richItems && onRichChange ? <div className="flex-1"><RichTextEditor label={`${label} ${i + 1}`} value={it} richValue={richItems[i]} placeholder={placeholder} onChange={(plain, rich) => {
              const next = [...items]; next[i] = plain; onChange(next);
              const nextRich = [...richItems]; nextRich[i] = rich; onRichChange(nextRich);
            }} /></div> : <input
              className="field flex-1"
              value={it}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />}
            <button
              type="button"
              onClick={() => { onChange(items.filter((_, j) => j !== i)); if (richItems && onRichChange) onRichChange(richItems.filter((_, j) => j !== i)); }}
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-rose-400 transition-colors hover:border-rose-400"
              aria-label="حذف"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => { onChange([...items, ""]); if (richItems && onRichChange) onRichChange([...richItems, { segments: [] }]); }}
          className="btn btn-ghost h-10 w-full text-xs"
        >
          <Plus size={14} /> افزودن مورد
        </button>
      </div>
    </div>
  );
}


export function ImageUploader({
  label,
  value,
  onChange,
  kind = "products",
  multiple = false,
  hint,
  guideline = "product",
}: {
  label: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  kind?: "products" | "banners" | "hero" | "blog" | "branding";
  multiple?: boolean;
  hint?: string;
  guideline?: ImageGuidelineKey;
}) {
  const [uploading, setUploading] = useState(false);
  const [dimensionWarning, setDimensionWarning] = useState("");
  const items = Array.isArray(value) ? value : (value ? [value] : []);
  const guide = IMAGE_GUIDELINES[guideline];

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
        const dimensions = await new Promise<{ width: number; height: number } | null>((resolve) => {
          const image = new Image();
          const url = URL.createObjectURL(file);
          image.onload = () => { resolve({ width: image.naturalWidth, height: image.naturalHeight }); URL.revokeObjectURL(url); };
          image.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
          image.src = url;
        });
        if (dimensions) {
          const expected = guide.width / guide.height;
          const actual = dimensions.width / dimensions.height;
          if (Math.abs(actual - expected) / expected > 0.15) {
            setDimensionWarning(`تصویر ${dimensions.width} × ${dimensions.height} است. نسبت پیشنهادی ${guide.ratio} است و ممکن است بخشی از تصویر در قاب برش بخورد.`);
          } else {
            setDimensionWarning("");
          }
        }
        const form = new FormData();
        form.append("file", file);
        form.append("kind", kind);
        const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok || typeof data.url !== "string") {
          throw new Error(data.error ?? "آپلود تصویر ناموفق بود");
        }
        next.push(data.url);
      }
      if (multiple) {
        const merged = [...items, ...next].slice(0, 8);
        onChange(merged);
      } else {
        onChange(next[0] ?? "");
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "آپلود تصویر ناموفق بود");
    } finally {
      setUploading(false);
    }
  }

  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index);
    onChange(Array.isArray(value) ? next : (next[0] ?? ""));
  }

  function moveItem(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(Array.isArray(value) ? next : (next[0] ?? ""));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [items[index], ...items.filter((_, itemIndex) => itemIndex !== index)];
    onChange(Array.isArray(value) ? next : (next[0] ?? ""));
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold text-muted">{label}</span>
      {hint && <span className="mb-2 block text-[10px] text-muted">{hint}</span>}
      <div className="mb-3 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-[10px] leading-5 text-muted">
        <span className="font-bold text-ink">ابعاد پیشنهادی: {guide.width} × {guide.height} پیکسل</span>
        <span className="mx-2 text-accent">•</span>
        <span className="font-bold text-ink">نسبت تصویر: {guide.ratio}</span>
        <span className="mx-2 text-accent">•</span>
        <span>فرمت: {guide.format}</span>
        <span className="block">{guide.usage}</span>
      </div>
      {dimensionWarning && <p className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-800" role="status">{dimensionWarning} آپلود مجاز است.</p>}
      <div className="flex flex-wrap gap-2.5">
        {items.map((src, i) => (
          <div key={`${src}-${i}`} className="relative rounded-xl border border-line bg-surface p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className={`size-20 rounded-lg ${guide.fit === "contain" ? "object-contain bg-surface p-1" : "object-cover"}`} />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-rose-500 text-white shadow"
              aria-label="حذف تصویر"
            >
              <X size={12} />
            </button>
            {multiple ? <div className="mt-1 flex items-center justify-center gap-1">
              <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0} className="min-h-7 rounded border border-line px-1.5 text-[9px] disabled:opacity-30" aria-label="انتقال تصویر به ابتدا">→</button>
              <button type="button" onClick={() => makeCover(i)} disabled={i === 0} className="min-h-7 rounded border border-line px-1.5 text-[9px] font-bold disabled:opacity-50">{i === 0 ? "کاور" : "کاور کن"}</button>
              <button type="button" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="min-h-7 rounded border border-line px-1.5 text-[9px] disabled:opacity-30" aria-label="انتقال تصویر به انتها">←</button>
            </div> : null}
          </div>
        ))}
        {(!items.length || multiple) && (
          <label className="grid size-20 cursor-pointer place-items-center rounded-xl border border-dashed border-line bg-surface transition-colors hover:border-accent">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              multiple={multiple}
              onChange={(e) => {
                void upload(e.target.files);
                e.currentTarget.value = "";
              }}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-accent" />
            ) : (
              <ImagePlus size={20} className="text-muted" />
            )}
            <span className="-mt-4 text-[9px] font-bold text-muted">آپلود</span>
          </label>
        )}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  desc,
  children,
  onSave,
  saving,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
  onSave?: () => void;
  saving?: boolean;
}) {
  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">{title}</h3>
          {desc && <p className="mt-1 text-xs text-muted">{desc}</p>}
        </div>
        {onSave && (
          <button onClick={onSave} disabled={saving} className="btn btn-primary h-11 px-7 text-xs">
            {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
        )}
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}
