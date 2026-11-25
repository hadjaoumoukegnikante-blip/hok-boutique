/** Numéro guinéen ramené à 9 chiffres (6XXXXXXXX), avec ou sans 224. null si invalide. */
export function normalizePhone(input: string): string | null {
  let d = (input ?? "").replace(/\D/g, "");
  if (d.startsWith("00224")) d = d.slice(5);
  else if (d.startsWith("224") && d.length === 12) d = d.slice(3);
  return /^6\d{8}$/.test(d) ? d : null;
}

/** Identifiant technique du compte client (jamais affiché, aucun e-mail n'y est envoyé). */
export const phoneToEmail = (phone9: string) => `${phone9}@clients.hokboutique.com`;

export const isClientEmail = (email?: string | null) => !!email?.endsWith("@clients.hokboutique.com");

export const formatPhone = (p9: string) => p9.replace(/^(\d{3})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4");
