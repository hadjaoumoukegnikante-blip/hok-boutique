/**
 * Lien de discussion WhatsApp avec message prérempli (wa.me).
 * Le numéro vient des paramètres de la boutique (admin › Paramètres).
 */
export interface WhatsappParts {
  intro?: string;
  productName?: string;
  productRef?: string;
  productUrl?: string;
  orderRef?: string;
  extra?: string[];
}

export function whatsappLink(parts: WhatsappParts, phone?: string | null) {
  const lines = [parts.intro ?? "Bonjour H.O.K Boutique,"];
  if (parts.productName) lines.push(`Produit : ${parts.productName}${parts.productRef ? ` (réf. ${parts.productRef})` : ""}`);
  if (parts.productUrl) lines.push(parts.productUrl);
  if (parts.orderRef) lines.push(`Commande : ${parts.orderRef}`);
  if (parts.extra) lines.push(...parts.extra);
  const text = encodeURIComponent(lines.join("\n"));
  const number = (phone ?? "").replace(/\D/g, "");
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}
