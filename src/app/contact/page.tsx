import type { Metadata } from "next";
import {
  AtSign,
  Clock,
  Headset,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { getSettings } from "@/lib/store";
import { DEFAULT_CONTACT, type ContactSettings } from "@/lib/defaults";
import { Reveal } from "@/components/effects";
import { telHref, toFa } from "@/lib/format";

export const metadata: Metadata = { title: "تماس با ما | آکما" };

export default async function ContactPage() {
  const s = await getSettings();
  const contact = { ...DEFAULT_CONTACT, ...(s.contact as Partial<ContactSettings>) };

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <Reveal>
        <header className="text-center">
          <p className="text-xs font-bold tracking-[0.25em] text-accent">همیشه پاسخگو هستیم</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">تماس با آکما</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-muted">
            {contact.note}
          </p>
        </header>
      </Reveal>

      {/* main call cards */}
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {contact.phones.map((p, i) => (
          <Reveal key={p} delay={i * 90}>
            <a
              href={telHref(p)}
              className="card card-hover group flex h-full flex-col items-center gap-4 p-9 text-center"
            >
              <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-accent2 to-accent text-on-accent shadow-lg shadow-accent/25 transition-transform duration-300 group-hover:scale-110">
                <Phone size={26} />
              </span>
              <span>
                <span className="block text-xs text-muted">خط سفارش و مشاوره</span>
                <span className="mt-2 block text-2xl font-black tracking-wide" dir="ltr">
                  {toFa(p)}
                </span>
              </span>
              <span className="btn btn-primary h-11 px-8 text-xs">برقراری تماس</span>
            </a>
          </Reveal>
        ))}

        <Reveal delay={120}>
          <div className="card flex h-full flex-col items-center gap-4 p-9 text-center">
            <span className="grid size-16 place-items-center rounded-2xl border border-line text-accent">
              <Clock size={26} />
            </span>
            <span>
              <span className="block text-xs text-muted">ساعات پاسخگویی</span>
              <span className="mt-2 block text-base font-extrabold leading-8">{contact.hours}</span>
            </span>
          </div>
        </Reveal>

        {contact.email && (
          <Reveal delay={160}>
            <a
              href={`mailto:${contact.email}`}
              className="card card-hover flex h-full flex-col items-center gap-4 p-9 text-center"
            >
              <span className="grid size-16 place-items-center rounded-2xl border border-line text-accent">
                <Mail size={26} />
              </span>
              <span>
                <span className="block text-xs text-muted">ایمیل</span>
                <span className="mt-2 block text-base font-extrabold" dir="ltr">
                  {contact.email}
                </span>
              </span>
            </a>
          </Reveal>
        )}
      </div>

      {/* secondary info */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Reveal delay={100}>
          <div className="card flex h-full items-start gap-5 p-8">
            <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent2 to-accent text-on-accent">
              <MapPin size={22} />
            </span>
            <span>
              <span className="block font-extrabold">آدرس و نحوه ارسال</span>
              <span className="mt-2.5 block text-sm leading-8 text-muted">{contact.address}</span>
            </span>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className="card flex h-full items-start gap-5 p-8">
            <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent2 to-accent text-on-accent">
              <Headset size={22} />
            </span>
            <span className="grow">
              <span className="block font-extrabold">شبکه‌های اجتماعی</span>
              <span className="mt-3 flex flex-wrap gap-2">
                {contact.instagram && (
                  <a
                    href={`https://instagram.com/${contact.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost h-10 px-5 text-xs"
                  >
                    <AtSign size={15} className="text-accent" />
                    اینستاگرام
                  </a>
                )}
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/98${contact.whatsapp.replace(/^0/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost h-10 px-5 text-xs"
                  >
                    <MessageCircle size={15} className="text-accent" />
                    واتساپ
                  </a>
                )}
                {contact.telegram && (
                  <a
                    href={`https://t.me/${contact.telegram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost h-10 px-5 text-xs"
                  >
                    <Send size={15} className="text-accent" />
                    تلگرام
                  </a>
                )}
                {!contact.instagram && !contact.whatsapp && !contact.telegram && (
                  <span className="text-xs text-muted">به‌زودی…</span>
                )}
              </span>
            </span>
          </div>
        </Reveal>
      </div>

      {/* order note band */}
      <Reveal delay={140}>
        <div className="relative mt-14 overflow-hidden rounded-[2rem] border border-line bg-gradient-to-l from-accent/15 via-card to-card p-10 text-center sm:p-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(600px circle at 50% -20%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)",
            }}
          />
          <h2 className="relative text-2xl font-black tracking-tight sm:text-3xl">
            آماده ثبت سفارش هستید؟
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm leading-8 text-muted">
            کارشناسان آکما برای استعلام قیمت همکاری، موجودی و شرایط ارسال، پاسخگوی شما هستند.
          </p>
          {contact.phones[0] && (
            <a
              href={telHref(contact.phones[0])}
              className="btn btn-primary relative mt-8 h-14 px-10 text-base"
            >
              <Phone size={19} />
              <span dir="ltr">{toFa(contact.phones[0])}</span>
            </a>
          )}
        </div>
      </Reveal>
    </div>
  );
}
