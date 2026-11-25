import Link from "next/link";
import { Bars, PageHeader, Panel, StatCard } from "@/components/admin/kit";
import { listOrders, listProducts } from "@/lib/admin-data";
import { cn, gnf } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";

const periods = [
  { key: "7j", label: "7 jours", days: 7 },
  { key: "30j", label: "30 jours", days: 30 },
  { key: "annee", label: "Année", days: 365 },
];

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await requireStaff(["admin", "superviseur"]);
  const { p = "30j" } = await searchParams;
  const period = periods.find((x) => x.key === p) ?? periods[1];
  const [orders, products] = await Promise.all([listOrders(1000), listProducts()]);

  const since = Date.now() - period.days * 86400000;
  const inPeriod = orders.filter((o) => new Date(o.createdAt).getTime() >= since);
  const live = inPeriod.filter((o) => o.status !== "annulee");
  const cashed = live.reduce((s, o) => s + o.paid, 0); // les impayés ne comptent pas
  const discounts = live.reduce((s, o) => s + o.discount, 0);
  const stockValue = products.reduce((s, x) => s + (x.status !== "sur_commande" ? x.stock * x.price : 0), 0);

  const qtyByProduct = new Map<string, number>();
  live.forEach((o) => o.lines.forEach((l) => qtyByProduct.set(l.name, (qtyByProduct.get(l.name) ?? 0) + l.qty)));
  const top = [...qtyByProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const byU = { studio: 0, bijoux: 0, maison: 0 };
  live.forEach((o) => o.lines.forEach((l) => (byU[l.univers] += l.unitPrice * l.qty)));

  // Marge estimée sur les lignes dont le coût est renseigné
  const costOf = new Map(products.map((x) => [x.id, x.cost]));
  let marginSales = 0;
  let margin = 0;
  live.forEach((o) => o.lines.forEach((l) => {
    const c = costOf.get(l.productId);
    if (c != null) { marginSales += l.unitPrice * l.qty; margin += (l.unitPrice - c) * l.qty; }
  }));

  return (
    <>
      <PageHeader
        title="Statistiques"
        subtitle="Les commandes impayées ne sont pas comptées comme ventes encaissées"
        actions={
          <div className="flex gap-1.5">
            {periods.map((x) => (
              <Link key={x.key} href={`/admin/statistiques?p=${x.key}`} className={cn("press flex h-9 items-center rounded-full px-4 text-sm font-medium", period.key === x.key ? "bg-brun text-white" : "bg-white text-soft hover:bg-sable")}>{x.label}</Link>
            ))}
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="brun" label="Chiffre d'affaires encaissé" value={gnf(cashed)} />
        <StatCard label="Commandes" value={String(inPeriod.length)} hint={`${inPeriod.filter((o) => o.paymentStatus === "paye").length} payées · ${inPeriod.filter((o) => o.status === "annulee").length} annulées · ${inPeriod.filter((o) => o.status === "livree").length} livrées`} />
        <StatCard label="Réductions accordées" value={gnf(discounts)} />
        <StatCard label="Valeur du stock" value={gnf(stockValue)} hint="Produits finis, au prix de vente" />
      </div>
      <div className="mt-5 grid gap-5 [&>*]:min-w-0 lg:grid-cols-2">
        <Panel title="Ventes par catégorie">
          <Bars data={[{ label: "Vêtements", value: byU.studio, display: gnf(byU.studio) }, { label: "Bijoux", value: byU.bijoux, display: gnf(byU.bijoux) }, { label: "Home", value: byU.maison, display: gnf(byU.maison) }]} />
        </Panel>
        <Panel title="Produits les plus vendus">
          {top.length ? <Bars data={top.map(([name, q]) => ({ label: name, value: q, display: `${q} vendu${q > 1 ? "s" : ""}` }))} /> : <p className="text-sm text-muted">Aucune vente sur la période.</p>}
        </Panel>
        <Panel title="Retours et remboursements">
          <p className="text-sm text-muted">{inPeriod.filter((o) => o.paymentStatus === "rembourse").length} remboursement(s) sur la période.</p>
        </Panel>
        <Panel title="Marge estimée">
          {marginSales > 0 ? (
            <p className="text-sm"><b className="text-lg font-semibold tabular-nums">{gnf(margin)}</b> <span className="text-muted">soit {Math.round((margin / marginSales) * 100)} % sur {gnf(marginSales)} de ventes dont le coût est renseigné.</span></p>
          ) : (
            <p className="text-sm text-muted">Disponible lorsque les coûts sont renseignés sur les fiches produits.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
