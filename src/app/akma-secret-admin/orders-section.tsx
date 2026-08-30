"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock,
  ExternalLink,
  Package,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  MessageCircle,
  Copy,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { formatPrice, toFa } from "@/lib/format";
import type { OrderRow } from "@/db/schema";

const STATUS_OPTIONS = [
  { value: "pending", label: "در حال بررسی", color: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
  { value: "processing", label: "در حال آماده‌سازی", color: "bg-sky-400/10 text-sky-400 border-sky-400/20" },
  { value: "shipped", label: "ارسال شده", color: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
  { value: "delivered", label: "تحویل داده شده", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { value: "cancelled", label: "لغو شده", color: "bg-rose-400/10 text-rose-400 border-rose-400/20" },
];

export function OrdersSection({ toast }: { toast: (m: string, ok?: boolean) => void }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Editable draft states per order
  const [drafts, setDrafts] = useState<Record<number, Partial<OrderRow>>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.ok) {
          setOrders(data.orders);
          const initialDrafts: Record<number, Partial<OrderRow>> = {};
          for (const o of data.orders) {
            initialDrafts[o.id] = {
              status: o.status,
              shippingCode: o.shippingCode || "",
              trackingLink: o.trackingLink || "",
              adminNotes: o.adminNotes || "",
            };
          }
          setDrafts(initialDrafts);
        } else {
          toast("خطا در دریافت لیست سفارش‌ها", false);
        }
      })
      .catch(() => {
        if (active) toast("خطا در اتصال به سرور", false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [toast]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (res.ok && data.ok) {
        setOrders(data.orders);
        const initialDrafts: Record<number, Partial<OrderRow>> = {};
        for (const o of data.orders) {
          initialDrafts[o.id] = {
            status: o.status,
            shippingCode: o.shippingCode || "",
            trackingLink: o.trackingLink || "",
            adminNotes: o.adminNotes || "",
          };
        }
        setDrafts(initialDrafts);
      } else {
        toast("خطا در دریافت لیست سفارش‌ها", false);
      }
    } catch {
      toast("خطا در اتصال به سرور", false);
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (id: number, patch: Partial<OrderRow>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch },
    }));
  };

  const saveOrder = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast(`سفارش #${id} با موفقیت به‌روزرسانی شد`);
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...draft } : o)));
      } else {
        toast(data.error || "خطا در ذخیره سفارش", false);
      }
    } catch {
      toast("خطا در برقراری ارتباط با سرور", false);
    } finally {
      setSavingId(null);
    }
  };

  const removeOrder = async (id: number) => {
    if (!confirm(`آیا از حذف سفارش شماره ${id} اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast("سفارش با موفقیت حذف شد");
        setOrders((prev) => prev.filter((o) => o.id !== id));
      } else {
        toast(data.error || "خطا در حذف سفارش", false);
      }
    } catch {
      toast("خطا در حذف سفارش", false);
    }
  };

  const copyAddress = (id: number, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    toast("آدرس در کلیپ‌بورد کپی شد");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const full = `${o.trackingCode} ${o.customerName} ${o.customerPhone} ${o.customerAddress} ${o.shippingCode}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [orders, filterStatus, search]);

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">مدیریت سفارش‌ها</h2>
          <p className="text-xs text-muted">
            مشاهده، تغییر وضعیت به «ارسال شده»، ثبت کد بارنامه و لینک پیگیری تیپاکس
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="btn btn-ghost h-10 px-4 text-xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          بروزرسانی لیست
        </button>
      </div>

      {/* Filters & Search */}
      <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`chip px-3.5 py-1.5 text-xs font-bold ${filterStatus === "all" ? "active" : "text-muted"}`}
          >
            همه ({toFa(orders.length)})
          </button>
          {STATUS_OPTIONS.map((st) => {
            const count = orders.filter((o) => o.status === st.value).length;
            return (
              <button
                key={st.value}
                type="button"
                onClick={() => setFilterStatus(st.value)}
                className={`chip px-3.5 py-1.5 text-xs font-bold ${filterStatus === st.value ? "active" : "text-muted"}`}
              >
                {st.label} ({toFa(count)})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس کد رهگیری، نام، شماره…"
            className="field w-full !pr-9 text-xs"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="card py-20 text-center text-xs text-muted">
          در حال بارگذاری لیست سفارش‌ها…
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Package size={36} className="text-muted" strokeWidth={1.5} />
          <p className="text-sm font-bold">هیچ سفارشی یافت نشد</p>
          <p className="text-xs text-muted">سفارش‌های ثبت شده در سایت در این بخش نمایش داده خواهند شد.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const draft = drafts[order.id] || order;
            const isSaving = savingId === order.id;

            return (
              <div
                key={order.id}
                className="card overflow-hidden border border-line bg-card p-6 shadow-sm transition-all"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-surface font-mono text-sm font-black text-accent">
                      #{order.id}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-ink">
                          {order.trackingCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(order.trackingCode);
                            toast("کد رهگیری کپی شد");
                          }}
                          className="text-muted hover:text-ink"
                          title="کپی کد رهگیری"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted">
                        ثبت شده در: {new Date(order.createdAt).toLocaleDateString("fa-IR")} — ساعت{" "}
                        {new Date(order.createdAt).toLocaleTimeString("fa-IR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-muted">وضعیت:</label>
                      <select
                        value={draft.status ?? order.status}
                        onChange={(e) => updateDraft(order.id, { status: e.target.value })}
                        className="field !h-9 !py-0 !text-xs font-extrabold"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeOrder(order.id)}
                      className="grid size-9 place-items-center rounded-xl border border-line text-rose-400 hover:border-rose-400 hover:bg-rose-500/10"
                      title="حذف سفارش"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Customer Info & Items */}
                <div className="mt-5 grid gap-6 lg:grid-cols-2">
                  {/* Customer & Address Details */}
                  <div className="space-y-3 rounded-2xl border border-line bg-surface/40 p-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-ink">{order.customerName}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="flex items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1 text-muted hover:text-ink"
                        >
                          <Phone size={12} />
                          {toFa(order.customerPhone)}
                        </a>
                        <a
                          href={`https://wa.me/98${order.customerPhone.replace(/^0/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <MessageCircle size={12} />
                          واتساپ
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2 border-t border-line/60 pt-2 text-[11px] leading-5 text-muted">
                      <div>
                        <span className="font-bold text-ink">آدرس ارسال: </span>
                        <span>{order.customerAddress}</span>
                        {order.customerCity && (
                          <span className="block text-[10px] text-muted">
                            شهر: {order.customerCity} | استان: {order.customerProvince || "—"}
                          </span>
                        )}
                        {order.postalCode && (
                          <span className="block text-[10px] text-muted">
                            کد پستی: {order.postalCode}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyAddress(order.id, order.customerAddress)}
                        className="shrink-0 text-muted hover:text-ink"
                        title="کپی آدرس"
                      >
                        {copiedId === order.id ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>

                    {order.notes && (
                      <div className="rounded-xl bg-card p-2.5 text-[11px] text-amber-300/90">
                        <strong>یادداشت مشتری: </strong> {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="space-y-2 rounded-2xl border border-line bg-surface/40 p-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>اقلام سفارش</span>
                      <span className="text-accent font-black">
                        جمع: {formatPrice(order.totalAmount)} تومان
                      </span>
                    </div>

                    <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 rounded-xl border border-line/60 bg-card p-2 text-xs"
                        >
                          <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-surface p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="size-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 font-bold text-ink">{item.productName}</p>
                            <p className="text-[10px] text-muted">
                              {toFa(item.quantity)} عدد × {formatPrice(item.price)} تومان
                            </p>
                          </div>
                          <span className="font-extrabold text-ink">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shipping code & Tipax tracking link inputs */}
                <div className="mt-5 rounded-2xl border border-accent/20 bg-surface/80 p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-extrabold text-accent">
                    <Truck size={15} /> مشخصات ارسال و رهگیری پستی / تیپاکس
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-muted">
                        کد رهگیری بارنامه / پست
                      </label>
                      <input
                        type="text"
                        value={draft.shippingCode ?? ""}
                        onChange={(e) => updateDraft(order.id, { shippingCode: e.target.value })}
                        placeholder="مثلاً: TPX-9843920193"
                        className="field w-full !h-9 text-xs"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-muted">
                        لینک مستقیم رهگیری تیپاکس (مشتری با کلیک روی آن وارد سایت تیپاکس می‌شود)
                      </label>
                      <input
                        type="text"
                        value={draft.trackingLink ?? ""}
                        onChange={(e) => updateDraft(order.id, { trackingLink: e.target.value })}
                        placeholder="https://tipaxco.com/tracking?id=..."
                        className="field w-full !h-9 text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-[11px] font-bold text-muted">
                      یادداشت داخلی مدیریت (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={draft.adminNotes ?? ""}
                      onChange={(e) => updateDraft(order.id, { adminNotes: e.target.value })}
                      placeholder="مثلاً: هماهنگ شده با مشتری، بسته‌بندی شد."
                      className="field w-full !h-9 text-xs"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                    <a
                      href={`/tracking?code=${order.trackingCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted hover:text-accent"
                    >
                      <ExternalLink size={13} />
                      مشاهده صفحه پیگیری مشتری
                    </a>

                    <button
                      type="button"
                      onClick={() => saveOrder(order.id)}
                      disabled={isSaving}
                      className="btn btn-primary h-9 px-5 text-xs font-bold disabled:opacity-50"
                    >
                      {isSaving ? "در حال ذخیره…" : "ذخیره تغییرات سفارش"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
