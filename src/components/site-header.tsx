"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  ShoppingBag,
  User,
  Heart,
  ChevronDown,
  Layers,
  Sparkle,
  Phone,
  Search,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { toFa } from "@/lib/format";

type CategoryNav = {
  key: string;
  label: string;
  image?: string;
  href: string;
};

const CATEGORIES_LIST: CategoryNav[] = [
  { key: "foam", label: "تمیزکننده کفش", image: "/images/redesign/cat-foam.jpg", href: "/products?cat=foam" },
  { key: "wax", label: "واکس و براق کننده", image: "/images/redesign/cat-wax.jpg", href: "/products?cat=wax" },
  { key: "freshener", label: "بوگیر کفش", image: "/images/redesign/cat-spray.jpg", href: "/products?cat=freshener" },
  { key: "tools", label: "ابزار و لوازم جانبی", image: "/images/redesign/cat-tools.jpg", href: "/products?cat=tools" },
  { key: "bundle", label: "پک‌های ویژه و استند", image: "/images/redesign/cat-packs.jpg", href: "/products?cat=bundle" },
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [customer, setCustomer] = useState<{ name?: string; phone?: string } | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { totalCount, openCart } = useCart();
  const catMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check customer session
    fetch("/api/customer/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.customer) {
          setCustomer(data.customer);
        }
      })
      .catch(() => {});

    // Saved wishlist items in localStorage
    try {
      const saved = localStorage.getItem("akma_wishlist");
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          queueMicrotask(() => setWishlistCount(list.length));
        }
      }
    } catch {}

    const handleOutside = (e: MouseEvent) => {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) {
        setCatMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const navLinks = [
    { label: "خانه", href: "/" },
    { label: "محصولات", href: "/products" },
    { label: "خرید عمده", href: "/products?mode=wholesale", highlight: true },
    { label: "درباره ما", href: "/#about-us" },
    { label: "مقالات", href: "/blog" },
    { label: "تماس با ما", href: "/contact" },
  ];

  return (
    <>
      <header className="sticky top-0 right-0 left-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E3DC] transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
            {/* RIGHT SIDE: Category Dropdown & Navigation Links */}
            <div className="flex items-center gap-6">
              {/* Category Pill Button (Matching Reference) */}
              <div className="relative" ref={catMenuRef}>
                <button
                  type="button"
                  onClick={() => setCatMenuOpen(!catMenuOpen)}
                  className="hidden md:inline-flex items-center gap-2.5 rounded-full bg-[#8E111E] hover:bg-[#780E19] text-white px-5 py-2.5 text-xs font-black shadow-md shadow-[#8E111E]/20 transition-transform active:scale-95"
                >
                  <Menu size={16} strokeWidth={2.5} />
                  <span>دسته‌بندی محصولات</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${catMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Category Dropdown Menu */}
                {catMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[#E7E3DC] bg-white p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="px-3 py-1.5 text-[11px] font-bold text-[#8C827A]">
                      دسته‌بندی‌های مراقبت از کفش
                    </p>
                    <div className="mt-1 space-y-1">
                      {CATEGORIES_LIST.map((cat) => (
                        <Link
                          key={cat.key}
                          href={cat.href}
                          onClick={() => setCatMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#2A2421] hover:bg-[#FAF6F0] hover:text-[#8E111E] transition-colors"
                        >
                          {cat.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cat.image}
                              alt={cat.label}
                              className="size-8 rounded-lg object-cover border border-[#E7E3DC]"
                            />
                          ) : (
                            <span className="grid size-8 place-items-center rounded-lg bg-[#8E111E]/10 text-[#8E111E]">
                              <Layers size={15} />
                            </span>
                          )}
                          <span>{cat.label}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-2 border-t border-[#E7E3DC] pt-2">
                      <Link
                        href="/products"
                        onClick={() => setCatMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-1.5 text-[11px] font-black text-[#8E111E] hover:underline"
                      >
                        <span>مشاهده کل کاتالوگ</span>
                        <span>←</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Menu */}
              <nav className="hidden lg:flex items-center gap-5">
                {navLinks.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative text-xs font-extrabold transition-colors py-1 ${
                        isActive
                          ? "text-[#8E111E]"
                          : item.highlight
                            ? "text-[#8E111E] hover:text-[#6E0A15]"
                            : "text-[#4A423D] hover:text-[#1F1916]"
                      }`}
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute -bottom-1 right-0 left-0 h-0.5 rounded-full bg-[#8E111E]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* CENTER: AKMA BRAND LOGO */}
            <div className="flex-1 flex justify-center">
              <Link href="/" className="group flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex items-center justify-center">
                    <span className="font-black text-2xl tracking-tighter text-[#1C1816] group-hover:text-[#8E111E] transition-colors font-sans">
                      AKMA
                    </span>
                    <span className="absolute -top-1.5 -right-2 text-[#8E111E]">
                      <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                        <path
                          d="M1 11C4 3 11 1 17 4C13 4 8 6 6 11H1Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </span>
                </div>
                <span className="text-[9px] font-black tracking-[0.25em] text-[#8E111E] -mt-1">
                  آکــمـا
                </span>
              </Link>
            </div>

            {/* LEFT SIDE: User, Wishlist, Cart & Mobile Trigger */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Account Link */}
              <Link
                href="/account"
                title={customer?.name ? `حساب کاربری: ${customer.name}` : "ورود یا ثبت‌نام"}
                className="group relative grid size-10 place-items-center rounded-full border border-[#E7E3DC] bg-white text-[#4A423D] hover:border-[#8E111E] hover:text-[#8E111E] shadow-xs transition-colors"
                aria-label="حساب کاربری"
              >
                <User size={18} strokeWidth={2.2} />
                {customer && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </Link>

              {/* Wishlist Link */}
              <Link
                href="/products"
                title="علاقه‌مندی‌ها"
                className="relative hidden sm:grid size-10 place-items-center rounded-full border border-[#E7E3DC] bg-white text-[#4A423D] hover:border-[#8E111E] hover:text-[#8E111E] shadow-xs transition-colors"
                aria-label="علاقه‌مندی‌ها"
              >
                <Heart size={18} strokeWidth={2.2} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#8E111E] text-[10px] font-black text-white">
                    {toFa(wishlistCount)}
                  </span>
                )}
              </Link>

              {/* Cart Drawer Trigger Button (Matching Reference with red badge) */}
              <button
                type="button"
                onClick={openCart}
                className="relative grid size-10 place-items-center rounded-full border border-[#E7E3DC] bg-white text-[#4A423D] hover:border-[#8E111E] hover:text-[#8E111E] shadow-xs transition-colors"
                aria-label="سبد خرید"
              >
                <ShoppingBag size={18} strokeWidth={2.2} />
                {totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 grid min-w-5 h-5 px-1 place-items-center rounded-full bg-[#8E111E] text-[11px] font-black text-white shadow-md shadow-[#8E111E]/40 animate-pulse">
                    {toFa(totalCount)}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-label="منو موبایل"
                className="grid size-10 place-items-center rounded-full border border-[#E7E3DC] bg-white text-[#2A2421] lg:hidden"
              >
                {open ? <X size={19} /> : <Menu size={19} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drop */}
        {open && (
          <div className="border-t border-[#E7E3DC] bg-white px-5 py-4 shadow-xl lg:hidden animate-in slide-in-from-top-3 duration-200">
            {/* Quick Mode Toggle for Mobile */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-1 rounded-xl bg-[#FAF8F5] border border-[#E7E3DC]">
              <Link
                href="/products?mode=retail"
                onClick={() => setOpen(false)}
                className="py-2 text-center rounded-lg text-xs font-bold bg-white text-[#2A2421] shadow-xs"
              >
                خرید تکی
              </Link>
              <Link
                href="/products?mode=wholesale"
                onClick={() => setOpen(false)}
                className="py-2 text-center rounded-lg text-xs font-bold bg-[#8E111E] text-white"
              >
                خرید عمده
              </Link>
            </div>

            <nav className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-black text-[#4A423D] hover:bg-[#FAF8F5] hover:text-[#8E111E]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 pt-3 border-t border-[#E7E3DC] flex items-center justify-between text-xs font-bold text-[#8C827A]">
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 text-[#8E111E]"
              >
                <User size={15} />
                {customer ? customer.name || "حساب کاربری" : "ورود یا عضویت"}
              </Link>
              <a href={`tel:${phone}`} className="flex items-center gap-1 text-[#2A2421]">
                <Phone size={14} />
                <span>{toFa(phone)}</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
