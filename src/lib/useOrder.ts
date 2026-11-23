"use client";

import { demoOrders } from "./data/orders";
import { useLocalOrders } from "@/store/cart";

/** Cherche une commande parmi celles créées dans ce navigateur, puis dans la démo. */
export function useOrder(ref: string) {
  const local = useLocalOrders((s) => s.orders);
  const r = decodeURIComponent(ref).toUpperCase();
  return local.find((o) => o.ref === r) ?? demoOrders.find((o) => o.ref === r);
}

export function useFindOrder() {
  const local = useLocalOrders((s) => s.orders);
  return (ref: string, phone: string) => {
    const r = ref.trim().toUpperCase();
    const o = local.find((x) => x.ref === r) ?? demoOrders.find((x) => x.ref === r);
    if (!o) return undefined;
    return o.customer.phone.replace(/\D/g, "").endsWith(phone.replace(/\D/g, "").slice(-9)) ? o : undefined;
  };
}
