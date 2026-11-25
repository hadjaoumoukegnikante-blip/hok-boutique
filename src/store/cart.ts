"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppliedPromo, CartLine, PaymentMode, VariantKind } from "@/lib/types";

interface CartState {
  lines: CartLine[];
  commune: string;
  mode: PaymentMode;
  promo: AppliedPromo | null;
  splitDelivery: boolean;
  add: (l: Omit<CartLine, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setCommune: (c: string) => void;
  setMode: (m: PaymentMode) => void;
  setPromo: (p: AppliedPromo | null) => void;
  setSplit: (v: boolean) => void;
}

export function lineKey(productId: string, selection: Partial<Record<VariantKind, string>>, fabric?: string) {
  const sel = Object.entries(selection)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  return `${productId}#${sel}#${fabric ?? ""}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      commune: "",
      mode: "orange_money",
      promo: null,
      splitDelivery: false,
      add: (l) =>
        set((s) => {
          // Pièce sur mesure : une ligne par personne, jamais fusionnée
          if (l.measurements || l.measurementsByWhatsapp) {
            return { lines: [...s.lines, { ...l, key: `${lineKey(l.productId, l.selection, l.fabric)}#m${Date.now()}` }] };
          }
          const key = lineKey(l.productId, l.selection, l.fabric);
          const existing = s.lines.find((x) => x.key === key);
          if (existing) {
            return { lines: s.lines.map((x) => (x.key === key ? { ...x, qty: x.qty + l.qty } : x)) };
          }
          return { lines: [...s.lines, { ...l, key }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({ lines: s.lines.map((x) => (x.key === key ? { ...x, qty: Math.max(1, qty) } : x)) })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((x) => x.key !== key) })),
      clear: () => set({ lines: [], promo: null, splitDelivery: false }),
      setCommune: (commune) => set({ commune }),
      setMode: (mode) => set({ mode }),
      setPromo: (promo) => set({ promo }),
      setSplit: (splitDelivery) => set({ splitDelivery }),
    }),
    { name: "hok-cart-v2", storage: createJSONStorage(() => localStorage) },
  ),
);

/** Commandes passées depuis cet appareil : référence + téléphone, pour le suivi sans compte. */
export interface LocalOrderRef {
  ref: string;
  phone: string;
  createdAt: string;
}

interface OrdersState {
  orders: LocalOrderRef[];
  remember: (o: LocalOrderRef) => void;
  phoneFor: (ref: string) => string | undefined;
}

export const useLocalOrders = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      remember: (o) => set((s) => ({ orders: [o, ...s.orders.filter((x) => x.ref !== o.ref)].slice(0, 30) })),
      phoneFor: (ref) => get().orders.find((o) => o.ref === ref.toUpperCase())?.phone,
    }),
    { name: "hok-orders-v2", storage: createJSONStorage(() => localStorage) },
  ),
);

/** Interface : tiroir panier, recherche, notifications. */
interface UiState {
  cartOpen: boolean;
  searchOpen: boolean;
  toast: { id: number; title: string; body?: string } | null;
  openCart: () => void;
  closeCart: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  notify: (title: string, body?: string) => void;
  dismiss: () => void;
}

export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  searchOpen: false,
  toast: null,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  notify: (title, body) => set({ toast: { id: Date.now(), title, body } }),
  dismiss: () => set({ toast: null }),
}));
