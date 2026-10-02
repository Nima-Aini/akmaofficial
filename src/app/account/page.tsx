"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  Clock,
  Phone,
  CreditCard,
  Truck,
  ExternalLink,
  LogOut,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building,
  RotateCcw,
  Sparkle,
} from "lucide-react";
import { formatPrice, toFa, normalizePhone, toEnDigits } from "@/lib/format";
import { formatJalaliDate } from "@/lib/jalali-date";
import type { CustomerUserRow, OrderRow } from "@/db/schema";
import { useCart } from "@/context/cart-context";

export default function AccountPage() {
  const { addItem } = useCart();
  const [customer, setCustomer] = useState<CustomerUserRow | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "wholesale">("orders");

  // Auth form states if not logged in
  const [phoneInput, setPhoneInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Profile Edit States
  const [profileName, setProfileName] = useState("");
  const [profileProvince, setProfileProvince] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profilePostalCode, setProfilePostalCode] = useState("");
  const [profileCompany, setProfileCompany] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const authRes = await fetch("/api/customer/auth");
      const authData = await authRes.json();
      if (authData.authenticated && authData.customer) {
        setCustomer(authData.customer);
        setProfileName(authData.customer.name || "");
        setProfileProvince(authData.customer.province || "");
        setProfileCity(authData.customer.city || "");
        setProfileAddress(authData.customer.address || "");
        setProfilePostalCode(authData.customer.postalCode || "");
        setProfileCompany(authData.customer.companyName || "");

        const ordersRes = await fetch("/api/customer/orders");
        const ordersData = await ordersRes.json();
        if (ordersData.ok) {
          setOrders(ordersData.orders || []);
        }
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchCustomerData();
    });
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const clean = normalizePhone(phoneInput);
    if (!clean || clean.length < 10) {
      setAuthError("شماره همراه وارد شده معتبر نیست.");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", phone: clean }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setOtpSent(true);
        if (data.demoCode) setDemoCode(data.demoCode);
      } else {
        setAuthError(data.error || "خطا در ارسال کد تأیید");
      }
    } catch {
      setAuthError("خطا در ارتباط با سرور");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const clean = normalizePhone(phoneInput);
    if (!otpCode.trim()) {
      setAuthError("لطفاً کد تأیید ۵ رقمی را وارد کنید.");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", phone: clean, code: otpCode }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCustomer(data.customer);
        fetchCustomerData();
      } else {
        setAuthError(data.error || "کد تأیید نامعتبر است");
      }
    } catch {
      setAuthError("خطا در ارتباط با سرور");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/customer/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setCustomer(null);
    setOrders([]);
    setOtpSent(false);
    setPhoneInput("");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName.trim(),
          province: profileProvince.trim(),
          city: profileCity.trim(),
          address: profileAddress.trim(),
          postalCode: toEnDigits(profilePostalCode).trim(),
          companyName: profileCompany.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCustomer(data.customer);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      // error
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReorder = (order: OrderRow) => {
    if (!order.items || !Array.isArray(order.items)) return;
    for (const item of order.items) {
      addItem(
        {
          id: item.productId,
          name: item.productName,
          images: [item.productImage],
          price: item.price,
          unitPrice: item.unitPrice,
        },
        item.quantity,
        item.mode || (order.orderType === "wholesale" ? "wholesale" : "retail"),
      );
    }
  };

  const copyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Status Badge Mapping
  const statusMeta = {
    pending: { label: "در انتظار بررسی", color: "text-amber-700 bg-amber-50 border-amber-200" },
    processing: { label: "در حال بسته‌بندی", color: "text-sky-700 bg-sky-50 border-sky-200" },
    shipped: { label: "تحویل تیپاکس شده", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    delivered: { label: "تحویل مشتری گردید", color: "text-emerald-800 bg-emerald-100 border-emerald-300" },
    cancelled: { label: "لغو گردیده", color: "text-rose-700 bg-rose-50 border-rose-200" },
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-xs text-[#78716C]">
        در حال بارگذاری حساب کاربری…
      </div>
    );
  }

  // NON-AUTHENTICATED VIEW: Login / Signup
  if (!customer) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-[2.5rem] border border-[#E7E3DC] bg-white p-8 sm:p-10 shadow-xl space-y-6 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#8E111E]/10 text-[#8E111E]">
            <User size={32} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-[#1C1816]">ورود به حساب کاربری آکما</h1>
            <p className="text-xs text-[#78716C] mt-2 leading-relaxed">
              شماره تلفن همراه خود را وارد کنید تا کد ورود یکبار مصرف ارسال گردد.
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-[#4A423D] mb-1.5">
                  شماره موبایل
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="09123456789"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-3 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
                />
              </div>

              {authError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white h-12 text-xs font-black shadow-md shadow-[#8E111E]/20 transition-transform active:scale-95 disabled:opacity-50"
              >
                <span>{authLoading ? "در حال ارسال…" : "دریافت کد تأیید ورود"}</span>
                <ChevronLeft size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-right animate-in fade-in duration-200">
              <div className="text-xs text-[#78716C] flex items-center justify-between">
                <span>کد ۵ رقمی به {phoneInput} ارسال شد:</span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setDemoCode(null);
                  }}
                  className="text-[#8E111E] underline font-bold"
                >
                  ویرایش شماره
                </button>
              </div>

              {demoCode && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 text-center font-bold">
                  کد ورود آزمایشی: <span className="font-mono text-base">{demoCode}</span>
                </div>
              )}

              <div>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={5}
                  placeholder="12345"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-3 text-base text-center font-mono tracking-widest text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
                />
              </div>

              {authError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white h-12 text-xs font-black shadow-md shadow-[#8E111E]/20 transition-transform active:scale-95 disabled:opacity-50"
              >
                <span>{authLoading ? "در حال تأیید…" : "ورود به حساب کاربری"}</span>
                <Check size={16} />
              </button>
            </form>
          )}

          <div className="border-t border-[#F0ECE4] pt-4 text-center">
            <Link href="/products" className="text-xs font-bold text-[#78716C] hover:text-[#8E111E]">
              بازگشت به فروشگاه محصولات آکما
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED CUSTOMER DASHBOARD
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      {/* Top Profile Header */}
      <div className="rounded-[2.5rem] border border-[#E7E3DC] bg-white p-6 sm:p-8 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-[#8E111E]/10 text-[#8E111E] font-black text-xl">
            {customer.name?.slice(0, 1) || "آ"}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-[#1C1816]">
                {customer.name || "کاربر گرامی آکما"}
              </h1>
              {customer.isWholesale && (
                <span className="rounded-full bg-[#8E111E] text-white px-2.5 py-0.5 text-[10px] font-black">
                  همکار عمده
                </span>
              )}
            </div>
            <p className="text-xs text-[#78716C] mt-1 flex items-center gap-3">
              <span dir="ltr">{customer.phone}</span>
              {customer.companyName && (
                <span>• {customer.companyName}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products?mode=wholesale"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E3DC] bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#2A2421] px-5 py-2.5 text-xs font-black shadow-xs transition-colors"
          >
            <Sparkle size={14} className="text-[#8E111E]" />
            <span>کاتالوگ خرید عمده</span>
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2.5 text-xs font-bold transition-colors"
          >
            <LogOut size={14} />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-8 flex gap-2 border-b border-[#E7E3DC] pb-px">
        <button
          onClick={() => setActiveTab("orders")}
          className={`relative pb-3 px-5 text-xs font-black transition-colors ${
            activeTab === "orders"
              ? "text-[#8E111E]"
              : "text-[#78716C] hover:text-[#1C1816]"
          }`}
        >
          <span>سفارش‌های من ({toFa(orders.length)})</span>
          {activeTab === "orders" && (
            <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#8E111E] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`relative pb-3 px-5 text-xs font-black transition-colors ${
            activeTab === "profile"
              ? "text-[#8E111E]"
              : "text-[#78716C] hover:text-[#1C1816]"
          }`}
        >
          <span>اطلاعات حساب و آدرس‌ها</span>
          {activeTab === "profile" && (
            <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#8E111E] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("wholesale")}
          className={`relative pb-3 px-5 text-xs font-black transition-colors ${
            activeTab === "wholesale"
              ? "text-[#8E111E]"
              : "text-[#78716C] hover:text-[#1C1816]"
          }`}
        >
          <span>مزایای همکاری و خرید عمده</span>
          {activeTab === "wholesale" && (
            <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#8E111E] rounded-full" />
          )}
        </button>
      </div>

      {/* TAB CONTENT: ORDERS */}
      {activeTab === "orders" && (
        <div className="mt-6 space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-[2rem] border border-[#E7E3DC] bg-white p-12 text-center space-y-3">
              <Package size={36} className="mx-auto text-[#8C827A]" />
              <p className="font-black text-[#1C1816]">هنوز سفارشی با این شماره ثبت نشده است.</p>
              <p className="text-xs text-[#78716C]">
                می‌توانید محصولات موردنظر خود را از کاتالوگ فروشگاه به صورت تکی یا عمده سفارش دهید.
              </p>
              <div className="pt-3">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-[#8E111E] text-white px-6 py-3 text-xs font-black shadow-xs"
                >
                  مشاهده کاتالوگ محصولات
                </Link>
              </div>
            </div>
          ) : (
            orders.map((order) => {
              const meta = statusMeta[order.status as keyof typeof statusMeta] || statusMeta.pending;
              return (
                <div
                  key={order.id}
                  className="rounded-[2rem] border border-[#E7E3DC] bg-white p-6 shadow-xs space-y-5"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0ECE4] pb-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[11px] text-[#78716C]">کد رهگیری مرسوله:</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-base font-black text-[#1C1816]">
                            {order.trackingCode}
                          </span>
                          <button
                            onClick={() => copyTracking(order.trackingCode)}
                            className="text-[#78716C] hover:text-[#8E111E]"
                            title="کپی کد رهگیری"
                          >
                            {copiedCode === order.trackingCode ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                      <span className="text-xs text-[#78716C]">
                        • {order.createdAt ? formatJalaliDate(new Date(order.createdAt)) : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold border ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      <span className="rounded-full bg-[#FAF8F5] border border-[#E7E3DC] px-3 py-1 text-xs font-bold text-[#4A423D]">
                        {order.orderType === "wholesale" ? "خرید عمده" : "خرید تکی"}
                      </span>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-3">
                    {order.items &&
                      Array.isArray(order.items) &&
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-12 rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] p-1 shrink-0 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.productImage || "/images/redesign/cat-foam.jpg"}
                                alt={item.productName}
                                className="size-full object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-[#1C1816] line-clamp-1">{item.productName}</p>
                              <span className="text-[11px] text-[#78716C]">
                                تعداد: {toFa(item.quantity)} عدد
                                {item.tierLabel && ` (${item.tierLabel})`}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#8E111E]">
                            {formatPrice(item.price * item.quantity)} تومان
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Order Details & Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#F0ECE4] pt-4">
                    <div>
                      <span className="text-xs text-[#78716C]">مبلغ کل:</span>
                      <span className="font-mono text-base font-black text-[#8E111E] mr-2">
                        {formatPrice(order.totalAmount)} تومان
                      </span>
                      {order.shippingCode && (
                        <span className="mr-3 text-xs font-bold text-sky-700">
                          کد تیپاکس: <span className="font-mono">{order.shippingCode}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {order.paymentStatus === "pending" && order.paymentLink && (
                        <a
                          href={order.paymentLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white px-4 py-2 text-xs font-black shadow-xs"
                        >
                          <CreditCard size={14} />
                          <span>پرداخت آنلاین</span>
                        </a>
                      )}

                      {order.trackingLink && (
                        <a
                          href={order.trackingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-[#E7E3DC] bg-white px-3.5 py-2 text-xs font-bold text-[#2A2421] hover:bg-[#FAF8F5]"
                        >
                          <span>رهگیری تیپاکس</span>
                          <ExternalLink size={13} />
                        </a>
                      )}

                      <button
                        onClick={() => handleReorder(order)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#E7E3DC] bg-white px-3.5 py-2 text-xs font-bold text-[#2A2421] hover:bg-[#FAF8F5]"
                        title="افزودن مجدد اقلام به سبد خرید"
                      >
                        <RotateCcw size={13} />
                        <span>سفارش مجدد</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT: PROFILE & ADDRESSES */}
      {activeTab === "profile" && (
        <form
          onSubmit={handleUpdateProfile}
          className="mt-6 rounded-[2rem] border border-[#E7E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-4">
            <h2 className="text-base font-black text-[#1C1816]">مشخصات گیرنده و نشانی پستی</h2>
            <p className="text-xs text-[#78716C]">
              این اطلاعات در تمام خریدهای بعدی شما به صورت خودکار قرار می‌گیرند.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#4A423D] mb-1.5">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A423D] mb-1.5">
                نام فروشگاه / شرکت (جهت فاکتور همکاری)
              </label>
              <input
                type="text"
                value={profileCompany}
                onChange={(e) => setProfileCompany(e.target.value)}
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#4A423D] mb-1.5">استان</label>
              <input
                type="text"
                value={profileProvince}
                onChange={(e) => setProfileProvince(e.target.value)}
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A423D] mb-1.5">شهر</label>
              <input
                type="text"
                value={profileCity}
                onChange={(e) => setProfileCity(e.target.value)}
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A423D] mb-1.5">آدرس دقیق پستی</label>
            <textarea
              rows={3}
              value={profileAddress}
              onChange={(e) => setProfileAddress(e.target.value)}
              className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] p-3 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A423D] mb-1.5">کد پستی ۱۰ رقمی</label>
            <input
              type="text"
              dir="ltr"
              maxLength={10}
              value={profilePostalCode}
              onChange={(e) => setProfilePostalCode(e.target.value)}
              className="w-full sm:w-1/2 rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white font-mono"
            />
          </div>

          {saveSuccess && (
            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl">
              اطلاعات با موفقیت ذخیره شد.
            </p>
          )}

          <button
            type="submit"
            disabled={saveLoading}
            className="inline-flex items-center gap-2 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white px-8 py-3 text-xs font-black shadow-xs disabled:opacity-50"
          >
            <span>{saveLoading ? "در حال ذخیره…" : "ذخیره تغییرات"}</span>
          </button>
        </form>
      )}

      {/* TAB CONTENT: WHOLESALE BENEFITS */}
      {activeTab === "wholesale" && (
        <div className="mt-6 rounded-[2rem] border border-[#E7E3DC] bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#1C1816]">مزایای همکاری و خرید عمده از آکما</h2>
            <p className="text-xs text-[#78716C] leading-6">
              فروشگاه‌های کفش، کتانی، کیف و چرم، کالای ورزشی و مراکز خدمات کفش می‌توانند مستقیماً از کارخانه با قیمت همکاری و تخفیف‌های پلکانی سفارش ثبت کنند.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] space-y-2">
              <span className="grid size-10 place-items-center rounded-xl bg-[#8E111E]/10 text-[#8E111E] font-black">
                ٪
              </span>
              <h3 className="text-sm font-black text-[#1C1816]">قیمت پلکانی همکاری</h3>
              <p className="text-[11px] text-[#78716C] leading-5">
                تخفیف بیشتر با افزایش تیراژ در سفارش‌های ۶، ۱۲، ۲۴ و ۴۸ عددی با اعمال خودکار در فاکتور.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] space-y-2">
              <span className="grid size-10 place-items-center rounded-xl bg-[#8E111E]/10 text-[#8E111E]">
                <Truck size={18} />
              </span>
              <h3 className="text-sm font-black text-[#1C1816]">ارسال باربری و تیپاکس</h3>
              <p className="text-[11px] text-[#78716C] leading-5">
                بسته‌بندی صنعتی محکم مناسب حمل بین‌شهری و تحویل سریع در سراسر کشور.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] space-y-2">
              <span className="grid size-10 place-items-center rounded-xl bg-[#8E111E]/10 text-[#8E111E]">
                <Building size={18} />
              </span>
              <h3 className="text-sm font-black text-[#1C1816]">استند و ویترین فروشگاهی</h3>
              <p className="text-[11px] text-[#78716C] leading-5">
                امکان سفارش استندهای فلزی ۳ طبقه رومیزی و سالنی برای افزایش جذابیت ویترین فروشگاه.
              </p>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Link
              href="/products?mode=wholesale"
              className="inline-flex items-center gap-2 rounded-full bg-[#8E111E] text-white px-6 py-3 text-xs font-black shadow-xs"
            >
              <span>ورود به کاتالوگ خرید عمده</span>
              <ChevronLeft size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
