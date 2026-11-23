import type { DeliveryZone, UniversKey } from "./types";

/**
 * Paramètres de la boutique.
 * Les valeurs entre crochets sont à fournir avant la mise en ligne
 * (cahier des charges, section 18). Elles seront ensuite gérées depuis l'administration.
 */
export const shop = {
  name: "H.O.K Boutique",
  signature: "FASHION · HOME · JEWELRY",
  tagline: "Une identité, plusieurs univers.",
  city: "Conakry, Guinée",
  domain: "hokboutique.com",
  workshop: "Lambangni, Cimetière (Conakry)",
  currency: "GNF",
  phone: "[TÉLÉPHONE OFFICIEL]",
  email: "[E-MAIL OFFICIEL]",
  // Numéro WhatsApp Business au format international sans "+" ni espaces, ex. 224620000000
  whatsapp: "",
  orangeMoney: {
    merchantCode: "[CODE MARCHAND]",
    beneficiary: "[NOM DU BÉNÉFICIAIRE]",
  },
  legal: {
    rccm: "[RCCM]",
    nif: "[NIF]",
  },
};

/** Règles de paiement par univers (configurables dans l'administration). */
export const paymentRules: Record<
  UniversKey,
  { depositRate: number; allowCashOnDelivery: boolean; requiresMakingAcceptance: boolean }
> = {
  studio: { depositRate: 0.5, allowCashOnDelivery: false, requiresMakingAcceptance: true },
  bijoux: { depositRate: 0, allowCashOnDelivery: true, requiresMakingAcceptance: false },
  maison: { depositRate: 0, allowCashOnDelivery: true, requiresMakingAcceptance: false },
};

/** Tarifs à définir avec le livreur : 25 000 GNF affiché à titre provisoire. */
export const delivery = {
  baseFee: 25000,
  provisional: true,
  extraShipmentFee: 25000, // par livraison séparée supplémentaire, à confirmer
  zones: [
    { commune: "Kaloum", fee: 25000 },
    { commune: "Dixinn", fee: 25000 },
    { commune: "Matam", fee: 25000 },
    { commune: "Ratoma", fee: 25000 },
    { commune: "Matoto", fee: 25000 },
  ] satisfies DeliveryZone[],
};

/** Une commande non payée est annulée au bout de 24 h (décision de la boutique, 21/11/2026). */
export const reservationHours: number | null = 24;
