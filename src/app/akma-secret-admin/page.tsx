import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/store";
import { AdminLogin } from "./login";
import { AdminPanel } from "./panel";

export const metadata: Metadata = {
  title: "مدیریت",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await ensureSeeded();
  const authed = await requireAdmin();
  return authed ? <AdminPanel /> : <AdminLogin />;
}
