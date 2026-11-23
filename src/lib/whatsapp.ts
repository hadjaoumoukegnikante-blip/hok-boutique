import { shop } from "./config";

/**
 * Lien de discussion WhatsApp avec message prérempli (wa.me).
 * C'est un simple bouton de discussion : la synchronisation automatique des
 * commandes demandera l'API WhatsApp Business (voir cahier des charges, section 10).
 */
export function whatsappLink(parts: {
  intro?: string;
  productName?: string;
  productRef?: string;
  productUrl?: string;
  orderRef?: string;
  extra?: string[];
}) {
  const lines = [parts.intro ?? "Bonjour H.O.K Boutique,"];
  if (parts.productName) lines.push(`Produit : ${parts.productName}${parts.productRef ? ` (réf. ${parts.productRef})` : ""}`);
  if (parts.productUrl) lines.push(parts.productUrl);
  if (parts.orderRef) lines.push(`Commande : ${parts.orderRef}`);
  if (parts.extra) lines.push(...parts.extra);
  const text = encodeURIComponent(lines.join("\n"));
  const number = shop.whatsapp.replace(/\D/g, "");
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}
