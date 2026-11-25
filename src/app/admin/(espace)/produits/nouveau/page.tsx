import { getCatalogMeta, listProducts } from "@/lib/admin-data";
import { requireStaff } from "@/lib/supabase/staff";
import ProductForm from "./ProductForm";

export default async function ProductEditPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireStaff(["admin", "superviseur"]);
  const { id } = await searchParams;
  const [products, meta] = await Promise.all([id ? listProducts() : Promise.resolve([]), getCatalogMeta()]);
  const existing = id ? products.find((p) => p.id === id) ?? null : null;
  return (
    <ProductForm
      key={existing?.id ?? "new"}
      existing={existing}
      univers={meta.univers.map((u) => ({ key: u.key, label: u.label, subs: u.subcategories.map((s) => ({ id: (s as typeof s & { id: string }).id, label: s.label, active: s.active })) }))}
      materials={meta.materials.filter((m: { univers: string }) => m.univers === "studio").map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }))}
    />
  );
}
