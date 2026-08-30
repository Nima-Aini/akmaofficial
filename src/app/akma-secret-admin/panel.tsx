"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Gauge,
  ImageIcon,
  Loader2,
  LogOut,
  MessageSquareText,
  Paintbrush,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import {
  ContactSection,
  ContentSection,
  DashboardSection,
  HeroBannersSection,
  SecuritySection,
  ThemeSection,
} from "./sections";
import { ProductsSection, type AdminProduct } from "./products-section";

const TABS = [
  { key: "dashboard", label: "داشبورد", icon: Gauge },
  { key: "products", label: "محصولات", icon: Boxes },
  { key: "hero", label: "هیرو و بنرها", icon: ImageIcon },
  { key: "theme", label: "تم و ظاهر", icon: Paintbrush },
  { key: "contact", label: "تماس با ما", icon: PhoneCall },
  { key: "content", label: "محتوای سایت", icon: MessageSquareText },
  { key: "security", label: "امنیت", icon: ShieldCheck },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [error, setError] = useState("");

  const toast = useCallback((text: string, ok = true) => {
    setToastMsg({ text, ok });
    window.setTimeout(() => setToastMsg(null), 3200);
  }, []);

  useEffect(() => {
    fetch("/api/admin/bootstrap")
      .then(async (r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json();
      })
      .then((d) => {
        setSettings(d.settings);
        setProducts(d.products);
      })
      .catch(() => setError("خطا در دریافت اطلاعات؛ لطفاً دوباره وارد شوید."));
  }, []);

  const setKey = useCallback((key: string, value: unknown) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }, []);

  const saveKey = useCallback(
    async (key: string) => {
      if (!settings) return;
      setSaving(true);
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: settings[key] }),
        });
        const data = await res.json();
        if (res.ok && data.ok) toast("ذخیره شد — روی سایت اعمال گردید");
        else toast(data.error ?? "خطا در ذخیره", false);
      } catch {
        toast("خطا در ارتباط با سرور", false);
      } finally {
        setSaving(false);
      }
    },
    [settings, toast],
  );

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.refresh();
  }

  if (error) {
    return (
      <div className="grid min-h-[50vh] place-items-center px-5">
        <p className="card px-8 py-6 text-sm font-bold text-rose-400">{error}</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 size={30} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-accent">AKMA CONTROL CENTER</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">پنل مدیریت فروشگاه</h1>
        </div>
        <button onClick={logout} className="btn btn-ghost h-11 px-6 text-xs">
          <LogOut size={15} />
          خروج از حساب
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-60 lg:shrink-0">
          <nav className="card flex gap-1.5 overflow-x-auto p-2.5 lg:sticky lg:top-24 lg:flex-col">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex min-w-max items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                  tab === t.key
                    ? "bg-gradient-to-l from-accent2 to-accent text-on-accent shadow-lg shadow-accent/20"
                    : "text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {tab === "dashboard" && (
            <DashboardSection settings={settings} productCount={products.filter((p) => p.active).length} />
          )}
          {tab === "products" && (
            <ProductsSection products={products} setProducts={setProducts} toast={toast} />
          )}
          {tab === "hero" && (
            <HeroBannersSection settings={settings} setKey={setKey} saveKey={saveKey} saving={saving} />
          )}
          {tab === "theme" && (
            <ThemeSection settings={settings} setKey={setKey} saveKey={saveKey} saving={saving} />
          )}
          {tab === "contact" && (
            <ContactSection settings={settings} setKey={setKey} saveKey={saveKey} saving={saving} />
          )}
          {tab === "content" && (
            <ContentSection settings={settings} setKey={setKey} saveKey={saveKey} saving={saving} />
          )}
          {tab === "security" && <SecuritySection toast={toast} />}
        </div>
      </div>

      {/* toast */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full border px-6 py-3.5 text-xs font-bold shadow-2xl backdrop-blur-xl ${
            toastMsg.ok
              ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
              : "border-rose-400/40 bg-rose-400/15 text-rose-300"
          }`}
        >
          {toastMsg.text}
        </div>
      )}
    </div>
  );
}
