"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Table, Td } from "@/components/admin/kit";
import { Badge, Button } from "@/components/ui";
import { delivery } from "@/lib/config";
import { dateFr, gnf, orderStatusMeta } from "@/lib/format";
import { useAdmin } from "@/store/admin";
import { useLocalOrders } from "@/store/cart";

export default function DeliveriesPage() {
  const { orders, merge } = useAdmin();
  const local = useLocalOrders((s) => s.orders);
  useEffect(() => merge(local), [local, merge]);
  const [zones, setZones] = useState(delivery.zones.map((z) => ({ ...z })));
  const [base, setBase] = useState(delivery.baseFee);
  const active = orders.filter((o) => !["annulee"].includes(o.status));

  return (
    <>
      <PageHeader title="Livraisons" subtitle="Conakry · grille tarifaire et suivi des expéditions" />
      <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.6fr_1fr]">
        <Table head={["Commande", "Client", "Adresse", "Mode", "Frais", "Statut"]}>
          {active.map((o) => (
            <tr key={o.ref} className="hover:bg-ecru/60">
              <Td><Link href={`/admin/commandes/${o.ref}`} className="font-semibold text-brun hover:underline">{o.ref}</Link><span className="block text-xs text-muted">{dateFr(o.createdAt)}</span></Td>
              <Td>{o.customer.firstName} {o.customer.lastName}<span className="block text-xs text-muted">{o.customer.phone}</span></Td>
              <Td>{o.customer.commune}<span className="block text-xs text-muted">{o.customer.quartier}</span></Td>
              <Td>{o.splitDelivery ? "Séparée" : "Groupée"}</Td>
              <Td className="tabular-nums">{gnf(o.deliveryFee)}</Td>
              <Td><Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge></Td>
            </tr>
          ))}
        </Table>
        <Panel title="Grille tarifaire">
          <label className="mb-1.5 block text-[13px] font-medium text-soft" htmlFor="base">Tarif de base (GNF)</label>
          <input id="base" type="number" step={1000} className="field" value={base} onChange={(e) => setBase(Number(e.target.value))} />
          <p className="mt-1.5 text-xs text-muted">Tarif envisagé de 25 000 GNF, provisoire.</p>
          <ul className="mt-4 space-y-2">
            {zones.map((z, i) => (
              <li key={z.commune} className="flex items-center gap-3 rounded-2xl bg-ecru px-4 py-2">
                <span className="flex-1 text-sm font-medium">{z.commune}</span>
                <label className="sr-only" htmlFor={`z-${i}`}>Frais {z.commune}</label>
                <input
                  id={`z-${i}`}
                  type="number"
                  step={1000}
                  value={z.fee}
                  onChange={(e) => setZones(zones.map((x, j) => (j === i ? { ...x, fee: Number(e.target.value) } : x)))}
                  className="h-10 w-32 rounded-xl border border-brun/15 bg-white px-3 text-right text-sm tabular-nums focus:border-brun focus:outline-none"
                />
              </li>
            ))}
          </ul>
          <Button className="mt-4 w-full">Enregistrer la grille</Button>
        </Panel>
      </div>
    </>
  );
}
