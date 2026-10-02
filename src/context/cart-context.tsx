"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { calculateProductPricing, type WholesaleTierItem } from "@/lib/pricing";

export type CartItem = {
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  unitPrice?: string;
  quantity: number;
  mode: "retail" | "wholesale";
  tierLabel?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  wholesaleTiers?: WholesaleTierItem[];
};

type CartContextType = {
  items: CartItem[];
  cartMode: "retail" | "wholesale";
  setCartMode: (mode: "retail" | "wholesale") => void;
  addItem: (
    product: {
      id: number;
      name: string;
      images: string[];
      price: number;
      retailPrice?: number;
      wholesalePrice?: number;
      wholesaleTiers?: WholesaleTierItem[];
      unitPrice?: string;
    },
    quantity?: number,
    mode?: "retail" | "wholesale",
  ) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setItemMode: (productId: number, mode: "retail" | "wholesale") => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
  totalWholesaleSavings: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "akma_cart_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartMode, setCartMode] = useState<"retail" | "wholesale">("retail");
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const recalculateItem = (item: CartItem, newQty: number, newMode?: "retail" | "wholesale"): CartItem => {
    const mode = newMode || item.mode || cartMode;
    const pricing = calculateProductPricing(
      {
        price: item.price,
        retailPrice: item.retailPrice,
        wholesalePrice: item.wholesalePrice,
        wholesaleTiers: item.wholesaleTiers,
      },
      newQty,
      mode,
    );
    return {
      ...item,
      quantity: newQty,
      mode,
      price: pricing.unitPrice,
      tierLabel: pricing.tierLabel,
      unitPrice: pricing.tierLabel || `${pricing.unitPrice.toLocaleString("fa-IR")} تومان`,
    };
  };

  const addItem = (
    product: {
      id: number;
      name: string;
      images: string[];
      price: number;
      retailPrice?: number;
      wholesalePrice?: number;
      wholesaleTiers?: WholesaleTierItem[];
      unitPrice?: string;
    },
    quantity = 1,
    mode?: "retail" | "wholesale",
  ) => {
    const targetMode = mode || cartMode;
    const addQty = Math.max(1, quantity);

    setItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.productId === product.id);
      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        const newQty = existing.quantity + addQty;
        const updated = recalculateItem(existing, newQty, targetMode);
        const copy = [...prev];
        copy[existingIdx] = updated;
        return copy;
      }

      const pricing = calculateProductPricing(product, addQty, targetMode);
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] || "/images/redesign/cat-foam.jpg",
        price: pricing.unitPrice,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        wholesaleTiers: product.wholesaleTiers,
        unitPrice: pricing.tierLabel || product.unitPrice,
        quantity: addQty,
        mode: targetMode,
        tierLabel: pricing.tierLabel,
      };
      return [...prev, newItem];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((it) => {
        if (it.productId === productId) {
          return recalculateItem(it, quantity);
        }
        return it;
      }),
    );
  };

  const setItemMode = (productId: number, mode: "retail" | "wholesale") => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.productId === productId) {
          return recalculateItem(it, it.quantity, mode);
        }
        return it;
      }),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity, 0),
    [items],
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [items],
  );

  const totalWholesaleSavings = useMemo(() => {
    return items.reduce((sum, it) => {
      const retailSingle = it.retailPrice && it.retailPrice > 0 ? it.retailPrice : it.price;
      const nominalRetailTotal = retailSingle * it.quantity;
      const actualTotal = it.price * it.quantity;
      return sum + Math.max(0, nominalRetailTotal - actualTotal);
    }, 0);
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((v) => !v);

  return (
    <CartContext.Provider
      value={{
        items,
        cartMode,
        setCartMode,
        addItem,
        removeItem,
        updateQuantity,
        setItemMode,
        clearCart,
        totalCount,
        totalAmount,
        totalWholesaleSavings,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
