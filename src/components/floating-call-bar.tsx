"use client";

import { usePathname } from "next/navigation";
import { Phone, ShoppingBag } from "lucide-react";
import { telHref, toFa } from "@/lib/format";
import { useCart } from "@/context/cart-context";

export function FloatingCallBar({ phone }: { phone: string }) {
  const pathname = usePathname();
  const { totalCount, openCart } = useCart();

  if (pathname.startsWith("/akma-secret-admin") || pathname.startsWith("/checkout")) return null;

  return (
    <div className="fixed bottom-5 inset-x-4 z-50 flex items-center justify-between gap-2.5 sm:hidden">
      <button
        onClick={openCart}
        className="btn btn-primary pulse-ring flex-1 h-13 rounded-2xl px-4 text-xs font-black shadow-2xl justify-between"
      >
        <span className="flex items-center gap-2">
          <ShoppingBag size={18} />
          <span>سبد خرید و ثبت سفارش</span>
        </span>
        {totalCount > 0 && (
          <span className="rounded-full bg-on-accent px-2 py-0.5 text-[11px] font-black text-accent">
            {toFa(totalCount)} کالا
          </span>
        )}
      </button>

      {phone && (
        <a
          href={telHref(phone)}
          className="btn btn-ghost grid size-13 shrink-0 place-items-center rounded-2xl border border-line bg-card/90 text-accent shadow-xl backdrop-blur"
          aria-label="تماس با پشتیبانی"
          title="پشتیبانی تلفنی"
        >
          <Phone size={19} />
        </a>
      )}
    </div>
  );
}
