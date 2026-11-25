import Link from "next/link";
import { PageHeader, Table, Td } from "@/components/admin/kit";
import { Badge } from "@/components/ui";
import { listOrders } from "@/lib/admin-data";
import { dateFr, gnf, paymentStatusMeta } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";

export default async function InvoicesPage() {
  await requireStaff(["admin", "superviseur"]);
  const orders = await listOrders();
  return (
    <>
      <PageHeader title="Factures" subtitle="Une par commande, mise à jour après chaque paiement vérifié" />
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
        {orders.length === 0 && <tr><Td colSpan={9} className="py-10 text-center text-muted">Aucune facture.</Td></tr>}
      </Table>
    </>
  );
}
