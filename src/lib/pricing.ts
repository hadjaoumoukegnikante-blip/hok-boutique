import { delivery, paymentRules } from "./config";
import { availableQty } from "./availability";
import { demoPromos } from "./data/orders";
import { producible } from "./data/admin";
import type { CartLine, PaymentMode, Product, Promo, UniversKey } from "./types";

export interface PricedLine {
  line: CartLine;
  product: Product;
  lineTotal: number;
  madeToOrder: boolean;
  overStock: boolean;
}

export interface CartTotals {
  lines: PricedLine[];
  count: number;
  subtotal: number;
  subtotalMade: number;
  subtotalStock: number;
  discount: number;
  deliveryFee: number;
  total: number;
  dueNow: number;
  dueLater: number;
  depositOnMade: number;
  requiresMakingAcceptance: boolean;
  cashOnDeliveryAllowed: boolean;
  makingDays: number;
  deliveryDays: number;
  hasStockIssue: boolean;
}

export function isMadeToOrder(p: Product) {
  return p.status === "sur_commande";
}

export function variantLabel(product: Product, line: Pick<CartLine, "selection" | "fabric">): string {
  const parts = product.variants
    .map((g) => g.options.find((o) => o.value === line.selection[g.kind])?.label)
    .filter(Boolean) as string[];
  if (product.fabric) parts.push(product.fabric.color);
  if (line.fabric) parts.push(line.fabric);
  return parts.join(" · ");
}

export function measurementsLabel(line: Pick<CartLine, "measurements" | "measurementsByWhatsapp">): string | undefined {
  if (line.measurementsByWhatsapp) return "Mesures à envoyer sur WhatsApp";
  const m = line.measurements;
  if (!m) return undefined;
  const parts = [`Poitrine ${m.poitrine}`, `Taille ${m.taille}`, `Hanches ${m.hanches}`, `Longueur ${m.longueur}`];
  if (m.hauteur) parts.push(`Hauteur ${m.hauteur}`);
  return parts.join(" · ") + " cm";
}

export function validatePromo(
  code: string,
  subtotalByUnivers: Record<UniversKey, number>,
  now = new Date(),
): { ok: true; promo: Promo } | { ok: false; message: string } {
  const promo = demoPromos.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!promo || !promo.active) return { ok: false, message: "Ce code n'est pas valide." };
  if (promo.startsAt && new Date(promo.startsAt) > now) return { ok: false, message: "Ce code n'est pas encore actif." };
  if (promo.endsAt && new Date(promo.endsAt) < now) return { ok: false, message: "Ce code a expiré." };
  if (promo.maxUses !== undefined && promo.used >= promo.maxUses) return { ok: false, message: "Ce code a atteint sa limite d'utilisation." };
  const eligible = eligibleAmount(promo, subtotalByUnivers);
  if (eligible <= 0) return { ok: false, message: "Aucun article éligible à ce code." };
  if (promo.minPurchase && eligible < promo.minPurchase)
    return { ok: false, message: `Minimum d'achat requis : ${promo.minPurchase.toLocaleString("fr-FR")} GNF.` };
  return { ok: true, promo };
}

function eligibleAmount(promo: Promo, byU: Record<UniversKey, number>) {
  const keys = (promo.univers?.length ? promo.univers : (Object.keys(byU) as UniversKey[]));
  return keys.reduce((s, k) => s + (byU[k] ?? 0), 0);
}

