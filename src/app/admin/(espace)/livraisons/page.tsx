import Link from "next/link";
import { PageHeader, Panel, Table, Td } from "@/components/admin/kit";
import { Badge, Button } from "@/components/ui";
import { saveDeliveryAction } from "@/app/admin/actions/ops";
import { getSettingsBundle, listOrders } from "@/lib/admin-data";
import { dateFr, gnf, orderStatusMeta } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";

export default async function DeliveriesPage() {
  const me = await requireStaff();
  const [orders, { settings, zoneRows }] = await Promise.all([listOrders(), getSettingsBundle()]);
  const todo = orders.filter((o) => ["confirmee", "en_preparation", "partiellement_prete", "prete_a_expedier", "expediee"].includes(o.status));

  return (
    <>
      <PageHeader title="Livraisons" subtitle="Commandes à livrer et frais de livraison par commune" />
      <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.6fr_1fr]">
        <Table head={["Commande", "Client", "Adresse", "Mode", "Reste à payer", "Statut"]}>
          {todo.map((o) => (
            <tr key={o.ref} className="hover:bg-ecru/60">
              <Td><Link href={`/admin/commandes/${o.ref}`} className="font-semibold text-brun hover:underline">{o.ref}</Link><span className="block text-xs text-muted">{dateFr(o.createdAt)}</span></Td>
              <Td>{o.customer.firstName} {o.customer.lastName}<span className="block text-xs text-muted">{o.customer.phone}</span></Td>
              <Td>{o.customer.commune}<span className="block text-xs text-muted">{o.customer.quartier}{o.customer.address ? `, ${o.customer.address}` : ""}</span></Td>
              <Td>{o.splitDelivery ? "Séparée" : "Groupée"}</Td>
              <Td className="font-semibold tabular-nums">{gnf(o.total - o.paid)}</Td>
              <Td><Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge></Td>
            </tr>
          ))}
          {todo.length === 0 && <tr><Td colSpan={6} className="py-10 text-center text-muted">Rien à livrer pour le moment.</Td></tr>}
        </Table>
        {me.role === "admin" && (
          <Panel title="Frais de livraison">
            <form action={saveDeliveryAction} className="space-y-2">
              {zoneRows.sort((a, b) => a.position - b.position).map((z) => (
                <div key={z.commune} className="flex items-center gap-3 rounded-2xl bg-ecru px-4 py-2">
                  <input type="hidden" name="commune" value={z.commune} />
                  <label className="flex flex-1 items-center gap-2 text-sm font-medium">
                    <input type="checkbox" name={`active_${z.commune}`} defaultChecked={z.active} className="size-4 accent-[#683C11]" /> {z.commune}
                  </label>
                  <label className="sr-only" htmlFor={`fee-${z.commune}`}>Frais {z.commune}</label>
                  <input id={`fee-${z.commune}`} name={`fee_${z.commune}`} type="number" step={1000} min={0} defaultValue={z.fee} className="h-10 w-32 rounded-xl border border-brun/15 bg-white px-3 text-right text-sm tabular-nums" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <input name="new_commune" placeholder="Ajouter une commune" className="field h-10 flex-1" />
                <input name="new_fee" type="number" step={1000} min={0} placeholder="Frais" className="field h-10 w-28" />
              </div>
              <label className="mt-3 block text-[13px] font-medium text-soft" htmlFor="extra">Supplément livraison séparée (GNF)</label>
              <input id="extra" name="extra_fee" type="number" step={1000} min={0} defaultValue={settings.extraShipmentFee} className="field" />
              <label className="flex items-center gap-2 pt-1 text-sm"><input type="checkbox" name="provisional" defaultChecked={settings.deliveryProvisional} className="size-4 accent-[#683C11]" /> Afficher « tarif provisoire » aux clients</label>
              <Button type="submit" className="mt-3 w-full">Enregistrer</Button>
            </form>
          </Panel>
        )}
      </div>
    </>
  );
}
