"use client";

import { Printer } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button, useMounted } from "@/components/ui";
import { shop } from "@/lib/config";
import { rowToOrder } from "@/lib/db";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Order, ShopSettings } from "@/lib/types";
import { trackOrder } from "@/lib/useOrder";
import { useLocalOrders } from "@/store/cart";
import { dateFr, gnf, paymentStatusMeta } from "@/lib/format";

export function InvoiceView({ refParam, settings }: { refParam: string; settings: ShopSettings }) {
  const mounted = useMounted();
  const ref = decodeURIComponent(refParam).toUpperCase();
  const phone = useLocalOrders((s) => s.orders.find((o) => o.ref === ref)?.phone);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [askPhone, setAskPhone] = useState("");

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      if (phone) return setOrder(await trackOrder(ref, phone));
      // Membre de l'équipe connecté : lecture directe (RLS)
      const db = supabaseBrowser();
      const { data } = await db.from("orders").select("*, order_lines(*), payments(*)").eq("ref", ref).maybeSingle();
      if (data) return setOrder(rowToOrder(data));
      // Client connecté : commande de son compte
      const { data: mine } = await db.rpc("my_orders");
      const row = ((mine as Record<string, unknown>[] | null) ?? []).find((x) => x?.ref === ref);
      setOrder(row ? rowToOrder(row) : null);
    })();
  }, [mounted, ref, phone]);

  if (!mounted || order === undefined) return null;
  if (!order)
    return (
      <main className="flex min-h-screen items-center justify-center bg-sable px-4">
        <form
          className="w-full max-w-sm rounded-3xl bg-white p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setOrder(await trackOrder(ref, askPhone));
          }}
        >
          <p className="font-semibold">Document de la commande {ref}</p>
          <label htmlFor="tel" className="mt-4 block text-[13px] font-medium text-soft">Téléphone utilisé à la commande</label>
          <input id="tel" className="field mt-1.5" inputMode="tel" value={askPhone} onChange={(e) => setAskPhone(e.target.value)} />
          <Button type="submit" className="mt-4 w-full">Afficher</Button>
        </form>
      </main>
    );

  const balance = order.total - order.paid;
  const payer = order.payments.find((p) => p.payerNumber)?.payerNumber;
  const fullyPaid = balance <= 0;

  return (
    <div className="min-h-screen bg-sable py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[820px] justify-end px-4">
        <Button onClick={() => window.print()}>
          <Printer className="size-[18px]" strokeWidth={1.7} /> Télécharger en PDF
        </Button>
      </div>
      <article className="mx-auto max-w-[820px] bg-white p-8 text-[13px] text-encre shadow-xl print:max-w-none print:p-0 print:shadow-none md:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Image src="/logo-hok.png" alt="H.O.K Boutique" width={1067} height={409} className="h-14 w-auto" />
            <p className="mt-3 leading-relaxed text-soft">
              {shop.city}
              <br />
              {[settings.phone, settings.email, settings.domain].filter(Boolean).join(" · ")}
              {(settings.rccm || settings.nif) && (
                <>
                  <br />
                  {settings.rccm && `RCCM ${settings.rccm}`}{settings.rccm && settings.nif && " · "}{settings.nif && `NIF ${settings.nif}`}
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="font-serif text-4xl">{fullyPaid ? "Facture" : order.paid > 0 ? "Facture d'acompte" : "Récapitulatif de commande"}</p>
            <p className="mt-2">N° <b>{order.invoiceNumber}</b></p>
            <p>Commande <b>{order.ref}</b></p>
            <p>Date : {dateFr(order.createdAt)}</p>
          </div>
        </header>

        <section className="mt-8 grid gap-4 rounded-2xl bg-ecru p-5 sm:grid-cols-2 print:bg-white print:ring-1 print:ring-brun/20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brun">Client</p>
            <p className="mt-1 font-semibold">{order.customer.firstName} {order.customer.lastName}</p>
            <p>Tél. {order.customer.phone}</p>
            <p>{order.customer.commune}, {order.customer.quartier}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brun">Paiement</p>
            <p className="mt-1">Statut : <b>{paymentStatusMeta[order.paymentStatus].label}</b></p>
            <p>Mode : {order.paymentMode === "orange_money" ? "Orange Money" : "À la livraison"}</p>
            {payer && <p>N° Orange Money du payeur : {payer}</p>}
          </div>
        </section>

        <table className="mt-8 w-full border-collapse">
          <thead>
            <tr className="border-b border-brun/20 text-left text-[11px] uppercase tracking-[0.12em] text-muted">
              <th className="py-2 font-semibold">Article</th>
              <th className="py-2 font-semibold">Variante</th>
              <th className="py-2 text-right font-semibold">Qté</th>
              <th className="py-2 text-right font-semibold">Prix unit.</th>
              <th className="py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l, i) => (
              <tr key={i} className="border-b border-brun/10">
                <td className="py-3">
                  {l.name}
                  <span className="block text-[11px] text-muted">Réf. {l.ref}{l.madeToOrder ? " · sur mesure" : ""}</span>
                </td>
                <td className="py-3">{l.variantLabel || "·"}</td>
                <td className="py-3 text-right tabular-nums">{l.qty}</td>
                <td className="py-3 text-right tabular-nums">{gnf(l.unitPrice)}</td>
                <td className="py-3 text-right tabular-nums">{gnf(l.unitPrice * l.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex flex-wrap justify-between gap-8">
          <div className="max-w-xs text-soft">
            {(order.makingDays || order.deliveryDays) && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brun">Délais</p>
                {order.makingDays ? <p className="mt-1">Confection : {order.makingDays} jours après validation de l'acompte</p> : null}
                {order.deliveryDays ? <p>Livraison : {order.deliveryDays} jour(s)</p> : null}
              </>
            )}
          </div>
          <dl className="w-full max-w-xs space-y-1.5">
            <Line label="Sous-total" v={gnf(order.subtotal)} />
            {order.discount > 0 && <Line label={`Réduction${order.promoCode ? ` (${order.promoCode})` : ""}`} v={`− ${gnf(order.discount)}`} />}
            <Line label="Frais de livraison" v={gnf(order.deliveryFee)} />
            <div className="flex justify-between border-t border-brun/20 pt-2 text-[15px] font-semibold">
              <dt>Montant total</dt>
              <dd className="tabular-nums">{gnf(order.total)}</dd>
            </div>
            <Line label="Montant déjà payé" v={gnf(order.paid)} />
            <div className="flex justify-between rounded-xl bg-brun px-3 py-2 font-semibold text-white print:bg-white print:text-encre print:ring-1 print:ring-brun">
              <dt>Solde restant dû</dt>
              <dd className="tabular-nums">{gnf(Math.max(0, balance))}</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-12 border-t border-brun/10 pt-4 text-center text-[11px] text-muted">
          {shop.name} · {shop.tagline} · Document mis à jour après chaque vérification de paiement.
        </footer>
      </article>
    </div>
  );
}

function Line({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-soft">{label}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
