import Link from "next/link";
import {
  ArrowLeft,
  BadgePercent,
  ClipboardList,
  Phone,
  Send,
  Sparkle,
  Store,
} from "lucide-react";
import { getActiveProducts, getSettings } from "@/lib/store";
import {
  CATEGORIES,
  DEFAULT_BANNERS,
  DEFAULT_CONTACT,
  DEFAULT_FEATURES,
  DEFAULT_HERO,
  DEFAULT_MARQUEE,
  DEFAULT_PRICE_TABLE,
  DEFAULT_SITE,
  DEFAULT_STEPS,
  type Banner,
  type ContactSettings,
  type Feature,
  type HeroSettings,
  type PriceRow,
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
  const features = (s.features as Feature[]) ?? DEFAULT_FEATURES;
  const priceTable = (s.priceTable as PriceRow[]) ?? DEFAULT_PRICE_TABLE;
  const steps = (s.steps as Step[]) ?? DEFAULT_STEPS;
  const site = { ...DEFAULT_SITE, ...(s.site as Partial<SiteSettings>) };
  const contact = { ...DEFAULT_CONTACT, ...(s.contact as Partial<ContactSettings>) };
  const phone = contact.phones[0] ?? "09033253065";
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const showcase = featured.length > 0 ? featured : products.slice(0, 6);

  const catIcons = [Sparkle, Send, BadgePercent, Store];

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
                  <Link href={hero.primaryCta.href} className="btn btn-primary h-13 px-8 text-sm">
                    {hero.primaryCta.label}
                    <ArrowLeft size={17} />
                  </Link>
                  <a href={hero.secondaryCta.href} className="btn btn-ghost h-13 px-8 text-sm">
                    <Phone size={17} className="text-accent" />
                    {hero.secondaryCta.label}
                  </a>
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
                    <Phone size={19} />
                  </span>
                  <span>
                    <span className="block text-[11px] text-muted">ثبت سفارش فقط با یک تماس</span>
                    <a href={telHref(phone)} className="block text-base font-black tracking-wide" dir="ltr">
                      {toFa(phone)}
                    </a>
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

      {/* ================= CATEGORIES ================= */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-accent">دسته‌بندی‌ها</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                هر آنچه ویترین شما نیاز دارد
              </h2>
            </div>
            <Link href="/products" className="btn btn-ghost h-11 px-6 text-xs">
              همه محصولات
              <ArrowLeft size={15} />
            </Link>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.filter((c) => c.key !== "all").map((c, i) => {
            const Icon = catIcons[i % catIcons.length];
            return (
              <Reveal key={c.key} delay={i * 80}>
                <Link
                  href={`/products?cat=${c.key}`}
                  className="card card-hover group flex h-full items-center gap-4 p-6"
                >
                  <span className="grid size-13 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-accent transition-all duration-300 group-hover:border-accent group-hover:shadow-[0_0_30px_-8px_var(--accent)]">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block font-extrabold">{c.label}</span>
                    <span className="mt-1 flex items-center gap-1 text-[11px] text-muted transition-colors group-hover:text-accent">
                      مشاهده محصولات <ArrowLeft size={12} />
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================= FEATURED PRODUCTS ================= */}
      {showcase.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.25em] text-accent">منتخب فروشگاه</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  محصولات ویژه آکما
                </h2>
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
        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-20 lg:grid-cols-2 lg:px-8">
          {banners.map((b, i) => (
            <Reveal key={b.id} delay={i * 120}>
              <Link
                href={b.href || "/products"}
                className="card card-hover group relative block overflow-hidden"
              >
                <div className="grid sm:grid-cols-2">
                  <div className="relative z-10 p-8 sm:p-10">
                    <span className="text-[11px] font-bold tracking-[0.25em] text-accent">
                      پیشنهاد آکما
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

      {/* ================= ABOUT / CRAFT ================= */}
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="relative order-2 lg:order-1">
            <div className="card overflow-hidden !rounded-[2.2rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/craft.png"
                alt="احیای کفش با محصولات آکما"
                loading="lazy"
                className="aspect-[5/4] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/55 to-transparent" />
            </div>
            <div className="card float-slow absolute -top-6 left-4 z-10 px-5 py-4 sm:-left-6">
              <p className="text-2xl font-black text-accent">+۱۰۰٪</p>
              <p className="mt-1 text-[11px] text-muted">تمرکز بر کیفیت و بسته‌بندی</p>
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <Reveal>
              <p className="text-xs font-bold tracking-[0.25em] text-accent">چرا آکما؟</p>
              <h2 className="mt-3 text-3xl font-black leading-snug tracking-tight sm:text-4xl">
                {site.aboutTitle}
              </h2>
              <p className="mt-6 text-[15px] leading-9 text-muted">{site.aboutText}</p>
            </Reveal>
            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => (
                <Reveal key={f.title + i} delay={i * 80}>
                  <div className="card card-hover flex h-full gap-4 p-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent2 to-accent text-on-accent">
                      <DynIcon name={f.icon} size={19} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold">{f.title}</span>
                      <span className="mt-1.5 block text-xs leading-6 text-muted">{f.desc}</span>
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= UNIT PRICE TABLE ================= */}
      <section id="price-table" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 lg:px-8">
        <Reveal>
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.25em] text-accent">شفافیت قیمت</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">قیمت واحد محصولات</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
              قیمت‌های خرده‌فروشی پیشنهادی؛ برای قیمت همکاری و خرید عمده تماس بگیرید.
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
              <p className="text-xs font-bold tracking-[0.25em] text-accent">بدون سبد خرید، بدون پیچیدگی</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                سفارش در سه قدم ساده
              </h2>
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
              <a href={telHref(phone)} className="btn btn-primary h-13 px-9 text-sm">
                <Phone size={17} />
                تماس برای ثبت سفارش — {toFa(phone)}
              </a>
              <Link href="/products" className="btn btn-ghost h-13 px-9 text-sm">
                <ClipboardList size={17} className="text-accent" />
                انتخاب محصولات
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
