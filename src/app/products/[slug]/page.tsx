import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Box,
  ChevronLeft,
  CircleCheck,
  Home,
  PackageCheck,
  PackageX,
  Phone,
  Truck,
} from "lucide-react";
import { getActiveProducts, getProductBySlug, getSettings } from "@/lib/store";
import { DEFAULT_CONTACT, type ContactSettings } from "@/lib/defaults";
import { ProductCard } from "@/components/product-card";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Reveal } from "@/components/effects";
import { formatPrice, telHref, toFa } from "@/lib/format";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, s, all] = await Promise.all([
    getProductBySlug(slug),
    getSettings(),
    getActiveProducts(),
  ]);
  if (!product || !product.active) notFound();

  const contact = { ...DEFAULT_CONTACT, ...(s.contact as Partial<ContactSettings>) };
  const phone = contact.phones[0] ?? "09033253065";
  const related = all
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);
  const relatedFinal =
    related.length > 0 ? related : all.filter((p) => p.id !== product.id).slice(0, 3);

  const paragraphs = product.description
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="flex items-center gap-1 transition-colors hover:text-accent">
          <Home size={13} /> خانه
        </Link>
        <ChevronLeft size={13} />
        <Link href="/products" className="transition-colors hover:text-accent">
          محصولات
        </Link>
        <ChevronLeft size={13} />
        <Link
          href={`/products?cat=${product.category}`}
          className="transition-colors hover:text-accent"
        >
          {product.categoryLabel}
        </Link>
        <ChevronLeft size={13} />
        <span className="font-bold text-ink">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* gallery */}
        <Reveal className="relative">
          <div className="card overflow-hidden !rounded-[2rem] bg-card">
            {product.badge && (
              <span className="absolute top-5 right-5 z-10 rounded-full bg-gradient-to-l from-accent2 to-accent px-4 py-2 text-xs font-extrabold text-on-accent shadow-lg shadow-accent/25">
                {product.badge}
              </span>
            )}
            <div className="relative aspect-square w-full bg-surface/30 p-6 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0] ?? "/images/products/foam-bottle.png"}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3 border-t border-line bg-surface p-4 overflow-x-auto">
                {product.images.map((im, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={im}
                    alt={`${product.name} — تصویر ${toFa(i + 1)}`}
                    className="size-16 rounded-xl border border-line object-contain bg-card p-1 shrink-0"
                  />
                ))}
              </div>
            )}
          </div>
        </Reveal>

        {/* info */}
        <div>
          <Reveal>
            <span className="inline-block rounded-full border border-line px-3.5 py-1.5 text-[11px] font-bold text-muted">
              {product.categoryLabel}
            </span>
            <h1 className="mt-4 text-3xl font-black leading-snug tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="mt-2 text-sm text-muted">{product.subtitle}</p>
            )}
          </Reveal>

          <Reveal delay={80}>
            <div className="card mt-7 p-6 space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-muted">قیمت بسته (عمده)</p>
                  <p className="mt-1.5 text-4xl font-black tracking-tight text-accent">
                    {formatPrice(product.price)}
                    <span className="mr-2 text-sm font-bold text-muted">تومان</span>
                  </p>
                  {product.unitPrice && (
                    <p className="mt-2 text-xs font-bold text-muted">{product.unitPrice}</p>
                  )}
                </div>
                {product.inStock ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-400">
                    <PackageCheck size={15} /> موجود — آماده ارسال
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-rose-400/10 px-4 py-2 text-xs font-bold text-rose-400">
                    <PackageX size={15} /> برای موجودی تماس بگیرید
                  </span>
                )}
              </div>

              {/* Add to cart action with quantity selector */}
              <div className="border-t border-line pt-6">
                <AddToCartButton product={product} size="lg" showQty={true} />
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={telHref(phone)}
                  className="btn btn-ghost h-12 flex-1 text-xs font-bold"
                >
                  <Phone size={16} />
                  مشاوره و سفارش تلفنی — {toFa(phone)}
                </a>
              </div>
              <p className="text-center text-[11px] leading-5 text-muted">
                امکان ثبت مستقیم سفارش و دریافت کد رهگیری آنی، یا تماس تلفنی جهت سفارش عمده.
              </p>

              <div className="grid grid-cols-3 gap-2 border-t border-line pt-5 text-center">
                {[
                  { icon: Truck, t: "ارسال سراسری" },
                  { icon: BadgeCheck, t: "قیمت همکاری" },
                  { icon: Box, t: "بسته‌بندی شکیل" },
                ].map((x) => (
                  <div key={x.t} className="flex flex-col items-center gap-1.5 py-1">
                    <x.icon size={18} className="text-accent" />
                    <span className="text-[10px] text-muted">{x.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {product.contents.length > 0 && (
            <Reveal delay={140}>
              <div className="card mt-5 p-6">
                <h2 className="text-sm font-extrabold">محتویات بسته</h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {product.contents.map((c, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13px] text-muted">
                      <CircleCheck size={15} className="shrink-0 text-accent" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}

          {product.features.length > 0 && (
            <Reveal delay={200}>
              <div className="card mt-5 p-6">
                <h2 className="text-sm font-extrabold">ویژگی‌های کلیدی</h2>
                <ul className="mt-4 space-y-2.5">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] leading-6 text-muted">
                      <CircleCheck size={15} className="mt-1 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}
        </div>
      </div>

      {/* description */}
      {paragraphs.length > 0 && (
        <Reveal className="mt-16">
          <div className="card p-7 sm:p-10">
            <h2 className="flex items-center gap-3 text-xl font-black">
              <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-accent2 to-accent" />
              توضیحات محصول
            </h2>
            <div className="mt-6 space-y-5 text-[14px] leading-8 text-muted">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* related */}
      {relatedFinal.length > 0 && (
        <section className="mt-20">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-black tracking-tight">محصولات مرتبط</h2>
            <Link
              href="/products"
              className="flex items-center gap-1.5 text-xs font-bold text-muted transition-colors hover:text-accent"
            >
              همه محصولات <ArrowLeft size={14} />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedFinal.map((p) => (
              <ProductCard key={p.id} product={p} phone={phone} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
