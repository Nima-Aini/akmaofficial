import Link from "next/link";
import { Clock, AtSign, Mail, MapPin, Phone, Send, Sparkle, MessageCircle } from "lucide-react";
import { telHref, toFa } from "@/lib/format";
import type { ContactSettings, SiteSettings } from "@/lib/defaults";
import { CATEGORIES } from "@/lib/defaults";

export function SiteFooter({
  site,
  contact,
}: {
  site: SiteSettings;
  contact: ContactSettings;
}) {
  const year = toFa(new Date().getFullYear());
  return (
    <footer className="relative mt-28 border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-accent2 to-accent text-on-accent">
                <Sparkle size={20} strokeWidth={2.2} />
              </span>
              <span className="leading-none">
                <span className="block text-xl font-black">{site.name}</span>
                <span className="block text-[10px] font-bold tracking-[0.35em] text-muted">
                  {site.latinName}
                </span>
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted">{site.footerText}</p>
            {(contact.instagram || contact.telegram || contact.whatsapp) && (
              <div className="mt-5 flex items-center gap-2">
                {contact.instagram && (
                  <a
                    href={`https://instagram.com/${contact.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="اینستاگرام"
                    className="grid size-10 place-items-center rounded-xl border border-line text-muted transition-all hover:border-accent hover:text-accent"
                  >
                    <AtSign size={17} />
                  </a>
                )}
                {contact.telegram && (
                  <a
                    href={`https://t.me/${contact.telegram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="تلگرام"
                    className="grid size-10 place-items-center rounded-xl border border-line text-muted transition-all hover:border-accent hover:text-accent"
                  >
                    <Send size={17} />
                  </a>
                )}
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/98${contact.whatsapp.replace(/^0/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="واتساپ"
                    className="grid size-10 place-items-center rounded-xl border border-line text-muted transition-all hover:border-accent hover:text-accent"
                  >
                    <MessageCircle size={17} />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-extrabold tracking-wide">دسترسی سریع</h4>
            <ul className="mt-5 space-y-3 text-sm text-muted">
              <li><Link className="transition-colors hover:text-accent" href="/">خانه</Link></li>
              <li><Link className="transition-colors hover:text-accent" href="/products">محصولات</Link></li>
              <li><Link className="transition-colors hover:text-accent" href="/#price-table">قیمت واحد</Link></li>
              <li><Link className="transition-colors hover:text-accent" href="/#how-to-order">راهنمای سفارش</Link></li>
              <li><Link className="transition-colors hover:text-accent" href="/contact">تماس با ما</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-extrabold tracking-wide">خدمات و سفارش</h4>
            <ul className="mt-5 space-y-3 text-sm text-muted">
              <li><Link className="transition-colors hover:text-accent" href="/products">کاتالوگ و ثبت سفارش آنلاین</Link></li>
              <li><Link className="transition-colors hover:text-accent" href="/track">پیگیری وضعیت سفارش</Link></li>
              <li><Link className="transition-colors hover:text-accent" href="/checkout">سبد خرید و تسویه‌حساب</Link></li>
              <li><Link className="transition-colors hover:text-accent" href="/#price-table">شفافیت قیمت واحد</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-extrabold tracking-wide">ارتباط با ما</h4>
            <ul className="mt-5 space-y-4 text-sm text-muted">
              {contact.phones.map((p) => (
                <li key={p}>
                  <a href={telHref(p)} className="flex items-center gap-3 transition-colors hover:text-accent">
                    <Phone size={16} className="shrink-0 text-accent" />
                    <span dir="ltr" className="font-bold">{toFa(p)}</span>
                  </a>
                </li>
              ))}
              {contact.email && (
                <li className="flex items-center gap-3">
                  <Mail size={16} className="shrink-0 text-accent" />
                  <span dir="ltr">{contact.email}</span>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="mt-1 shrink-0 text-accent" />
                  <span>{contact.address}</span>
                </li>
              )}
              {contact.hours && (
                <li className="flex items-start gap-3">
                  <Clock size={16} className="mt-1 shrink-0 text-accent" />
                  <span>{contact.hours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-7 text-xs text-muted sm:flex-row">
          <p>© {year} {site.name} — تمامی حقوق محفوظ است.</p>
          <p className="tracking-wide">{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
