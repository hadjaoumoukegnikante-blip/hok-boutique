"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader, SearchInput, Table, Td } from "@/components/admin/kit";
import { Badge, ButtonLink, ProductVisual, Segmented } from "@/components/ui";
import { allProducts, getUniversSync } from "@/lib/api";
import { availableQty } from "@/lib/availability";
import { gnf, productStatusMeta } from "@/lib/format";
import type { UniversKey } from "@/lib/types";

type F = "tous" | UniversKey;

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [f, setF] = useState<F>("tous");
  const list = allProducts().filter(
    (p) => (f === "tous" || p.univers === f) && `${p.name} ${p.ref}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Produits"
        subtitle={`${allProducts().length} produits au catalogue`}
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Nom ou référence" />
            <ButtonLink href="/admin/produits/nouveau" size="md"><Plus className="size-4" /> Nouveau produit</ButtonLink>
          </>
        }
      />
      <Segmented<F>
        label="Univers"
        value={f}
        onChange={setF}
        className="mb-4 max-w-lg"
        options={[
          { value: "tous", label: "Tous" },
          { value: "studio", label: "Vêtements" },
          { value: "bijoux", label: "Bijoux" },
          { value: "maison", label: "Home" },
        ]}
      />
      <Table head={["Produit", "Référence", "Univers", "Prix", "Stock", "Statut", "Délais", ""]}>
        {list.map((p) => {
          const u = getUniversSync(p.univers);
          return (
            <tr key={p.id} className="hover:bg-ecru/60">
              <Td>
                <div className="flex items-center gap-3">
                  <ProductVisual univers={p.univers} alt="" label="" className="size-11 shrink-0 rounded-xl" />
                  <span className="font-medium">{p.name}</span>
                </div>
              </Td>
              <Td className="text-muted">{p.ref}</Td>
              <Td>{u.brand}<span className="block text-xs text-muted">{u.subcategories.find((s) => s.slug === p.subcategory)?.label}</span></Td>
              <Td className="tabular-nums">{gnf(p.price)}{p.pricePending && <span className="block text-[11px] font-semibold text-bordeaux">Prix à confirmer</span>}</Td>
              <Td className={p.status === "en_stock" && p.stock <= 3 ? "font-semibold text-bordeaux" : ""}>
                {p.fabric ? `${availableQty(p)} pièce(s)` : p.status === "sur_commande" ? "·" : p.stock}
                {p.fabric && <span className="block text-[11px] text-muted">{p.fabric.color} · {p.fabric.meters.toLocaleString("fr-FR")} m</span>}
              </Td>
              <Td><Badge tone={productStatusMeta[p.status].tone}>{productStatusMeta[p.status].label}</Badge></Td>
              <Td className="text-muted">{p.makingDays ? `${p.makingDays} j conf. · ` : ""}{p.deliveryDays ?? "?"} j livr.</Td>
              <Td><Link href={`/admin/produits/nouveau?ref=${p.ref}`} className="text-brun hover:underline">Modifier</Link></Td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
