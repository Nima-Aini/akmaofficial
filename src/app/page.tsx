import Link from "next/link";
import {
  ArrowLeft,
  BadgePercent,
  ClipboardList,
  Headphones,
  Phone,
  Sparkle,
  Truck,
} from "lucide-react";
import { getActiveProducts, getSettings } from "@/lib/store";
import {
  DEFAULT_BANNERS,
  DEFAULT_BOTTOM_BANNERS,
  DEFAULT_CONTACT,
  DEFAULT_FEATURES,
  DEFAULT_HERO,
  DEFAULT_MARQUEE,
  DEFAULT_PRICE_TABLE,
  DEFAULT_SECTION_TITLES,
  DEFAULT_SITE,
  DEFAULT_STEPS,
  type Banner,
  type BottomBanner,
  type ContactSettings,
  type Feature,
  type HeroSettings,
  type PriceRow,
  type SectionTitles,
  type SiteSettings,
  type Step,
} from "@/lib/defaults";
import { Reveal, SpotlightRegion } from "@/components/effects";
import { ProductCard } from "@/components/product-card";
import { DynIcon } from "@/components/icon";
import { formatPrice, telHref, toFa } from "@/lib/format";

export default async function HomePage() {
  const [s, products] = await Promise.all([getSettings(), getActiveProducts()]);
  const hero = { ...DEFAULT_HERO, ...(s.hero as Partial<HeroSettings>) };
  const marquee = (s.marquee as string[]) ?? DEFAULT_MARQUEE;
  const banners = ((s.banners as Banner[]) ?? DEFAULT_BANNERS).filter((b) => b.enabled);
  const bottomBanners = ((s.bottomBanners as BottomBanner[]) ?? DEFAULT_BOTTOM_BANNERS).filter((b) => b.enabled);
  const features = (s.features as Feature[]) ?? DEFAULT_FEATURES;
  const priceTable = (s.priceTable as PriceRow[]) ?? DEFAULT_PRICE_TABLE;
  const steps = (s.steps as Step[]) ?? DEFAULT_STEPS;
  const site = { ...DEFAULT_SITE, ...(s.site as Partial<SiteSettings>) };
  const sectionTitles = { ...DEFAULT_SECTION_TITLES, ...(s.sectionTitles as Partial<SectionTitles>) };
  const contact = { ...DEFAULT_CONTACT, ...(s.contact as Partial<ContactSettings>) };
  const phone = contact.phones[0] ?? "09033253065";
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const showcase = featured.length > 0 ? featured : products.slice(0, 6);

  return (
    <div className="overflow-hidden">
      {/* ================= HERO ================= */}
      <SpotlightRegion className="relative">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 20%, transparent), transparent)",
          }}
        />
        <section className="relative mx-auto max-w-7xl px-5 pt-10 pb-20 lg:px-8 lg:pt-16">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="relative z-10 text-center lg:text-right">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-2 text-xs font-bold text-muted backdrop-blur">
                  <span className="size-1.5 rounded-full bg-accent" />
                  {hero.badge}
                </span>
              </Reveal>
              <Reveal delay={90}>
                <h1 className="mt-6 text-4xl font-black leading-[1.25] tracking-tight sm:text-5xl lg:text-[3.6rem]">
                  {hero.title}{" "}
                  <span className="bg-gradient-to-l from-accent2 to-accent bg-clip-text text-transparent">
                    {hero.highlight}
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={180}>
                <p className="mx-auto mt-6 max-w-xl text-[15px] leading-8 text-muted lg:mx-0">
                  {hero.subtitle}
                </p>
              </Reveal>
              <Reveal delay={260}>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  <Link href={hero.primaryCta.href} className="btn btn-primary h-13 px-8 text-sm shadow-lg shadow-accent/20">
                    {hero.primaryCta.label}
                    <ArrowLeft size={17} />
                  </Link>
                  <Link href={hero.secondaryCta.href} className="btn btn-ghost h-13 px-8 text-sm">
                    {hero.secondaryCta.label}
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={340}>
                <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-4">
                  {hero.stats.map((st) => (
                    <div key={st.label} className="bg-card px-4 py-5 text-center">
                      <dt className="order-2 mt-1 text-[11px] text-muted">{st.label}</dt>
                      <dd className="text-xl font-black text-accent">{st.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            <Reveal delay={200} className="relative">
              <div className="relative mx-auto max-w-[560px]">
                <div
                  className="absolute inset-8 -z-0 rounded-full opacity-50 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 35%, transparent), transparent)",
                  }}
                />
                <div className="card relative overflow-hidden !rounded-[2.2rem]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hero.image}
                    alt={site.name}
                    className="aspect-[5/4] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
                </div>
                <div className="card float-slow absolute -bottom-6 -right-3 z-10 flex items-center gap-3 px-5 py-4 sm:-right-8">
                  <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-accent2 to-accent text-on-accent">
                    <Truck size={19} />
                  </span>
                  <span>
                    <span className="block text-[11px] text-muted">ارسال سریع سفارشات</span>
                    <span className="block text-sm font-black text-accent">تیپاکس سراسری</span>
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </SpotlightRegion>

      {/* ================= MARQUEE ================= */}
      {marquee.length > 0 && (
        <div className="relative border-y border-line bg-surface py-4" dir="ltr">
          <div className="marquee-track">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
                {marquee.map((m, i) => (
                  <span
                    key={`${dup}-${i}`}
                    className="mx-6 flex items-center gap-6 whitespace-nowrap text-sm font-bold text-muted"
                  >
                    <span dir="rtl">{m}</span>
                    <Sparkle size={13} className="text-accent" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= FEATURED PRODUCTS ================= */}
      {showcase.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.25em] text-accent">
                  {sectionTitles.featuredBadge || "منتخب فروشگاه"}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  {sectionTitles.featuredTitle || "محصولات ویژه آکما"}
                </h2>
                {sectionTitles.featuredSubtitle && (
                  <p className="mt-2 text-xs text-muted max-w-xl">
                    {sectionTitles.featuredSubtitle}
                  </p>
                )}
              </div>
              <Link href="/products" className="btn btn-ghost h-11 px-6 text-xs">
                مشاهده همه
                <ArrowLeft size={15} />
              </Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 90}>
                <ProductCard product={p} phone={phone} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ================= PROMO BANNERS ================= */}
      {banners.length > 0 && (
        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-14 lg:grid-cols-2 lg:px-8">
          {banners.map((b, i) => (
            <Reveal key={b.id} delay={i * 120}>
              <Link
                href={b.href || "/products"}
                className="card card-hover group relative block overflow-hidden"
              >
                <div className="grid sm:grid-cols-2">
                  <div className="relative z-10 p-8 sm:p-10">
                    <span className="text-[11px] font-bold tracking-[0.25em] text-accent">
                      {sectionTitles.promoBadge || "پیشنهاد آکما"}
                    </span>
                    <h3 className="mt-4 text-2xl font-black leading-snug">{b.title}</h3>
                    <p className="mt-3 text-[13px] leading-7 text-muted">{b.subtitle}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-accent">
                      {b.cta}
                      <ArrowLeft
                        size={16}
                        className="transition-transform duration-300 group-hover:-translate-x-1.5"
                      />
                    </span>
                  </div>
                  <div className="relative min-h-56 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.image}
                      alt={b.title}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-card via-card/20 to-transparent sm:bg-gradient-to-r" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </section>
      )}

      {/* ================= WHY AKMA (مزایا و هویت) ================= */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold tracking-[0.25em] text-accent">
              {sectionTitles.whyAkmaBadge || "چرا آکما؟"}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-snug tracking-tight sm:text-4xl">
              {sectionTitles.whyAkmaTitle || site.aboutTitle}
            </h2>
            <p className="mt-5 text-[15px] leading-8 text-muted">
              {sectionTitles.whyAkmaSubtitle || site.aboutText}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title + i} delay={i * 80}>
              <div className="card card-hover flex h-full flex-col gap-4 p-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent2 to-accent text-on-accent shadow-md shadow-accent/20">
                  <DynIcon name={f.icon} size={20} />
                </span>
                <div>
                  <span className="block text-sm font-extrabold">{f.title}</span>
                  <span className="mt-2 block text-xs leading-6 text-muted">{f.desc}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= UNIT PRICE TABLE ================= */}
      <section id="price-table" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 lg:px-8">
        <Reveal>
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.25em] text-accent">
              {sectionTitles.priceTableBadge || "شفافیت قیمت"}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {sectionTitles.priceTableTitle || "قیمت واحد محصولات"}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
              {sectionTitles.priceTableSubtitle ||
                "قیمت‌های خرده‌فروشی پیشنهادی؛ برای قیمت همکاری و خرید عمده تماس بگیرید یا آنلاین سفارش دهید."}
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="card mt-10 overflow-hidden">
            {priceTable.map((row, i) => (
              <div
                key={i}
                className={`group flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-surface sm:px-9 ${
                  i !== priceTable.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-accent">
                    <BadgePercent size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold sm:text-base">{row.name}</p>
                    {row.note && <p className="mt-0.5 text-[11px] text-muted">{row.note}</p>}
                  </div>
                </div>
                <p className="shrink-0 text-lg font-black text-accent sm:text-xl">
                  {formatPrice(row.price)}
                  <span className="mr-1.5 text-[11px] font-bold text-muted">تومان</span>
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ================= HOW TO ORDER ================= */}
      <section id="how-to-order" className="relative scroll-mt-28 border-y border-line bg-surface py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Reveal>
            <div className="text-center">
              <p className="text-xs font-bold tracking-[0.25em] text-accent">
                {sectionTitles.stepsBadge || "سفارش آسان"}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {sectionTitles.stepsTitle || "سفارش در چند قدم ساده"}
              </h2>
              {sectionTitles.stepsSubtitle && (
                <p className="mx-auto mt-3 max-w-lg text-xs leading-6 text-muted">
                  {sectionTitles.stepsSubtitle}
                </p>
              )}
            </div>
          </Reveal>
          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div className="pointer-events-none absolute top-10 right-[16%] left-[16%] hidden border-t-2 border-dashed border-line md:block" />
            {steps.map((st, i) => (
              <Reveal key={st.title + i} delay={i * 130}>
                <div className="card card-hover relative h-full p-8 text-center">
                  <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-accent2 to-accent text-2xl font-black text-on-accent shadow-lg shadow-accent/25">
                    {toFa(i + 1)}
                  </span>
                  <h3 className="mt-6 text-lg font-extrabold">{st.title}</h3>
                  <p className="mt-3 text-[13px] leading-7 text-muted">{st.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <Link href="/products" className="btn btn-primary h-13 px-9 text-sm shadow-lg shadow-accent/20">
                <ClipboardList size={17} />
                ثبت سفارش آنلاین محصولات
              </Link>
              <a href={telHref(phone)} className="btn btn-ghost h-13 px-9 text-sm">
                <Headphones size={17} className="text-accent" />
                مشاوره و پشتیبانی — {toFa(phone)}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= BOTTOM BANNERS ================= */}
      {bottomBanners.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className={`grid gap-5 ${bottomBanners.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`}>
            {bottomBanners.map((bb, idx) => {
              const content = (
                <div className="card overflow-hidden !rounded-[2rem] border border-line transition-transform duration-500 hover:scale-[1.01]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bb.image}
                    alt={bb.alt || site.name}
                    loading="lazy"
                    className="w-full object-cover max-h-[380px]"
                  />
                </div>
              );
              return (
                <Reveal key={bb.id} delay={idx * 100}>
                  {bb.href ? (
                    <Link href={bb.href} className="block group">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </Reveal>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
