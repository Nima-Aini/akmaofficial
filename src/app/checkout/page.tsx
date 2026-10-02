"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Check,
  Search,
  User,
  CreditCard,
  Lock,
  Sparkle,
  LogIn,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatPrice, normalizePhone, toEnDigits, toFa } from "@/lib/format";

type CustomerInfo = {
  id?: number;
  phone?: string;
  name?: string;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  companyName?: string;
  isWholesale?: boolean;
};

export default function CheckoutPage() {
  const { items, totalAmount, totalCount, clearCart, cartMode, totalWholesaleSavings } = useCart();

  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Quick Inline OTP login states for non-authenticated customers
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Order Details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "card_to_card">("online");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{
    trackingCode: string;
    totalAmount: number;
    customerName: string;
    orderType: string;
    paymentLink?: string;
    paymentError?: string;
    paymentFailed?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Check auth session
  useEffect(() => {
    fetch("/api/customer/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.customer) {
          setCustomer(data.customer);
          setName(data.customer.name || "");
          setPhone(data.customer.phone || "");
          setProvince(data.customer.province || "");
          setCity(data.customer.city || "");
          setAddress(data.customer.address || "");
          setPostalCode(data.customer.postalCode || "");
          setCompanyName(data.customer.companyName || "");
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecking(false));
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const clean = normalizePhone(otpPhone);
    if (!clean || clean.length < 10) {
      setAuthError("لطفاً شماره موبایل معتبر (۱۱ رقم) وارد کنید.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", phone: clean }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setOtpSent(true);
        if (data.demoCode) setDemoCodeHint(data.demoCode);
      } else {
        setAuthError(data.error || "خطا در ارسال کد تأیید");
      }
    } catch {
      setAuthError("خطا در برقراری ارتباط با سرور");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const clean = normalizePhone(otpPhone);
    if (!otpCode.trim()) {
      setAuthError("لطفاً کد تأیید دریافتی را وارد کنید.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", phone: clean, code: otpCode }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.customer) {
        setCustomer(data.customer);
        setName(data.customer.name || "");
        setPhone(data.customer.phone || clean);
        setProvince(data.customer.province || "");
        setCity(data.customer.city || "");
        setAddress(data.customer.address || "");
        setPostalCode(data.customer.postalCode || "");
        setCompanyName(data.customer.companyName || "");
      } else {
        setAuthError(data.error || "کد تأیید نادرست است");
      }
    } catch {
      setAuthError("خطا در اتصال به سرور");
    } finally {
      setOtpLoading(false);
    }
  };

  const isWholesaleOrder = items.some((it) => it.mode === "wholesale") || cartMode === "wholesale";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customer) {
      setError("برای تکمیل خرید، لطفاً ابتدا شماره همراه خود را وارد و تأیید نمایید.");
      return;
    }

    const cleanPhone = normalizePhone(phone || customer.phone || "");
    if (!name.trim()) {
      setError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("لطفاً شماره تماس معتبر (۱۰ یا ۱۱ رقم) وارد کنید.");
      return;
    }
    if (!address.trim() || address.trim().length < 8) {
      setError("لطفاً آدرس دقیق پستی جهت ارسال را بنویسید.");
      return;
    }
    if (items.length === 0) {
      setError("سبد خرید شما خالی است.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: isWholesaleOrder ? "wholesale" : "retail",
          customerName: name.trim(),
          customerPhone: cleanPhone,
          customerProvince: province.trim(),
          customerCity: city.trim(),
          customerAddress: address.trim(),
          postalCode: toEnDigits(postalCode).trim(),
          notes: notes.trim(),
          paymentMethod,
          items,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        // Also save profile details to customer account for convenience
        fetch("/api/customer/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            province: province.trim(),
            city: city.trim(),
            address: address.trim(),
            postalCode: toEnDigits(postalCode).trim(),
            companyName: companyName.trim(),
          }),
        }).catch(() => {});

        if (data.paymentError) {
          setSuccessOrder({
            trackingCode: data.trackingCode,
            totalAmount: data.order?.totalAmount || totalAmount,
            customerName: name.trim(),
            orderType: isWholesaleOrder ? "خرید عمده و همکاری" : "خرید تکی",
            paymentLink: "",
            paymentError: data.paymentError,
            paymentFailed: true,
          });
        } else if (data.paymentLink) {
          clearCart();
          window.location.href = data.paymentLink;
        } else {
          setSuccessOrder({
            trackingCode: data.trackingCode,
            totalAmount: data.order?.totalAmount || totalAmount,
            customerName: name.trim(),
            orderType: isWholesaleOrder ? "خرید عمده و همکاری" : "خرید تکی",
            paymentLink: data.paymentLink,
          });
          clearCart();
        }
      } else {
        setError(data.error || "خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.");
      }
    } catch {
      setError("خطا در اتصال به سرور. اینترنت خود را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  const copyTracking = () => {
    if (successOrder?.trackingCode) {
      navigator.clipboard.writeText(successOrder.trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // SUCCESS VIEW
  if (successOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-emerald-500/20 bg-white p-8 sm:p-12 shadow-xl">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={44} strokeWidth={2.2} />
          </div>

          <span className="mt-6 inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-black text-emerald-700">
            ثبت موفق سفارش ({successOrder.orderType})
          </span>

          <h1 className="mt-3 text-2xl font-black text-[#1C1816] sm:text-3xl">
            {successOrder.customerName} عزیز، سفارش شما با موفقیت ثبت شد!
          </h1>
          <p className="mt-3 text-xs sm:text-sm leading-6 text-[#78716C]">
            سفارش شما در پایگاه داده آکما ذخیره شد و در پنل کاربری شما قرار گرفت.
          </p>

          {/* Tracking Code Highlight Box */}
          <div className="mt-8 rounded-2xl border-2 border-dashed border-[#8E111E]/30 bg-[#FAF8F5] p-6">
            <p className="text-xs font-bold text-[#78716C]">کد رهگیری اختصاصی مرسوله:</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-black tracking-wider text-[#8E111E] sm:text-4xl">
                {successOrder.trackingCode}
              </span>
              <button
                type="button"
                onClick={copyTracking}
                className="grid size-10 place-items-center rounded-xl border border-[#E7E3DC] text-[#78716C] hover:text-[#1C1816] bg-white shadow-xs"
                title="کپی کد رهگیری"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-[#78716C]">
              این سفارش هم‌اکنون در بخش «سفارش‌های من» در حساب کاربری شما قابل مشاهده و پیگیری لحظه‌ای است.
            </p>
          </div>

          {/* Payment Link Trigger Banner */}
          {successOrder.paymentLink && (
            <div className="mt-6 rounded-2xl bg-[#8E111E]/5 border border-[#8E111E]/20 p-5 text-center">
              <p className="text-xs font-bold text-[#8E111E]">
                مبلغ قابل پرداخت: {formatPrice(successOrder.totalAmount)} تومان
              </p>
              <a
                href={successOrder.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-3 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white px-8 py-3.5 text-xs font-black shadow-md shadow-[#8E111E]/25 transition-transform active:scale-95"
              >
                <CreditCard size={16} />
                <span>پرداخت آنلاین از درگاه معتبر شاپرک</span>
              </a>
            </div>
          )}

          {/* Payment Failed Warning & Retry Banner */}
          {successOrder.paymentFailed && (
            <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-5 text-right space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                <span>سفارش ثبت شد، اما اتصال به درگاه پرداخت ناموفق بود:</span>
              </div>
              <p className="text-xs text-amber-800 font-mono bg-amber-100/50 p-2.5 rounded-xl border border-amber-200">
                {successOrder.paymentError || "خطا در برقراری ارتباط با شبکه آنلاین زیبال / شاپرک"}
              </p>

              {retryError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {retryError}
                </p>
              )}

              <button
                type="button"
                onClick={async () => {
                  setRetryLoading(true);
                  setRetryError(null);
                  try {
                    const res = await fetch("/api/orders/retry-payment", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ trackingCode: successOrder.trackingCode }),
                    });
                    const data = await res.json();
                    if (res.ok && data.ok && data.paymentLink) {
                      window.location.href = data.paymentLink;
                    } else {
                      setRetryError(data.error || "خطا در اتصال مجدد به درگاه پرداخت");
                    }
                  } catch {
                    setRetryError("خطا در برقراری ارتباط با سرور");
                  } finally {
                    setRetryLoading(false);
                  }
                }}
                disabled={retryLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white py-3.5 px-6 text-xs font-black shadow-md shadow-[#8E111E]/20 transition-transform active:scale-95 disabled:opacity-50"
              >
                <CreditCard size={16} />
                <span>{retryLoading ? "در حال دریافت لینک جدید درگاه…" : "پرداخت مجدد آنلاین"}</span>
              </button>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/account"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1C1816] hover:bg-black text-white h-12 px-6 text-xs font-black shadow-xs"
            >
              <User size={15} />
              مشاهده در حساب کاربری من
            </Link>
            <Link
              href={`/tracking?code=${successOrder.trackingCode}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#2A2421] h-12 px-6 text-xs font-bold"
            >
              <Search size={15} />
              پیگیری عمومی مرسوله
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART VIEW
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-[#E7E3DC] bg-white p-10 shadow-xs">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#FAF8F5] text-[#8C827A]">
            <ShoppingBag size={28} />
          </div>
          <h1 className="mt-5 text-xl font-black text-[#1C1816]">سبد خرید شما در حال حاضر خالی است</h1>
          <p className="mt-2 text-xs leading-6 text-[#78716C]">
            برای ثبت سفارش ابتدا کالاهای موردنظر خود را از کاتالوگ فروشگاه انتخاب فرمایید.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/products?mode=retail"
              className="inline-flex items-center rounded-full bg-[#8E111E] text-white px-6 py-3 text-xs font-black shadow-xs"
            >
              مشاهده محصولات تکی
            </Link>
            <Link
              href="/products?mode=wholesale"
              className="inline-flex items-center rounded-full border border-[#E7E3DC] bg-white text-[#2A2421] px-6 py-3 text-xs font-black shadow-xs"
            >
              خرید عمده و همکاری
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <header className="text-center space-y-1">
        <span className="inline-block rounded-full bg-[#8E111E]/10 px-3.5 py-1 text-xs font-black text-[#8E111E]">
          {isWholesaleOrder ? "ثبت سفارش عمده و همکاری" : "ثبت نهایی سفارش تکی"}
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#1C1816]">
          مشخصات گیرنده و صدور پیش‌فاکتور
        </h1>
        <p className="text-xs text-[#78716C]">
          اطلاعات دقیق ارسال را وارد فرمایید تا فاکتور رسمی و لینک پرداخت صادر گردد.
        </p>
      </header>

      {/* Main Grid: Form vs Cart Order Summary */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">

          {/* STEP 1: Authentication Guard */}
          <div className="rounded-[2rem] border border-[#E7E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-4">
              <h2 className="flex items-center gap-2.5 text-base font-black text-[#1C1816]">
                <span className="grid size-7 place-items-center rounded-full bg-[#8E111E] text-xs font-black text-white">
                  ۱
                </span>
                <span>حساب کاربری خریدار</span>
              </h2>
              {customer && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={15} /> وارد شده‌اید
                </span>
              )}
            </div>

            {authChecking ? (
              <div className="py-6 text-center text-xs text-[#78716C]">
                در حال بررسی وضعیت کاربری…
              </div>
            ) : customer ? (
              <div className="flex items-center justify-between rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] p-4 text-xs">
                <div>
                  <p className="font-black text-[#1C1816]">{customer.name || "کاربر آکما"}</p>
                  <p className="text-[#78716C] mt-0.5" dir="ltr">{customer.phone}</p>
                </div>
                <Link
                  href="/account"
                  className="text-xs font-bold text-[#8E111E] hover:underline"
                >
                  ویرایش پروفایل
                </Link>
              </div>
            ) : (
              /* Inline Login Form for non-logged in users */
              <div className="rounded-2xl bg-[#FAF8F5] border border-[#8E111E]/20 p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8E111E]">
                  <Lock size={15} />
                  <span>ثبت سفارش نیازمند ورود به حساب کاربری است (احراز هویت پیامکی).</span>
                </div>

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <label className="block text-xs font-bold text-[#4A423D]">
                      شماره تلفن همراه خود را وارد کنید:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        dir="ltr"
                        placeholder="09123456789"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        className="flex-1 rounded-xl border border-[#E7E3DC] bg-white px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E]"
                      />
                      <button
                        type="submit"
                        disabled={otpLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#8E111E] text-white px-5 py-2.5 text-xs font-black shadow-xs hover:bg-[#720C17] disabled:opacity-50"
                      >
                        <LogIn size={15} />
                        <span>{otpLoading ? "ارسال…" : "دریافت کد"}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs text-[#78716C]">
                      <span>کد ۵ رقمی به {otpPhone} ارسال شد:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setDemoCodeHint(null);
                        }}
                        className="text-[#8E111E] underline"
                      >
                        تغییر شماره
                      </button>
                    </div>

                    {demoCodeHint && (
                      <p className="text-[11px] font-bold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        کد آزمایشی برای تست سریع: <span className="font-mono">{demoCodeHint}</span>
                      </p>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        maxLength={5}
                        placeholder="12345"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="flex-1 rounded-xl border border-[#E7E3DC] bg-white px-4 py-2.5 text-sm font-mono tracking-widest text-center text-[#1C1816] outline-hidden focus:border-[#8E111E]"
                      />
                      <button
                        type="submit"
                        disabled={otpLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-6 py-2.5 text-xs font-black shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check size={16} />
                        <span>{otpLoading ? "تأیید…" : "ورود به حساب"}</span>
                      </button>
                    </div>
                  </form>
                )}

                {authError && (
                  <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg">
                    {authError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Shipping & Delivery Details */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-[2rem] border border-[#E7E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-5">
              <h2 className="flex items-center gap-2.5 text-base font-black text-[#1C1816] border-b border-[#F0ECE4] pb-4">
                <span className="grid size-7 place-items-center rounded-full bg-[#8E111E] text-xs font-black text-white">
                  ۲
                </span>
                <span>اطلاعات آدرس و تحویل‌گیرنده</span>
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A423D] mb-1.5">
                    نام و نام خانوادگی تحویل‌گیرنده *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: علی رضایی"
                    className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A423D] mb-1.5">
                    شماره موبایل جهت هماهنگی و ارسال پیامک *
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
                  />
                </div>
              </div>

              {isWholesaleOrder && (
                <div>
                  <label className="block text-xs font-bold text-[#4A423D] mb-1.5">
                    نام فروشگاه / شرکت / مرکز پخش (اختیاری جهت درج در فاکتور رسمی)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: فروشگاه کفش اسپرت پارس"
                    className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A423D] mb-1.5">استان</label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="مثال: تهران"
                    className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A423D] mb-1.5">شهر</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثال: تهران"
                    className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A423D] mb-1.5">
                  آدرس دقیق پستی *
                </label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="خیابان، کوچه، پلاک، واحد…"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] p-3 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A423D] mb-1.5">
                    کد پستی ۱۰ رقمی
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={10}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="1234567890"
                    className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A423D] mb-1.5">
                    یادداشت یا نحوه ارسال (تیپاکس / باربری / پست)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="توضیحات تکمیلی یا درخواست ارسال با باربری…"
                    className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: Payment Method */}
            <div className="rounded-[2rem] border border-[#E7E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="flex items-center gap-2.5 text-base font-black text-[#1C1816] border-b border-[#F0ECE4] pb-4">
                <span className="grid size-7 place-items-center rounded-full bg-[#8E111E] text-xs font-black text-white">
                  ۳
                </span>
                <span>انتخاب روش تسویه‌حساب</span>
              </h2>

              <div className="grid sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setPaymentMethod("online")}
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-colors ${
                    paymentMethod === "online"
                      ? "border-[#8E111E] bg-[#8E111E]/5"
                      : "border-[#E7E3DC] bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="pm"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    className="mt-1 accent-[#8E111E]"
                  />
                  <div>
                    <span className="block text-xs font-black text-[#1C1816]">
                      درگاه پرداخت آنلاین شاپرک (آنی)
                    </span>
                    <span className="block text-[11px] text-[#78716C] mt-1">
                      صدور لینک و اتصال آنی به شبکه پرداخت شتاب با تمامی کارت‌های عضو شتاب
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod("card_to_card")}
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-colors ${
                    paymentMethod === "card_to_card"
                      ? "border-[#8E111E] bg-[#8E111E]/5"
                      : "border-[#E7E3DC] bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="pm"
                    checked={paymentMethod === "card_to_card"}
                    onChange={() => setPaymentMethod("card_to_card")}
                    className="mt-1 accent-[#8E111E]"
                  />
                  <div>
                    <span className="block text-xs font-black text-[#1C1816]">
                      کارت‌به‌کارت و هماهنگی تلفنی
                    </span>
                    <span className="block text-[11px] text-[#78716C] mt-1">
                      ثبت سفارش + ارسال شماره حساب توسط کارشناس فروش جهت حواله
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !customer}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white h-14 text-sm font-black shadow-lg shadow-[#8E111E]/25 transition-transform active:scale-95 disabled:opacity-50"
            >
              <CreditCard size={18} />
              <span>
                {loading
                  ? "در حال ثبت سفارش…"
                  : !customer
                    ? "لطفاً ابتدا با شماره همراه وارد شوید"
                    : `تأیید نهایی و صدور فاکتور — ${formatPrice(totalAmount)} تومان`}
              </span>
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-[#E7E3DC] bg-white p-6 shadow-xs space-y-5 sticky top-28">
            <h3 className="text-sm font-black text-[#1C1816] border-b border-[#F0ECE4] pb-3">
              خلاصه اقلام فاکتور ({toFa(totalCount)} قلم)
            </h3>

            <div className="max-h-72 overflow-y-auto space-y-3 divide-y divide-[#F0ECE4]">
              {items.map((it) => (
                <div key={it.productId} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="size-14 rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] p-1 shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.productImage}
                      alt={it.productName}
                      className="size-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 text-xs font-black text-[#1C1816]">
                      {it.productName}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-[#78716C] mt-1">
                      <span>تعداد: {toFa(it.quantity)}</span>
                      <span className="font-mono text-xs font-bold text-[#8E111E]">
                        {formatPrice(it.price * it.quantity)} ت
                      </span>
                    </div>
                    {it.tierLabel && (
                      <span className="inline-block text-[9px] text-[#8E111E] font-bold mt-0.5">
                        {it.tierLabel}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalWholesaleSavings > 0 && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between font-bold">
                <span>سود شما از تخفیف عمده:</span>
                <span>{formatPrice(totalWholesaleSavings)} تومان</span>
              </div>
            )}

            <div className="border-t border-[#F0ECE4] pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#78716C]">
                <span>جمع اقلام:</span>
                <span className="font-mono">{formatPrice(totalAmount)} تومان</span>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span className="text-emerald-600 font-bold">محاسبه در مقصد (تیپاکس)</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#8E111E] border-t border-[#F0ECE4] pt-3">
                <span>مبلغ نهایی فاکتور:</span>
                <span className="font-mono">{formatPrice(totalAmount)} تومان</span>
              </div>
            </div>

            <div className="pt-2 space-y-2 text-[11px] text-[#78716C] border-t border-[#F0ECE4]">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-[#8E111E] shrink-0" />
                <span>ارسال مستقیم از انبار مرکزی آکما با بسته‌بندی صنعتی</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#8E111E] shrink-0" />
                <span>ضمانت سلامت فیزیکی مرسوله و تطابق کامل کالا</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
