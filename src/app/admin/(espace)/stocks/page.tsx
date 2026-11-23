"use client";

import { PageHeader, Panel, StatCard, Table, Td } from "@/components/admin/kit";
import { Badge } from "@/components/ui";
import { allProducts, getUniversSync } from "@/lib/api";
import { auditLog } from "@/lib/data/admin";
import { demoOrders } from "@/lib/data/orders";
import { dateFr, gnf } from "@/lib/format";

export default function StocksPage() {
  const items = allProducts().filter((p) => p.status !== "sur_commande");
  // Quantités réservées par les commandes non livrées et non annulées
  const reserved = (id: string) =>
    demoOrders
      .filter((o) => !["livree", "annulee"].includes(o.status))
      .flatMap((o) => o.lines)
      .filter((l) => l.productId === id)
      .reduce((s, l) => s + l.qty, 0);
  const value = items.reduce((s, p) => s + p.stock * p.price, 0);
  const moves = auditLog.filter((l) => l.action.includes("stock") || l.action.includes("Réservation"));

  return (
    <>
      <PageHeader title="Stocks" subtitle="Produits finis, réservations et mouvements. Aucune vente au-delà du disponible." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Valeur du stock (prix de vente)" value={gnf(value)} />
        <StatCard label="Références suivies" value={String(items.length)} />
        <StatCard tone="alert" label="Stock faible (≤ 3)" value={String(items.filter((p) => p.stock <= 3).length)} />
      </div>
      <Table head={["Produit", "Univers", "En stock", "Réservé", "Disponible", "Seuil", "État"]}>
        {items.map((p) => {
          const r = reserved(p.id);
          const dispo = Math.max(0, p.stock - r);
          return (
            <tr key={p.id} className="hover:bg-ecru/60">
              <Td><span className="font-medium">{p.name}</span><span className="block text-xs text-muted">{p.ref}</span></Td>
              <Td>{getUniversSync(p.univers).label}</Td>
              <Td className="tabular-nums">{p.stock}</Td>
              <Td className="tabular-nums">{r}</Td>
              <Td className="font-semibold tabular-nums">{dispo}</Td>
              <Td className="tabular-nums text-muted">3</Td>
              <Td>{dispo === 0 ? <Badge tone="danger">Épuisé</Badge> : dispo <= 3 ? <Badge tone="bordeaux">Faible</Badge> : <Badge tone="ok">OK</Badge>}</Td>
            </tr>
          );
        })}
      </Table>
      <Panel title="Mouvements récents" className="mt-5">
        <ul className="space-y-2 text-sm">
          {moves.map((m) => (
            <li key={m.id} className="flex flex-wrap justify-between gap-2 rounded-2xl bg-ecru px-4 py-3">
              <span><b className="font-semibold">{m.action}</b> · {m.target} · {m.detail}</span>
              <span className="text-muted">{dateFr(m.date, true)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
