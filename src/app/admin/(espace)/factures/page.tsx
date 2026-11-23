"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageHeader, Table, Td } from "@/components/admin/kit";
import { Badge } from "@/components/ui";
import { dateFr, gnf, paymentStatusMeta } from "@/lib/format";
import { useAdmin } from "@/store/admin";
import { useLocalOrders } from "@/store/cart";

export default function InvoicesPage() {
  const { orders, merge } = useAdmin();
  const local = useLocalOrders((s) => s.orders);
  useEffect(() => merge(local), [local, merge]);
  return (
    <>
      <PageHeader title="Factures" subtitle="Générées pour chaque commande, mises à jour après vérification des paiements" />
      <Table head={["N° facture", "Commande", "Date", "Client", "Total", "Payé", "Solde", "Statut", ""]}>
        {orders.map((o) => (
          <tr key={o.ref} className="hover:bg-ecru/60">
            <Td className="font-semibold">{o.invoiceNumber}</Td>
            <Td><Link href={`/admin/commandes/${o.ref}`} className="text-brun hover:underline">{o.ref}</Link></Td>
            <Td className="text-muted">{dateFr(o.createdAt)}</Td>
            <Td>{o.customer.firstName} {o.customer.lastName}</Td>
            <Td className="tabular-nums">{gnf(o.total)}</Td>
            <Td className="tabular-nums">{gnf(o.paid)}</Td>
            <Td className="font-semibold tabular-nums">{gnf(o.total - o.paid)}</Td>
            <Td><Badge tone={paymentStatusMeta[o.paymentStatus].tone}>{paymentStatusMeta[o.paymentStatus].label}</Badge></Td>
            <Td><a href={`/facture/${o.ref}`} target="_blank" rel="noopener noreferrer" className="text-brun hover:underline">Ouvrir</a></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
