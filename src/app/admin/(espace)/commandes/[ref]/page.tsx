import { ChevronLeft, FileText, Image as ImageIcon, MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/admin/kit";
import { Badge, Button, ButtonLink } from "@/components/ui";
import { cashPaymentAction, rejectPaymentAction, setOrderStatusAction, verifyPaymentAction } from "@/app/admin/actions/ops";
import { getAdminOrder, getSettingsBundle, orderHistory } from "@/lib/admin-data";
import { dateFr, gnf, orderStatusMeta, paymentStatusMeta } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";
import { whatsappLink } from "@/lib/whatsapp";

const stageLabel: Record<string, string> = { a_demarrer: "À démarrer", decoupe: "Découpe", couture: "Couture", finitions: "Finitions", terminee: "Terminée" };

export default async function AdminOrderPage({ params }: { params: Promise<{ ref: string }> }) {
  const me = await requireStaff();
  const { ref } = await params;
  const r = decodeURIComponent(ref);
  const [order, history, { settings }] = await Promise.all([getAdminOrder(r), orderHistory(r), getSettingsBundle()]);
  if (!order) notFound();
  const balance = order.total - order.paid;
  const canPay = me.role === "admin" || me.role === "superviseur";
  const cancelled = order.status === "annulee";
  const clientPhone = order.customer.phone.length === 9 ? `224${order.customer.phone}` : order.customer.phone;

  return (
    <>
      <Link href="/admin/commandes" className="inline-flex items-center gap-1 text-sm text-brun hover:underline">
        <ChevronLeft className="size-4" /> Commandes
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="title-serif text-[36px] leading-none md:text-[44px]">{order.ref}</h1>
          <p className="mt-2 text-sm text-muted">
            Créée le {dateFr(order.createdAt, true)}
            {order.expiresAt && !cancelled && ` · annulation automatique le ${dateFr(order.expiresAt, true)} si impayée`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/facture/${order.ref}`} variant="outline" size="sm" target="_blank"><FileText className="size-4" /> Facture</ButtonLink>
          <ButtonLink href={whatsappLink({ intro: `Bonjour ${order.customer.firstName},`, orderRef: order.ref }, clientPhone)} variant="soft" size="sm"><MessageCircle className="size-4" /> WhatsApp client</ButtonLink>
        </div>
      </div>

      <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Panel title="Articles">
            <ul className="divide-y divide-brun/[0.07] text-sm">
              {order.lines.map((l, i) => (
                <li key={i} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{l.name} × {l.qty}</p>
                    <p className="text-xs text-muted">Réf. {l.ref}{l.variantLabel ? ` · ${l.variantLabel}` : ""}</p>
                    {l.madeToOrder && (l.measurements ? (
                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-xl bg-ecru px-3 py-2 text-xs sm:grid-cols-4">
                        {(["poitrine", "taille", "hanches", "longueur"] as const).map((k) => (
                          <div key={k}><dt className="capitalize text-muted">{k}</dt><dd className="font-semibold">{l.measurements![k]} cm</dd></div>
                        ))}
                        {l.measurements.hauteur ? <div><dt className="text-muted">Hauteur</dt><dd className="font-semibold">{l.measurements.hauteur} cm</dd></div> : null}
                        {l.measurements.note ? <div className="col-span-full"><dt className="text-muted">Précision</dt><dd>{l.measurements.note}</dd></div> : null}
                      </dl>
                    ) : (
                      <p className="mt-1.5 inline-flex rounded-full bg-bordeaux/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-bordeaux">Mesures attendues sur WhatsApp</p>
                    ))}
                  </div>
                  <div className="shrink-0 text-right">
                    {l.madeToOrder ? <Badge tone="brun">Sur mesure</Badge> : <Badge tone="ok">Stock</Badge>}
                    <p className="mt-1 tabular-nums">{gnf(l.unitPrice * l.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-brun/10 pt-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Sous-total</dt><dd className="tabular-nums">{gnf(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between gap-3"><dt className="text-muted">Réduction {order.promoCode}</dt><dd className="tabular-nums">− {gnf(order.discount)}</dd></div>}
              <div className="flex justify-between gap-3"><dt className="text-muted">Livraison{order.splitDelivery ? " (séparée)" : ""}</dt><dd className="tabular-nums">{gnf(order.deliveryFee)}</dd></div>
              <div className="flex justify-between gap-3 pt-1 text-[15px] font-semibold"><dt>Total</dt><dd className="tabular-nums">{gnf(order.total)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Exigé avant confection / livraison</dt><dd className="tabular-nums">{gnf(order.depositDue)}</dd></div>
              <div className="flex justify-between gap-3 font-semibold text-brun"><dt>Solde restant dû</dt><dd className="tabular-nums">{gnf(balance)}</dd></div>
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
                  <p className="mt-1 text-muted">{dateFr(p.date, true)}{p.payerNumber ? ` · N° payeur ${p.payerNumber}` : ""}</p>
                  {order.proofLinks[p.id] && (
                    <a href={order.proofLinks[p.id]} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-brun hover:underline">
                      <ImageIcon className="size-4" /> Voir la capture
                    </a>
                  )}
                  {canPay && (p.status === "a_verifier" || p.status === "preuve_recue") && (
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <form action={verifyPaymentAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="payment_id" value={p.id} />
                        <input type="hidden" name="ref" value={order.ref} />
                        <label className="text-xs text-muted">
                          Montant reçu
                          <input name="amount" defaultValue={p.amount} inputMode="numeric" className="mt-1 block h-10 w-32 rounded-xl border border-brun/15 bg-white px-3 text-sm tabular-nums" />
                        </label>
                        <Button size="sm" type="submit">Fonds reçus, valider</Button>
                      </form>
                      <form action={rejectPaymentAction}>
                        <input type="hidden" name="payment_id" value={p.id} />
                        <input type="hidden" name="ref" value={order.ref} />
                        <Button size="sm" variant="outline" type="submit">Transaction introuvable</Button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {!cancelled && balance > 0 && (canPay || me.role === "livreur") && (
              <form action={cashPaymentAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-brun/10 pt-4">
                <input type="hidden" name="ref" value={order.ref} />
                <label className="text-xs text-muted">
                  Paiement reçu en main propre (GNF)
                  <input name="amount" defaultValue={balance} inputMode="numeric" className="mt-1 block h-10 w-40 rounded-xl border border-brun/15 bg-white px-3 text-sm tabular-nums" />
                </label>
                <Button size="sm" variant="soft" type="submit">Enregistrer</Button>
              </form>
            )}
            <p className="mt-3 text-xs text-muted">Valider uniquement après contrôle de la transaction sur le compte marchand. Une capture seule ne suffit pas.</p>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Statut de la commande">
            <Badge tone={orderStatusMeta[order.status].tone}>{orderStatusMeta[order.status].label}</Badge>
            {!cancelled && (
              <form action={setOrderStatusAction} className="mt-3 flex gap-2">
                <input type="hidden" name="ref" value={order.ref} />
                <label htmlFor="st" className="sr-only">Nouveau statut</label>
                <select id="st" name="status" defaultValue={order.status} className="field h-11 flex-1 bg-ecru">
                  {Object.entries(orderStatusMeta)
                    .filter(([k]) => me.role !== "livreur" || ["expediee", "livree"].includes(k))
                    .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <Button type="submit" size="md">Appliquer</Button>
              </form>
            )}
            <p className="mt-2 text-xs text-muted">« Annulée » libère le stock et le tissu non découpé. « Expédiée » ou « Livrée » sort le stock définitivement.</p>
          </Panel>
          {order.jobs.length > 0 && (
            <Panel title="Confection" action={<Link href="/admin/confection" className="text-sm text-brun hover:underline">Atelier</Link>}>
              <ul className="space-y-1.5 text-sm">
                {order.jobs.map((j) => (
                  <li key={j.id} className="flex justify-between gap-3">
                    <span>{j.lineName}</span>
                    <span className="text-muted">{stageLabel[j.stage]}{j.dueDate ? ` · pour le ${dateFr(j.dueDate)}` : ""}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <Panel title="Client">
            <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
            <p className="text-sm text-muted">{order.customer.phone}{order.customer.email ? ` · ${order.customer.email}` : ""}</p>
            <p className="mt-2 text-sm">{order.customer.commune}, {order.customer.quartier}</p>
            {order.customer.address && <p className="text-sm text-muted">{order.customer.address}</p>}
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
                  <p className="text-xs text-muted">{dateFr(h.at, true)} · {h.detail}</p>
                </li>
              ))}
            </ul>
          </Panel>
          {!settings.whatsapp && <p className="text-xs text-muted">Astuce : renseignez le numéro WhatsApp de la boutique dans Paramètres.</p>}
        </div>
      </div>
    </>
  );
}
