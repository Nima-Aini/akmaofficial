"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type ProductMode = "retail" | "wholesale";
type ProductModeContextValue = { mode: ProductMode; setMode: (mode: ProductMode) => void };

const ProductModeContext = createContext<ProductModeContextValue | null>(null);

export function ProductModeProvider({ children, initialMode = "retail" }: { children: ReactNode; initialMode?: ProductMode }) {
  const [mode, setMode] = useState<ProductMode>(initialMode);
  return <ProductModeContext.Provider value={{ mode, setMode }}>{children}</ProductModeContext.Provider>;
}

export function useProductMode() {
  return useContext(ProductModeContext);
}
