/**
 * Estimation du panier affichée au client. Le montant qui fait foi est
 * recalculé par la base (fonction place_order) au moment de la commande.
 */
import { availableQty } from "./availability";
import type { AppliedPromo, CartLine, DeliveryZone, PaymentMode, PaymentRule, Product, UniversKey } from "./types";

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
  baseDeliveryFee: number;
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
  if (product.fabric?.color) parts.push(product.fabric.color);
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

const DEFAULT_RULE: PaymentRule = { univers: "studio", depositRate: 0, allowCashOnDelivery: true, requiresMakingAcceptance: false };

export function computeCart(
  lines: CartLine[],
  catalogue: Product[],
  opts: {
    commune?: string;
    mode: PaymentMode;
    promo?: AppliedPromo | null;
    splitDelivery?: boolean;
    zones: DeliveryZone[];
    rules: Partial<Record<UniversKey, PaymentRule>>;
    extraShipmentFee: number;
  },
): CartTotals {
  const rule = (u: UniversKey) => opts.rules[u] ?? DEFAULT_RULE;
  const priced: PricedLine[] = [];
  const qtyByProduct: Record<string, number> = {};
  for (const line of lines) {
    const product = catalogue.find((p) => p.id === line.productId);
    if (!product) continue;
    const made = isMadeToOrder(product);
    qtyByProduct[product.id] = (qtyByProduct[product.id] ?? 0) + line.qty;
    const overStock = product.status !== "precommande" && qtyByProduct[product.id] > availableQty(product);
    priced.push({ line, product, lineTotal: product.price * line.qty, madeToOrder: made, overStock });
  }

  const subtotalMade = priced.filter((l) => l.madeToOrder).reduce((s, l) => s + l.lineTotal, 0);
  const subtotalStock = priced.filter((l) => !l.madeToOrder).reduce((s, l) => s + l.lineTotal, 0);
  const subtotal = subtotalMade + subtotalStock;

  // Remise : sur le montant éligible, répartie au prorata entre confection et stock (comme la base)
  let discount = 0;
  let discMade = 0;
  if (opts.promo) {
    const eligibleU = (u: UniversKey) => !opts.promo!.univers?.length || opts.promo!.univers.includes(u);
    const eligible = priced.filter((l) => eligibleU(l.product.univers)).reduce((s, l) => s + l.lineTotal, 0);
    discount = opts.promo.kind === "pourcentage" ? Math.round((eligible * opts.promo.value) / 100) : Math.min(opts.promo.value, eligible);
    const eligibleMade = priced.filter((l) => l.madeToOrder && eligibleU(l.product.univers)).reduce((s, l) => s + l.lineTotal, 0);
    discMade = eligible > 0 ? Math.round((discount * eligibleMade) / eligible) : 0;
  }
  const discStock = discount - discMade;

  const zone = opts.zones.find((z) => z.commune === opts.commune);
  const baseDeliveryFee = priced.length ? (zone?.fee ?? opts.zones[0]?.fee ?? 0) : 0;
  const deliveryFee = baseDeliveryFee + (opts.splitDelivery && priced.length ? opts.extraShipmentFee : 0);
  const total = subtotal - discount + deliveryFee;

  const cashOnDeliveryAllowed = priced.filter((l) => !l.madeToOrder).every((l) => rule(l.product.univers).allowCashOnDelivery);
  const mode: PaymentMode = cashOnDeliveryAllowed ? opts.mode : "orange_money";

  const depositRaw = priced.filter((l) => l.madeToOrder).reduce((s, l) => s + l.lineTotal * rule(l.product.univers).depositRate, 0);
  const depositOnMade = subtotalMade > 0 ? Math.round((depositRaw * (subtotalMade - discMade)) / subtotalMade) : 0;
  const dueNow = depositOnMade + (mode === "orange_money" ? subtotalStock - discStock + deliveryFee : 0);

  return {
    lines: priced,
    count: priced.reduce((s, l) => s + l.line.qty, 0),
    subtotal,
    subtotalMade,
    subtotalStock,
    discount,
    deliveryFee,
    baseDeliveryFee,
    total,
    dueNow,
    dueLater: total - dueNow,
    depositOnMade,
    requiresMakingAcceptance: priced.some((l) => l.madeToOrder && rule(l.product.univers).requiresMakingAcceptance),
    cashOnDeliveryAllowed,
    makingDays: Math.max(0, ...priced.map((l) => (l.madeToOrder ? l.product.makingDays ?? 0 : 0))),
    deliveryDays: Math.max(0, ...priced.map((l) => l.product.deliveryDays ?? 0)),
    hasStockIssue: priced.some((l) => l.overStock || l.product.status === "indisponible"),
  };
}