export function computeCart(
  lines: CartLine[],
  catalogue: Product[],
  opts: { commune?: string; mode: PaymentMode; promo?: Promo | null; splitDelivery?: boolean },
): CartTotals {
  const priced: PricedLine[] = [];
  const fabricUsed: Record<string, number> = {}; // mètres déjà demandés par matière
  const qtyByProduct: Record<string, number> = {};
  for (const line of lines) {
    const product = catalogue.find((p) => p.id === line.productId);
    if (!product) continue;
    const made = isMadeToOrder(product);
    let overStock = false;
    if (made && product.fabric) {
      const { materialId, meters } = product.fabric;
      const used = fabricUsed[materialId] ?? 0;
      overStock = producible(materialId, meters, used) < line.qty;
      fabricUsed[materialId] = used + meters * line.qty;
    } else {
      qtyByProduct[product.id] = (qtyByProduct[product.id] ?? 0) + line.qty;
      overStock = qtyByProduct[product.id] > availableQty(product);
    }
    priced.push({ line, product, lineTotal: product.price * line.qty, madeToOrder: made, overStock });
  }

  const byU: Record<UniversKey, number> = { studio: 0, bijoux: 0, maison: 0 };
  priced.forEach((l) => (byU[l.product.univers] += l.lineTotal));

  const subtotalMade = priced.filter((l) => l.madeToOrder).reduce((s, l) => s + l.lineTotal, 0);
  const subtotalStock = priced.filter((l) => !l.madeToOrder).reduce((s, l) => s + l.lineTotal, 0);
  const subtotal = subtotalMade + subtotalStock;

  // Réduction : appliquée sur le montant éligible, répartie au prorata entre confection et stock
  let discount = 0;
  let discMade = 0;
  if (opts.promo) {
    const eligible = eligibleAmount(opts.promo, byU);
    discount =
      opts.promo.kind === "pourcentage"
        ? Math.round((eligible * opts.promo.value) / 100)
        : Math.min(opts.promo.value, eligible);
    const eligibleMade = priced
      .filter((l) => l.madeToOrder && (!opts.promo!.univers?.length || opts.promo!.univers.includes(l.product.univers)))
      .reduce((s, l) => s + l.lineTotal, 0);
    discMade = eligible > 0 ? Math.round((discount * eligibleMade) / eligible) : 0;
  }
  const discStock = discount - discMade;

  const zone = delivery.zones.find((z) => z.commune === opts.commune);
  const baseFee = priced.length ? (zone?.fee ?? delivery.baseFee) : 0;
  const deliveryFee = baseFee + (opts.splitDelivery && priced.length ? delivery.extraShipmentFee : 0);

  const total = subtotal - discount + deliveryFee;

  const cashOnDeliveryAllowed = priced
    .filter((l) => !l.madeToOrder)
    .every((l) => paymentRules[l.product.univers].allowCashOnDelivery);
  const mode: PaymentMode = cashOnDeliveryAllowed ? opts.mode : "orange_money";

  const depositRate = paymentRules.studio.depositRate;
  const depositOnMade = Math.round((subtotalMade - discMade) * depositRate);
  const stockNet = subtotalStock - discStock;
  const dueNow = depositOnMade + (mode === "orange_money" ? stockNet + deliveryFee : 0);

  return {
    lines: priced,
    count: priced.reduce((s, l) => s + l.line.qty, 0),
    subtotal,
    subtotalMade,
    subtotalStock,
    discount,
    deliveryFee,
    total,
    dueNow,
    dueLater: total - dueNow,
    depositOnMade,
    requiresMakingAcceptance: priced.some((l) => l.madeToOrder && paymentRules[l.product.univers].requiresMakingAcceptance),
    cashOnDeliveryAllowed,
    makingDays: Math.max(0, ...priced.map((l) => (l.madeToOrder ? l.product.makingDays ?? 0 : 0))),
    deliveryDays: Math.max(0, ...priced.map((l) => l.product.deliveryDays ?? 0)),
    hasStockIssue: priced.some((l) => l.overStock || l.product.status === "indisponible"),
  };
}

/** Référence de commande HOK-AAAAMMJJ-XXXX. La séquence définitive sera attribuée par le backend. */
export function makeOrderRef(date: Date, seq: number) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `HOK-${y}${m}${d}-${String(seq).padStart(4, "0")}`;
}
