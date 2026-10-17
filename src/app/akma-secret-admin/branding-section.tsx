"use client";
/* eslint-disable @next/next/no-img-element */

import { DEFAULT_BRANDING, DEFAULT_SITE, type BrandingSettings, type SiteSettings } from "@/lib/defaults";
import { Field, ImageUploader, SectionCard } from "./fields";

export function BrandingSection({
  settings,
  setKey,
  saveKey,
  saving,
}: {
  settings: Record<string, unknown>;
  setKey: (key: string, value: unknown) => void;
  saveKey: (key: string) => void;
  saving: boolean;
}) {
  const branding = { ...DEFAULT_BRANDING, ...(settings.branding as Partial<BrandingSettings>) };
  const site = { ...DEFAULT_SITE, ...(settings.site as Partial<SiteSettings>) };
  const set = (patch: Partial<BrandingSettings>) => setKey("branding", { ...branding, ...patch });
  const upload = (field: keyof BrandingSettings) => (value: string | string[]) => set({ [field]: typeof value === "string" ? value : value[0] ?? "" });
  const desktop = branding.desktopHeaderLogo || branding.lightBackgroundLogo;
  const mobile = branding.mobileHeaderLogo || desktop;
  const footer = branding.footerLogo || branding.darkBackgroundLogo || desktop;

  return <SectionCard title="مدیریت لوگو و هویت برند" desc="لوگوهای آکما، favicon و تصویر اشتراک‌گذاری را بدون تغییر کد مدیریت کنید. نماد رسمی eNAMAD مستقل است و تغییری نمی‌کند." onSave={() => saveKey("branding")} saving={saving}>
    <div className="grid gap-5 lg:grid-cols-2">
      <ImageUploader label="لوگوی سربرگ دسکتاپ" value={branding.desktopHeaderLogo} onChange={upload("desktopHeaderLogo")} kind="branding" guideline="logoDesktop" />
      <ImageUploader label="لوگوی سربرگ موبایل" value={branding.mobileHeaderLogo} onChange={upload("mobileHeaderLogo")} kind="branding" guideline="logoMobile" hint="اگر خالی باشد، لوگوی دسکتاپ و سپس لوگوی متنی فعلی نمایش داده می‌شود." />
      <ImageUploader label="لوگوی فوتر" value={branding.footerLogo} onChange={upload("footerLogo")} kind="branding" guideline="logoDesktop" />
      <ImageUploader label="لوگو مخصوص پس‌زمینه تیره" value={branding.darkBackgroundLogo} onChange={upload("darkBackgroundLogo")} kind="branding" guideline="logoDesktop" />
      <ImageUploader label="لوگو مخصوص پس‌زمینه روشن" value={branding.lightBackgroundLogo} onChange={upload("lightBackgroundLogo")} kind="branding" guideline="logoDesktop" />
      <ImageUploader label="آیکون تب مرورگر" value={branding.favicon} onChange={upload("favicon")} kind="branding" guideline="brandIcon" />
      <ImageUploader label="آیکون نصب سایت روی موبایل" value={branding.appIcon} onChange={upload("appIcon")} kind="branding" guideline="brandIcon" />
      <ImageUploader label="تصویر اشتراک‌گذاری سایت" value={branding.socialImage} onChange={upload("socialImage")} kind="branding" guideline="socialShare" />
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="عرض لوگوی دسکتاپ (پیکسل)" type="number" dir="ltr" value={branding.desktopLogoWidth} onChange={(value) => set({ desktopLogoWidth: Math.min(240, Math.max(60, Number(value) || 120)) })} hint="محدوده امن: ۶۰ تا ۲۴۰ پیکسل" />
      <Field label="عرض لوگوی موبایل (پیکسل)" type="number" dir="ltr" value={branding.mobileLogoWidth} onChange={(value) => set({ mobileLogoWidth: Math.min(180, Math.max(54, Number(value) || 94)) })} hint="محدوده امن: ۵۴ تا ۱۸۰ پیکسل" />
    </div>
    <div className="grid gap-4 lg:grid-cols-2" data-branding-preview>
      <BrandPreview label="پیش‌نمایش سربرگ دسکتاپ" src={desktop} fallback={site.latinName} background="bg-[#FAF8F5]" width={branding.desktopLogoWidth} />
      <BrandPreview label="پیش‌نمایش سربرگ موبایل" src={mobile} fallback={site.latinName} background="bg-[#FAF8F5]" width={branding.mobileLogoWidth} />
      <BrandPreview label="پیش‌نمایش فوتر / پس‌زمینه تیره" src={footer} fallback={site.latinName} background="bg-[#191919] text-white" width={branding.desktopLogoWidth} />
      <BrandPreview label="پیش‌نمایش پس‌زمینه روشن" src={branding.lightBackgroundLogo || desktop} fallback={site.latinName} background="bg-white" width={branding.desktopLogoWidth} />
      <BrandPreview label="پیش‌نمایش Favicon" src={branding.favicon} fallback="A" background="bg-white" width={64} square />
    </div>
  </SectionCard>;
}

function BrandPreview({ label, src, fallback, background, width, square = false }: { label: string; src: string; fallback: string; background: string; width: number; square?: boolean }) {
  return <div className={`rounded-2xl border border-line p-4 ${background}`}><p className="mb-3 text-[10px] font-bold opacity-70">{label}</p><div className="flex min-h-24 items-center justify-center">{src ? <img src={src} alt={label} className={`${square ? "aspect-square" : "max-h-16"} object-contain`} style={{ width }} /> : <span className="text-2xl font-black text-[#8E111E]">{fallback}</span>}</div></div>;
}
