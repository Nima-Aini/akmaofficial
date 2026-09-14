"use client";

import { ArrowDown, ArrowUp, Bold, ImageIcon, Italic, Link2, List, ListOrdered, Minus, Pilcrow, Plus, Quote, Trash2, Type } from "lucide-react";
import type { BlogContentBlock } from "@/db/schema";
import { ImageUploader } from "./fields";

const blockOptions: { type: BlogContentBlock["type"]; label: string; icon: typeof Pilcrow }[] = [
  { type: "paragraph", label: "پاراگراف", icon: Pilcrow },
  { type: "h2", label: "تیتر H2", icon: Type },
  { type: "h3", label: "تیتر H3", icon: Type },
  { type: "bulletList", label: "لیست نقطه‌ای", icon: List },
  { type: "numberedList", label: "لیست شماره‌ای", icon: ListOrdered },
  { type: "quote", label: "نقل‌قول", icon: Quote },
  { type: "image", label: "تصویر", icon: ImageIcon },
  { type: "divider", label: "جداکننده", icon: Minus },
];

function newBlock(type: BlogContentBlock["type"]): BlogContentBlock {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type, ...(type.includes("List") ? { items: [""] } : type === "image" ? { url: "", alt: "", caption: "" } : type === "divider" ? {} : { text: "" }) };
}

export function BlogEditor({ value, onChange }: { value: BlogContentBlock[]; onChange: (blocks: BlogContentBlock[]) => void }) {
  const update = (index: number, patch: Partial<BlogContentBlock>) => onChange(value.map((block, i) => i === index ? { ...block, ...patch } : block));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const appendMarkup = (index: number, markup: string) => update(index, { text: `${value[index].text ?? ""}${value[index].text ? " " : ""}${markup}` });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold text-muted">محتوای کامل مقاله</span><span className="text-[10px] text-muted">محتوا ساختاریافته و امن ذخیره می‌شود.</span></div>
      <div className="mt-3 space-y-3">
        {value.map((block, index) => {
          const info = blockOptions.find((item) => item.type === block.type)!;
          return (
            <div key={block.id} className="rounded-2xl border border-line bg-surface/40 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2 text-xs font-black text-accent"><info.icon size={14} />{info.label}</span><div className="flex gap-1"><button type="button" onClick={() => move(index, -1)} className="grid size-8 place-items-center rounded-lg border border-line" aria-label="انتقال به بالا"><ArrowUp size={13} /></button><button type="button" onClick={() => move(index, 1)} className="grid size-8 place-items-center rounded-lg border border-line" aria-label="انتقال به پایین"><ArrowDown size={13} /></button><button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} className="grid size-8 place-items-center rounded-lg border border-line text-rose-400" aria-label="حذف بلوک"><Trash2 size={13} /></button></div></div>
              {(block.type === "paragraph" || block.type === "quote") && <div className="mb-2 flex flex-wrap gap-1"><button type="button" onClick={() => appendMarkup(index, "**متن پررنگ**")} className="grid size-8 place-items-center rounded-lg border border-line" aria-label="افزودن متن پررنگ"><Bold size={13} /></button><button type="button" onClick={() => appendMarkup(index, "*متن ایتالیک*")} className="grid size-8 place-items-center rounded-lg border border-line" aria-label="افزودن متن ایتالیک"><Italic size={13} /></button><button type="button" onClick={() => appendMarkup(index, "[عنوان لینک](/products)")} className="grid size-8 place-items-center rounded-lg border border-line" aria-label="افزودن لینک"><Link2 size={13} /></button></div>}
              {(block.type === "paragraph" || block.type === "h2" || block.type === "h3" || block.type === "quote") && <textarea className="field min-h-24 resize-y leading-7" value={block.text ?? ""} onChange={(event) => update(index, { text: event.target.value })} aria-label={info.label} placeholder={block.type === "paragraph" ? "متن مقاله؛ برای Bold و Italic از دکمه‌های بالا استفاده کنید." : info.label} />}
              {(block.type === "bulletList" || block.type === "numberedList") && <textarea className="field min-h-28 resize-y leading-7" value={(block.items ?? []).join("\n")} onChange={(event) => update(index, { items: event.target.value.split("\n") })} aria-label={info.label} placeholder="هر مورد را در یک خط بنویسید" />}
              {block.type === "image" && <div className="space-y-4"><ImageUploader label="تصویر داخل مقاله" value={block.url ?? ""} onChange={(url) => update(index, { url: typeof url === "string" ? url : url[0] ?? "" })} kind="blog" guideline="blogInline" /><label><span className="mb-1.5 block text-xs font-bold text-muted">متن جایگزین تصویر (Alt)</span><input className="field" value={block.alt ?? ""} onChange={(event) => update(index, { alt: event.target.value })} /></label><label><span className="mb-1.5 block text-xs font-bold text-muted">زیرنویس اختیاری</span><input className="field" value={block.caption ?? ""} onChange={(event) => update(index, { caption: event.target.value })} /></label></div>}
              {block.type === "divider" && <hr className="my-5 border-line" />}
            </div>
          );
        })}
        {value.length === 0 && <p className="rounded-2xl border border-dashed border-line p-6 text-center text-xs text-muted">مقاله هنوز محتوایی ندارد.</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{blockOptions.map((option) => <button key={option.type} type="button" onClick={() => onChange([...value, newBlock(option.type)])} className="btn btn-ghost h-9 px-3 text-[10px]"><Plus size={12} /><option.icon size={12} />{option.label}</button>)}</div>
    </div>
  );
}
