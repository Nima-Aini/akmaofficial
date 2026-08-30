"use client";

import Link from "next/link";
import { ArrowLeft, PackageCheck, PackageX, Phone } from "lucide-react";
import { formatPrice, telHref } from "@/lib/format";
import { AddToCartButton } from "./add-to-cart-button";
import type { ProductRow } from "@/db/schema";

export function ProductCard({
  product,
  phone,
  delay = 0,
}: {
  product: ProductRow;
  phone?: string;
  delay?: number;
}) {
  const img = product.images[0] ?? "/images/products/foam-bottle.png";
  return (
    <article
      className="card card-hover group relative flex h-full flex-col overflow-hidden"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {product.badge && (
        <span className="absolute top-4 right-4 z-10 rounded-full bg-gradient-to-l from-accent2 to-accent px-3.5 py-1.5 text-[11px] font-extrabold text-on-accent shadow-lg shadow-accent/25">
          {product.badge}
        </span>
      )}

      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden bg-surface/30 p-4 flex items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </Link>

      <div className="flex grow flex-col gap-3 p-5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="rounded-full border border-line px-2.5 py-1 text-muted">
            {product.categoryLabel}
          </span>
          {product.inStock ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <PackageCheck size={13} /> موجود
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-400">
              <PackageX size={13} /> تماس بگیرید
            </span>
          )}
        </div>

        <Link href={`/products/${product.slug}`}>
          <h3 className="text-[15px] font-extrabold leading-7 transition-colors group-hover:text-accent">
            {product.name}
          </h3>
        </Link>
        {product.subtitle && (
          <p className="-mt-1.5 line-clamp-2 text-xs text-muted">{product.subtitle}</p>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-line pt-4">
          <div>
            <p className="text-2xl font-black tracking-tight text-accent">
              {formatPrice(product.price)}
              <span className="mr-1.5 text-xs font-bold text-muted">تومان</span>
            </p>
            {product.unitPrice && (
              <p className="mt-1 text-[11px] text-muted">{product.unitPrice}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <AddToCartButton product={product} size="md" />
          <div className="flex items-center gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="btn btn-ghost h-10 flex-1 text-xs"
            >
              مشاهده و خرید
              <ArrowLeft size={14} />
            </Link>
            {phone && (
              <a
                href={telHref(phone)}
                className="btn btn-ghost grid size-10 place-items-center rounded-xl text-muted hover:text-accent"
                aria-label={`تماس برای ${product.name}`}
                title="سفارش تلفنی"
              >
                <Phone size={15} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
