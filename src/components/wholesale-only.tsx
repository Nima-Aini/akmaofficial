"use client";

import type { ReactNode } from "react";
import { useProductMode } from "@/context/product-mode-context";

export function WholesaleOnly({ children }: { children: ReactNode }) {
  return useProductMode()?.mode === "wholesale" ? <>{children}</> : null;
}
