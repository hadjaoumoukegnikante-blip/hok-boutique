import "server-only";
/**
 * Lecture des données publiques de la boutique (serveur).
 * Source : Supabase (vue « catalogue » et tables publiques).
 */
import { cache } from "react";
import { rowsToRules, rowsToUnivers, rowsToZones, rowToProduct, rowToSettings } from "./db";
import { supabasePublic } from "./supabase/public";
import type { Product, ShopData, Univers, UniversKey } from "./types";

export const getShopData = cache(async (): Promise<ShopData> => {
  const db = supabasePublic();
  const [p, u, s, st, z, r] = await Promise.all([
    db.from("catalogue").select("*").order("created_at"),
    db.from("univers").select("*"),
    db.from("subcategories").select("*").eq("active", true),
    db.from("settings").select("*").eq("id", 1).maybeSingle(),
    db.from("delivery_zones").select("*").eq("active", true),
    db.from("payment_rules").select("*"),
  ]);
  const err = p.error ?? u.error ?? s.error ?? st.error ?? z.error ?? r.error;
  if (err) throw new Error(`Lecture Supabase impossible : ${err.message}`);
  return {
    products: (p.data ?? []).map(rowToProduct),
    univers: rowsToUnivers(u.data ?? [], s.data ?? []),
    settings: rowToSettings(st.data),
    zones: rowsToZones(z.data ?? []),
    rules: rowsToRules(r.data ?? []),
  };
});

export async function getUnivers(): Promise<Univers[]> {
  return (await getShopData()).univers;
}

export async function getUniversBySlug(slug: string): Promise<Univers | undefined> {
  return (await getUnivers()).find((u) => u.slug === slug);
}

export async function getProducts(filter?: { univers?: UniversKey; subcategory?: string }): Promise<Product[]> {
  return (await getShopData()).products.filter(
    (p) => (!filter?.univers || p.univers === filter.univers) && (!filter?.subcategory || p.subcategory === filter.subcategory),
  );
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getShopData()).products.find((p) => p.slug === slug);
}

export async function getNewProducts(): Promise<Product[]> {
  return (await getShopData()).products.filter((p) => p.isNew);
}
