import type { Product, Univers, UniversKey, VariantGroup } from "../types";

/**
 * DONNÉES DE DÉMONSTRATION.
 * Noms, prix, stocks et délais sont des exemples pour la maquette.
 * Ils seront remplacés par le catalogue réel fourni par la boutique (via le backend).
 */

export const univers: Univers[] = [
  {
    key: "studio",
    slug: "vetements",
    label: "Vêtements",
    brand: "H.O.K Studio",
    tagline: "Confectionnés pour vous, à vos mesures.",
    subcategories: [
      { slug: "robes", label: "Robes", active: true },
      { slug: "outside-dress", label: "Outside dress", active: true },
      { slug: "office", label: "Office", active: true },
      { slug: "suits", label: "Suits", active: true },
    ],
  },
  {
    key: "bijoux",
    slug: "bijoux",
    label: "Bijoux",
    brand: "H.O.K Jewelry",
    tagline: "Des détails qui vous ressemblent.",
    subcategories: [
      { slug: "charms-custom", label: "Charms bracelet custom", active: true },
      { slug: "bagues", label: "Bagues", active: true },
      { slug: "boucles-oreilles", label: "Boucles d'oreilles", active: true },
      { slug: "bracelets", label: "Bracelets", active: true },
      { slug: "colliers", label: "Colliers", active: true },
    ],
  },
  {
    key: "maison",
    slug: "maison",
    label: "Home",
    brand: "H.O.K Home",
    tagline: "La chaleur d'un intérieur soigné.",
    subcategories: [
      { slug: "bougies", label: "Bougies", active: true },
      { slug: "vases", label: "Vases", active: true },
      { slug: "plateaux", label: "Plateaux", active: true },
      { slug: "vaisselle", label: "Vaisselle", active: true },
      { slug: "ensembles", label: "Ensembles", active: true },
    ],
  },
];

export const universByKey = Object.fromEntries(univers.map((u) => [u.key, u])) as Record<
  UniversKey,
  Univers
>;

const tailles: VariantGroup = {
  kind: "taille",
  label: "Taille",
  options: ["M", "L", "XL", "XXL"].map((v) => ({ value: v, label: v })),
};


const metal: VariantGroup = {
  kind: "couleur",
  label: "Finition",
  options: [
    { value: "dore", label: "Doré", hex: "#C9A45C" },
    { value: "argent", label: "Argenté", hex: "#C8C8C8" },
  ],
};

const senteurs: VariantGroup = {
  kind: "senteur",
  label: "Senteur",
  options: [
    { value: "vanille", label: "Vanille" },
    { value: "ambre", label: "Ambre" },
    { value: "fleur-coton", label: "Fleur de coton" },
  ],
};

function p(x: Omit<Product, "id" | "slug" | "createdAt" | "images"> & { images?: string[] }): Product {
  const slug = x.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return { id: x.ref, slug, createdAt: "2026-11-01", images: [], ...x };
}

const robe = (
  ref: string,
  name: string,
  description: string,
  fabric: { materialId: string; meters: number; color: string; hex: string; pattern?: "uni" | "rayures" },
  makingDays: number,
  isNew = false,
) =>
  p({
    ref,
    name,
    description,
    price: 350000, // PRIX PROVISOIRE : à communiquer par la boutique
    pricePending: true,
    univers: "studio",
    subcategory: "robes",
    variants: [tailles],
    fabric,
    stock: 0,
    status: "sur_commande",
    makingDays,
    deliveryDays: 1, // délai de livraison à confirmer avec le livreur
    isNew,
  });

