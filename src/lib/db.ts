/** Conversion des lignes de la base vers les types du front (utilisable client et serveur). */
import type {
  DeliveryZone, Order, OrderLine, PaymentRecord, PaymentRule, Product, ShopSettings, SubCategory, Univers, UniversKey,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

export function imageUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

export function rowToProduct(r: Row): Product {
  return {
    id: r.id,
    ref: r.ref,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    price: r.price,
    pricePending: r.price_pending ?? false,
    univers: r.univers,
    subcategory: r.subcategory ?? r.subcategories?.slug ?? "",
    subcategoryId: r.subcategory_id ?? null,
    images: (Array.isArray(r.images) ? r.images : (r.product_images ?? []).sort((a: Row, b: Row) => a.position - b.position).map((i: Row) => i.path)).map(imageUrl),
    variants: r.variants ?? [],
    fabric: r.fabric_material_id
      ? { materialId: r.fabric_material_id, meters: Number(r.fabric_meters), color: r.fabric_color ?? "", hex: r.fabric_hex ?? "#D8C3A9", pattern: r.fabric_pattern ?? "uni" }
      : undefined,
    stock: r.stock ?? 0,
    status: r.status,
    makingDays: r.making_days ?? undefined,
    deliveryDays: r.delivery_days ?? undefined,
    isNew: r.is_new ?? false,
    createdAt: r.created_at,
    available: r.available ?? undefined,
    active: r.active ?? true,
    isDemo: r.is_demo ?? false,
  };
}

export function rowsToUnivers(univers: Row[], subs: Row[]): Univers[] {
  return univers
    .sort((a, b) => a.position - b.position)
    .map((u) => ({
      key: u.key as UniversKey,
      slug: u.slug,
      label: u.label,
      brand: u.brand,
      tagline: u.tagline ?? "",
      subcategories: subs
        .filter((s) => s.univers === u.key)
        .sort((a, b) => a.position - b.position)
        .map((s): SubCategory & { id: string } => ({ id: s.id, slug: s.slug, label: s.label, active: s.active })),
    }));
}

export function rowToSettings(r: Row | null): ShopSettings {
  return {
    phone: r?.phone ?? null,
    email: r?.email ?? null,
    whatsapp: r?.whatsapp ?? null,
    domain: r?.domain ?? null,
    workshop: r?.workshop ?? null,
    omMerchantCode: r?.om_merchant_code ?? null,
    omBeneficiary: r?.om_beneficiary ?? null,
    rccm: r?.rccm ?? null,
    nif: r?.nif ?? null,
    reservationHours: r?.reservation_hours ?? null,
    extraShipmentFee: r?.extra_shipment_fee ?? 25000,
    deliveryProvisional: r?.delivery_provisional ?? true,
  };
}

export function rowsToZones(rows: Row[]): DeliveryZone[] {
  return rows.sort((a, b) => a.position - b.position).map((z) => ({ commune: z.commune, fee: z.fee }));
}

export function rowsToRules(rows: Row[]): Record<UniversKey, PaymentRule> {
  const out = {} as Record<UniversKey, PaymentRule>;
  for (const r of rows)
    out[r.univers as UniversKey] = {
      univers: r.univers,
      depositRate: Number(r.deposit_rate),
      allowCashOnDelivery: r.allow_cash_on_delivery,
      requiresMakingAcceptance: r.requires_making_acceptance,
    };
  return out;
}

export function rowToOrder(r: Row): Order {
  const lines: OrderLine[] = (r.lines ?? r.order_lines ?? []).map((l: Row) => ({
    productId: l.product_id,
    ref: l.product_ref,
    name: l.name,
    univers: l.univers,
    variantLabel: l.variant_label ?? "",
    qty: l.qty,
    unitPrice: l.unit_price,
    madeToOrder: l.made_to_order,
    measurements: l.measurements ?? undefined,
    measurementsByWhatsapp: l.measurements_by_whatsapp ?? false,
  }));
  const payments: PaymentRecord[] = (r.payments ?? [])
    .map((p: Row) => ({
      id: p.id ?? `${r.ref}-${p.created_at}`,
      date: p.created_at,
      amount: p.amount,
      mode: p.mode,
      payerNumber: p.payer_number ?? undefined,
      status: p.status,
      proofUrl: p.proof_path ?? undefined,
      verifiedBy: p.verified_by ?? undefined,
    }))
    .sort((a: PaymentRecord, b: PaymentRecord) => a.date.localeCompare(b.date));
  return {
    ref: r.ref,
    createdAt: r.created_at,
    customer: {
      firstName: r.first_name,
      lastName: r.last_name,
      phone: r.phone,
      email: r.email ?? undefined,
      commune: r.commune,
      quartier: r.quartier,
      address: r.address ?? "",
      marketingConsent: r.marketing_consent ?? false,
    },
    lines,
    subtotal: r.subtotal,
    discount: r.discount,
    promoCode: r.promo_code ?? undefined,
    deliveryFee: r.delivery_fee,
    total: r.total,
    depositDue: r.deposit_due,
    paid: r.paid,
    paymentMode: r.payment_mode,
    paymentStatus: r.payment_status,
    status: r.status,
    payments,
    makingDays: r.making_days ?? undefined,
    deliveryDays: r.delivery_days ?? undefined,
    splitDelivery: r.split_delivery ?? false,
    invoiceNumber: r.invoice_number,
    expiresAt: r.expires_at ?? null,
  };
}
