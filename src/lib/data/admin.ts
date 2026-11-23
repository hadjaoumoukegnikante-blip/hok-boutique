/** DONNÉES DE DÉMONSTRATION pour l'administration (matières, confection, historique). */

export interface RawMaterial {
  id: string;
  name: string;
  univers: "studio" | "bijoux" | "maison";
  unit: string;
  quantity: number;
  reserved: number;
  threshold: number;
  unitCost?: number;
}

/** Stock communiqué par la boutique le 21/11/2026. Coûts unitaires à fournir. */
export const rawMaterials: RawMaterial[] = [
  { id: "TIS-ROSE", name: "Tissu rose", univers: "studio", unit: "m", quantity: 3, reserved: 0, threshold: 3 },
  { id: "TIS-MARRON", name: "Tissu marron", univers: "studio", unit: "m", quantity: 9, reserved: 0, threshold: 3 },
  { id: "TIS-BEIGE", name: "Tissu beige", univers: "studio", unit: "m", quantity: 6, reserved: 0, threshold: 4 },
  { id: "TIS-VERT", name: "Tissu vert", univers: "studio", unit: "m", quantity: 7, reserved: 3, threshold: 3 }, // 3 m réservés par la commande de démo HOK-20261119-0001
  { id: "TIS-ROUGE", name: "Tissu rouge", univers: "studio", unit: "m", quantity: 6, reserved: 0, threshold: 4 },
  { id: "TIS-JAUNE", name: "Tissu jaune", univers: "studio", unit: "m", quantity: 6.5, reserved: 0, threshold: 4 },
  // 1 rouleau : longueur en mètres à confirmer (hypothèse provisoire de 10 m)
  { id: "TIS-RAYURES", name: "Tissu rayé rose et blanc (1 rouleau)", univers: "studio", unit: "m", quantity: 10, reserved: 0, threshold: 3 },
  { id: "BJ-CHARMS", name: "Charms (bracelets)", univers: "bijoux", unit: "bracelet", quantity: 20, reserved: 0, threshold: 5 },
  { id: "HM-CIRE", name: "Cire", univers: "maison", unit: "kg", quantity: 9, reserved: 0, threshold: 2 },
  { id: "HM-SENTEURS", name: "Senteurs", univers: "maison", unit: "flacon", quantity: 27, reserved: 0, threshold: 5 },
  { id: "HM-MECHES", name: "Mèches", univers: "maison", unit: "pièce", quantity: 100, reserved: 0, threshold: 20 },
  { id: "HM-AUTOCOLLANTS", name: "Autocollants de mèche", univers: "maison", unit: "pièce", quantity: 200, reserved: 0, threshold: 40 },
];

export function materialById(id: string) {
  return rawMaterials.find((m) => m.id === id);
}

/** Nombre de pièces encore réalisables avec le tissu disponible. */
export function producible(materialId: string, meters: number, alreadyUsed = 0) {
  const m = materialById(materialId);
  if (!m || meters <= 0) return 0;
  return Math.max(0, Math.floor((m.quantity - m.reserved - alreadyUsed + 1e-9) / meters));
}



export type ProductionStage = "a_demarrer" | "decoupe" | "couture" | "finitions" | "terminee";

export const productionStages: { key: ProductionStage; label: string }[] = [
  { key: "a_demarrer", label: "À démarrer" },
  { key: "decoupe", label: "Découpe" },
  { key: "couture", label: "Couture" },
  { key: "finitions", label: "Finitions" },
  { key: "terminee", label: "Terminée" },
];

export interface ProductionJob {
  id: string;
  orderRef: string;
  product: string;
  variant: string;
  customer: string;
  stage: ProductionStage;
  dueDate: string;
}

export const productionJobs: ProductionJob[] = [
  { id: "CF-001", orderRef: "HOK-20261119-0001", product: "Kénèya", variant: "M · Vert", customer: "Aïssata E.", stage: "couture", dueDate: "2026-11-29" },
  { id: "CF-002", orderRef: "HOK-20261117-0007", product: "Sira", variant: "L · Beige", customer: "Hawa D.", stage: "decoupe", dueDate: "2026-12-01" },
  { id: "CF-003", orderRef: "HOK-20261115-0005", product: "Néné", variant: "XL · Rose", customer: "Binta S.", stage: "finitions", dueDate: "2026-11-22" },
  { id: "CF-004", orderRef: "HOK-20261120-0009", product: "Danaya", variant: "M · Marron", customer: "Nènè K.", stage: "a_demarrer", dueDate: "2026-12-04" },
];

export interface AuditEntry {
  id: string;
  date: string;
  user: string;
  action: string;
  target: string;
  detail: string;
}

export const auditLog: AuditEntry[] = [
  { id: "LOG-006", date: "2026-11-20T09:41:00Z", user: "Admin", action: "Changement de statut", target: "HOK-20261120-0003", detail: "En attente de paiement → Confirmée (paiement à la livraison)" },
  { id: "LOG-005", date: "2026-11-20T08:31:00Z", user: "Système", action: "Preuve de paiement reçue", target: "HOK-20261120-0002", detail: "Orange Money · 445 000 GNF · à vérifier" },
  { id: "LOG-004", date: "2026-11-19T11:03:00Z", user: "Admin", action: "Validation de paiement", target: "HOK-20261119-0001", detail: "Acompte 175 000 GNF vérifié" },
  { id: "LOG-003", date: "2026-11-19T11:05:00Z", user: "Admin", action: "Réservation matière", target: "TIS-VERT", detail: "3 m réservés pour HOK-20261119-0001" },
  { id: "LOG-002", date: "2026-11-18T16:20:00Z", user: "Admin", action: "Modification du stock", target: "HOK-BJ-003", detail: "6 → 5 (vente HOK-20261118-0004)" },
  { id: "LOG-001", date: "2026-11-18T15:41:00Z", user: "Admin", action: "Validation de paiement", target: "HOK-20261118-0004", detail: "133 000 GNF vérifié" },
];