export const products: Product[] = [
  // H.O.K Studio : catalogue communiqué par la boutique le 21/11/2026 (prix à confirmer)
  robe("HOK-ST-001", "Kénèya", "Robe corset avec nœud.", { materialId: "TIS-VERT", meters: 3, color: "Vert", hex: "#3F6B4A" }, 4, true),
  robe("HOK-ST-002", "Sira", "Robe beige à boutons.", { materialId: "TIS-BEIGE", meters: 4, color: "Beige", hex: "#D8C3A9" }, 3, true),
  robe("HOK-ST-003", "Néné", "Robe asymétrique.", { materialId: "TIS-ROSE", meters: 3, color: "Rose", hex: "#E7A9B6" }, 3, true),
  robe("HOK-ST-004", "Danaya", "Robe fine à bretelles.", { materialId: "TIS-MARRON", meters: 1.5, color: "Marron", hex: "#683C11" }, 4),
  robe("HOK-ST-005", "Boiro", "Robe à nœud dans le dos.", { materialId: "TIS-ROUGE", meters: 4, color: "Rouge", hex: "#A3202A" }, 3),
  robe("HOK-ST-006", "Malika", "Robe à col.", { materialId: "TIS-JAUNE", meters: 4, color: "Jaune", hex: "#E3B53B" }, 3),
  robe("HOK-ST-007", "Kandé", "Robe rayée.", { materialId: "TIS-RAYURES", meters: 3, color: "Rose et blanc", hex: "#F1C6CF", pattern: "rayures" }, 3),

  // H.O.K Jewelry : en stock
  p({ ref: "HOK-BJ-001", name: "Bracelet charms personnalisé", price: 180000, univers: "bijoux", subcategory: "charms-custom", variants: [metal], stock: 12, status: "en_stock", deliveryDays: 1, isNew: true, description: "Composez votre bracelet avec les charms de votre choix." }),
  p({ ref: "HOK-BJ-002", name: "Bague fine", price: 95000, univers: "bijoux", subcategory: "bagues", variants: [metal, { kind: "taille", label: "Taille", options: ["50", "52", "54", "56"].map((v) => ({ value: v, label: v })) }], stock: 8, status: "en_stock", deliveryDays: 1, description: "Bague fine et lumineuse, à porter seule ou en accumulation." }),
  p({ ref: "HOK-BJ-003", name: "Créoles dorées", price: 120000, univers: "bijoux", subcategory: "boucles-oreilles", variants: [metal], stock: 5, status: "en_stock", deliveryDays: 1, description: "Créoles légères au fini poli." }),
  p({ ref: "HOK-BJ-004", name: "Bracelet jonc", price: 140000, univers: "bijoux", subcategory: "bracelets", variants: [metal], stock: 2, status: "en_stock", deliveryDays: 1, description: "Jonc minimaliste, ouverture souple." }),
  p({ ref: "HOK-BJ-005", name: "Collier pendentif", price: 210000, univers: "bijoux", subcategory: "colliers", variants: [metal], stock: 0, status: "precommande", deliveryDays: 7, isNew: true, description: "Collier à pendentif délicat. Disponible en précommande." }),

  // H.O.K Home : en stock
  p({ ref: "HOK-HM-001", name: "Bougie parfumée", price: 120000, univers: "maison", subcategory: "bougies", variants: [senteurs], stock: 20, status: "en_stock", deliveryDays: 1, isNew: true, description: "Bougie coulée à la main, mèche en coton. Senteur au choix." }),
  p({ ref: "HOK-HM-002", name: "Vase sculptural", price: 260000, univers: "maison", subcategory: "vases", variants: [], stock: 4, status: "en_stock", deliveryDays: 2, description: "Vase aux lignes organiques, finition mate." }),
  p({ ref: "HOK-HM-003", name: "Plateau ovale", price: 190000, univers: "maison", subcategory: "plateaux", variants: [], stock: 6, status: "en_stock", deliveryDays: 2, description: "Plateau ovale pour la décoration ou le service." }),
  p({ ref: "HOK-HM-004", name: "Service à thé", price: 340000, univers: "maison", subcategory: "vaisselle", variants: [], stock: 0, status: "indisponible", deliveryDays: 2, description: "Service à thé en céramique." }),
  p({ ref: "HOK-HM-005", name: "Coffret bougie et plateau", price: 290000, univers: "maison", subcategory: "ensembles", variants: [senteurs], stock: 3, status: "en_stock", deliveryDays: 2, description: "Un coffret prêt à offrir." }),
];
