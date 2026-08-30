import type { Metadata } from "next";
import { getActiveProducts, getSettings } from "@/lib/store";
import { DEFAULT_CONTACT, type ContactSettings } from "@/lib/defaults";
import { CatalogClient } from "./catalog-client";

export const metadata: Metadata = { title: "محصولات | آکما" };

export default async function ProductsPage() {
  const [s, products] = await Promise.all([getSettings(), getActiveProducts()]);
  const contact = { ...DEFAULT_CONTACT, ...(s.contact as Partial<ContactSettings>) };
  const phone = contact.phones[0] ?? "09033253065";

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <header className="text-center">
        <p className="text-xs font-bold tracking-[0.25em] text-accent">فروشگاه عمده آکما</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">محصولات</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
          محصول موردنظر را انتخاب کنید و برای ثبت سفارش و قیمت همکاری با ما تماس بگیرید.
        </p>
      </header>
      <CatalogClient products={products} phone={phone} />
    </div>
  );
}
