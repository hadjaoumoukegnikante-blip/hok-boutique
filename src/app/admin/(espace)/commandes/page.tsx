import Link from "next/link";
import { PageHeader, Table, Td } from "@/components/admin/kit";
import { Badge } from "@/components/ui";
import { listOrders } from "@/lib/admin-data";
import { cn, dateFr, gnf, orderStatusMeta, paymentStatusMeta } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";
import type { OrderStatus } from "@/lib/types";

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

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  await requireStaff();
  const { f = "toutes", q = "" } = await searchParams;
  const orders = await listOrders();
  const list = orders.filter(
    (o) => (f === "toutes" || o.status === f) && `${o.ref} ${o.customer.firstName} ${o.customer.lastName} ${o.customer.phone}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Commandes"
        subtitle="Commandes du site et commandes saisies pour WhatsApp"
        actions={
          <form className="flex h-11 items-center rounded-full bg-white px-4 shadow-[0_1px_2px_rgb(72_40_10/0.06)]">
            <input type="hidden" name="f" value={f} />
            <label htmlFor="q" className="sr-only">Rechercher</label>
            <input id="q" name="q" defaultValue={q} placeholder="Référence, client, téléphone" className="w-56 bg-transparent text-sm focus:outline-none md:w-64" />
          </form>
        }
      />
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
        {filters.map((x) => (
          <Link key={x.key} href={`/admin/commandes?f=${x.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={cn("press flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium", f === x.key ? "bg-brun text-white" : "bg-white text-soft hover:bg-sable")}>
            {x.label}
          </Link>
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
        {list.length === 0 && <tr><Td colSpan={8} className="py-10 text-center text-muted">Aucune commande.</Td></tr>}
      </Table>
    </>
  );
}
