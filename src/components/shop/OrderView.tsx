"use client";

import { motion } from "framer-motion";
import { Check, Download, MessageCircle } from "lucide-react";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { dateFr, gnf, orderStatusMeta, paymentStatusMeta } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { useWhatsapp } from "./ShopData";

const flow: { key: OrderStatus[]; label: string }[] = [
  { key: ["en_attente_paiement", "paiement_a_verifier"], label: "Commande reçue" },
  { key: ["confirmee"], label: "Paiement vérifié / confirmée" },
  { key: ["en_preparation", "partiellement_prete"], label: "En préparation ou confection" },
  { key: ["prete_a_expedier", "expediee"], label: "Prête, en route" },
  { key: ["livree"], label: "Livrée" },
];

export function stepIndex(status: OrderStatus) {
  return flow.findIndex((f) => f.key.includes(status));
}

export function OrderView({ order }: { order: Order }) {
  const whatsappLink = useWhatsapp();
  const cur = stepIndex(order.status);
  const balance = order.total - order.paid;
  const pct = order.total ? Math.round((order.paid / order.total) * 100) : 0;
  const cancelled = order.status === "annulee";

  return (
    <div className="space-y-3">
      <Card>
        <p className="text-xs text-muted">Commande du {dateFr(order.createdAt)}</p>
        <p className="mt-0.5 text-lg font-semibold tracking-wide">{order.ref}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={orderStatusMeta[order.status].tone}>Commande · {orderStatusMeta[order.status].label}</Badge>
          <Badge tone={paymentStatusMeta[order.paymentStatus].tone}>Paiement · {paymentStatusMeta[order.paymentStatus].label}</Badge>
        </div>

        {!cancelled && (
          <ol className="mt-6">
            {flow.map((f, i) => {
              const done = i < cur || order.status === "livree";
              const active = i === cur && order.status !== "livree";
              return (
                <li key={f.label} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className={
                        done
                          ? "grid size-6 place-items-center rounded-full bg-brun text-white"
                          : active
                            ? "grid size-6 place-items-center rounded-full border-2 border-brun bg-white"
                            : "size-6 rounded-full border-2 border-beige-clair bg-white"
                      }
                    >
                      {done && <Check className="size-3" strokeWidth={3} />}
                      {active && <span className="size-2.5 animate-pulse rounded-full bg-brun" />}
                    </motion.span>
                    {i < flow.length - 1 && <span className={`min-h-7 w-0.5 flex-1 ${done ? "bg-brun" : "bg-beige-clair"}`} />}
                  </div>
                  <p className={`pb-5 text-[15px] ${done || active ? "font-semibold" : "text-muted"} ${active ? "text-brun" : ""}`}>{f.label}</p>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card>
        <p className="font-semibold">Paiement</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-sable">
          <motion.div className="h-full rounded-full bg-brun" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} />
        </div>
        <div className="mt-3 flex justify-between text-[13px]">
          <div>
            <p className="text-muted">Déjà payé</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums">{gnf(order.paid)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted">Solde restant dû</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums">{gnf(balance)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="font-semibold">Articles</p>
        <ul className="mt-2 divide-y divide-brun/10 text-sm">
          {order.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-3 py-2.5">
              <span>
                {l.name} × {l.qty}
                {l.variantLabel && <span className="block text-xs text-muted">{l.variantLabel}</span>}
                {l.madeToOrder && (
                  <span className="block text-xs text-soft">
                    {l.measurementsByWhatsapp ? "Mesures à envoyer sur WhatsApp" : l.measurements ? `Mesures : ${l.measurements.poitrine} / ${l.measurements.taille} / ${l.measurements.hanches} / ${l.measurements.longueur} cm` : ""}
                  </span>
                )}
              </span>
              <span className="tabular-nums">{gnf(l.unitPrice * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-brun/10 pt-3 text-[15px] font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{gnf(order.total)}</span>
        </div>
      </Card>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <ButtonLink href={`/facture/${order.ref}`} size="lg" target="_blank">
          <Download className="size-[18px]" strokeWidth={1.8} /> Télécharger la facture
        </ButtonLink>
        <ButtonLink href={whatsappLink({ intro: "Bonjour H.O.K Boutique, j'ai une question sur ma commande.", orderRef: order.ref })} variant="soft" size="lg">
          <MessageCircle className="size-[18px]" strokeWidth={1.7} /> Contacter la boutique
        </ButtonLink>
      </div>
    </div>
  );
}
