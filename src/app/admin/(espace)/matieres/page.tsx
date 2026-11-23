"use client";

import { PageHeader, Panel, Table, Td } from "@/components/admin/kit";
import { Badge, Button } from "@/components/ui";
import { allProducts } from "@/lib/api";
import { producible, rawMaterials } from "@/lib/data/admin";
import { gnf } from "@/lib/format";

const label = { studio: "Vêtements", bijoux: "Bijoux", maison: "Home" } as const;

export default function MaterialsPage() {
  const models = allProducts().filter((p) => p.fabric);
  return (
    <>
      <PageHeader title="Matières premières" subtitle="Tissus, composants et fournitures : disponibles, réservés, consommés" actions={<Button size="md">Entrée de stock</Button>} />
      <Table head={["Matière", "Univers", "Quantité", "Réservé", "Disponible", "Seuil", "Coût unitaire", "État"]}>
        {rawMaterials.map((m) => {
          const dispo = m.quantity - m.reserved;
          return (
            <tr key={m.id} className="hover:bg-ecru/60">
              <Td><span className="font-medium">{m.name}</span><span className="block text-xs text-muted">{m.id}</span></Td>
              <Td>{label[m.univers]}</Td>
              <Td className="tabular-nums">{m.quantity.toLocaleString("fr-FR")} {m.unit}</Td>
              <Td className="tabular-nums">{m.reserved.toLocaleString("fr-FR")} {m.unit}</Td>
              <Td className="font-semibold tabular-nums">{dispo.toLocaleString("fr-FR")} {m.unit}</Td>
              <Td className="tabular-nums text-muted">{m.threshold} {m.unit}</Td>
              <Td className="tabular-nums">{m.unitCost ? gnf(m.unitCost) : "À fournir"}</Td>
              <Td>{dispo <= m.threshold ? <Badge tone="bordeaux">À réapprovisionner</Badge> : <Badge tone="ok">OK</Badge>}</Td>
            </tr>
          );
        })}
      </Table>
      <Panel title="Tissu par modèle et pièces réalisables" className="mt-5">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((p) => {
            const n = producible(p.fabric!.materialId, p.fabric!.meters);
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-ecru px-4 py-3 text-sm">
                <span>
                  <b className="font-semibold">{p.name}</b>
                  <span className="block text-xs text-muted">{p.fabric!.color} · {p.fabric!.meters.toLocaleString("fr-FR")} m par robe</span>
                </span>
                <Badge tone={n === 0 ? "danger" : n === 1 ? "bordeaux" : "ok"}>{n} pièce{n > 1 ? "s" : ""}</Badge>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Chaque commande validée réserve le tissu du modèle. En cas d'annulation après découpe, la perte est enregistrée et le tissu n'est pas libéré. Le rouleau rayé est compté à 10 m en attendant sa longueur réelle.
        </p>
      </Panel>
    </>
  );
}
