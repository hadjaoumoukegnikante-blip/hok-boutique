import type { Product } from "./types";

/** Quantité vendable, calculée par la base (stock libre ou tissu libre). */
export function availableQty(p: Product): number {
  if (p.status === "indisponible") return 0;
  if (typeof p.available === "number") return p.available;
  return p.status === "en_stock" ? p.stock : 99;
}

export function isSoldOut(p: Product) {
  return availableQty(p) <= 0;
}
