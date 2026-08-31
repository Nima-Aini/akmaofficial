"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Phone, X, Sparkle, ShoppingBag, SearchCheck } from "lucide-react";
import { telHref, toFa } from "@/lib/format";
import { useCart } from "@/context/cart-context";

const NAV = [
  { label: "خانه", href: "/" },
  { label: "محصولات", href: "/products" },
  { label: "قیمت واحد", href: "/#price-table" },
  { label: "راهنمای سفارش", href: "/#how-to-order" },
  { label: "پیگیری سفارش", href: "/track" },
  { label: "تماس با ما", href: "/contact" },
];

export function SiteHeader({
  name,
  latin,
  phone,
}: {
  name: string;
  latin: string;
  phone: string;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalCount, openCart } = useCart();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
          scrolled
            ? "backdrop-blur-xl bg-bg/80 border-b border-line"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex h-[72px] items-center justify-between gap-4">
            <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-accent2 to-accent text-on-accent shadow-lg shadow-accent/20 transition-transform duration-300 group-hover:rotate-6">
                <Sparkle size={20} strokeWidth={2.2} />
              </span>
              <span className="leading-none">
                <span className="block text-xl font-black">{name}</span>
                <span className="block text-[10px] font-bold tracking-[0.35em] text-muted">
                  {latin}
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="link-underline text-sm font-medium text-muted transition-colors hover:text-ink"
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2.5">
              {/* Cart Drawer Trigger Button */}
              <button
                onClick={openCart}
                className="relative grid size-11 place-items-center rounded-2xl border border-line bg-card/80 text-ink transition-colors hover:border-accent hover:text-accent"
                aria-label="سبد خرید"
              >
                <ShoppingBag size={19} />
                {totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-black text-on-accent shadow-md shadow-accent/30 animate-pulse">
                    {toFa(totalCount)}
                  </span>
                )}
              </button>

              <a
                href={telHref(phone)}
                className="btn btn-primary hidden h-11 px-5 text-sm sm:inline-flex"
              >
                <Phone size={16} />
                <span className="font-extrabold">{toFa(phone)}</span>
              </a>

              <button
                onClick={() => setOpen(!open)}
                aria-label="منو"
                className="btn btn-ghost grid size-11 place-items-center !rounded-2xl lg:hidden"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* mobile drawer */}
        <div
          className={`overflow-hidden border-b border-line bg-bg/95 backdrop-blur-xl transition-all duration-500 lg:hidden ${
            open ? "max-h-[460px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-1 px-5 py-4">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-muted transition-colors hover:bg-card hover:text-ink"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  openCart();
                }}
                className="btn btn-ghost h-12 flex-1 text-sm border border-line"
              >
                <ShoppingBag size={16} className="text-accent" />
                سبد خرید ({toFa(totalCount)})
              </button>
              <Link
                href="/track"
                onClick={() => setOpen(false)}
                className="btn btn-ghost h-12 flex-1 text-sm border border-line"
              >
                <SearchCheck size={16} className="text-accent" />
                پیگیری
              </Link>
            </div>
            <a href={telHref(phone)} onClick={() => setOpen(false)} className="btn btn-primary mt-2 h-12 text-sm">
              <Phone size={16} />
              سفارش تلفنی — {toFa(phone)}
            </a>
          </nav>
        </div>
      </header>
      <div className="h-[72px]" />
    </>
  );
}
