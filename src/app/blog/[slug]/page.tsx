import type { Metadata } from "next";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronLeft, Home, PackageSearch, UserRound } from "lucide-react";
import { BlogContent } from "@/components/blog-content";
import { getPublishedBlogPostBySlug, getPublishedBlogPosts } from "@/lib/content-store";
import { formatJalaliDate } from "@/lib/jalali-date";

type Props = { params: Promise<{ slug: string }> };
const siteUrl = (process.env.SITE_URL ?? "https://akmaofficial.ir").replace(/\/$/, "");
const absoluteUrl = (path: string) => /^https?:\/\//i.test(path) ? path : `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedBlogPostBySlug((await params).slug);
  if (!post) return { title: "مقاله پیدا نشد", robots: { index: false, follow: false } };
  const canonical = `/blog/${encodeURIComponent(post.slug)}`;
  const description = post.metaDescription || post.excerpt;
  return {
    title: post.seoTitle || `${post.title} | آکما`, description, alternates: { canonical }, robots: { index: true, follow: true },
    openGraph: { type: "article", url: canonical, title: post.seoTitle || post.title, description, publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt.toISOString(), images: post.coverImage ? [{ url: absoluteUrl(post.coverImage), alt: post.coverImageAlt || post.title }] : [] },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedBlogPostBySlug((await params).slug);
  if (!post) notFound();
  const related = (await getPublishedBlogPosts()).filter((item) => item.id !== post.id).slice(0, 3);
  const canonical = `${siteUrl}/blog/${encodeURIComponent(post.slug)}`;
  const image = post.coverImage ? absoluteUrl(post.coverImage) : undefined;
  const blogPosting = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title,
    description: post.metaDescription || post.excerpt || undefined, image, datePublished: post.publishedAt?.toISOString(), dateModified: post.updatedAt.toISOString(),
    ...(post.author ? { author: { "@type": "Person", name: post.author } } : {}),
    publisher: { "@type": "Organization", name: "AKMA", url: siteUrl }, mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };
  const breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "خانه", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "وبلاگ", item: `${siteUrl}/blog` },
    { "@type": "ListItem", position: 3, name: post.title, item: canonical },
  ] };
  return (
    <article className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPosting).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted" aria-label="مسیر صفحه"><Link href="/" className="flex items-center gap-1 hover:text-accent"><Home size={13} /> خانه</Link><ChevronLeft size={13} /><Link href="/blog" className="hover:text-accent">وبلاگ</Link><ChevronLeft size={13} /><span className="line-clamp-1 font-bold text-ink">{post.title}</span></nav>
      <header className="mx-auto mt-10 max-w-3xl text-center"><h1 className="text-3xl font-black leading-tight sm:text-5xl">{post.title}</h1>{post.excerpt && <p className="mt-5 text-sm leading-8 text-muted">{post.excerpt}</p>}<div className="mt-5 flex flex-wrap justify-center gap-4 text-[11px] text-muted"><time dateTime={post.publishedAt?.toISOString()} className="flex items-center gap-1.5"><CalendarDays size={14} />{post.publishedAt ? formatJalaliDate(post.publishedAt) : ""}</time>{post.author && <span className="flex items-center gap-1.5"><UserRound size={14} />{post.author}</span>}</div></header>
      {post.coverImage && <figure className="card mt-10 aspect-video overflow-hidden"><img src={post.coverImage} alt={post.coverImageAlt || post.title} className="size-full object-cover" width="1600" height="900" /></figure>}
      <div className="card mx-auto mt-8 max-w-3xl p-6 sm:p-10"><BlogContent blocks={post.content} /><div className="mt-12 rounded-2xl border border-accent/25 bg-accent/5 p-6 text-center"><PackageSearch className="mx-auto text-accent" size={24} /><p className="mt-3 text-sm font-black">محصولات تخصصی آکما را ببینید</p><Link href="/products" className="btn btn-primary mt-4 h-10 px-6 text-xs">مشاهده محصولات <ArrowLeft size={14} /></Link></div></div>
      {related.length > 0 && <section className="mt-16"><h2 className="text-xl font-black">مقاله‌های دیگر</h2><div className="mt-6 grid gap-4 sm:grid-cols-3">{related.map((item) => <Link key={item.id} href={`/blog/${encodeURIComponent(item.slug)}`} className="card card-hover p-5"><p className="line-clamp-2 text-sm font-black leading-7">{item.title}</p><span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-accent">ادامه مطلب <ArrowLeft size={12} /></span></Link>)}</div></section>}
    </article>
  );
}
