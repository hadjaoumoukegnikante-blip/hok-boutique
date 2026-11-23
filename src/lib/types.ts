// Modèle de données du front. Les mêmes formes serviront de contrat avec le backend.

export type UniversKey = "studio" | "bijoux" | "maison";

export type ProductStatus =
  | "en_stock"
  | "sur_commande" // confection sur commande
  | "precommande"
  | "indisponible";

export type OrderStatus =
  | "en_attente_paiement"
  | "paiement_a_verifier"
  | "confirmee"
  | "en_preparation"
  | "partiellement_prete"
  | "prete_a_expedier"
  | "expediee"
  | "livree"
  | "annulee";

export type PaymentStatus =
  | "en_attente"
  | "preuve_recue"
  | "a_verifier"
  | "partiellement_paye"
  | "paye"
  | "echec"
  | "rembourse";

export type PaymentMode = "orange_money" | "a_la_livraison";

export interface SubCategory {
  slug: string;
  label: string;
  active: boolean;
}

export interface Univers {
  key: UniversKey;
  slug: string; // segment d'URL
  label: string; // libellé du menu
  brand: string; // H.O.K Studio, H.O.K Jewelry, H.O.K Home
  tagline: string;
  subcategories: SubCategory[];
}

export type VariantKind = "taille" | "couleur" | "senteur" | "modele";

export interface VariantOption {
  value: string;
  label: string;
  hex?: string; // pour les couleurs
  stock?: number; // stock par option, si géré
}

export interface VariantGroup {
  kind: VariantKind;
  label: string;
  options: VariantOption[];
}

/** Mensurations en centimètres, pour la confection sur mesure. */
export interface Measurements {
  poitrine: string;
  taille: string;
  hanches: string;
  longueur: string;
  hauteur?: string;
  note?: string;
}

/** Tissu utilisé par un modèle : il fixe la couleur et la quantité consommée. */
export interface FabricUse {
  materialId: string;
  meters: number;
  color: string;
  hex: string;
  pattern?: "uni" | "rayures";
}

export interface Product {
  id: string;
  ref: string; // référence unique
  slug: string;
  name: string;
  description: string;
  price: number; // GNF
  univers: UniversKey;
  subcategory: string; // slug de sous-catégorie
  images: string[]; // URLs ; vide = visuel de remplacement
  variants: VariantGroup[];
  fabrics?: string[]; // tissus au choix (si plusieurs)
  fabric?: FabricUse; // tissu imposé par le modèle
  pricePending?: boolean; // prix à confirmer par la boutique
  stock: number; // quantité disponible (produits finis)
  status: ProductStatus;
  makingDays?: number; // délai de confection
  deliveryDays?: number; // délai de livraison
  isNew?: boolean;
  createdAt: string;
}

export interface CartLine {
  key: string; // productId + variantes
  productId: string;
  qty: number;
  selection: Partial<Record<VariantKind, string>>;
  fabric?: string;
  measurements?: Measurements; // saisies sur le site
  measurementsByWhatsapp?: boolean; // le client enverra ses mesures sur WhatsApp
}

export interface DeliveryZone {
  commune: string;
  fee: number; // GNF
}

export interface Promo {
  code: string;
  kind: "pourcentage" | "montant";
  value: number;
  minPurchase?: number;
  startsAt?: string;
  endsAt?: string;
  maxUses?: number;
  used: number;
  univers?: UniversKey[]; // vide = tous
  cumulable: boolean;
  active: boolean;
}

export interface Customer {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  commune: string;
  quartier: string;
  address: string;
  marketingConsent: boolean;
}

export interface OrderLine {
  productId: string;
  ref: string;
  name: string;
  univers: UniversKey;
  variantLabel: string;
  qty: number;
  unitPrice: number;
  madeToOrder: boolean;
  measurements?: Measurements;
  measurementsByWhatsapp?: boolean;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  payerNumber?: string; // numéro Orange Money du payeur
  status: PaymentStatus;
  proofUrl?: string;
  verifiedBy?: string;
}

export interface Order {
  ref: string; // HOK-AAAAMMJJ-XXXX
  createdAt: string;
  customer: Customer;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  deliveryFee: number;
  total: number;
  depositDue: number; // montant exigé avant confection / livraison
  paid: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  payments: PaymentRecord[];
  makingDays?: number;
  deliveryDays?: number;
  splitDelivery: boolean;
  invoiceNumber: string;
}
