import type { Metadata } from "next";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, CalendarDays, Home } from "lucide-react";
import { getPublishedBlogPosts } from "@/lib/content-store";
import { formatJalaliDate } from "@/lib/jalali-date";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "وبلاگ آکما | راهنمای محصولات و فروش",
  description: "مقاله‌ها و راهنماهای تخصصی آکما درباره محصولات، نگهداری کفش و تجربه بهتر فروش.",
  alternates: { canonical: "/blog" },
  openGraph: { type: "website", url: "/blog", title: "وبلاگ آکما", description: "مقاله‌ها و راهنماهای تخصصی آکما" },
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <nav className="flex items-center gap-2 text-xs text-muted" aria-label="مسیر صفحه"><Link href="/" className="flex items-center gap-1 hover:text-accent"><Home size={13} /> خانه</Link><span>/</span><span className="font-bold text-ink">وبلاگ</span></nav>
      <header className="mx-auto mt-12 max-w-3xl text-center"><p className="text-xs font-bold text-accent">مجله آکما</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">راهنماها و مقاله‌های آکما</h1><p className="mt-5 text-sm leading-8 text-muted">دانش کاربردی برای انتخاب، نگهداری و عرضه بهتر محصولات.</p></header>
      {posts.length ? <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <article key={post.id} className="card card-hover flex h-full flex-col overflow-hidden"><Link href={`/blog/${encodeURIComponent(post.slug)}`} className="block aspect-video overflow-hidden bg-surface">{post.coverImage ? <img src={post.coverImage} alt={post.coverImageAlt || post.title} className="size-full object-cover transition-transform duration-500 hover:scale-105" width="1600" height="900" loading="lazy" /> : <span className="grid size-full place-items-center text-sm font-bold text-muted">AKMA</span>}</Link><div className="flex flex-1 flex-col p-6"><time dateTime={post.publishedAt?.toISOString()} className="flex items-center gap-2 text-[11px] text-muted"><CalendarDays size={13} />{post.publishedAt ? formatJalaliDate(post.publishedAt) : ""}</time><h2 className="mt-3 line-clamp-2 text-lg font-black leading-8"><Link href={`/blog/${encodeURIComponent(post.slug)}`}>{post.title}</Link></h2>{post.excerpt && <p className="mt-3 line-clamp-3 text-xs leading-6 text-muted">{post.excerpt}</p>}<Link href={`/blog/${encodeURIComponent(post.slug)}`} className="mt-5 inline-flex items-center gap-2 text-xs font-black text-accent">ادامه مطلب <ArrowLeft size={14} /></Link></div></article>)}</div> : <div className="card mt-14 p-12 text-center text-sm text-muted">به‌زودی مقاله‌های آکما در این بخش منتشر می‌شوند.</div>}
    </div>
  );
}
