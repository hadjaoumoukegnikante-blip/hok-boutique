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

  const [accountPhone, setAccountPhone] = useState<string | undefined>();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (phone) {
        const order = await trackOrder(r, phone);
        if (alive) setState({ loading: false, order });
        return;
      }
      // Pas mémorisée sur cet appareil : commande du compte connecté ?
      const { data } = await supabaseBrowser().rpc("my_orders");
      const row = ((data as Record<string, unknown>[] | null) ?? []).find((x) => x?.ref === r);
      if (!alive) return;
      setAccountPhone(row ? String(row.phone) : undefined);
      setState({ loading: false, order: row ? rowToOrder(row) : null });
    })();
    return () => {
      alive = false;
    };
  }, [r, phone, tick]);

  return { ...state, phone: phone ?? accountPhone, reload: () => setTick((t) => t + 1) };
}
