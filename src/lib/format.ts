import type { OrderStatus, PaymentStatus, ProductStatus } from "./types";

export function gnf(n: number): string {
  const s = Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${s} GNF`;
}

export function dateFr(iso: string, withTime = false): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function cn(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(" ");
}

type Tone = "neutre" | "brun" | "ok" | "bordeaux" | "danger";

export const productStatusMeta: Record<ProductStatus, { label: string; short: string; tone: Tone }> = {
  en_stock: { label: "En stock", short: "En stock", tone: "ok" },
  sur_commande: { label: "Confection sur commande", short: "Sur commande", tone: "brun" },
  precommande: { label: "Précommande", short: "Précommande", tone: "bordeaux" },
  indisponible: { label: "Indisponible", short: "Indisponible", tone: "neutre" },
};

export const orderStatusMeta: Record<OrderStatus, { label: string; tone: Tone }> = {
  en_attente_paiement: { label: "En attente de paiement", tone: "neutre" },
  paiement_a_verifier: { label: "Paiement à vérifier", tone: "brun" },
  confirmee: { label: "Confirmée", tone: "ok" },
  en_preparation: { label: "En préparation / confection", tone: "brun" },
  partiellement_prete: { label: "Partiellement prête", tone: "brun" },
  prete_a_expedier: { label: "Prête à expédier", tone: "ok" },
  expediee: { label: "Expédiée", tone: "ok" },
  livree: { label: "Livrée", tone: "ok" },
  annulee: { label: "Annulée", tone: "danger" },
};

export const paymentStatusMeta: Record<PaymentStatus, { label: string; tone: Tone }> = {
  en_attente: { label: "En attente", tone: "neutre" },
  preuve_recue: { label: "Preuve reçue", tone: "neutre" },
  a_verifier: { label: "À vérifier", tone: "brun" },
  partiellement_paye: { label: "Partiellement payé", tone: "bordeaux" },
  paye: { label: "Payé", tone: "ok" },
  echec: { label: "Échec", tone: "danger" },
  rembourse: { label: "Remboursé", tone: "neutre" },
};

export const toneClass: Record<Tone, string> = {
  neutre: "bg-sable text-soft",
  brun: "bg-brun/10 text-brun",
  ok: "bg-ok/10 text-ok",
  bordeaux: "bg-bordeaux/[0.08] text-bordeaux",
  danger: "bg-danger/[0.08] text-danger",
};

export type { Tone };
