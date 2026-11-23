"use client";

import { useEffect, useState } from "react";
import { PageHeader, SearchInput, Table, Td } from "@/components/admin/kit";
import { Badge } from "@/components/ui";
import { dateFr, gnf } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { useAdmin } from "@/store/admin";
import { useLocalOrders } from "@/store/cart";

export default function CustomersPage() {
  const { orders, merge } = useAdmin();
  const local = useLocalOrders((s) => s.orders);
  useEffect(() => merge(local), [local, merge]);
  const [q, setQ] = useState("");

  const map = new Map<string, { name: string; phone: string; commune: string; orders: number; spent: number; last: string; consent: boolean }>();
  orders.forEach((o) => {
    const k = o.customer.phone;
    const c = map.get(k) ?? { name: `${o.customer.firstName} ${o.customer.lastName}`, phone: k, commune: o.customer.commune, orders: 0, spent: 0, last: o.createdAt, consent: o.customer.marketingConsent };
    c.orders += 1;
    c.spent += o.paid;
    if (o.createdAt > c.last) c.last = o.createdAt;
    map.set(k, c);
  });
  const list = [...map.values()].filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Clients" subtitle="Comptes clients et commandes en invité" actions={<SearchInput value={q} onChange={setQ} placeholder="Nom ou téléphone" />} />
      <Table head={["Client", "Téléphone", "Commune", "Commandes", "Encaissé", "Dernière commande", "Offres", ""]}>
        {list.map((c) => (
          <tr key={c.phone} className="hover:bg-ecru/60">
            <Td className="font-medium">{c.name}</Td>
            <Td className="tabular-nums">{c.phone}</Td>
            <Td>{c.commune}</Td>
            <Td>{c.orders}</Td>
            <Td className="tabular-nums">{gnf(c.spent)}</Td>
            <Td className="text-muted">{dateFr(c.last)}</Td>
            <Td>{c.consent ? <Badge tone="ok">Accepte</Badge> : <Badge>Non</Badge>}</Td>
            <Td><a href={whatsappLink({ intro: `Bonjour ${c.name.split(" ")[0]},` })} target="_blank" rel="noopener noreferrer" className="text-brun hover:underline">WhatsApp</a></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
