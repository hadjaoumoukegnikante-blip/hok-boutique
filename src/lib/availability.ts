import { materialById, producible } from "./data/admin";
import type { Product } from "./types";

/** Quantité réellement vendable : stock pour les produits finis, tissu disponible pour la confection. */
export function availableQty(p: Product): number {
  if (p.status === "indisponible") return 0;
  if (p.status === "sur_commande") return p.fabric ? producible(p.fabric.materialId, p.fabric.meters) : 99;
  if (p.status === "precommande") return 99;
  return p.stock;
}

export function isSoldOut(p: Product) {
  return availableQty(p) <= 0;
}

export function fabricLabel(p: Product) {
  if (!p.fabric) return undefined;
  const m = materialById(p.fabric.materialId);
  return `${p.fabric.color}${p.fabric.pattern === "rayures" ? " (rayé)" : ""} · ${p.fabric.meters.toLocaleString("fr-FR")} m${m ? "" : ""}`;
}
