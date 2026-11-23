"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine, Order, PaymentMode, VariantKind } from "@/lib/types";

interface CartState {
  lines: CartLine[];
  commune: string;
  mode: PaymentMode;
  promoCode: string | null;
  splitDelivery: boolean;
  add: (l: Omit<CartLine, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setCommune: (c: string) => void;
  setMode: (m: PaymentMode) => void;
  setPromo: (c: string | null) => void;
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
      promoCode: null,
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
      clear: () => set({ lines: [], promoCode: null, splitDelivery: false }),
      setCommune: (commune) => set({ commune }),
      setMode: (mode) => set({ mode }),
      setPromo: (promoCode) => set({ promoCode }),
      setSplit: (splitDelivery) => set({ splitDelivery }),
    }),
    { name: "hok-cart", storage: createJSONStorage(() => localStorage) },
  ),
);

/** Commandes créées depuis ce navigateur (en attendant le backend). */
interface OrdersState {
  orders: Order[];
  addOrder: (o: Order) => void;
  attachProof: (ref: string, payerNumber: string) => void;
}

export const useLocalOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      attachProof: (ref, payerNumber) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.ref === ref
              ? {
                  ...o,
                  status: "paiement_a_verifier",
                  paymentStatus: "preuve_recue",
                  payments: [
                    ...o.payments,
                    {
                      id: `PAY-${Date.now()}`,
                      date: new Date().toISOString(),
                      amount: o.depositDue,
                      mode: "orange_money",
                      payerNumber,
                      status: "preuve_recue",
                    },
                  ],
                }
              : o,
          ),
        })),
    }),
    { name: "hok-orders", storage: createJSONStorage(() => localStorage) },
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
