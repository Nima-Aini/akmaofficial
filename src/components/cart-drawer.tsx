"use client";

import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, X, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatPrice, toFa } from "@/lib/format";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, totalAmount, totalCount } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 flex max-w-full pl-0 sm:pl-10">
        <div className="flex w-screen max-w-md flex-col border-r border-line bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent">
                <ShoppingBag size={18} />
              </span>
              <div>
                <h2 className="text-base font-black">سبد خرید</h2>
                <p className="text-[11px] text-muted">{toFa(totalCount)} قلم کالا</p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="grid size-9 place-items-center rounded-xl border border-line text-muted hover:text-ink"
              aria-label="بستن سبد خرید"
            >
              <X size={18} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="grid size-16 place-items-center rounded-2xl bg-surface text-muted">
                  <ShoppingBag size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-extrabold text-ink">سبد خرید شما خالی است</p>
                  <p className="mt-1 text-xs text-muted">
                    محصولات موردنظر خود را از بخش فروشگاه انتخاب کنید.
                  </p>
                </div>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="btn btn-primary mt-2 h-10 px-5 text-xs"
                >
                  مشاهده محصولات
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 rounded-2xl border border-line bg-surface/60 p-3"
                  >
                    <div className="relative size-18 shrink-0 overflow-hidden rounded-xl border border-line bg-card p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="size-full object-contain"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-xs font-bold text-ink">
                          {item.productName}
                        </p>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-muted hover:text-rose-400"
                          aria-label="حذف محصول"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {item.unitPrice && (
                        <p className="text-[10px] text-muted">{item.unitPrice}</p>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 rounded-lg border border-line bg-card p-1">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="grid size-6 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink"
                            aria-label="کاهش تعداد"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="min-w-6 text-center text-xs font-extrabold text-ink">
                            {toFa(item.quantity)}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="grid size-6 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink"
                            aria-label="افزایش تعداد"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <p className="text-xs font-extrabold text-accent">
                          {formatPrice(item.price * item.quantity)}{" "}
                          <span className="text-[10px] font-normal text-muted">تومان</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer & Checkout button */}
          {items.length > 0 && (
            <div className="border-t border-line bg-surface/80 p-5 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs text-muted">مبلغ کل سفارش:</span>
                <span className="text-lg font-black text-accent">
                  {formatPrice(totalAmount)}{" "}
                  <span className="text-xs font-bold text-muted">تومان</span>
                </span>
              </div>

              <div className="mb-3 flex items-center gap-2 rounded-xl bg-accent/5 p-2.5 text-[11px] text-muted">
                <ShieldCheck size={16} className="shrink-0 text-accent" />
                <span>ثبت سریع بدون پرداخت آنی + صدور کد رهگیری هوشمند</span>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn btn-primary h-12 w-full text-sm font-extrabold"
              >
                تکمیل سفارش و ثبت آدرس
                <ArrowLeft size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
