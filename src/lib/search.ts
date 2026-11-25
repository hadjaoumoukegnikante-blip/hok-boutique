import type { Product, Univers } from "./types";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function searchIn(products: Product[], univers: Univers[], q: string): Product[] {
  const s = norm(q.trim());
  if (!s) return [];
  return products.filter((p) => {
    const u = univers.find((x) => x.key === p.univers);
    return norm(`${p.name} ${p.ref} ${p.description} ${u?.label ?? ""} ${p.fabric?.color ?? ""}`).includes(s);
  });
}
