import Link from "next/link";
import { ArrowLeft, Phone, PackageCheck, PackageX } from "lucide-react";
import { formatPrice, telHref } from "@/lib/format";
import type { ProductRow } from "@/db/schema";

export function ProductCard({
  product,
  phone,
  delay = 0,
}: {
  product: ProductRow;
  phone: string;
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
        className="relative block aspect-square w-full overflow-hidden bg-surface"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
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
          <p className="-mt-1.5 text-xs text-muted">{product.subtitle}</p>
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

        <div className="flex gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="btn btn-ghost h-11 flex-1 text-xs"
          >
            جزئیات
            <ArrowLeft size={14} />
          </Link>
          <a
            href={telHref(phone)}
            className="btn btn-primary h-11 flex-[1.4] text-xs"
            aria-label={`سفارش تلفنی ${product.name}`}
          >
            <Phone size={14} />
            سفارش تلفنی
          </a>
        </div>
      </div>
    </article>
  );
}
