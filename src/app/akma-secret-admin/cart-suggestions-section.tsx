"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { AdminProduct } from "./products-section";
import { Field, Textarea, Toggle } from "./fields";

type Rule = {
  id: number;
  triggerProductId: number | null;
  suggestedProductId: number | null;
  message: string;
  active: boolean;
  sortOrder: number;
};

const emptyRule: Rule = { id: 0, triggerProductId: null, suggestedProductId: null, message: "", active: true, sortOrder: 0 };

export function CartSuggestionsSection({ products, toast }: { products: AdminProduct[]; toast: (message: string, ok?: boolean) => void }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/cart-suggestions").then((res) => res.json()).then((data) => {
      if (data.ok) setRules(data.suggestions);
      else toast(data.error ?? "دریافت پیشنهادها ناموفق بود", false);
    }).catch(() => toast("دریافت پیشنهادها ناموفق بود", false));
  }, [toast]);

  const productName = (id: number | null) => products.find((product) => product.id === id)?.name ?? "محصول حذف‌شده";

  async function save() {
    if (!editing?.triggerProductId || !editing.suggestedProductId) return toast("هر دو محصول را انتخاب کنید", false);
    setSaving(true);
    try {
      const isNew = editing.id === 0;
      const res = await fetch(isNew ? "/api/admin/cart-suggestions" : `/api/admin/cart-suggestions/${editing.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return toast(data.error ?? "ذخیره پیشنهاد ناموفق بود", false);
      setRules((current) => isNew ? [...current, data.suggestion] : current.map((rule) => rule.id === data.suggestion.id ? data.suggestion : rule));
      setEditing(null);
      toast("پیشنهاد سبد خرید ذخیره شد");
    } catch { toast("خطا در ارتباط با سرور", false); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!window.confirm("این پیشنهاد حذف شود؟")) return;
    const res = await fetch(`/api/admin/cart-suggestions/${id}`, { method: "DELETE" });
    if (res.ok) { setRules((current) => current.filter((rule) => rule.id !== id)); toast("پیشنهاد حذف شد"); }
    else toast("حذف پیشنهاد ناموفق بود", false);
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-black">پیشنهادات سبد خرید</h3><p className="mt-1 text-xs text-muted">برای هر محصول، مکمل مناسب و پیام اختصاصی تعریف کنید.</p></div>
        <button type="button" onClick={() => setEditing({ ...emptyRule, sortOrder: rules.length })} className="btn btn-primary h-11 px-6 text-xs"><Plus size={15} /> پیشنهاد جدید</button>
      </div>
      <div className="mt-7 space-y-3">
        {rules.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted">هنوز پیشنهادی تعریف نشده است.</p>}
        {rules.map((rule) => (
          <div key={rule.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line p-4">
            <div className="min-w-0 flex-1"><p className="text-sm font-extrabold">{productName(rule.triggerProductId)} ← {productName(rule.suggestedProductId)}</p><p className="mt-1 line-clamp-2 text-[11px] text-muted">{rule.message || "بدون پیام اختصاصی"}</p></div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${rule.active ? "bg-emerald-400/10 text-emerald-400" : "bg-surface text-muted"}`}>{rule.active ? "فعال" : "غیرفعال"}</span>
            <button type="button" onClick={() => setEditing({ ...rule })} className="btn btn-ghost h-10 px-4 text-xs"><Pencil size={14} /> ویرایش</button>
            <button type="button" onClick={() => void remove(rule.id)} className="grid size-10 place-items-center rounded-xl border border-line text-rose-400 hover:border-rose-400" aria-label="حذف پیشنهاد"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8">
          <div className="card my-auto w-full max-w-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between"><h4 className="text-lg font-black">{editing.id ? "ویرایش پیشنهاد" : "پیشنهاد جدید"}</h4><button type="button" onClick={() => setEditing(null)} className="grid size-10 place-items-center rounded-xl border border-line" aria-label="بستن"><X size={17} /></button></div>
            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label><span className="mb-1.5 block text-xs font-bold text-muted">محصول محرک</span><select className="field" value={editing.triggerProductId ?? ""} onChange={(event) => setEditing({ ...editing, triggerProductId: Number(event.target.value) || null })}><option value="">انتخاب کنید</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
                <label><span className="mb-1.5 block text-xs font-bold text-muted">محصول پیشنهادی</span><select className="field" value={editing.suggestedProductId ?? ""} onChange={(event) => setEditing({ ...editing, suggestedProductId: Number(event.target.value) || null })}><option value="">انتخاب کنید</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
              </div>
              <Textarea label="پیام اختصاصی" value={editing.message} onChange={(message) => setEditing({ ...editing, message })} rows={4} />
              <Field label="ترتیب نمایش" type="number" dir="ltr" value={editing.sortOrder} onChange={(value) => setEditing({ ...editing, sortOrder: Number(value) || 0 })} />
              <Toggle label="پیشنهاد فعال باشد" checked={editing.active} onChange={(active) => setEditing({ ...editing, active })} />
              <button type="button" disabled={saving} onClick={() => void save()} className="btn btn-primary h-12 w-full text-sm"><Save size={16} />{saving ? "در حال ذخیره…" : "ذخیره پیشنهاد"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
