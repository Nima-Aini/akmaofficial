import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Headphones,
  ShieldCheck,
  Truck,
  Sparkle,
  Phone,
  Layers,
  ChevronLeft,
} from "lucide-react";
import { getActiveProducts, getSettings } from "@/lib/store";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CONTACT,
  DEFAULT_DUAL_CARDS,
  DEFAULT_FEATURES,
  DEFAULT_HERO,
  DEFAULT_SECTION_TITLES,
  DEFAULT_SITE,
  DEFAULT_WHOLESALE_PROMO,
  type CategoryItem,
  type ContactSettings,
  type DualCardsSettings,
  type Feature,
  type HeroSettings,
  type SectionTitles,
  type SiteSettings,
  type WholesalePromoSettings,
} from "@/lib/defaults";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [s, products] = await Promise.all([getSettings(), getActiveProducts()]);

  const hero = { ...DEFAULT_HERO, ...(s.hero as Partial<HeroSettings>) };
  const dualCards: DualCardsSettings = {
    retail: { ...DEFAULT_DUAL_CARDS.retail, ...(s.dualCards as Partial<DualCardsSettings>)?.retail },
    wholesale: { ...DEFAULT_DUAL_CARDS.wholesale, ...(s.dualCards as Partial<DualCardsSettings>)?.wholesale },
  };
  const categories: CategoryItem[] = (s.categories as CategoryItem[]) || DEFAULT_CATEGORIES;
  const wholesalePromo: WholesalePromoSettings = {
    ...DEFAULT_WHOLESALE_PROMO,
    ...(s.wholesalePromo as Partial<WholesalePromoSettings>),
  };
  const contact = { ...DEFAULT_CONTACT, ...(s.contact as Partial<ContactSettings>) };
  const phone = contact.phones[0] ?? "09033253065";

  // Showcase 4 featured bestseller items matching reference panel
  const featured = products.filter((p) => p.featured);
  const showcase = featured.length >= 4 ? featured.slice(0, 4) : products.slice(0, 4);

  return (
    <div className="bg-[#FAF8F5] text-[#1C1816] min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 pt-6">

        {/* ================= 1. HERO SECTION (MATCHING LEFT REFERENCE PANEL) ================= */}
        <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-r from-[#4A0811] via-[#750E1B] to-[#991424] text-white shadow-xl">
          <div className="grid lg:grid-cols-12 items-center gap-8 p-6 sm:p-10 lg:p-14 relative z-10">
            {/* Left Content Area (Right in RTL) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-1.5 text-xs font-bold text-white/90 backdrop-blur-xs border border-white/10">
                <span className="size-2 rounded-full bg-[#E53E3E] animate-pulse" />
                {hero.badge}
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.2] tracking-tight">
                {hero.title}{" "}
                <span className="text-[#FF6B78] drop-shadow-sm block sm:inline mt-1 sm:mt-0">
                  {hero.highlight}
                </span>
              </h1>

              <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {hero.subtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Link
                  href={hero.primaryCta.href || "/products"}
                  className="inline-flex items-center gap-3 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white border border-white/20 px-8 py-3.5 text-sm font-black shadow-lg shadow-black/25 transition-transform active:scale-95"
                >
                  <ArrowRight size={17} className="rotate-180" />
                  <span>{hero.primaryCta.label || "مشاهده محصولات"}</span>
                </Link>

                <Link
                  href={hero.secondaryCta.href || "/products?mode=wholesale"}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 text-sm font-bold backdrop-blur-xs transition-colors"
                >
                  <span>{hero.secondaryCta.label || "خرید عمده و همکاری"}</span>
                </Link>
              </div>
            </div>

            {/* Right Image Composition (Left in RTL) */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero.image || "/images/redesign/hero.jpg"}
                  alt="مراقبت از کفش آکما"
                  className="size-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Dots Indicator in bottom corner */}
          <div className="absolute bottom-4 left-6 hidden sm:flex items-center gap-1.5 z-20">
            <span className="size-2 rounded-full bg-white" />
            <span className="size-2 rounded-full bg-white/40" />
            <span className="size-2 rounded-full bg-white/40" />
          </div>
        </section>

        {/* ================= 2. MINI TICKER / TRUST STRIP UNDER HERO ================= */}
        <section className="bg-white rounded-2xl border border-[#E7E3DC] p-3 sm:p-4 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#F0ECE4]">
            <div className="flex items-center justify-center gap-2.5 py-1 text-xs font-black text-[#2A2421]">
              <Headphones size={17} className="text-[#8E111E]" />
              <span>پشتیبانی تخصصی قبل و بعد خرید</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 py-1 text-xs font-black text-[#2A2421]">
              <CreditCard size={17} className="text-[#8E111E]" />
              <span>پرداخت امن و سریع آنلاین</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 py-1 text-xs font-black text-[#2A2421]">
              <Truck size={17} className="text-[#8E111E]" />
              <span>ارسال سریع به سراسر کشور</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 py-1 text-xs font-black text-[#2A2421]">
              <ShieldCheck size={17} className="text-[#8E111E]" />
              <span>ضمانت اصالت محصولات آکما</span>
            </div>
          </div>
        </section>

        {/* ================= 3. DUAL ACTION CARDS (RETAIL VS. WHOLESALE) ================= */}
        <section className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* RETAIL CARD: خرید تکی */}
          <div className="relative overflow-hidden rounded-[2rem] border border-[#E7E3DC] bg-white p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="grid sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-7 space-y-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#8E111E]">
                    {dualCards.retail.title}
                  </h2>
                  <p className="text-xs font-bold text-[#8C827A] mt-1">
                    {dualCards.retail.subtitle}
                  </p>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {dualCards.retail.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs font-bold text-[#2A2421]">
                      <span className="grid size-4 place-items-center rounded-full bg-[#8E111E]/10 text-[#8E111E]">
                        <CheckCircle2 size={13} strokeWidth={2.5} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <Link
                    href={dualCards.retail.buttonHref || "/products?mode=retail"}
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white px-6 py-3 text-xs font-black shadow-md shadow-[#8E111E]/20 transition-transform active:scale-95"
                  >
                    <ArrowRight size={15} className="rotate-180" />
                    <span>{dualCards.retail.buttonText}</span>
                  </Link>
                </div>
              </div>

              <div className="sm:col-span-5 flex justify-center">
                <div className="relative aspect-square w-full max-w-[200px] rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E7E3DC] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dualCards.retail.image || "/images/redesign/retail-card.jpg"}
                    alt="خرید تکی آکما"
                    className="size-full object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* WHOLESALE CARD: خرید عمده */}
          <div className="relative overflow-hidden rounded-[2rem] border border-[#E7E3DC] bg-white p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="grid sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-7 space-y-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#8E111E]">
                    {dualCards.wholesale.title}
                  </h2>
                  <p className="text-xs font-bold text-[#8C827A] mt-1">
                    {dualCards.wholesale.subtitle}
                  </p>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {dualCards.wholesale.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs font-bold text-[#2A2421]">
                      <span className="grid size-4 place-items-center rounded-full bg-[#8E111E]/10 text-[#8E111E]">
                        <CheckCircle2 size={13} strokeWidth={2.5} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <Link
                    href={dualCards.wholesale.buttonHref || "/products?mode=wholesale"}
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white px-6 py-3 text-xs font-black shadow-md shadow-[#8E111E]/20 transition-transform active:scale-95"
                  >
                    <ArrowRight size={15} className="rotate-180" />
                    <span>{dualCards.wholesale.buttonText}</span>
                  </Link>
                </div>
              </div>

              <div className="sm:col-span-5 flex justify-center">
                <div className="relative aspect-square w-full max-w-[200px] rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E7E3DC] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dualCards.wholesale.image || "/images/redesign/wholesale-boxes.jpg"}
                    alt="خرید عمده آکما"
                    className="size-full object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. BENEFITS 4-GRID ================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              icon: CreditCard,
              title: "پرداخت امن",
              desc: "درگاه معتبر بانکی و تسویه آنلاین",
            },
            {
              icon: Headphones,
              title: "پشتیبانی تخصصی",
              desc: "قبل و بعد از خرید در تمام ساعات",
            },
            {
              icon: ShieldCheck,
              title: "ضمانت اصالت",
              desc: "محصولات اصلی با فرمولاسیون آکما",
            },
            {
              icon: Truck,
              title: "ارسال سریع",
              desc: "به سراسر کشور با تیپاکس و پست",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-[#E7E3DC] shadow-xs"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-[#8E111E]/10 text-[#8E111E] mb-3">
                <item.icon size={26} strokeWidth={2.2} />
              </span>
              <h3 className="text-sm font-black text-[#1C1816]">{item.title}</h3>
              <p className="text-[11px] font-medium text-[#8C827A] mt-1">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* ================= 5. CATEGORIES SECTION (MATCHING REFERENCE) ================= */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1816]">
              دسته‌بندی محصولات
            </h2>
            <p className="text-xs text-[#8C827A] font-bold">
              همه آنچه برای مراقبت از کفش نیاز دارید
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                href={cat.href || `/products?cat=${cat.key}`}
                className="group flex flex-col items-center rounded-2xl border border-[#E7E3DC] bg-white p-4 text-center shadow-xs transition-all hover:-translate-y-1 hover:border-[#8E111E]/40 hover:shadow-md"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FAF8F5] p-3 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="size-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <span className="text-xs font-black text-[#2A2421] group-hover:text-[#8E111E] transition-colors">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ================= 6. FEATURED BESTSELLERS SECTION ================= */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1816]">
              محصولات پرفروش آکما
            </h2>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E3DC] bg-white px-4 py-2 text-xs font-black text-[#8E111E] hover:bg-[#FAF8F5] transition-colors"
            >
              <span>مشاهده همه</span>
              <ChevronLeft size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {showcase.map((product) => (
              <ProductCard key={product.id} product={product} mode="retail" />
            ))}
          </div>
        </section>

        {/* ================= 7. LOWER WHOLESALE COLLABORATION BANNER ================= */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#4A0811] via-[#6B0C17] to-[#8E111E] text-white p-8 sm:p-12 shadow-xl">
          <div className="grid lg:grid-cols-12 items-center gap-8">
            <div className="lg:col-span-8 space-y-4 text-center lg:text-right">
              <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                {wholesalePromo.title}
              </h2>
              <p className="text-sm text-white/80 max-w-2xl font-medium">
                {wholesalePromo.subtitle}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                {wholesalePromo.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 text-xs font-bold text-white/90 bg-black/20 px-3.5 py-1.5 rounded-full border border-white/10"
                  >
                    <CheckCircle2 size={14} className="text-[#FF6B78]" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>

              <div className="pt-3">
                <Link
                  href={wholesalePromo.buttonHref || "/products?mode=wholesale"}
                  className="inline-flex items-center gap-2.5 rounded-full bg-white text-[#8E111E] hover:bg-[#FAF8F5] px-8 py-3.5 text-xs font-black shadow-lg transition-transform active:scale-95"
                >
                  <ArrowRight size={15} className="rotate-180 text-[#8E111E]" />
                  <span>{wholesalePromo.buttonText}</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="relative aspect-[4/3] w-full max-w-sm rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={wholesalePromo.image || "/images/redesign/wholesale-banner.jpg"}
                  alt="همکاری عمده با آکما"
                  className="size-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
