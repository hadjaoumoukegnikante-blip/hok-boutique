"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, ButtonLink, Card, Container, useMounted } from "@/components/ui";
import { dateFr, gnf, orderStatusMeta } from "@/lib/format";
import type { Order } from "@/lib/types";
import { trackOrder } from "@/lib/useOrder";
import { useLocalOrders } from "@/store/cart";

/**
 * Mes commandes : celles passées depuis cet appareil (référence + téléphone mémorisés).
 * Les comptes clients avec mot de passe pourront être ajoutés plus tard.
 */
export default function AccountPage() {
  const mounted = useMounted();
  const refs = useLocalOrders((s) => s.orders);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!mounted) return;
    Promise.all(refs.map((r) => trackOrder(r.ref, r.phone))).then((list) => setOrders(list.filter(Boolean) as Order[]));
  }, [mounted, refs]);

  return (
    <Container className="max-w-3xl pt-12 md:pt-16">
      <p className="eyebrow">Mon espace</p>
      <h1 className="title-serif mt-2 text-[44px] md:text-[56px]">Mes commandes</h1>
      <p className="mt-2 text-muted">Les commandes passées depuis cet appareil. Pour une autre commande, utilisez le suivi avec votre référence et votre téléphone.</p>
      <div className="mt-8 space-y-2">
        {mounted && orders === null && refs.length > 0 && <Card className="text-sm text-muted">Chargement…</Card>}
        {mounted && refs.length === 0 && <Card className="text-sm text-muted">Aucune commande sur cet appareil pour le moment.</Card>}
        {orders?.map((o) => (
          <Link key={o.ref} href={`/suivi?ref=${o.ref}`} className="lift flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgb(72_40_10/0.06)]">
            <div className="min-w-0 flex-1">
              <p className="font-semibold tracking-wide">{o.ref}</p>
              <p className="text-sm text-muted">{dateFr(o.createdAt)} · {gnf(o.total)}</p>
            </div>
            <Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge>
            <ChevronRight className="size-5 text-muted" />
          </Link>
        ))}
      </div>
      <ButtonLink href="/suivi" variant="soft" className="mt-6">Suivre une autre commande</ButtonLink>
    </Container>
  );
}
