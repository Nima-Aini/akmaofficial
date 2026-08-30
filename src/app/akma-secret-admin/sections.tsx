"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_BANNERS,
  DEFAULT_CONTACT,
  DEFAULT_FEATURES,
  DEFAULT_HERO,
  DEFAULT_MARQUEE,
  DEFAULT_PRICE_TABLE,
  DEFAULT_SITE,
  DEFAULT_STEPS,
  DEFAULT_THEME,
  type Banner,
  type ContactSettings,
  type Feature,
  type HeroSettings,
  type PriceRow,
  type SiteSettings,
  type Step,
  type ThemeSettings,
} from "@/lib/defaults";
import { ICON_CHOICES, DynIcon } from "@/components/icon";
import { SectionCard, Field, ImageUploader, Textarea, Toggle, Select, ColorField, ListEditor } from "./fields";

type Settings = Record<string, unknown>;
export type SetKey = (key: string, value: unknown) => void;
export type SaveKey = (key: string) => Promise<void>;

const PRESET_ACCENTS: [string, string, string][] = [
  ["#e8132c", "#ff6b78", "#ffffff"],
  ["#e8b34b", "#f5d78e", "#170f02"],
  ["#34d399", "#a7f3d0", "#052016"],
  ["#60a5fa", "#bfdbfe", "#08152b"],
  ["#f472b6", "#fbcfe8", "#2b0718"],
  ["#a78bfa", "#ddd6fe", "#170b33"],
  ["#f97316", "#fdba74", "#2b1203"],
  ["#2dd4bf", "#99f6e4", "#04241f"],
];

/* ---------------- داشبورد ---------------- */
export function DashboardSection({
  settings,
  productCount,
}: {
  settings: Settings;
  productCount: number;
}) {
  const site = { ...DEFAULT_SITE, ...(settings.site as Partial<SiteSettings>) };
  const contact = { ...DEFAULT_CONTACT, ...(settings.contact as Partial<ContactSettings>) };
  const banners = (settings.banners as Banner[]) ?? DEFAULT_BANNERS;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "محصولات فعال", value: String(productCount) },
          { label: "بنرهای تبلیغاتی", value: String(banners.filter((b) => b.enabled).length) },
          { label: "شماره‌های تماس", value: String(contact.phones.length) },
        ].map((x) => (
          <div key={x.label} className="card p-6 text-center">
            <p className="text-3xl font-black text-accent">{x.value}</p>
            <p className="mt-1.5 text-xs text-muted">{x.label}</p>
          </div>
        ))}
      </div>
      <SectionCard title="دسترسی سریع">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/" target="_blank" className="btn btn-ghost h-12 text-xs">
            مشاهده صفحه اصلی سایت
          </Link>
          <Link href="/products" target="_blank" className="btn btn-ghost h-12 text-xs">
            مشاهده فروشگاه
          </Link>
        </div>
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-[11px] leading-6 text-muted">
          نام فروشگاه: <b className="text-ink">{site.name}</b> — تغییرات پس از «ذخیره تغییرات» بلافاصله
          روی سایت اعمال می‌شود (در صورت نیاز صفحه را رفرش کنید).
        </p>
      </SectionCard>
    </div>
  );
}

