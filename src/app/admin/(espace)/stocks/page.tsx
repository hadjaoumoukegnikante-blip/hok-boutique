import { PageHeader, Panel, StatCard, Table, Td } from "@/components/admin/kit";
import { Badge, Button } from "@/components/ui";
import { adjustStockAction } from "@/app/admin/actions/ops";
import { listMovements, listProducts } from "@/lib/admin-data";
import { dateFr, gnf } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";

const kindLabel: Record<string, string> = { entree: "Entrée", reservation: "Réservation", liberation: "Libération", sortie: "Sortie", perte: "Perte", ajustement: "Ajustement" };

export default async function StocksPage() {
  await requireStaff(["admin", "superviseur"]);
  const [products, moves] = await Promise.all([listProducts(), listMovements(40)]);
  const items = products.filter((p) => p.status !== "sur_commande");
  const value = items.reduce((s, p) => s + p.stock * p.price, 0);

  return (
    <>
      <PageHeader title="Stocks" subtitle="Produits finis : en stock, réservé par des commandes, disponible. Aucune vente au-delà du disponible." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Valeur du stock (prix de vente)" value={gnf(value)} />
        <StatCard label="Références suivies" value={String(items.length)} />
        <StatCard tone="alert" label="Stock faible (≤ 3)" value={String(items.filter((p) => p.active && (p.available ?? p.stock) <= 3).length)} />
      </div>
      <Table head={["Produit", "En stock", "Réservé", "Disponible", "État", "Entrée / correction"]}>
        {items.map((p) => {
          const dispo = p.available ?? p.stock;
          return (
            <tr key={p.id} className="hover:bg-ecru/60">
              <Td><span className="font-medium">{p.name}</span><span className="block text-xs text-muted">{p.ref}{p.isDemo ? " · exemple" : ""}</span></Td>
              <Td className="tabular-nums">{p.stock}</Td>
              <Td className="tabular-nums">{p.stock - dispo}</Td>
              <Td className="font-semibold tabular-nums">{dispo}</Td>
              <Td>{dispo === 0 ? <Badge tone="danger">Épuisé</Badge> : dispo <= 3 ? <Badge tone="bordeaux">Faible</Badge> : <Badge tone="ok">OK</Badge>}</Td>
              <Td>
                <form action={adjustStockAction} className="flex items-center gap-1.5">
                  <input type="hidden" name="product_id" value={p.id} />
                  <label className="sr-only" htmlFor={`d-${p.id}`}>Quantité à ajouter ou retirer</label>
                  <input id={`d-${p.id}`} name="delta" type="number" step={1} placeholder="+5 ou -1" className="h-9 w-24 rounded-xl border border-brun/15 bg-white px-2.5 text-sm" />
                  <input name="note" placeholder="Motif" className="h-9 w-28 rounded-xl border border-brun/15 bg-white px-2.5 text-sm" />
                  <Button size="sm" variant="soft" type="submit">OK</Button>
                </form>
              </Td>
            </tr>
          );
        })}
        {items.length === 0 && <tr><Td colSpan={6} className="py-10 text-center text-muted">Aucun produit en stock.</Td></tr>}
      </Table>
      <Panel title="Mouvements récents" className="mt-5">
        <ul className="space-y-2 text-sm">
          {moves.map((m) => (
            <li key={m.id} className="flex flex-wrap justify-between gap-2 rounded-2xl bg-ecru px-4 py-3">
              <span><b className="font-semibold">{kindLabel[m.kind] ?? m.kind}</b> · {m.products?.name ?? m.materials?.name} · {Number(m.quantity).toLocaleString("fr-FR")}{m.order_ref ? ` · ${m.order_ref}` : ""}{m.note ? ` · ${m.note}` : ""}</span>
              <span className="text-muted">{dateFr(m.at, true)}</span>
            </li>
          ))}
          {moves.length === 0 && <li className="text-muted">Aucun mouvement.</li>}
        </ul>
      </Panel>
    </>
  );
}
