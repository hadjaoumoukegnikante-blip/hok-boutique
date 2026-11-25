"use client";

import { useEffect, useState } from "react";
import { rowToOrder } from "./db";
import { supabaseBrowser } from "./supabase/client";
import type { Order } from "./types";
import { useLocalOrders } from "@/store/cart";

/** Lit une commande par référence + téléphone (fonction track_order, sans compte). */
export async function trackOrder(ref: string, phone: string): Promise<Order | null> {
  const { data, error } = await supabaseBrowser().rpc("track_order", { p_ref: ref.trim().toUpperCase(), p_phone: phone });
  if (error || !data) return null;
  return rowToOrder(data);
}

/** Commande passée depuis cet appareil (le téléphone est mémorisé localement). */
export function useOrder(ref: string) {
  const r = decodeURIComponent(ref).toUpperCase();
  const phone = useLocalOrders((s) => s.orders.find((o) => o.ref === r)?.phone);
  const [state, setState] = useState<{ loading: boolean; order: Order | null }>({ loading: true, order: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!phone) {
      setState({ loading: false, order: null });
      return;
    }
    trackOrder(r, phone).then((order) => alive && setState({ loading: false, order }));
    return () => {
      alive = false;
    };
  }, [r, phone, tick]);

  return { ...state, phone, reload: () => setTick((t) => t + 1) };
}
