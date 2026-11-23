"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageHeader, StatCard, Table, Td } from "@/components/admin/kit";
import { Badge, Button } from "@/components/ui";
import { dateFr, gnf, paymentStatusMeta } from "@/lib/format";
import { useAdmin } from "@/store/admin";
import { useLocalOrders } from "@/store/cart";

export default function PaymentsPage() {
  const { orders, merge, verifyPayment, rejectPayment } = useAdmin();
  const local = useLocalOrders((s) => s.orders);
  useEffect(() => merge(local), [local, merge]);
  const rows = orders.flatMap((o) => o.payments.map((p) => ({ o, p }))).sort((a, b) => b.p.date.localeCompare(a.p.date));
  const pending = rows.filter((r) => r.p.status === "a_verifier" || r.p.status === "preuve_recue");

  return (
    <>
      <PageHeader title="Paiements" subtitle="Orange Money : chaque transaction est vérifiée manuellement sur le compte marchand" />
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
              {(p.status === "a_verifier" || p.status === "preuve_recue") ? (
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => verifyPayment(o.ref, p.id)}>Valider</Button>
                  <Button size="sm" variant="ghost" onClick={() => rejectPayment(o.ref, p.id)}>Refuser</Button>
                </div>
              ) : (
                <span className="text-xs text-muted">{p.verifiedBy ? `Vérifié par ${p.verifiedBy}` : "·"}</span>
              )}
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
