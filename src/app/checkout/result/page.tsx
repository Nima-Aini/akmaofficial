"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { CheckCircle2, XCircle, Copy, Check, ArrowLeft, ShoppingBag, Truck } from "lucide-react";
import { toFa } from "@/lib/format";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const trackingCode = searchParams.get("trackingCode") || "";
  const status = searchParams.get("status") || "";
  const ref = searchParams.get("ref") || "";
  const trackId = searchParams.get("trackId") || "";
  const error = searchParams.get("error") || "";

  const [copied, setCopied] = useState(false);

  const isSuccess = status === "success";

  const copyTracking = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-[2.5rem] border border-[#E7E3DC] bg-white p-6 sm:p-10 shadow-xl text-center space-y-6">
        {isSuccess ? (
          <>
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2">
              <span className="inline-block rounded-full bg-emerald-100/80 px-4 py-1 text-xs font-black text-emerald-800">
                پرداخت آنلاین موفق
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1C1816]">
                سفارش شما با موفقیت ثبت و پرداخت شد
              </h1>
              <p className="text-sm text-[#736B63]">
                از خرید شما سپاسگزاریم. سفارش شما جهت بسته‌بندی و ارسال به انبار آکما ارجاع داده شد.
              </p>
            </div>

            {/* Tracking & Ref Details */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-3 text-right">
              {trackingCode && (
                <div className="flex items-center justify-between border-b border-emerald-100/70 pb-3">
                  <span className="text-xs font-bold text-[#736B63]">کد پیگیری سفارش:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base sm:text-lg font-black text-[#8E111E]">
                      {trackingCode}
                    </span>
                    <button
                      onClick={copyTracking}
                      className="p-1 text-[#736B63] hover:text-[#1C1816]"
                      title="کپی کد رهگیری"
                    >
                      {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {ref && (
                <div className="flex items-center justify-between border-b border-emerald-100/70 pb-3">
                  <span className="text-xs font-bold text-[#736B63]">شماره ارجاع بانک (RefID):</span>
                  <span className="font-mono text-sm font-bold text-[#1C1816]">{ref}</span>
                </div>
              )}

              {trackId && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#736B63]">شناسه پرداخت درگاه:</span>
                  <span className="font-mono text-xs font-bold text-[#736B63]">{trackId}</span>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/account"
                className="flex-1 rounded-2xl bg-[#8E111E] py-4 text-center text-sm font-black text-white hover:bg-[#720C17] shadow-lg shadow-[#8E111E]/20 transition-transform active:scale-95"
              >
                مشاهده سفارش در پنل کاربری
              </Link>
              <Link
                href={`/products`}
                className="flex-1 rounded-2xl border border-[#E7E3DC] bg-white py-4 text-center text-sm font-bold text-[#1C1816] hover:bg-[#FAF8F5]"
              >
                بازگشت به فروشگاه
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
              <XCircle size={44} />
            </div>

            <div className="space-y-2">
              <span className="inline-block rounded-full bg-rose-100/80 px-4 py-1 text-xs font-black text-rose-800">
                پرداخت ناموفق
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1C1816]">پرداخت انجام نشد</h1>
              <p className="text-sm text-[#736B63]">
                {error || "عملیات پرداخت توسط کاربر لغو گردید یا از سمت درگاه بانکی تایید نشد."}
              </p>
            </div>

            {trackingCode && (
              <div className="rounded-2xl border border-[#E7E3DC] bg-[#FAF8F5] p-4 text-right">
                <p className="text-xs text-[#736B63]">
                  سفارش شما با کد پیگیری <b className="font-mono text-[#8E111E]">{trackingCode}</b> ثبت
                  شده و در وضعیت منتظر پرداخت باقی مانده است.
                </p>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/account"
                className="flex-1 rounded-2xl bg-[#8E111E] py-4 text-center text-sm font-black text-white hover:bg-[#720C17]"
              >
                ورود به حساب و تلاش مجدد
              </Link>
              <Link
                href="/checkout"
                className="flex-1 rounded-2xl border border-[#E7E3DC] bg-white py-4 text-center text-sm font-bold text-[#1C1816] hover:bg-[#FAF8F5]"
              >
                بازگشت به سبد خرید
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md py-20 text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-[#8E111E] border-t-transparent" />
          <p className="mt-4 text-xs font-bold text-[#736B63]">در حال استعلام وضعیت پرداخت...</p>
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
