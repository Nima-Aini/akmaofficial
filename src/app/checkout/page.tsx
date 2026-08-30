"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Check,
  Search,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatPrice, toFa } from "@/lib/format";

export default function CheckoutPage() {
  const { items, totalAmount, totalCount, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{
    trackingCode: string;
    totalAmount: number;
    customerName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
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
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerProvince: province.trim(),
          customerCity: city.trim(),
          customerAddress: address.trim(),
          postalCode: postalCode.trim(),
          notes: notes.trim(),
          items,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccessOrder({
          trackingCode: data.trackingCode,
          totalAmount,
          customerName: name.trim(),
        });
        clearCart();
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
      <div className="mx-auto max-w-2xl px-5 py-16 text-center lg:px-8">
        <div className="card border-emerald-500/20 bg-card p-8 sm:p-12">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 size={44} strokeWidth={2.2} />
          </div>

          <span className="mt-6 inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400">
            ثبت موفق سفارش
          </span>

          <h1 className="mt-3 text-2xl font-black sm:text-3xl">
            {successOrder.customerName} عزیز، سفارش شما ثبت شد!
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            سفارش شما در سیستم آکما ذخیره گردید و کارشناسان ما جهت هماهنگی بسته‌بندی و ارسال
            با شما تماس خواهند گرفت.
          </p>

          {/* Tracking Code Highlight Box */}
          <div className="mt-8 rounded-2xl border-2 border-dashed border-accent/40 bg-surface p-6">
            <p className="text-xs font-bold text-muted">کد رهگیری اختصاصی سفارش شما:</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-black tracking-wider text-accent sm:text-4xl">
                {successOrder.trackingCode}
              </span>
              <button
                type="button"
                onClick={copyTracking}
                className="btn btn-ghost grid size-10 place-items-center rounded-xl border border-line text-muted hover:text-ink"
                title="کپی کد رهگیری"
              >
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-muted">
              این کد را نزد خود نگه دارید؛ هر زمان می‌توانید وضعیت بسته‌بندی و لینک تیپاکس را در بخش پیگیری سفارش مشاهده کنید.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/tracking?code=${successOrder.trackingCode}`}
              className="btn btn-primary h-12 px-6 text-xs font-black"
            >
              <Search size={15} />
              پیگیری وضعیت این سفارش
            </Link>
            <Link href="/" className="btn btn-ghost h-12 px-6 text-xs">
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART VIEW
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center lg:px-8">
        <div className="card p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-surface text-muted">
            <ShoppingBag size={28} />
          </div>
          <h1 className="mt-5 text-xl font-black">سبد خرید شما در حال حاضر خالی است</h1>
          <p className="mt-2 text-xs leading-6 text-muted">
            برای ثبت سفارش ابتدا کالاهای موردنظر خود را از کاتالوگ محصولات انتخاب فرمایید.
          </p>
          <Link href="/products" className="btn btn-primary mx-auto mt-6 h-11 px-6 text-xs font-bold">
            مشاهده کاتالوگ محصولات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <header className="text-center">
        <p className="text-xs font-bold text-accent">ثبت نهایی سفارش</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">مشخصات گیرنده و تحویل</h1>
        <p className="mt-2 text-xs text-muted">
          اطلاعات دقیق ارسال را وارد کنید تا سفارش شما آماده‌سازی و ارسال گردد.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-5 p-6 sm:p-8">
            <h2 className="flex items-center gap-2.5 text-base font-extrabold">
              <span className="grid size-7 place-items-center rounded-lg bg-accent/10 text-xs font-black text-accent">
                ۱
              </span>
              اطلاعات تحویل‌گیرنده
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-muted">
                  نام و نام خانوادگی / نام فروشگاه <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: علی رضایی (فروشگاه اسپرت)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-muted">
                  شماره تماس همراه <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="09123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="field w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-muted">استان</label>
                <input
                  type="text"
                  placeholder="مثال: تهران / خراسان رضوی"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="field w-full"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-muted">شهر</label>
                <input
                  type="text"
                  placeholder="مثال: مشهد / اصفهان"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="field w-full"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-muted">
                آدرس کامل پستی <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="خیابان، کوچه، پلاک، واحد یا آدرس دقیق فروشگاه"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="field w-full"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-muted">کد پستی (اختیاری)</label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="کد ۱۰ رقمی"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="field w-full"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-muted">توضیحات تکمیلی / باربری پیشنهادی</label>
                <input
                  type="text"
                  placeholder="مثلاً: ارسال با تیپاکس / باربری وطن"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="field w-full"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary h-14 flex-1 text-sm font-black disabled:opacity-50"
            >
              {loading ? "در حال ثبت سفارش…" : "ثبت نهایی سفارش و دریافت کد رهگیری"}
              {!loading && <ArrowLeft size={18} />}
            </button>
          </div>
        </form>

        {/* Order Summary Sidebar */}
        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="flex items-center justify-between text-base font-extrabold">
              <span>خلاصه سبد خرید</span>
              <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
                {toFa(totalCount)} قلم
              </span>
            </h2>

            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 border-b border-line/60 pb-3"
                >
                  <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-line bg-surface p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="size-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-bold text-ink">{item.productName}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {toFa(item.quantity)} × {formatPrice(item.price)} تومان
                    </p>
                  </div>
                  <p className="text-xs font-extrabold text-accent">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-line pt-4">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>هزینه بسته‌بندی:</span>
                <span className="text-emerald-400">رایگان</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>نحوه ارسال:</span>
                <span>تیپاکس / باربری (پس‌کرایه)</span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="font-extrabold text-ink">مبلغ قابل پرداخت:</span>
                <span className="text-lg font-black text-accent">
                  {formatPrice(totalAmount)}{" "}
                  <span className="text-xs font-bold text-muted">تومان</span>
                </span>
              </div>
            </div>
          </div>

          <div className="card space-y-3 p-5 text-xs leading-6 text-muted">
            <div className="flex items-center gap-2 font-bold text-ink">
              <ShieldCheck size={16} className="text-accent" />
              ضمانت سفارش آکما
            </div>
            <p className="text-[11px]">
              پس از ثبت سفارش، کارشناسان واحد فروش با شما تماس خواهند گرفت و لینک رهگیری مرسوله تیپاکس در سامانه پیگیری فعال می‌شود.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <Truck size={14} className="text-accent" />
              ارسال سریع به تمام استان‌ها و شهرستان‌های کشور
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
