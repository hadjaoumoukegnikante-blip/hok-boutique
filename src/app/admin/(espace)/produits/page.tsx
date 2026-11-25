import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader, Table, Td } from "@/components/admin/kit";
import { Badge, ButtonLink, ProductVisual } from "@/components/ui";
import { toggleProductAction } from "@/app/admin/actions/ops";
import { getCatalogMeta, listProducts } from "@/lib/admin-data";
import { cn, gnf, productStatusMeta } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";

const filters = [
  { key: "tous", label: "Tous" },
  { key: "studio", label: "Vêtements" },
  { key: "bijoux", label: "Bijoux" },
  { key: "maison", label: "Home" },
];

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ u?: string; q?: string }> }) {
  const me = await requireStaff(["admin", "superviseur"]);
  void me;
  const { u = "tous", q = "" } = await searchParams;
  const [products, meta] = await Promise.all([listProducts(), getCatalogMeta()]);
  const list = products.filter((p) => (u === "tous" || p.univers === u) && `${p.name} ${p.ref}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Produits"
        subtitle={`${products.length} produits au catalogue${products.some((p) => p.isDemo) ? " (dont des exemples à supprimer avant lancement)" : ""}`}
        actions={
          <>
            <form className="flex h-11 items-center rounded-full bg-white px-4 shadow-[0_1px_2px_rgb(72_40_10/0.06)]">
              <input type="hidden" name="u" value={u} />
              <label htmlFor="q" className="sr-only">Rechercher</label>
              <input id="q" name="q" defaultValue={q} placeholder="Nom ou référence" className="w-44 bg-transparent text-sm focus:outline-none md:w-56" />
            </form>
            <ButtonLink href="/admin/produits/nouveau" size="md"><Plus className="size-4" /> Nouveau produit</ButtonLink>
          </>
        }
      />
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
        {filters.map((x) => (
          <Link key={x.key} href={`/admin/produits?u=${x.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={cn("press flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium", u === x.key ? "bg-brun text-white" : "bg-white text-soft hover:bg-sable")}>
            {x.label}
          </Link>
        ))}
      </div>
      <Table head={["Produit", "Univers", "Prix", "Disponible", "Statut", "Marge", "En ligne", ""]}>
        {list.map((p) => {
          const uni = meta.univers.find((x) => x.key === p.univers);
          const dispo = p.available ?? (p.status === "sur_commande" ? null : p.stock);
          return (
            <tr key={p.id} className={cn("hover:bg-ecru/60", !p.active && "opacity-60")}>
              <Td>
                <div className="flex items-center gap-3">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <ProductVisual univers={p.univers} alt="" label="" className="size-11 shrink-0 rounded-xl" />
                  )}
                  <span><span className="font-medium">{p.name}</span><span className="block text-xs text-muted">{p.ref}{p.isDemo ? " · exemple" : ""}</span></span>
                </div>
              </Td>
              <Td>{uni?.brand}<span className="block text-xs text-muted">{uni?.subcategories.find((s) => s.slug === p.subcategory)?.label}</span></Td>
              <Td className="tabular-nums">{gnf(p.price)}{p.pricePending && <span className="block text-[11px] font-semibold text-bordeaux">Prix à confirmer</span>}</Td>
              <Td className={dispo !== null && dispo <= 3 ? "font-semibold text-bordeaux" : ""}>
                {dispo === null ? "·" : p.fabric ? `${dispo} pièce${dispo > 1 ? "s" : ""}` : dispo}
                {p.fabric && <span className="block text-[11px] font-normal text-muted">{p.fabric.color} · {p.fabric.meters.toLocaleString("fr-FR")} m</span>}
              </Td>
              <Td><Badge tone={productStatusMeta[p.status].tone}>{productStatusMeta[p.status].short}</Badge></Td>
              <Td className="tabular-nums text-muted">{p.cost != null && p.price > 0 ? `${Math.round(((p.price - p.cost) / p.price) * 100)} %` : "·"}</Td>
              <Td>
                <form action={toggleProductAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="active" value={String(!p.active)} />
                  <button type="submit" className="press text-xs font-semibold text-brun hover:underline">{p.active ? "Masquer" : "Publier"}</button>
                </form>
              </Td>
              <Td><Link href={`/admin/produits/nouveau?id=${p.id}`} className="text-brun hover:underline">Modifier</Link></Td>
            </tr>
          );
        })}
        {list.length === 0 && <tr><Td colSpan={8} className="py-10 text-center text-muted">Aucun produit.</Td></tr>}
      </Table>
    </>
  );
}