/* ---------------- تم و ظاهر ---------------- */
export function ThemeSection({
  settings,
  setKey,
  saveKey,
  saving,
}: {
  settings: Settings;
  setKey: SetKey;
  saveKey: SaveKey;
  saving: boolean;
}) {
  const theme = { ...DEFAULT_THEME, ...(settings.theme as Partial<ThemeSettings>) };
  const set = (patch: Partial<ThemeSettings>) => setKey("theme", { ...theme, ...patch });
  return (
    <div className="space-y-5">
      <SectionCard
        title="پوسته و رنگ‌بندی"
        desc="کل ظاهر سایت (دکمه‌ها، لینک‌ها، بج‌ها و…) از این تنظیمات پیروی می‌کند."
        onSave={() => saveKey("theme")}
        saving={saving}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="حالت نمایش"
            value={theme.mode}
            onChange={(v) => set({ mode: v as ThemeSettings["mode"] })}
            options={[
              { value: "dark", label: "تیره (لوکس)" },
              { value: "light", label: "روشن" },
            ]}
          />
          <Select
            label="گردی گوشه کارت‌ها"
            value={theme.radius}
            onChange={(v) => set({ radius: v as ThemeSettings["radius"] })}
            options={[
              { value: "sm", label: "کم" },
              { value: "md", label: "متوسط" },
              { value: "lg", label: "زیاد" },
              { value: "full", label: "خیلی گرد" },
            ]}
          />
          <Select
            label="فرم دکمه‌ها"
            value={theme.buttonShape}
            onChange={(v) => set({ buttonShape: v as ThemeSettings["buttonShape"] })}
            options={[
              { value: "pill", label: "کاملاً گرد (Pill)" },
              { value: "soft", label: "گوشه نرم" },
              { value: "sharp", label: "تیز" },
            ]}
          />
          <div className="grid gap-4">
            <ColorField label="رنگ اصلی (Accent)" value={theme.accent} onChange={(v) => set({ accent: v })} />
            <ColorField label="رنگ روشن مکمل" value={theme.accent2} onChange={(v) => set({ accent2: v })} />
            <ColorField
              label="رنگ متن روی دکمه‌ها"
              value={theme.contrast ?? "#ffffff"}
              onChange={(v) => set({ contrast: v })}
            />
          </div>
        </div>
        <div>
          <span className="mb-2 block text-xs font-bold text-muted">پالت‌های آماده</span>
          <div className="flex flex-wrap gap-2.5">
            {PRESET_ACCENTS.map(([a, b, c]) => (
              <button
                key={a}
                type="button"
                onClick={() => set({ accent: a, accent2: b, contrast: c })}
                className="h-10 w-16 rounded-xl border border-line transition-transform hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${b}, ${a})` }}
                aria-label={`پالت ${a}`}
              />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <span className="mb-3 block text-xs font-bold text-muted">پیش‌نمایش زنده</span>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="btn h-11 px-6 text-xs font-extrabold"
              style={{
                background: `linear-gradient(135deg, ${theme.accent2}, ${theme.accent})`,
                color: theme.contrast ?? "#ffffff",
                borderRadius: "var(--btn-radius)",
              }}
            >
              دکمه اصلی
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: theme.accent }}
            >
              متن تاکیدی
            </span>
            <span
              className="rounded-full px-3.5 py-1.5 text-[11px] font-extrabold"
              style={{ background: `${theme.accent}26`, color: theme.accent }}
            >
              بج نمونه
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- هیرو و بنرها ---------------- */
export function HeroBannersSection({
  settings,
  setKey,
  saveKey,
  saving,
}: {
  settings: Settings;
  setKey: SetKey;
  saveKey: SaveKey;
  saving: boolean;
}) {
  const hero = { ...DEFAULT_HERO, ...(settings.hero as Partial<HeroSettings>) };
  const marquee = (settings.marquee as string[]) ?? DEFAULT_MARQUEE;
  const banners = (settings.banners as Banner[]) ?? DEFAULT_BANNERS;
  const setHero = (patch: Partial<HeroSettings>) => setKey("hero", { ...hero, ...patch });

  const setBanner = (i: number, patch: Partial<Banner>) => {
    const next = banners.map((b, j) => (j === i ? { ...b, ...patch } : b));
    setKey("banners", next);
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="بخش اصلی صفحه نخست (Hero)"
        onSave={() => saveKey("hero")}
        saving={saving}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="متن بج بالای تیتر" value={hero.badge} onChange={(v) => setHero({ badge: v })} />
          <ImageUploader
            label="تصویر اصلی"
            value={hero.image}
            onChange={(v) => setHero({ image: typeof v === "string" ? v : (v[0] ?? "") })}
            kind="hero"
            hint="تصویر را مستقیم از کامپیوتر انتخاب کنید؛ حداکثر 10MB."
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="تیتر (بخش اول)" value={hero.title} onChange={(v) => setHero({ title: v })} />
          <Field
            label="تیتر (بخش رنگی)"
            value={hero.highlight}
            onChange={(v) => setHero({ highlight: v })}
          />
        </div>
        <Textarea
          label="متن توضیح"
          value={hero.subtitle}
          onChange={(v) => setHero({ subtitle: v })}
          rows={3}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="متن دکمه اصلی"
            value={hero.primaryCta.label}
            onChange={(v) => setHero({ primaryCta: { ...hero.primaryCta, label: v } })}
          />
          <Field
            label="لینک دکمه اصلی"
            value={hero.primaryCta.href}
            onChange={(v) => setHero({ primaryCta: { ...hero.primaryCta, href: v } })}
            dir="ltr"
          />
          <Field
            label="متن دکمه دوم"
            value={hero.secondaryCta.label}
            onChange={(v) => setHero({ secondaryCta: { ...hero.secondaryCta, label: v } })}
          />
          <Field
            label="لینک دکمه دوم"
            value={hero.secondaryCta.href}
            onChange={(v) => setHero({ secondaryCta: { ...hero.secondaryCta, href: v } })}
            dir="ltr"
          />
        </div>
        <div>
          <span className="mb-2 block text-xs font-bold text-muted">آمارهای پایین هیرو</span>
          <div className="space-y-2">
            {hero.stats.map((st, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="field w-28"
                  placeholder="عدد"
                  value={st.value}
                  onChange={(e) => {
                    const stats = hero.stats.map((x, j) =>
                      j === i ? { ...x, value: e.target.value } : x,
                    );
                    setHero({ stats });
                  }}
                />
                <input
                  className="field flex-1"
                  placeholder="عنوان"
                  value={st.label}
                  onChange={(e) => {
                    const stats = hero.stats.map((x, j) =>
                      j === i ? { ...x, label: e.target.value } : x,
                    );
                    setHero({ stats });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setHero({ stats: hero.stats.filter((_, j) => j !== i) })}
                  className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-rose-400 hover:border-rose-400"
                  aria-label="حذف آمار"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setHero({ stats: [...hero.stats, { value: "", label: "" }] })}
              className="btn btn-ghost h-10 w-full text-xs"
            >
              <Plus size={14} /> افزودن آمار
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="نوار متحرک (Marquee)"
        desc="جملاتی که به‌صورت متحرک زیر هیرو نمایش داده می‌شوند."
        onSave={() => saveKey("marquee")}
        saving={saving}
      >
        <ListEditor
          label="جملات نوار متحرک"
          items={marquee}
          onChange={(v) => setKey("marquee", v)}
          placeholder="مثلاً: ارسال به سراسر کشور"
        />
      </SectionCard>

      <SectionCard
        title="بنرهای تبلیغاتی"
        desc="بنرهای میانی صفحه اصلی؛ می‌توانید فعال/غیرفعال کنید یا بنر جدید بسازید."
        onSave={() => saveKey("banners")}
        saving={saving}
      >
        <div className="space-y-6">
          {banners.map((b, i) => (
            <div key={b.id} className="rounded-2xl border border-line p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-muted">بنر {i + 1}</span>
                <div className="flex items-center gap-3">
                  <Toggle
                    label={b.enabled ? "فعال" : "غیرفعال"}
                    checked={b.enabled}
                    onChange={(v) => setBanner(i, { enabled: v })}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setKey(
                        "banners",
                        banners.filter((x) => x.id !== b.id),
                      )
                    }
                    className="grid size-10 place-items-center rounded-xl border border-line text-rose-400 hover:border-rose-400"
                    aria-label="حذف بنر"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="عنوان" value={b.title} onChange={(v) => setBanner(i, { title: v })} />
                <ImageUploader
                  label="تصویر بنر"
                  value={b.image}
                  onChange={(v) => setBanner(i, { image: typeof v === "string" ? v : (v[0] ?? "") })}
                  kind="banners"
                  hint="تصویر را مستقیم از کامپیوتر انتخاب کنید؛ حداکثر 10MB."
                />
              </div>
              <div className="mt-4">
                <Textarea
                  label="متن"
                  value={b.subtitle}
                  onChange={(v) => setBanner(i, { subtitle: v })}
                  rows={2}
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="متن دکمه" value={b.cta} onChange={(v) => setBanner(i, { cta: v })} />
                <Field
                  label="لینک دکمه"
                  value={b.href}
                  onChange={(v) => setBanner(i, { href: v })}
                  dir="ltr"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setKey("banners", [
                ...banners,
                {
                  id: `banner-${Date.now()}`,
                  title: "بنر جدید",
                  subtitle: "",
                  cta: "مشاهده",
                  href: "/products",
                  image: "/images/hero.png",
                  enabled: true,
                },
              ])
            }
            className="btn btn-ghost h-11 w-full text-xs"
          >
            <Plus size={14} /> افزودن بنر جدید
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- تماس ---------------- */
export function ContactSection({
  settings,
  setKey,
  saveKey,
  saving,
}: {
  settings: Settings;
  setKey: SetKey;
  saveKey: SaveKey;
  saving: boolean;
}) {
  const contact = { ...DEFAULT_CONTACT, ...(settings.contact as Partial<ContactSettings>) };
  const set = (patch: Partial<ContactSettings>) => setKey("contact", { ...contact, ...patch });
  return (
    <SectionCard
      title="اطلاعات تماس و ارتباط"
      desc="اولین شماره تمام دکمه‌های «سفارش تلفنی» سراسر سایت را تشکیل می‌دهد."
      onSave={() => saveKey("contact")}
      saving={saving}
    >
      <ListEditor
        label="شماره‌های تماس (به ترتیب اولویت)"
        items={contact.phones}
        onChange={(v) => set({ phones: v })}
        placeholder="09033253065"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="ایمیل" value={contact.email} onChange={(v) => set({ email: v })} dir="ltr" />
        <Field label="ساعات پاسخگویی" value={contact.hours} onChange={(v) => set({ hours: v })} />
      </div>
      <Field label="آدرس / توضیح ارسال" value={contact.address} onChange={(v) => set({ address: v })} />
      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="اینستاگرام (آیدی)"
          value={contact.instagram}
          onChange={(v) => set({ instagram: v })}
          dir="ltr"
        />
        <Field
          label="واتساپ (شماره)"
          value={contact.whatsapp}
          onChange={(v) => set({ whatsapp: v })}
          dir="ltr"
        />
        <Field
          label="تلگرام (آیدی)"
          value={contact.telegram}
          onChange={(v) => set({ telegram: v })}
          dir="ltr"
        />
      </div>
      <Textarea
        label="پیام راهنمای سفارش"
        value={contact.note}
        onChange={(v) => set({ note: v })}
        rows={2}
      />
    </SectionCard>
  );
}

/* ---------------- محتوای سایت ---------------- */
export function ContentSection({
  settings,
  setKey,
  saveKey,
  saving,
}: {
  settings: Settings;
  setKey: SetKey;
  saveKey: SaveKey;
  saving: boolean;
}) {
  const site = { ...DEFAULT_SITE, ...(settings.site as Partial<SiteSettings>) };
  const features = (settings.features as Feature[]) ?? DEFAULT_FEATURES;
  const steps = (settings.steps as Step[]) ?? DEFAULT_STEPS;
  const priceTable = (settings.priceTable as PriceRow[]) ?? DEFAULT_PRICE_TABLE;
  const setSite = (patch: Partial<SiteSettings>) => setKey("site", { ...site, ...patch });

  return (
    <div className="space-y-5">
      <SectionCard title="هویت و محتوای سایت" onSave={() => saveKey("site")} saving={saving}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="نام فروشگاه" value={site.name} onChange={(v) => setSite({ name: v })} />
          <Field
            label="نام لاتین"
            value={site.latinName}
            onChange={(v) => setSite({ latinName: v })}
            dir="ltr"
          />
        </div>
        <Field label="شعار" value={site.tagline} onChange={(v) => setSite({ tagline: v })} />
        <Textarea
          label="متن فوتر"
          value={site.footerText}
          onChange={(v) => setSite({ footerText: v })}
          rows={2}
        />
        <div className="grid gap-5">
          <Field
            label="تیتر بخش «چرا ما»"
            value={site.aboutTitle}
            onChange={(v) => setSite({ aboutTitle: v })}
          />
          <Textarea
            label="متن بخش «چرا ما»"
            value={site.aboutText}
            onChange={(v) => setSite({ aboutText: v })}
            rows={4}
          />
        </div>
        <div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
          <Field
            label="عنوان سئو (Title)"
            value={site.seoTitle}
            onChange={(v) => setSite({ seoTitle: v })}
          />
          <Field
            label="توضیحات سئو (Description)"
            value={site.seoDescription}
            onChange={(v) => setSite({ seoDescription: v })}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="مزیت‌ها (چرا آکما)"
        onSave={() => saveKey("features")}
        saving={saving}
      >
        <div className="space-y-4">
          {features.map((f, i) => (
            <div key={i} className="grid items-end gap-3 rounded-2xl border border-line p-4 sm:grid-cols-[1fr_1fr_150px_44px]">
              <Field
                label="عنوان"
                value={f.title}
                onChange={(v) =>
                  setKey("features", features.map((x, j) => (j === i ? { ...x, title: v } : x)))
                }
              />
              <Field
                label="توضیح"
                value={f.desc}
                onChange={(v) =>
                  setKey("features", features.map((x, j) => (j === i ? { ...x, desc: v } : x)))
                }
              />
              <div>
                <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-muted">
                  <DynIcon name={f.icon} size={15} /> آیکون
                </span>
                <select
                  className="field"
                  value={f.icon}
                  onChange={(e) =>
                    setKey("features", features.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))
                  }
                >
                  {ICON_CHOICES.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setKey("features", features.filter((_, j) => j !== i))}
                className="grid size-10 place-items-center rounded-xl border border-line text-rose-400 hover:border-rose-400"
                aria-label="حذف"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setKey("features", [...features, { icon: "Sparkles", title: "", desc: "" }])}
            className="btn btn-ghost h-10 w-full text-xs"
          >
            <Plus size={14} /> افزودن مزیت
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="قیمت واحد محصولات"
        onSave={() => saveKey("priceTable")}
        saving={saving}
      >
        <div className="space-y-4">
          {priceTable.map((r, i) => (
            <div key={i} className="grid items-end gap-3 rounded-2xl border border-line p-4 sm:grid-cols-[1.4fr_1fr_1fr_44px]">
              <Field
                label="نام محصول"
                value={r.name}
                onChange={(v) =>
                  setKey("priceTable", priceTable.map((x, j) => (j === i ? { ...x, name: v } : x)))
                }
              />
              <Field
                label="توضیح کوتاه"
                value={r.note}
                onChange={(v) =>
                  setKey("priceTable", priceTable.map((x, j) => (j === i ? { ...x, note: v } : x)))
                }
              />
              <Field
                label="قیمت (تومان)"
                type="number"
                value={r.price}
                onChange={(v) =>
                  setKey(
                    "priceTable",
                    priceTable.map((x, j) => (j === i ? { ...x, price: Number(v) || 0 } : x)),
                  )
                }
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setKey("priceTable", priceTable.filter((_, j) => j !== i))}
                className="grid size-10 place-items-center rounded-xl border border-line text-rose-400 hover:border-rose-400"
                aria-label="حذف"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setKey("priceTable", [...priceTable, { name: "", note: "", price: 0 }])}
            className="btn btn-ghost h-10 w-full text-xs"
          >
            <Plus size={14} /> افزودن ردیف قیمت
          </button>
        </div>
      </SectionCard>

      <SectionCard title="مراحل سفارش" onSave={() => saveKey("steps")} saving={saving}>
        <div className="space-y-4">
          {steps.map((st, i) => (
            <div key={i} className="grid items-start gap-3 rounded-2xl border border-line p-4 sm:grid-cols-[200px_1fr_44px]">
              <Field
                label={`مرحله ${i + 1} — عنوان`}
                value={st.title}
                onChange={(v) =>
                  setKey("steps", steps.map((x, j) => (j === i ? { ...x, title: v } : x)))
                }
              />
              <Textarea
                label="توضیح"
                rows={2}
                value={st.desc}
                onChange={(v) =>
                  setKey("steps", steps.map((x, j) => (j === i ? { ...x, desc: v } : x)))
                }
              />
              <button
                type="button"
                onClick={() => setKey("steps", steps.filter((_, j) => j !== i))}
                className="mt-6 grid size-10 place-items-center rounded-xl border border-line text-rose-400 hover:border-rose-400"
                aria-label="حذف"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setKey("steps", [...steps, { title: "", desc: "" }])}
            className="btn btn-ghost h-10 w-full text-xs"
          >
            <Plus size={14} /> افزودن مرحله
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- امنیت ---------------- */
export function SecuritySection({ toast }: { toast: (m: string, ok?: boolean) => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          username: username || undefined,
          password: password || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast("اطلاعات ورود با موفقیت به‌روزرسانی شد");
        setCurrentPassword("");
        setPassword("");
        setUsername("");
      } else {
        toast(data.error ?? "خطا در ذخیره", false);
      }
    } catch {
      toast("خطا در ارتباط با سرور", false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title="تغییر نام کاربری و رمز عبور"
      desc="رمز عبور جدید باید حداقل ۱۰ کاراکتر باشد. برای اعمال تغییر، رمز فعلی الزامی است."
      onSave={submit}
      saving={saving}
    >
      <Field
        label="رمز عبور فعلی (الزامی)"
        type="password"
        value={currentPassword}
        onChange={setCurrentPassword}
        dir="ltr"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="نام کاربری جدید (اختیاری)"
          value={username}
          onChange={setUsername}
          dir="ltr"
          hint="حداقل ۴ کاراکتر"
        />
        <Field
          label="رمز عبور جدید (اختیاری)"
          type="password"
          value={password}
          onChange={setPassword}
          dir="ltr"
          hint="ترکیب حروف، عدد و علامت توصیه می‌شود"
        />
      </div>
    </SectionCard>
  );
}
