import type { Order, Promo } from "../types";

/** DONNÉES DE DÉMONSTRATION pour le suivi de commande et l'administration. */

const client = {
  firstName: "Aïssata",
  lastName: "Exemple",
  phone: "620000001",
  email: "",
  commune: "Ratoma",
  quartier: "Kipé",
  address: "[Adresse d'exemple]",
  marketingConsent: false,
};

export const demoOrders: Order[] = [
  {
    ref: "HOK-20261119-0001",
    createdAt: "2026-11-19T10:24:00Z",
    customer: client,
    lines: [
      { productId: "HOK-ST-001", ref: "HOK-ST-001", name: "Kénèya", univers: "studio", variantLabel: "M · Vert", qty: 1, unitPrice: 350000, madeToOrder: true, measurements: { poitrine: "92", taille: "74", hanches: "100", longueur: "120" } },
    ],
    subtotal: 350000,
    discount: 0,
    deliveryFee: 25000,
    total: 375000,
    depositDue: 175000,
    paid: 175000,
    paymentMode: "orange_money",
    paymentStatus: "partiellement_paye",
    status: "en_preparation",
    payments: [
      { id: "PAY-0001", date: "2026-11-19T11:02:00Z", amount: 175000, mode: "orange_money", payerNumber: "620000001", status: "paye", verifiedBy: "Admin" },
    ],
    makingDays: 4,
    deliveryDays: 2,
    splitDelivery: false,
    invoiceNumber: "FAC-2026-0001",
  },
  {
    ref: "HOK-20261120-0002",
    createdAt: "2026-11-20T08:12:00Z",
    customer: { ...client, firstName: "Mariama", phone: "620000002", commune: "Kaloum", quartier: "Almamya" },
    lines: [
      { productId: "HOK-BJ-001", ref: "HOK-BJ-001", name: "Bracelet charms personnalisé", univers: "bijoux", variantLabel: "Doré", qty: 1, unitPrice: 180000, madeToOrder: false },
      { productId: "HOK-HM-001", ref: "HOK-HM-001", name: "Bougie parfumée", univers: "maison", variantLabel: "Vanille", qty: 2, unitPrice: 120000, madeToOrder: false },
    ],
    subtotal: 420000,
    discount: 0,
    deliveryFee: 25000,
    total: 445000,
    depositDue: 445000,
    paid: 0,
    paymentMode: "orange_money",
    paymentStatus: "a_verifier",
    status: "paiement_a_verifier",
    payments: [
      { id: "PAY-0002", date: "2026-11-20T08:30:00Z", amount: 445000, mode: "orange_money", payerNumber: "620000002", status: "a_verifier", proofUrl: "#" },
    ],
    deliveryDays: 1,
    splitDelivery: false,
    invoiceNumber: "FAC-2026-0002",
  },
  {
    ref: "HOK-20261120-0003",
    createdAt: "2026-11-20T09:40:00Z",
    customer: { ...client, firstName: "Fatou", phone: "620000003", commune: "Matoto", quartier: "Sangoyah" },
    lines: [
      { productId: "HOK-HM-002", ref: "HOK-HM-002", name: "Vase sculptural", univers: "maison", variantLabel: "", qty: 1, unitPrice: 260000, madeToOrder: false },
    ],
    subtotal: 260000,
    discount: 0,
    deliveryFee: 25000,
    total: 285000,
    depositDue: 0,
    paid: 0,
    paymentMode: "a_la_livraison",
    paymentStatus: "en_attente",
    status: "confirmee",
    payments: [],
    deliveryDays: 2,
    splitDelivery: false,
    invoiceNumber: "FAC-2026-0003",
  },
  {
    ref: "HOK-20261118-0004",
    createdAt: "2026-11-18T15:05:00Z",
    customer: { ...client, firstName: "Kadiatou", phone: "620000004", commune: "Dixinn", quartier: "Landréah" },
    lines: [
      { productId: "HOK-BJ-003", ref: "HOK-BJ-003", name: "Créoles dorées", univers: "bijoux", variantLabel: "Doré", qty: 1, unitPrice: 120000, madeToOrder: false },
    ],
    subtotal: 120000,
    discount: 12000,
    promoCode: "BIENVENUE10",
    deliveryFee: 25000,
    total: 133000,
    depositDue: 133000,
    paid: 133000,
    paymentMode: "orange_money",
    paymentStatus: "paye",
    status: "livree",
    payments: [
      { id: "PAY-0003", date: "2026-11-18T15:40:00Z", amount: 133000, mode: "orange_money", payerNumber: "620000004", status: "paye", verifiedBy: "Admin" },
    ],
    deliveryDays: 1,
    splitDelivery: false,
    invoiceNumber: "FAC-2026-0004",
  },
];

/** Codes d'exemple. Les vraies promotions seront créées dans l'administration. */
export const demoPromos: Promo[] = [
  { code: "BIENVENUE10", kind: "pourcentage", value: 10, minPurchase: 100000, used: 3, maxUses: 100, cumulable: false, active: true },
  { code: "HOME20000", kind: "montant", value: 20000, minPurchase: 200000, univers: ["maison"], used: 0, maxUses: 50, cumulable: false, active: true },
];
