"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export function SectionLink({ href, children, className, onNavigate }: { href: `/#${string}`; children: ReactNode; className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();
    if (pathname !== "/" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = href.slice(2);
    const element = document.getElementById(id);
    if (!element) return;
    event.preventDefault();
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    element.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  return <Link href={href} className={className} onClick={handleClick}>{children}</Link>;
}
