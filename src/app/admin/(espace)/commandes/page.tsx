"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, SearchInput, Table, Td } from "@/components/admin/kit";
import { Badge } from "@/components/ui";
import { dateFr, gnf, orderStatusMeta, paymentStatusMeta } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { useAdmin } from "@/store/admin";
import { useLocalOrders } from "@/store/cart";
import { cn } from "@/lib/format";

const filters: { key: "toutes" | OrderStatus; label: string }[] = [
  { key: "toutes", label: "Toutes" },
  { key: "paiement_a_verifier", label: "À vérifier" },
  { key: "en_attente_paiement", label: "En attente" },
  { key: "confirmee", label: "Confirmées" },
  { key: "en_preparation", label: "En confection" },
  { key: "expediee", label: "Expédiées" },
  { key: "livree", label: "Livrées" },
  { key: "annulee", label: "Annulées" },
];

export default function OrdersPage() {
  const { orders, merge } = useAdmin();
  const local = useLocalOrders((s) => s.orders);
  useEffect(() => merge(local), [local, merge]);
  const [f, setF] = useState<(typeof filters)[number]["key"]>("toutes");
  const [q, setQ] = useState("");

  const list = orders.filter(
    (o) =>
      (f === "toutes" || o.status === f) &&
      `${o.ref} ${o.customer.firstName} ${o.customer.lastName} ${o.customer.phone}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Commandes" subtitle="Commandes du site et commandes reçues sur WhatsApp" actions={<SearchInput value={q} onChange={setQ} placeholder="Référence, client, téléphone" />} />
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
        {filters.map((x) => (
          <button
            key={x.key}
            onClick={() => setF(x.key)}
            className={cn("press h-9 shrink-0 rounded-full px-4 text-sm font-medium", f === x.key ? "bg-brun text-white" : "bg-white text-soft hover:bg-sable")}
          >
            {x.label}
          </button>
        ))}
      </div>
      <Table head={["Référence", "Date", "Client", "Articles", "Total", "Payé", "Paiement", "Statut"]}>
        {list.map((o) => (
          <tr key={o.ref} className="hover:bg-ecru/60">
            <Td><Link href={`/admin/commandes/${o.ref}`} className="font-semibold text-brun hover:underline">{o.ref}</Link></Td>
            <Td className="text-muted">{dateFr(o.createdAt, true)}</Td>
            <Td>{o.customer.firstName} {o.customer.lastName}<span className="block text-xs text-muted">{o.customer.phone}</span></Td>
            <Td>{o.lines.reduce((s, l) => s + l.qty, 0)}</Td>
            <Td className="tabular-nums">{gnf(o.total)}</Td>
            <Td className="tabular-nums">{gnf(o.paid)}</Td>
            <Td><Badge tone={paymentStatusMeta[o.paymentStatus].tone}>{paymentStatusMeta[o.paymentStatus].label}</Badge></Td>
            <Td><Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge></Td>
          </tr>
        ))}
        {list.length === 0 && (
          <tr><Td colSpan={8} className="py-10 text-center text-muted">Aucune commande.</Td></tr>
        )}
      </Table>
    </>
  );
}
