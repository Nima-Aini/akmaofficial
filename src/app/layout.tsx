import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/store";
import {
  DEFAULT_CONTACT,
  DEFAULT_SITE,
  DEFAULT_THEME,
  type ContactSettings,
  type SiteSettings,
  type ThemeSettings,
} from "@/lib/defaults";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingCallBar } from "@/components/floating-call-bar";
import { CartProvider } from "@/context/cart-context";
import { CartDrawer } from "@/components/cart-drawer";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-vazirmatn",
});

const RADIUS_MAP: Record<ThemeSettings["radius"], string> = {
  sm: "12px",
  md: "18px",
  lg: "24px",
  full: "34px",
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const site = { ...DEFAULT_SITE, ...(s.site as Partial<SiteSettings>) };
  return {
    title: site.seoTitle,
    description: site.seoDescription,
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const s = await getSettings();
  const theme = { ...DEFAULT_THEME, ...(s.theme as Partial<ThemeSettings>) };
  const site = { ...DEFAULT_SITE, ...(s.site as Partial<SiteSettings>) };
  const contact = { ...DEFAULT_CONTACT, ...(s.contact as Partial<ContactSettings>) };
  const phone = contact.phones[0] ?? "09033253065";

  return (
    <html
      lang="fa"
      dir="rtl"
      className={vazirmatn.variable}
      data-mode={theme.mode}
      data-btn={theme.buttonShape}
      style={
        {
          "--accent": theme.accent,
          "--accent2": theme.accent2,
          "--accent-contrast": theme.contrast ?? "#ffffff",
          "--radius": RADIUS_MAP[theme.radius] ?? "24px",
        } as React.CSSProperties
      }
    >
      <body className="grain min-h-dvh antialiased">
        <CartProvider>
          <SiteHeader name={site.name} latin={site.latinName} phone={phone} />
          <main>{children}</main>
          <SiteFooter site={site} contact={contact} />
          <FloatingCallBar phone={phone} />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
