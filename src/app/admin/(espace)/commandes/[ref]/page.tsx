"use client";

import { ChevronDown, ChevronLeft, FileText, MessageCircle } from "lucide-react";
import Link from "next/link";
import { use, useEffect } from "react";
import { Panel } from "@/components/admin/kit";
import { Badge, Button, ButtonLink } from "@/components/ui";
import { dateFr, gnf, orderStatusMeta, paymentStatusMeta } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { useAdmin } from "@/store/admin";
import { useLocalOrders } from "@/store/cart";

export default function AdminOrderPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const { orders, merge, setStatus, verifyPayment, rejectPayment, log } = useAdmin();
  const local = useLocalOrders((s) => s.orders);
  useEffect(() => merge(local), [local, merge]);
  const order = orders.find((o) => o.ref === decodeURIComponent(ref));

  if (!order) return <p className="text-muted">Commande introuvable.</p>;
  const balance = order.total - order.paid;
  const history = log.filter((l) => l.target === order.ref);

  return (
    <>
      <Link href="/admin/commandes" className="inline-flex items-center gap-1 text-sm text-brun hover:underline">
        <ChevronLeft className="size-4" /> Commandes
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="title-serif text-[36px] leading-none md:text-[44px]">{order.ref}</h1>
          <p className="mt-2 text-sm text-muted">Créée le {dateFr(order.createdAt, true)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/facture/${order.ref}`} variant="outline" size="sm" target="_blank"><FileText className="size-4" /> Facture</ButtonLink>
          <ButtonLink href={whatsappLink({ intro: `Bonjour ${order.customer.firstName},`, orderRef: order.ref })} variant="soft" size="sm"><MessageCircle className="size-4" /> WhatsApp client</ButtonLink>
        </div>
      </div>

      <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Panel title="Articles">
            <ul className="divide-y divide-brun/[0.07] text-sm">
              {order.lines.map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{l.name} × {l.qty}</p>
                    <p className="text-xs text-muted">Réf. {l.ref}{l.variantLabel ? ` · ${l.variantLabel}` : ""}</p>
                    {l.madeToOrder && (
                      l.measurements ? (
                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-xl bg-ecru px-3 py-2 text-xs sm:grid-cols-4">
                          {(["poitrine", "taille", "hanches", "longueur"] as const).map((k) => (
                            <div key={k}><dt className="capitalize text-muted">{k}</dt><dd className="font-semibold">{l.measurements![k]} cm</dd></div>
                          ))}
                          {l.measurements.hauteur ? <div><dt className="text-muted">Hauteur</dt><dd className="font-semibold">{l.measurements.hauteur} cm</dd></div> : null}
                          {l.measurements.note ? <div className="col-span-full"><dt className="text-muted">Précision</dt><dd>{l.measurements.note}</dd></div> : null}
                        </dl>
                      ) : (
                        <p className="mt-1.5 inline-flex rounded-full bg-bordeaux/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-bordeaux">Mesures attendues sur WhatsApp</p>
                      )
                    )}
                  </div>
                  <div className="text-right">
                    {l.madeToOrder ? <Badge tone="brun">Sur commande</Badge> : <Badge tone="ok">Stock</Badge>}
                    <p className="mt-1 tabular-nums">{gnf(l.unitPrice * l.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-brun/10 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd className="tabular-nums">{gnf(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Réduction {order.promoCode}</dt><dd className="tabular-nums">− {gnf(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Livraison{order.splitDelivery ? " (séparée)" : ""}</dt><dd className="tabular-nums">{gnf(order.deliveryFee)}</dd></div>
              <div className="flex justify-between pt-1 text-[15px] font-semibold"><dt>Total</dt><dd className="tabular-nums">{gnf(order.total)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Exigé avant confection / livraison</dt><dd className="tabular-nums">{gnf(order.depositDue)}</dd></div>
              <div className="flex justify-between font-semibold text-brun"><dt>Solde restant dû</dt><dd className="tabular-nums">{gnf(balance)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Paiements" action={<Badge tone={paymentStatusMeta[order.paymentStatus].tone}>{paymentStatusMeta[order.paymentStatus].label}</Badge>}>
            {order.payments.length === 0 && <p className="text-sm text-muted">Aucun paiement enregistré.</p>}
            <ul className="space-y-2.5">
              {order.payments.map((p) => (
                <li key={p.id} className="rounded-2xl bg-ecru p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold tabular-nums">{gnf(p.amount)} · {p.mode === "orange_money" ? "Orange Money" : "À la livraison"}</p>
                    <Badge tone={paymentStatusMeta[p.status].tone}>{paymentStatusMeta[p.status].label}</Badge>
                  </div>
                  <p className="mt-1 text-muted">{dateFr(p.date, true)}{p.payerNumber ? ` · N° payeur ${p.payerNumber}` : ""}{p.verifiedBy ? ` · vérifié par ${p.verifiedBy}` : ""}</p>
                  {(p.status === "a_verifier" || p.status === "preuve_recue") && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => verifyPayment(order.ref, p.id)}>Fonds reçus, valider</Button>
                      <Button size="sm" variant="outline" onClick={() => rejectPayment(order.ref, p.id)}>Transaction introuvable</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Valider uniquement après contrôle de la transaction sur le compte marchand. Une capture seule ne suffit pas.</p>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Statut de la commande">
            <div className="relative">
              <label htmlFor="st" className="sr-only">Statut</label>
              <select id="st" value={order.status} onChange={(e) => setStatus(order.ref, e.target.value as OrderStatus)} className="field appearance-none bg-ecru pr-10">
                {Object.entries(orderStatusMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-4 size-4 text-brun" />
            </div>
            <p className="mt-2 text-xs text-muted">Chaque changement est tracé dans l'historique et peut déclencher une notification au client.</p>
          </Panel>
          <Panel title="Client">
            <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
            <p className="text-sm text-muted">{order.customer.phone}{order.customer.email ? ` · ${order.customer.email}` : ""}</p>
            <p className="mt-2 text-sm">{order.customer.commune}, {order.customer.quartier}</p>
            <p className="text-sm text-muted">{order.customer.address}</p>
            <p className="mt-2 text-xs text-muted">Communications commerciales : {order.customer.marketingConsent ? "acceptées" : "refusées"}</p>
          </Panel>
          <Panel title="Délais">
            <p className="text-sm">Confection : {order.makingDays ? `${order.makingDays} jours` : "non applicable"}</p>
            <p className="text-sm">Livraison : {order.deliveryDays ? `${order.deliveryDays} jour(s)` : "à définir"}</p>
          </Panel>
          <Panel title="Historique">
            {history.length === 0 && <p className="text-sm text-muted">Aucune opération tracée.</p>}
            <ul className="space-y-2.5 text-sm">
              {history.map((h) => (
                <li key={h.id}>
                  <p className="font-medium">{h.action}</p>
                  <p className="text-xs text-muted">{dateFr(h.date, true)} · {h.user} · {h.detail}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
