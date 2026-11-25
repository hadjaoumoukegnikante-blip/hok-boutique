import Link from "next/link";
import { PageHeader, StatCard, Table, Td } from "@/components/admin/kit";
import { Badge, Button } from "@/components/ui";
import { rejectPaymentAction, verifyPaymentAction } from "@/app/admin/actions/ops";
import { listOrders } from "@/lib/admin-data";
import { dateFr, gnf, paymentStatusMeta } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";

export default async function PaymentsPage() {
  await requireStaff(["admin", "superviseur"]);
  const orders = await listOrders();
  const rows = orders.flatMap((o) => o.payments.map((p) => ({ o, p }))).sort((a, b) => b.p.date.localeCompare(a.p.date));
  const pending = rows.filter((r) => r.p.status === "a_verifier" || r.p.status === "preuve_recue");

  return (
    <>
      <PageHeader title="Paiements" subtitle="Orange Money : chaque transaction est vérifiée à la main sur le compte marchand" />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard tone={pending.length ? "alert" : "default"} label="À vérifier" value={String(pending.length)} />
        <StatCard label="Encaissé (vérifié)" value={gnf(rows.filter((r) => r.p.status === "paye").reduce((s, r) => s + r.p.amount, 0))} />
        <StatCard label="Soldes restants dus" value={gnf(orders.filter((o) => o.status !== "annulee").reduce((s, o) => s + (o.total - o.paid), 0))} />
      </div>
      <Table head={["Date", "Commande", "Montant", "Mode", "N° payeur", "Statut", "Action"]}>
        {rows.map(({ o, p }) => (
          <tr key={p.id} className="hover:bg-ecru/60">
            <Td className="text-muted">{dateFr(p.date, true)}</Td>
            <Td><Link href={`/admin/commandes/${o.ref}`} className="font-semibold text-brun hover:underline">{o.ref}</Link></Td>
            <Td className="font-medium tabular-nums">{gnf(p.amount)}</Td>
            <Td>{p.mode === "orange_money" ? "Orange Money" : "À la livraison"}</Td>
            <Td className="tabular-nums">{p.payerNumber ?? "·"}</Td>
            <Td><Badge tone={paymentStatusMeta[p.status].tone}>{paymentStatusMeta[p.status].label}</Badge></Td>
            <Td>
              {p.status === "a_verifier" || p.status === "preuve_recue" ? (
                <div className="flex gap-1.5">
                  <form action={verifyPaymentAction}><input type="hidden" name="payment_id" value={p.id} /><input type="hidden" name="ref" value={o.ref} /><Button size="sm" type="submit">Valider</Button></form>
                  <form action={rejectPaymentAction}><input type="hidden" name="payment_id" value={p.id} /><input type="hidden" name="ref" value={o.ref} /><Button size="sm" variant="ghost" type="submit">Refuser</Button></form>
                </div>
              ) : (
                <span className="text-xs text-muted">{p.status === "paye" ? "Vérifié" : "·"}</span>
              )}
            </Td>
          </tr>
        ))}
        {rows.length === 0 && <tr><Td colSpan={7} className="py-10 text-center text-muted">Aucun paiement.</Td></tr>}
      </Table>
      <p className="mt-3 text-xs text-muted">Pour un montant différent de celui annoncé, validez depuis la fiche de la commande.</p>
    </>
  );
}
