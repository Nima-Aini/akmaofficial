import { NextResponse } from "next/server";
import { getCurrentCustomer, getCustomerOrders } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ ok: false, error: "لطفاً ابتدا وارد شوید" }, { status: 401 });
  }

  const orders = await getCustomerOrders(customer.phone);
  const safeOrders = orders.map(({ adminNotes: _adminNotes, ...order }) => order);
  const safeCustomer = {
    id: customer.id,
    phone: customer.phone,
    name: customer.name,
    address: customer.address,
    province: customer.province,
    city: customer.city,
    postalCode: customer.postalCode,
  };
  return NextResponse.json({ ok: true, orders: safeOrders, customer: safeCustomer });
}
