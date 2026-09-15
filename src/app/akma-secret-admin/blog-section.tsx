"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { BlogContentBlock } from "@/db/schema";
import { formatJalaliDateTime } from "@/lib/jalali-date";
import { Field, ImageUploader, Textarea, Toggle } from "./fields";
import { BlogEditor } from "./blog-editor";
import { JalaliDatePicker } from "./jalali-date-picker";

type AdminPost = {
  id: number; title: string; slug: string; excerpt: string; coverImage: string; coverImageAlt: string;
  content: BlogContentBlock[]; seoTitle: string; metaDescription: string; status: "draft" | "published";
  author: string; featured: boolean; sortOrder: number; publishedAt: string | null; updatedAt?: string;
};

const emptyPost: AdminPost = { id: 0, title: "", slug: "", excerpt: "", coverImage: "", coverImageAlt: "", content: [], seoTitle: "", metaDescription: "", status: "draft", author: "", featured: false, sortOrder: 0, publishedAt: null };

export function BlogSection({ toast }: { toast: (message: string, ok?: boolean) => void }) {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [editing, setEditing] = useState<AdminPost | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/admin/blog-posts").then((res) => res.json()).then((data) => data.ok ? setPosts(data.posts) : toast(data.error ?? "دریافت مقالات ناموفق بود", false)).catch(() => toast("دریافت مقالات ناموفق بود", false)); }, [toast]);

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const isNew = editing.id === 0;
      const res = await fetch(isNew ? "/api/admin/blog-posts" : `/api/admin/blog-posts/${editing.id}`, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
      const data = await res.json();
      if (!res.ok || !data.ok) return toast(data.error ?? "ذخیره مقاله ناموفق بود", false);
      setPosts((current) => isNew ? [data.post, ...current] : current.map((post) => post.id === data.post.id ? data.post : post));
      setEditing(null); toast(editing.status === "published" ? "مقاله منتشر شد" : "پیش‌نویس ذخیره شد");
    } catch { toast("خطا در ارتباط با سرور", false); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!window.confirm("این مقاله برای همیشه حذف شود؟")) return;
    const res = await fetch(`/api/admin/blog-posts/${id}`, { method: "DELETE" });
    if (res.ok) { setPosts((current) => current.filter((post) => post.id !== id)); toast("مقاله حذف شد"); } else toast("حذف مقاله ناموفق بود", false);
  }

  const patch = (value: Partial<AdminPost>) => setEditing((current) => current ? { ...current, ...value } : current);

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-black">مدیریت وبلاگ</h3><p className="mt-1 text-xs text-muted">مقاله‌های SEO را به‌صورت پیش‌نویس ذخیره یا منتشر کنید.</p></div><button type="button" onClick={() => setEditing({ ...emptyPost })} className="btn btn-primary h-11 px-6 text-xs"><Plus size={15} /> مقاله جدید</button></div>
      <div className="mt-7 space-y-3">{posts.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted">هنوز مقاله‌ای ایجاد نشده است.</p>}{posts.map((post) => {
        const scheduled = post.status === "published" && post.publishedAt && new Date(post.publishedAt) > new Date();
        return <div key={post.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line p-4">{post.coverImage && <div className="aspect-video w-20 shrink-0 overflow-hidden rounded-xl bg-surface"><img src={post.coverImage} alt="" className="size-full object-cover" width="160" height="90" /></div>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{post.title}</p><p className="mt-1 text-[11px] text-muted" dir="ltr">/blog/{post.slug}</p>{post.publishedAt && <p className="mt-1 text-[11px] text-muted">{formatJalaliDateTime(post.publishedAt)}</p>}</div><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${post.status === "published" ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"}`}>{scheduled ? "زمان‌بندی‌شده" : post.status === "published" ? "منتشرشده" : "پیش‌نویس"}</span><button type="button" onClick={() => setEditing({ ...post })} className="btn btn-ghost h-10 px-4 text-xs"><Pencil size={14} /> ویرایش</button><button type="button" onClick={() => void remove(post.id)} className="grid size-10 place-items-center rounded-xl border border-line text-rose-400 hover:border-rose-400" aria-label={`حذف ${post.title}`}><Trash2 size={15} /></button></div>;
      })}</div>
      {editing && <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-8"><div className="card my-4 w-full max-w-4xl p-5 sm:p-8"><div className="flex items-center justify-between"><h4 className="text-lg font-black">{editing.id ? `ویرایش «${editing.title}»` : "مقاله جدید"}</h4><button type="button" onClick={() => setEditing(null)} className="grid size-10 place-items-center rounded-xl border border-line" aria-label="بستن"><X size={17} /></button></div><div className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2"><Field label="عنوان مقاله" value={editing.title} onChange={(title) => patch({ title })} /><Field label="اسلاگ (آدرس)" dir="ltr" value={editing.slug} onChange={(slug) => patch({ slug })} hint="خالی بماند = ساخت خودکار از عنوان" /></div>
        <Textarea label="خلاصه مقاله" value={editing.excerpt} onChange={(excerpt) => patch({ excerpt })} rows={3} />
        <ImageUploader label="تصویر کاور" value={editing.coverImage} onChange={(value) => patch({ coverImage: typeof value === "string" ? value : value[0] ?? "" })} kind="blog" guideline="blogCover" /><Field label="متن جایگزین کاور (Alt)" value={editing.coverImageAlt} onChange={(coverImageAlt) => patch({ coverImageAlt })} />
        <BlogEditor value={editing.content} onChange={(content) => patch({ content })} />
        <div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2"><Field label="عنوان SEO" value={editing.seoTitle} onChange={(seoTitle) => patch({ seoTitle })} hint="اگر خالی باشد از عنوان مقاله استفاده می‌شود." /><Textarea label="Meta Description" value={editing.metaDescription} onChange={(metaDescription) => patch({ metaDescription })} rows={2} hint="حدود ۱۴۰ تا ۱۶۰ کاراکتر پیشنهاد می‌شود." /></div>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="نویسنده (اختیاری)" value={editing.author} onChange={(author) => patch({ author })} /><Field label="ترتیب نمایش" type="number" dir="ltr" value={editing.sortOrder} onChange={(sortOrder) => patch({ sortOrder: Number(sortOrder) || 0 })} /></div>
        <JalaliDatePicker value={editing.publishedAt} onChange={(publishedAt) => patch({ publishedAt })} />
        <div className="flex flex-wrap gap-3"><Toggle label="مقاله ویژه" checked={editing.featured} onChange={(featured) => patch({ featured })} /><Toggle label={editing.status === "published" ? "منتشرشده" : "پیش‌نویس"} checked={editing.status === "published"} onChange={(published) => patch({ status: published ? "published" : "draft" })} /></div>
        <button type="button" disabled={saving} onClick={() => void save()} className="btn btn-primary h-12 w-full text-sm"><Save size={16} />{saving ? "در حال ذخیره…" : editing.status === "published" ? "ذخیره و انتشار" : "ذخیره پیش‌نویس"}</button>
      </div></div></div>}
    </div>
  );
}
