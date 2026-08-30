"use client";

import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";

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
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold text-muted">{label}</span>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="field flex-1"
              value={it}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-rose-400 transition-colors hover:border-rose-400"
              aria-label="حذف"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
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
}: {
  label: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  kind?: "products" | "banners" | "hero";
  multiple?: boolean;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const items = Array.isArray(value) ? value : (value ? [value] : []);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
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

  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold text-muted">{label}</span>
      {hint && <span className="mb-2 block text-[10px] text-muted">{hint}</span>}
      <div className="flex flex-wrap gap-2.5">
        {items.map((src, i) => (
          <div key={`${src}-${i}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-20 rounded-xl border border-line object-cover" />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-rose-500 text-white shadow"
              aria-label="حذف تصویر"
            >
              <X size={12} />
            </button>
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
