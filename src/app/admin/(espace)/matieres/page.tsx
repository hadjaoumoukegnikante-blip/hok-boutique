import { PageHeader, Panel, Table, Td } from "@/components/admin/kit";
import { Badge, Button } from "@/components/ui";
import { adjustMaterialAction, saveMaterialAction } from "@/app/admin/actions/ops";
import { listMaterials, listProducts } from "@/lib/admin-data";
import { gnf } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";

const label = { studio: "Vêtements", bijoux: "Bijoux", maison: "Home" } as Record<string, string>;

export default async function MaterialsPage() {
  const me = await requireStaff(["admin", "superviseur", "atelier"]);
  const canEdit = me.role !== "atelier";
  const [materials, products] = await Promise.all([listMaterials(), listProducts()]);
  const models = products.filter((p) => p.fabric && p.active);

  return (
    <>
      <PageHeader title="Matières premières" subtitle="Tissus, composants et fournitures : disponibles, réservés par les commandes, consommés à la découpe" />
      <Table head={["Matière", "Univers", "Quantité", "Réservé", "Disponible", "Seuil", "Coût unitaire", "État", canEdit ? "Entrée / correction" : ""]}>
        {materials.map((m) => {
          const dispo = Number(m.quantity) - Number(m.reserved);
          return (
            <tr key={m.id} className="hover:bg-ecru/60">
              <Td><span className="font-medium">{m.name}</span><span className="block text-xs text-muted">{m.id}{m.note ? ` · ${m.note}` : ""}</span></Td>
              <Td>{label[m.univers]}</Td>
              <Td className="tabular-nums">{Number(m.quantity).toLocaleString("fr-FR")} {m.unit}</Td>
              <Td className="tabular-nums">{Number(m.reserved).toLocaleString("fr-FR")} {m.unit}</Td>
              <Td className="font-semibold tabular-nums">{dispo.toLocaleString("fr-FR")} {m.unit}</Td>
              <Td className="tabular-nums text-muted">{Number(m.threshold).toLocaleString("fr-FR")} {m.unit}</Td>
              <Td className="tabular-nums">{m.unit_cost ? gnf(m.unit_cost) : "À fournir"}</Td>
              <Td>{dispo <= Number(m.threshold) ? <Badge tone="bordeaux">À réapprovisionner</Badge> : <Badge tone="ok">OK</Badge>}</Td>
              <Td>
                {canEdit && (
                  <form action={adjustMaterialAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={m.id} />
                    <label className="sr-only" htmlFor={`m-${m.id}`}>Quantité</label>
                    <input id={`m-${m.id}`} name="delta" type="number" step="0.1" placeholder="+3 ou -0,5" className="h-9 w-24 rounded-xl border border-brun/15 bg-white px-2.5 text-sm" />
                    <input name="note" placeholder="Motif" className="h-9 w-28 rounded-xl border border-brun/15 bg-white px-2.5 text-sm" />
                    <Button size="sm" variant="soft" type="submit">OK</Button>
                  </form>
                )}
              </Td>
            </tr>
          );
        })}
      </Table>

      <div className="mt-5 grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Pièces encore réalisables par modèle">
          <ul className="grid gap-2 sm:grid-cols-2">
            {models.map((p) => {
              const n = p.available ?? 0;
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-ecru px-4 py-3 text-sm">
                  <span><b className="font-semibold">{p.name}</b><span className="block text-xs text-muted">{p.fabric!.color} · {p.fabric!.meters.toLocaleString("fr-FR")} m par pièce</span></span>
                  <Badge tone={n === 0 ? "danger" : n === 1 ? "bordeaux" : "ok"}>{n} pièce{n > 1 ? "s" : ""}</Badge>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">Chaque commande réserve le tissu de son modèle. Il est consommé au passage en découpe ; une annulation après découpe ne le libère pas.</p>
        </Panel>
        {canEdit && (
          <Panel title="Nouvelle matière">
            <form action={saveMaterialAction} className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-[13px] font-medium text-soft">Nom<input name="name" required className="field mt-1.5" placeholder="Ex. Tissu bleu" /></label>
              <label className="text-[13px] font-medium text-soft">Code<input name="id" required className="field mt-1.5 uppercase" placeholder="TIS-BLEU" /></label>
              <label className="text-[13px] font-medium text-soft">Univers
                <select name="univers" className="field mt-1.5"><option value="studio">Vêtements</option><option value="bijoux">Bijoux</option><option value="maison">Home</option></select>
              </label>
              <label className="text-[13px] font-medium text-soft">Unité<input name="unit" className="field mt-1.5" placeholder="m, kg, pièce" /></label>
              <label className="text-[13px] font-medium text-soft">Quantité<input name="quantity" type="number" step="0.1" min={0} className="field mt-1.5" /></label>
              <label className="text-[13px] font-medium text-soft">Seuil d'alerte<input name="threshold" type="number" step="0.1" min={0} className="field mt-1.5" /></label>
              <label className="text-[13px] font-medium text-soft">Coût unitaire<input name="unit_cost" type="number" min={0} className="field mt-1.5" /></label>
              <Button type="submit" className="col-span-2">Ajouter</Button>
            </form>
          </Panel>
        )}
      </div>
    </>
  );
}
