"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  XCircle,
} from "lucide-react";
import { formatPrice, toFa } from "@/lib/format";
import type { OrderItem } from "@/db/schema";

type OrderData = {
  id: number;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  customerProvince: string;
  customerCity: string;
  customerAddress: string;
  postalCode: string;
  notes: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingCode: string;
  trackingLink: string;
  createdAt: string;
  updatedAt: string;
};

function TrackingContent() {
  const params = useSearchParams();
  const initialCode = params.get("code") || params.get("q") || "";

  const [query, setQuery] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchOrder = async (searchCode: string) => {
    if (!searchCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track?code=${encodeURIComponent(searchCode.trim())}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setOrder(data.order);
      } else {
        setOrder(null);
        setError(data.error || "سفارشی با این کد رهگیری پیدا نشد.");
      }
    } catch {
      setError("خطا در برقراری ارتباط. لطفاً اتصال اینترنت خود را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialCode) return;
    let active = true;
    fetch(`/api/orders/track?code=${encodeURIComponent(initialCode.trim())}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.ok) {
          setOrder(data.order);
        } else {
          setOrder(null);
          setError(data.error || "سفارشی با این کد رهگیری پیدا نشد.");
        }
      })
      .catch(() => {
        if (active) setError("خطا در برقراری ارتباط. لطفاً اتصال اینترنت خود را بررسی کنید.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(query);
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const statusConfig = {
    pending: {
      label: "در حال بررسی",
      color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      step: 1,
      desc: "سفارش شما در سامانه ثبت شده و در نوبت بررسی کارشناسان قرار دارد.",
    },
    processing: {
      label: "در حال آماده‌سازی و بسته‌بندی",
      color: "text-sky-400 bg-sky-400/10 border-sky-400/20",
      step: 2,
      desc: "اقلام سفارش شما در انبار آکما در حال کنترل کیفیت و بسته‌بندی است.",
    },
    shipped: {
      label: "ارسال شده",
      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      step: 3,
      desc: "سفارش شما بسته‌بندی و تحویل شرکت حمل‌ونقل (تیپاکس/پست) گردیده است.",
    },
    delivered: {
      label: "تحویل داده شده",
      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      step: 4,
      desc: "مرسوله به آدرس شما تحویل داده شد.",
    },
    cancelled: {
      label: "لغو شده",
      color: "text-rose-400 bg-rose-400/10 border-rose-400/20",
      step: 0,
      desc: "این سفارش لغو گردیده است.",
    },
  }[order?.status ?? "pending"];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
      <header className="text-center">
        <p className="text-xs font-bold text-accent">سامانه رهگیری سفارشات آکما</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">پیگیری وضعیت سفارش</h1>
        <p className="mx-auto mt-3 max-w-lg text-xs leading-6 text-muted">
          کد رهگیری دریافت شده پس از ثبت سفارش (مانند AKM-123456) یا شماره موبایلی که با آن ثبت سفارش کرده‌اید را وارد کنید.
        </p>
      </header>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
        <div className="card flex items-center gap-2 p-2 shadow-lg">
          <Search size={18} className="mr-3 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="کد رهگیری (مثلاً AKM-849201) یا شماره تماس…"
            className="flex-1 bg-transparent text-sm text-ink outline-hidden placeholder:text-muted"
            dir="auto"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn btn-primary h-11 px-6 text-xs font-bold disabled:opacity-50"
          >
            {loading ? "در حال جستجو…" : "استعلام"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-300">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Order Details View */}
      {order && (
        <div className="mt-10 space-y-6">
          {/* Status Banner */}
          <div className="card space-y-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
              <div>
                <span className="text-xs text-muted">کد رهگیری سفارش:</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-xl font-black text-ink">{order.trackingCode}</span>
                  <button
                    onClick={() => copyCode(order.trackingCode)}
                    className="grid size-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"
                    title="کپی کد رهگیری"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full border px-4 py-1.5 text-xs font-extrabold ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Timeline Progress */}
            {order.status !== "cancelled" ? (
              <div>
                <div className="relative flex items-center justify-between">
                  <div className="absolute top-1/2 right-0 left-0 -z-10 h-1 -translate-y-1/2 bg-line" />
                  <div
                    className="absolute top-1/2 right-0 -z-10 h-1 -translate-y-1/2 bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${((Math.min(statusConfig.step, 4) - 1) / 3) * 100}%`,
                    }}
                  />

                  {[
                    { step: 1, title: "ثبت سفارش", icon: Clock },
                    { step: 2, title: "آماده‌سازی", icon: Package },
                    { step: 3, title: "ارسال مرسوله", icon: Truck },
                    { step: 4, title: "تحویل", icon: CheckCircle2 },
                  ].map((st) => {
                    const isPassed = statusConfig.step >= st.step;
                    const isCurrent = statusConfig.step === st.step;
                    return (
                      <div key={st.step} className="flex flex-col items-center gap-2 bg-card px-2">
                        <div
                          className={`grid size-10 place-items-center rounded-full border-2 transition-all ${
                            isPassed
                              ? "border-emerald-500 bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                              : "border-line bg-surface text-muted"
                          } ${isCurrent ? "scale-110 ring-4 ring-emerald-500/20" : ""}`}
                        >
                          <st.icon size={18} />
                        </div>
                        <span
                          className={`text-center text-[11px] font-bold ${
                            isPassed ? "text-ink" : "text-muted"
                          }`}
                        >
                          {st.title}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-6 rounded-xl bg-surface p-3.5 text-center text-xs leading-6 text-muted">
                  {statusConfig.desc}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-4 text-xs font-bold text-rose-300">
                <XCircle size={18} />
                <span>این سفارش لغو شده است. جهت اطلاعات بیشتر با پشتیبانی آکما تماس حاصل فرمایید.</span>
              </div>
            )}

            {/* Courier & Tipax Tracking Link */}
            {(order.trackingLink || order.shippingCode) && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-black text-emerald-400">
                      <Truck size={16} /> اطلاعات رهگیری پستی و بارنامه
                    </p>
                    {order.shippingCode && (
                      <p className="mt-1 text-xs text-muted">
                        شماره بارنامه / کد رهگیری مرسوله:{" "}
                        <span className="font-mono font-black text-ink">{order.shippingCode}</span>
                      </p>
                    )}
                  </div>

                  {order.trackingLink && (
                    <a
                      href={order.trackingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary h-11 px-5 text-xs font-black"
                    >
                      <ExternalLink size={14} />
                      رهگیری آنلاین مرسوله در تیپاکس / سامانه رهگیری
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Customer & Items Details */}
          <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
            {/* Delivery Info */}
            <div className="card space-y-4 p-6">
              <h3 className="text-sm font-extrabold">اطلاعات ارسال</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-muted">تحویل‌گیرنده:</span>
                  <span className="font-bold text-ink">{order.customerName}</span>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-muted">شماره تماس:</span>
                  <span className="font-mono font-bold text-ink">{order.customerPhone}</span>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-muted">شهر و استان:</span>
                  <span className="font-bold text-ink">
                    {[order.customerProvince, order.customerCity].filter(Boolean).join(" — ") || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-muted">آدرس کامل:</span>
                  <p className="mt-1 text-[11px] leading-5 text-ink">{order.customerAddress}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="card space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold">اقلام سفارش</h3>
                <span className="text-xs text-muted">
                  مبلغ کل:{" "}
                  <strong className="font-black text-accent">{formatPrice(order.totalAmount)}</strong> تومان
                </span>
              </div>

              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface/50 p-2.5"
                  >
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-line bg-card p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-bold text-ink">{item.productName}</p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {toFa(item.quantity)} عدد × {formatPrice(item.price)} تومان
                      </p>
                    </div>
                    <p className="text-xs font-extrabold text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Link href="/" className="btn btn-ghost h-11 px-6 text-xs">
              <ArrowLeft size={14} /> بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-muted">
          در حال بارگذاری سامانه پیگیری…
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
