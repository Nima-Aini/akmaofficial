import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Headphones,
  ShieldCheck,
  Truck,
  ChevronLeft,
} from "lucide-react";
import { getActiveProducts, getSettings } from "@/lib/store";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_BANNERS,
  DEFAULT_BOTTOM_BANNERS,
  DEFAULT_DUAL_CARDS,
  DEFAULT_HERO,
  DEFAULT_WHOLESALE_PROMO,
  DEFAULT_FEATURES,
  DEFAULT_SECTION_TITLES,
  type CategoryItem,
  type Banner,
  type BottomBanner,
  type DualCardsSettings,
  type HeroSettings,
  type WholesalePromoSettings,
  type Feature,
  type SectionTitles,
} from "@/lib/defaults";
import { ProductCard } from "@/components/product-card";
import {
  ResponsiveBannerContent,
  ResponsiveBannerMedia,
  ResponsiveTextRegionBackdrop,
} from "@/components/responsive-banner";
import { RichText } from "@/components/rich-text";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [s, products] = await Promise.all([getSettings(), getActiveProducts()]);

  const hero = { ...DEFAULT_HERO, ...(s.hero as Partial<HeroSettings>) };
  const dualCards: DualCardsSettings = {
    retail: { ...DEFAULT_DUAL_CARDS.retail, ...(s.dualCards as Partial<DualCardsSettings>)?.retail },
    wholesale: { ...DEFAULT_DUAL_CARDS.wholesale, ...(s.dualCards as Partial<DualCardsSettings>)?.wholesale },
  };
  const categories: CategoryItem[] = (s.categories as CategoryItem[]) || DEFAULT_CATEGORIES;
  const banners: Banner[] = ((s.banners as Banner[]) || DEFAULT_BANNERS).filter((banner) => banner.enabled);
  const bottomBanners: BottomBanner[] = ((s.bottomBanners as BottomBanner[]) || DEFAULT_BOTTOM_BANNERS).filter((banner) => banner.enabled);
  const wholesalePromo: WholesalePromoSettings = {
    ...DEFAULT_WHOLESALE_PROMO,
    ...(s.wholesalePromo as Partial<WholesalePromoSettings>),
  };
  const features = (s.features as Feature[]) ?? DEFAULT_FEATURES;
  const sectionTitles = { ...DEFAULT_SECTION_TITLES, ...(s.sectionTitles as Partial<SectionTitles>) };

  // Showcase 4 featured bestseller items matching reference panel
  const featured = products.filter((p) => p.featured);
  const showcase = featured.length >= 4 ? featured.slice(0, 4) : products.slice(0, 4);

  return (
    <div className="bg-[#FAF8F5] text-[#1C1816] min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 pt-6">

        {/* ================= 1. HERO SECTION (MATCHING LEFT REFERENCE PANEL) ================= */}
        <section className="relative isolate min-h-[500px] overflow-hidden rounded-[2rem] bg-[#4A0811] text-white shadow-xl md:min-h-[460px] sm:rounded-[2.5rem]">
          <ResponsiveBannerMedia settings={hero} fallback="/images/redesign/hero.jpg" alt="" priority />
          <span aria-hidden="true" className="absolute inset-0 z-0 bg-black/10" />
          <ResponsiveTextRegionBackdrop settings={hero} />
          <ResponsiveBannerContent settings={hero} className="min-h-[500px] p-5 sm:p-10 md:min-h-[460px] lg:p-14">
            <div className="space-y-5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-1.5 text-xs font-bold text-white/90 backdrop-blur-xs border border-white/10">
                <span className="size-2 rounded-full bg-[#E53E3E] animate-pulse" />
                <RichText value={hero.badgeRichText} fallback={hero.badge} />
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.2] tracking-tight">
                <RichText value={hero.titleRichText} fallback={hero.title} />{" "}
                <span className="text-[#FF6B78] drop-shadow-sm block sm:inline mt-1 sm:mt-0">
                  <RichText value={hero.highlightRichText} fallback={hero.highlight} />
                </span>
              </h1>

              <p className="max-w-xl text-sm font-medium leading-relaxed text-white/90 sm:text-base">
                <RichText value={hero.subtitleRichText} fallback={hero.subtitle} />
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={hero.primaryCta.href || "/products"}
                  className="inline-flex items-center gap-3 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white border border-white/20 px-8 py-3.5 text-sm font-black shadow-lg shadow-black/25 transition-transform active:scale-95"
                >
                  <ArrowRight size={17} className="rotate-180" />
                  <RichText value={hero.primaryCta.labelRichText} fallback={hero.primaryCta.label || "مشاهده محصولات"} />
                </Link>

                <Link
                  href={hero.secondaryCta.href || "/products?mode=wholesale"}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 text-sm font-bold backdrop-blur-xs transition-colors"
                >
                  <RichText value={hero.secondaryCta.labelRichText} fallback={hero.secondaryCta.label || "خرید عمده و همکاری"} />
                </Link>
              </div>
            </div>
          </ResponsiveBannerContent>

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
          <div className="relative isolate min-h-[360px] overflow-hidden rounded-[2rem] border border-white/60 shadow-md transition-shadow hover:shadow-xl">
            <ResponsiveBannerMedia settings={dualCards.retail} fallback="/images/redesign/retail-card.jpg" />
            <ResponsiveTextRegionBackdrop settings={dualCards.retail} />
            <ResponsiveBannerContent settings={dualCards.retail} className="min-h-[360px] p-6 sm:p-8">
              <div className="space-y-4 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
                <div>
                  <h2 className="text-2xl font-black sm:text-3xl">
                    <RichText value={dualCards.retail.titleRichText} fallback={dualCards.retail.title} />
                  </h2>
                  <p className="mt-1 text-xs font-bold text-white/80">
                    <RichText value={dualCards.retail.subtitleRichText} fallback={dualCards.retail.subtitle} />
                  </p>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {dualCards.retail.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs font-bold text-white/95">
                      <span className="grid size-4 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm">
                        <CheckCircle2 size={13} strokeWidth={2.5} />
                      </span>
                      <RichText value={dualCards.retail.checklistRichTextList?.[idx]} fallback={item} />
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <Link
                    href={dualCards.retail.buttonHref || "/products?mode=retail"}
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white px-6 py-3 text-xs font-black shadow-md shadow-[#8E111E]/20 transition-transform active:scale-95"
                  >
                    <ArrowRight size={15} className="rotate-180" />
                    <RichText value={dualCards.retail.buttonTextRichText} fallback={dualCards.retail.buttonText} />
                  </Link>
                </div>
              </div>
            </ResponsiveBannerContent>

          </div>

          {/* WHOLESALE CARD: خرید عمده */}
          <div className="relative isolate min-h-[360px] overflow-hidden rounded-[2rem] border border-white/60 shadow-md transition-shadow hover:shadow-xl">
            <ResponsiveBannerMedia settings={dualCards.wholesale} fallback="/images/redesign/wholesale-boxes.jpg" />
            <ResponsiveTextRegionBackdrop settings={dualCards.wholesale} />
            <ResponsiveBannerContent settings={dualCards.wholesale} className="min-h-[360px] p-6 sm:p-8">
              <div className="space-y-4 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
                <div>
                  <h2 className="text-2xl font-black sm:text-3xl">
                    <RichText value={dualCards.wholesale.titleRichText} fallback={dualCards.wholesale.title} />
                  </h2>
                  <p className="mt-1 text-xs font-bold text-white/80">
                    <RichText value={dualCards.wholesale.subtitleRichText} fallback={dualCards.wholesale.subtitle} />
                  </p>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {dualCards.wholesale.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs font-bold text-white/95">
                      <span className="grid size-4 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm">
                        <CheckCircle2 size={13} strokeWidth={2.5} />
                      </span>
                      <RichText value={dualCards.wholesale.checklistRichTextList?.[idx]} fallback={item} />
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <Link
                    href={dualCards.wholesale.buttonHref || "/products?mode=wholesale"}
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white px-6 py-3 text-xs font-black shadow-md shadow-[#8E111E]/20 transition-transform active:scale-95"
                  >
                    <ArrowRight size={15} className="rotate-180" />
                    <RichText value={dualCards.wholesale.buttonTextRichText} fallback={dualCards.wholesale.buttonText} />
                  </Link>
                </div>
              </div>
            </ResponsiveBannerContent>

          </div>
        </section>

        {/* ================= 4. BENEFITS 4-GRID ================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.slice(0, 4).map((item, idx) => {
            const iconMap = { CreditCard, Headphones, ShieldCheck, Truck };
            const FeatureIcon = iconMap[item.icon as keyof typeof iconMap] ?? ShieldCheck;
            return (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-[#E7E3DC] shadow-xs"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-[#8E111E]/10 text-[#8E111E] mb-3">
                <FeatureIcon size={26} strokeWidth={2.2} />
              </span>
              <h3 className="text-sm font-black text-[#1C1816]"><RichText value={item.titleRichText} fallback={item.title} /></h3>
              <RichText as="p" className="text-[11px] font-medium text-[#8C827A] mt-1" value={item.descRichText} fallback={item.desc} />
            </div>
          )})}
        </section>

        {/* ================= 5. CATEGORIES SECTION (MATCHING REFERENCE) ================= */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1816]">
              <RichText value={sectionTitles.categoriesTitleRichText} fallback={sectionTitles.categoriesTitle} />
            </h2>
            <p className="text-xs text-[#8C827A] font-bold">
              <RichText value={sectionTitles.categoriesSubtitleRichText} fallback={sectionTitles.categoriesSubtitle} />
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                href={cat.href || `/products?cat=${cat.key}`}
                className="group relative isolate aspect-square overflow-hidden rounded-2xl border border-white/60 text-center shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <ResponsiveBannerMedia settings={cat} fallback="/images/redesign/cat-packs.jpg" alt="" />
                <ResponsiveTextRegionBackdrop settings={cat} desktopFallback="bottom" mobileFallback="bottom" />
                <ResponsiveBannerContent settings={cat} desktopFallback="bottom" mobileFallback="bottom" className="min-h-full p-3">
                  <RichText as="span" className="block w-full px-3 py-2 text-xs font-black text-white drop-shadow-md transition-colors group-hover:text-[#FFD6DA]" value={cat.labelRichText} fallback={cat.label} />
                </ResponsiveBannerContent>
              </Link>
            ))}
          </div>
        </section>

        {banners.length > 0 && (
          <section className="grid gap-6 md:grid-cols-2" aria-label="پیشنهادهای ویژه">
            {banners.map((banner) => (
              <Link key={banner.id} href={banner.href || "/products"} className="group relative isolate min-h-[340px] overflow-hidden rounded-[2rem] border border-white/50 shadow-lg md:min-h-[300px]">
                <ResponsiveBannerMedia settings={banner} fallback="/images/hero.png" alt="" />
                <ResponsiveTextRegionBackdrop settings={banner} />
                <ResponsiveBannerContent settings={banner} className="min-h-[340px] p-6 md:min-h-[300px]">
                <span className="block text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
                  <RichText as="span" className="block text-xl font-black" value={banner.titleRichText} fallback={banner.title} />
                  <RichText as="span" className="mt-2 block text-xs leading-6 text-white/85" value={banner.subtitleRichText} fallback={banner.subtitle} />
                  <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-black text-[#8E111E]"><RichText value={banner.ctaRichText} fallback={banner.cta} /><ArrowLeft size={14} /></span>
                </span>
                </ResponsiveBannerContent>
              </Link>
            ))}
          </section>
        )}

        {/* ================= 6. FEATURED BESTSELLERS SECTION ================= */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1C1816]">
              <RichText value={sectionTitles.featuredTitleRichText} fallback={sectionTitles.featuredTitle} />
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
        <section className="relative isolate min-h-[390px] overflow-hidden rounded-[2.5rem] bg-[#4A0811] text-white shadow-xl md:min-h-[360px]">
          <ResponsiveBannerMedia settings={wholesalePromo} fallback="/images/redesign/wholesale-banner.jpg" alt="" />
          <ResponsiveTextRegionBackdrop settings={wholesalePromo} />
          <ResponsiveBannerContent settings={wholesalePromo} className="min-h-[390px] p-7 sm:p-12 md:min-h-[360px]">
            <div className="space-y-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                <RichText value={wholesalePromo.titleRichText} fallback={wholesalePromo.title} />
              </h2>
              <p className="text-sm text-white/80 max-w-2xl font-medium">
                <RichText value={wholesalePromo.subtitleRichText} fallback={wholesalePromo.subtitle} />
              </p>

              {/* Tags */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                {wholesalePromo.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 text-xs font-bold text-white/90 bg-black/20 px-3.5 py-1.5 rounded-full border border-white/10"
                  >
                    <CheckCircle2 size={14} className="text-[#FF6B78]" />
                    <RichText value={wholesalePromo.tagsRichTextList?.[idx]} fallback={tag} />
                  </span>
                ))}
              </div>

              <div className="pt-3">
                <Link
                  href={wholesalePromo.buttonHref || "/products?mode=wholesale"}
                  className="inline-flex items-center gap-2.5 rounded-full bg-white text-[#8E111E] hover:bg-[#FAF8F5] px-8 py-3.5 text-xs font-black shadow-lg transition-transform active:scale-95"
                >
                  <ArrowRight size={15} className="rotate-180 text-[#8E111E]" />
                  <RichText value={wholesalePromo.buttonTextRichText} fallback={wholesalePromo.buttonText} />
                </Link>
              </div>
            </div>
          </ResponsiveBannerContent>
        </section>

        {bottomBanners.length > 0 && (
          <section className="grid gap-5 sm:grid-cols-2" aria-label="بنرهای پایانی">
            {bottomBanners.map((banner) => (
              <Link key={banner.id} href={banner.href || "/products"} aria-label={banner.alt} className="relative isolate min-h-[280px] overflow-hidden rounded-[2rem] border border-white/50 shadow-lg md:min-h-[220px]">
                <ResponsiveBannerMedia settings={banner} fallback="/images/craft.png" alt="" />
                <ResponsiveTextRegionBackdrop settings={banner} desktopFallback="bottom" mobileFallback="bottom" />
                <ResponsiveBannerContent settings={banner} desktopFallback="bottom" mobileFallback="bottom" className="min-h-[280px] p-5 md:min-h-[220px]">
                  <RichText as="span" className="px-4 py-3 text-sm font-black text-white drop-shadow-md" value={banner.altRichText} fallback={banner.alt} />
                </ResponsiveBannerContent>
              </Link>
            ))}
          </section>
        )}

      </div>
    </div>
  );
}
