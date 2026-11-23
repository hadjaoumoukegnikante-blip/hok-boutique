"use client";

import { useEffect, useState } from "react";
import { Bars, PageHeader, Panel, StatCard } from "@/components/admin/kit";
import { Segmented } from "@/components/ui";
import { allProducts } from "@/lib/api";
import { gnf } from "@/lib/format";
import { useAdmin } from "@/store/admin";
import { useLocalOrders } from "@/store/cart";

type Period = "7j" | "30j" | "annee";

export default function StatsPage() {
  const { orders, merge } = useAdmin();
  const local = useLocalOrders((s) => s.orders);
  useEffect(() => merge(local), [local, merge]);
  const [period, setPeriod] = useState<Period>("30j");

  const days = period === "7j" ? 7 : period === "30j" ? 30 : 365;
  const since = Date.now() - days * 86400000;
  const inPeriod = orders.filter((o) => new Date(o.createdAt).getTime() >= since);
  const live = inPeriod.filter((o) => o.status !== "annulee");
  const cashed = live.reduce((s, o) => s + o.paid, 0); // les impayés ne comptent pas
  const discounts = live.reduce((s, o) => s + o.discount, 0);
  const stockValue = allProducts().reduce((s, p) => s + (p.status === "en_stock" ? p.stock * p.price : 0), 0);

  const qtyByProduct = new Map<string, number>();
  live.forEach((o) => o.lines.forEach((l) => qtyByProduct.set(l.name, (qtyByProduct.get(l.name) ?? 0) + l.qty)));
  const top = [...qtyByProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const byU = { studio: 0, bijoux: 0, maison: 0 };
  live.forEach((o) => o.lines.forEach((l) => (byU[l.univers] += l.unitPrice * l.qty)));

  return (
    <>
      <PageHeader
        title="Statistiques"
        subtitle="Les commandes impayées ne sont pas comptées comme ventes encaissées"
        actions={<Segmented<Period> label="Période" value={period} onChange={setPeriod} className="w-72" options={[{ value: "7j", label: "7 jours" }, { value: "30j", label: "30 jours" }, { value: "annee", label: "Année" }]} />}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="brun" label="Chiffre d'affaires encaissé" value={gnf(cashed)} />
        <StatCard label="Commandes" value={String(inPeriod.length)} hint={`${inPeriod.filter((o) => o.paymentStatus === "paye").length} payées · ${inPeriod.filter((o) => o.status === "annulee").length} annulées · ${inPeriod.filter((o) => o.status === "livree").length} livrées`} />
        <StatCard label="Réductions accordées" value={gnf(discounts)} />
        <StatCard label="Valeur du stock" value={gnf(stockValue)} hint="Au prix de vente" />
      </div>
      <div className="mt-5 grid gap-5 [&>*]:min-w-0 lg:grid-cols-2">
        <Panel title="Ventes par catégorie">
          <Bars data={[{ label: "Vêtements", value: byU.studio, display: gnf(byU.studio) }, { label: "Bijoux", value: byU.bijoux, display: gnf(byU.bijoux) }, { label: "Home", value: byU.maison, display: gnf(byU.maison) }]} />
        </Panel>
        <Panel title="Produits les plus vendus">
          <Bars data={top.map(([name, q]) => ({ label: name, value: q, display: `${q} vendu${q > 1 ? "s" : ""}` }))} />
        </Panel>
        <Panel title="Retours et remboursements">
          <p className="text-sm text-muted">{inPeriod.filter((o) => o.paymentStatus === "rembourse").length} remboursement(s) sur la période.</p>
        </Panel>
        <Panel title="Marge estimée">
          <p className="text-sm text-muted">Disponible lorsque les coûts d'achat et de production sont renseignés sur les produits.</p>
        </Panel>
      </div>
    </>
  );
}
