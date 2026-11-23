"use client";

import { TriangleExclamationPoint } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Bars, PageHeader, Panel, StatCard, Table, Td } from "@/components/admin/kit";
import { Badge, ButtonLink } from "@/components/ui";
import { allProducts } from "@/lib/api";
import { rawMaterials } from "@/lib/data/admin";
import { dateFr, gnf, orderStatusMeta, paymentStatusMeta } from "@/lib/format";
import { useAdmin } from "@/store/admin";
import { useLocalOrders } from "@/store/cart";

export default function DashboardPage() {
  const { orders, merge } = useAdmin();
  const local = useLocalOrders((s) => s.orders);
  useEffect(() => merge(local), [local, merge]);

  const live = orders.filter((o) => o.status !== "annulee");
  const cashed = live.reduce((s, o) => s + o.paid, 0); // encaissé uniquement
  const toVerify = orders.filter((o) => o.paymentStatus === "a_verifier" || o.paymentStatus === "preuve_recue");
  const lowStock = allProducts().filter((p) => p.status === "en_stock" && p.stock <= 3);
  const lowMat = rawMaterials.filter((m) => m.quantity - m.reserved <= m.threshold);
  const byU = { studio: 0, bijoux: 0, maison: 0 };
  live.forEach((o) => o.lines.forEach((l) => (byU[l.univers] += l.unitPrice * l.qty)));

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble des ventes, paiements et stocks" actions={<ButtonLink href="/admin/produits/nouveau" size="sm">Nouveau produit</ButtonLink>} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="brun" label="Chiffre d'affaires encaissé" value={gnf(cashed)} hint="Paiements vérifiés uniquement" />
        <StatCard label="Commandes" value={String(orders.length)} hint={`${orders.filter((o) => o.status === "livree").length} livrée(s)`} />
        <StatCard tone={toVerify.length ? "alert" : "default"} label="Paiements à vérifier" value={String(toVerify.length)} hint="Orange Money, vérification manuelle" />
        <StatCard tone={lowStock.length + lowMat.length ? "alert" : "default"} label="Alertes stock" value={String(lowStock.length + lowMat.length)} hint="Produits et matières sous le seuil" />
      </div>

      <div className="mt-5 grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Dernières commandes" action={<Link href="/admin/commandes" className="text-sm text-brun hover:underline">Tout voir</Link>} className="p-0 pt-5 [&>div:first-child]:px-5">
          <Table head={["Référence", "Client", "Total", "Paiement", "Statut"]} className="rounded-none shadow-none">
            {orders.slice(0, 6).map((o) => (
              <tr key={o.ref} className="hover:bg-ecru/60">
                <Td><Link href={`/admin/commandes/${o.ref}`} className="font-semibold text-brun hover:underline">{o.ref}</Link><span className="block text-xs text-muted">{dateFr(o.createdAt)}</span></Td>
                <Td>{o.customer.firstName} {o.customer.lastName}</Td>
                <Td className="tabular-nums">{gnf(o.total)}</Td>
                <Td><Badge tone={paymentStatusMeta[o.paymentStatus].tone}>{paymentStatusMeta[o.paymentStatus].label}</Badge></Td>
                <Td><Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <div className="space-y-5">
          <Panel title="À traiter">
            <ul className="space-y-2 text-sm">
              {toVerify.map((o) => (
                <li key={o.ref}>
                  <Link href={`/admin/commandes/${o.ref}`} className="flex items-center gap-3 rounded-2xl bg-brun/[0.06] px-3.5 py-3 hover:bg-brun/[0.1]">
                    <TriangleExclamationPoint className="size-4 shrink-0 text-brun" strokeWidth={1.8} />
                    <span className="flex-1">Paiement à vérifier · <b className="font-semibold">{o.ref}</b></span>
                  </Link>
                </li>
              ))}
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-bordeaux/[0.05] px-3.5 py-3">
                  <TriangleExclamationPoint className="size-4 shrink-0 text-bordeaux" strokeWidth={1.8} />
                  Stock faible · {p.name} ({p.stock})
                </li>
              ))}
              {lowMat.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-bordeaux/[0.05] px-3.5 py-3">
                  <TriangleExclamationPoint className="size-4 shrink-0 text-bordeaux" strokeWidth={1.8} />
                  Matière sous le seuil · {m.name}
                </li>
              ))}
              {toVerify.length + lowStock.length + lowMat.length === 0 && <li className="text-muted">Rien à traiter.</li>}
            </ul>
          </Panel>
          <Panel title="Ventes par univers">
            <Bars
              data={[
                { label: "Vêtements", value: byU.studio, display: gnf(byU.studio) },
                { label: "Bijoux", value: byU.bijoux, display: gnf(byU.bijoux) },
                { label: "Home", value: byU.maison, display: gnf(byU.maison) },
              ]}
            />
            <p className="mt-3 text-xs text-muted">Montants commandés, hors annulations.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
