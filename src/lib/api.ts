/**
 * Couche d'accès aux données.
 * Aujourd'hui : données de démonstration en mémoire.
 * Demain : appels au backend (fetch vers l'API) sans changer les pages.
 */
import { products, univers, universByKey } from "./data/catalogue";
import { demoOrders } from "./data/orders";
import type { Order, Product, Univers, UniversKey } from "./types";

export async function getUnivers(): Promise<Univers[]> {
  return univers;
}

export async function getUniversBySlug(slug: string): Promise<Univers | undefined> {
  return univers.find((u) => u.slug === slug);
}

export function getUniversSync(key: UniversKey): Univers {
  return universByKey[key];
}

export async function getProducts(filter?: { univers?: UniversKey; subcategory?: string }): Promise<Product[]> {
  return products.filter(
    (p) =>
      (!filter?.univers || p.univers === filter.univers) &&
      (!filter?.subcategory || p.subcategory === filter.subcategory),
  );
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return products.find((p) => p.slug === slug);
}

export async function getNewProducts(): Promise<Product[]> {
  return products.filter((p) => p.isNew);
}

export function searchProducts(q: string): Product[] {
  const s = q
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (!s) return [];
  return products.filter((p) => {
    const hay = `${p.name} ${p.ref} ${p.description} ${universByKey[p.univers].label}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    return hay.includes(s);
  });
}

export async function getOrders(): Promise<Order[]> {
  return demoOrders;
}

export async function findOrder(ref: string, phone?: string): Promise<Order | undefined> {
  const o = demoOrders.find((x) => x.ref.toUpperCase() === ref.trim().toUpperCase());
  if (!o) return undefined;
  if (phone !== undefined && o.customer.phone.replace(/\D/g, "") !== phone.replace(/\D/g, "")) return undefined;
  return o;
}

export function allProducts(): Product[] {
  return products;
}
