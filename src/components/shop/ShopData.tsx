"use client";

import { createContext, useContext } from "react";
import { searchIn } from "@/lib/search";
import type { ShopData, UniversKey } from "@/lib/types";
import { whatsappLink, type WhatsappParts } from "@/lib/whatsapp";

const Ctx = createContext<ShopData | null>(null);

/** Données de la boutique lues côté serveur, partagées avec les composants du navigateur. */
export function ShopDataProvider({ value, children }: { value: ShopData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShopData(): ShopData {
  const v = useContext(Ctx);
  if (!v) throw new Error("ShopDataProvider manquant");
  return v;
}

export function useUniversOf() {
  const { univers } = useShopData();
  return (key: UniversKey) => univers.find((u) => u.key === key)!;
}

export function useWhatsapp() {
  const { settings } = useShopData();
  return (parts: WhatsappParts) => whatsappLink(parts, settings.whatsapp);
}

export function useSearch() {
  const { products, univers } = useShopData();
  return (q: string) => searchIn(products, univers, q);
}
