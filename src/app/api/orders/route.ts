import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createOrder, updateOrder, getAllProducts, calculateProductPricing, type OrderInput } from "@/lib/store";
import { normalizePhone, toEnDigits } from "@/lib/format";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { atomicUpdateOrderPaymentRetry, createZibalPayment, recordPaymentAttempt } from "@/lib/payment";
import type { OrderItem } from "@/db/schema";
import { getWholesalePackConfig, isPositiveSafeInteger } from "@/lib/pricing";
import { getProductImages } from "@/lib/product-media";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json(
        {
          error: "برای ثبت سفارش، لطفاً ابتدا وارد حساب کاربری خود شوید یا با شماره همراه ثبت‌نام نمایید.",
          requireAuth: true,
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    const customerName = String(body.customerName || customer.name || "").trim();
    const rawPhone = String(body.customerPhone || customer.phone || "").trim();
    const customerPhone = normalizePhone(rawPhone);
    const customerAddress = String(body.customerAddress || customer.address || "").trim();
    const customerProvince = String(body.customerProvince || customer.province || "").trim();
    const customerCity = String(body.customerCity || customer.city || "").trim();
    const postalCode = toEnDigits(String(body.postalCode || customer.postalCode || "")).trim();
    const notes = String(body.notes ?? "").trim();
    const orderType = body.orderType === "wholesale" ? "wholesale" : "retail";
    const paymentMethod = body.paymentMethod === "card_to_card" ? "card_to_card" : "online";
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!customerName) {
      return NextResponse.json({ error: "لطفاً نام و نام خانوادگی تحویل‌گیرنده را وارد کنید" }, { status: 400 });
    }
    if (!customerPhone || customerPhone.length < 10) {
      return NextResponse.json({ error: "لطفاً شماره تماس معتبر وارد کنید" }, { status: 400 });
    }
    if (!customerAddress || customerAddress.length < 8) {
      return NextResponse.json({ error: "لطفاً آدرس دقیق جهت ارسال را وارد کنید" }, { status: 400 });
    }
    if (rawItems.length === 0) {
      return NextResponse.json({ error: "سبد خرید شما خالی است" }, { status: 400 });
    }

    // Server-side strict product & price validation against database
    const allProducts = await getAllProducts();
    const productMap = new Map(allProducts.map((p) => [p.id, p]));

    const validatedItems: OrderItem[] = [];

    for (const raw of rawItems) {
      const pid = Number(raw.productId);
      const product = productMap.get(pid);

      if (!product) {
        return NextResponse.json(
          { error: `محصول با شناسه ${pid} یافت نشد یا از لیست حذف شده است.` },
          { status: 400 },
        );
      }

      if (product.active === false) {
        return NextResponse.json(
          { error: `محصول «${product.name}» در حال حاضر غیرفعال است و امکان سفارش ندارد.` },
          { status: 400 },
        );
      }

      const qty = Number(raw.quantity);
      const itemMode = raw.mode === "wholesale"
        ? "wholesale"
        : raw.mode === "retail"
          ? "retail"
          : orderType;

      if (!isPositiveSafeInteger(qty)) {
        return NextResponse.json(
          { error: `تعداد انتخاب‌شده برای «${product.name}» باید یک عدد صحیح مثبت و معتبر باشد.` },
          { status: 400 },
        );
      }

      // Validate wholesale / retail permissions
      if (itemMode === "wholesale") {
        if (product.isWholesale === false) {
          return NextResponse.json(
            { error: `محصول «${product.name}» امکان سفارش در حالت عمده را ندارد.` },
            { status: 400 },
          );
        }

        if (product.wholesalePackSize !== null && !isPositiveSafeInteger(product.wholesalePackSize)) {
          return NextResponse.json(
            { error: `تنظیم تعداد محصول در بسته برای «${product.name}» نامعتبر است؛ لطفاً با پشتیبانی تماس بگیرید.` },
            { status: 409 },
          );
        }
        const pack = getWholesalePackConfig(product);
        if (qty < pack.minimumPackCount) {
          return NextResponse.json(
            {
              error: `حداقل سفارش عمده برای «${product.name}»، ${pack.minimumPackCount} بسته است (تعداد درخواستی: ${qty} بسته).`,
            },
            { status: 400 },
          );
        }
      } else {
        if (product.isRetail === false) {
          return NextResponse.json(
            { error: `محصول «${product.name}» فقط به‌صورت عمده عرضه می‌شود.` },
            { status: 400 },
          );
        }
      }

      // Check stock if inventory tracking is active
      if (product.inStock === false) {
        return NextResponse.json(
          { error: `محصول «${product.name}» در حال حاضر ناموجود است.` },
          { status: 400 },
        );
      }

      // Compute trusted unit price strictly server-side
      const pricing = calculateProductPricing(product, qty, itemMode);
      const pack = getWholesalePackConfig(product);
      const productImages = getProductImages(product, itemMode);
      const retailUnitLabel = product.retailUnitLabel?.trim() || "عدد";
      const isWholesale = itemMode === "wholesale";

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productImage: productImages[0],
        price: pricing.unitPrice,
        unitPrice: `${pricing.unitPrice.toLocaleString("fa-IR")} تومان / ${isWholesale ? pack.packLabel : retailUnitLabel}`,
        quantity: qty,
        mode: itemMode,
        tierLabel: pricing.tierLabel,
        selectedQuantity: qty,
        unitOrPackPrice: pricing.unitPrice,
        packCount: isWholesale ? qty : undefined,
        unitsPerPack: isWholesale ? pack.unitsPerPack : undefined,
        totalUnits: pricing.totalUnits,
        retailUnitLabel,
        wholesalePackLabel: isWholesale ? pack.packLabel : undefined,
        appliedPricingTier: pricing.tierLabel,
        lineTotal: pricing.lineTotal,
      });
    }

    // Strictly compute total amount server-side (do NOT trust client totalPrice)
    const totalAmount = validatedItems.reduce((sum, it) => sum + (it.lineTotal ?? it.price * it.quantity), 0);

    const input: OrderInput = {
      customerId: customer.id,
      orderType,
      customerName,
      customerPhone,
      customerAddress,
      customerProvince,
      customerCity,
      postalCode,
      notes,
      items: validatedItems,
      totalAmount,
      paymentMethod,
    };

    const order = await createOrder(input);

    let paymentLink = "";
    let paymentTrackId = "";
    let paymentError = "";

    // If online payment, generate real gateway payment link
    if (paymentMethod === "online" && totalAmount > 0) {
      const payRes = await createZibalPayment({
        trackingCode: order.trackingCode,
        totalAmount,
        customerPhone,
        customerName,
        orderType,
      });

      if (payRes.success && payRes.paymentUrl) {
        paymentLink = payRes.paymentUrl;
        paymentTrackId = payRes.trackId || "";
        const activated = await atomicUpdateOrderPaymentRetry(order.id, paymentTrackId, paymentLink);
        if (!activated) {
          return NextResponse.json({ error: "سفارش پیش از فعال‌سازی پرداخت تسویه یا نامعتبر شد." }, { status: 409 });
        }
      } else {
        paymentError = payRes.error || "خطا در اتصال به درگاه پرداخت اینترنتی";
        await recordPaymentAttempt({
          orderId: order.id,
          provider: "zibal",
          trackId: `request-failed-${order.id}-${crypto.randomUUID()}`,
          amountTomans: totalAmount,
          status: "failed",
          rawGatewayResponse: { error: paymentError.slice(0, 1000) },
        });
        await updateOrder(order.id, {
          paymentStatus: "failed",
          adminNotes: `خطای اولیه اتصال به درگاه: ${paymentError}`,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      trackingCode: order.trackingCode,
      paymentLink,
      paymentTrackId,
      paymentError,
      order: {
        id: order.id,
        trackingCode: order.trackingCode,
        orderType: order.orderType,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: paymentError ? "failed" : order.paymentStatus,
        paymentLink,
        createdAt: order.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Order creation failed:", error);
    const msg = error instanceof Error ? error.message : "خطا در ثبت سفارش. لطفاً مجدداً تلاش کنید.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
