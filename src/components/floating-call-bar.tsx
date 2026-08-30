"use client";

import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";
import { telHref, toFa } from "@/lib/format";

export function FloatingCallBar({ phone }: { phone: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/akma-secret-admin")) return null;

  return (
    <a
      href={telHref(phone)}
      className="btn btn-primary pulse-ring fixed bottom-5 right-5 z-50 h-14 rounded-full px-6 text-sm font-extrabold shadow-2xl md:hidden"
    >
      <Phone size={18} />
      سفارش تلفنی — {toFa(phone)}
    </a>
  );
}
