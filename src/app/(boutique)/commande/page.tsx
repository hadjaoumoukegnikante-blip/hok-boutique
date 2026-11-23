"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Scissors, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PromoField, TotalsBlock } from "@/components/shop/Summary";
import { Button, ButtonLink, Card, ChipGroup, Container, Field, ProductVisual, Segmented, useMounted } from "@/components/ui";
import { delivery } from "@/lib/config";
import { cn, gnf } from "@/lib/format";
import { makeOrderRef, measurementsLabel, variantLabel } from "@/lib/pricing";
import type { Customer, Order } from "@/lib/types";
import { useCartTotals } from "@/lib/useCartTotals";
import { useCart, useLocalOrders } from "@/store/cart";
import { demoOrders } from "@/lib/data/orders";

const steps = ["Coordonnées", "Livraison et paiement", "Récapitulatif"];

export default function CheckoutPage() {
  const mounted = useMounted();
  const router = useRouter();
  const totals = useCartTotals();
  const cart = useCart();
  const { orders, addOrder } = useLocalOrders();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [c, setC] = useState<Customer>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    commune: cart.commune,
    quartier: "",
    address: "",
    marketingConsent: false,
  });

  if (!mounted) return <Container className="min-h-[60vh]" />;
  if (totals.lines.length === 0)
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="title-serif text-[40px]">Aucun article à commander</h1>
        <ButtonLink href="/" className="mt-6">Retour à la boutique</ButtonLink>
      </Container>
    );

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validate1 = () => {
    const e: Record<string, string> = {};
    if (!c.firstName.trim()) e.firstName = "Prénom requis.";
    if (!c.lastName.trim()) e.lastName = "Nom requis.";
    if (c.phone.replace(/\D/g, "").length < 9) e.phone = "Numéro de téléphone invalide.";
    if (!c.commune) e.commune = "Choisissez une commune.";
    if (!c.quartier.trim()) e.quartier = "Quartier requis.";
    if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) e.email = "Adresse e-mail invalide.";
    setErrors(e);
    if (Object.keys(e).length === 0) {
      cart.setCommune(c.commune);
      go(1);
    }
  };

  const validate2 = () => {
    if (totals.requiresMakingAcceptance && !accepted) {
      setErrors({ accept: "Merci de prendre connaissance des délais et de les accepter." });
      return;
    }
    setErrors({});
    go(2);
  };

  const placeOrder = () => {
    if (!confirmed) return setErrors({ confirm: "Confirmez votre commande pour continuer." });
    const now = new Date();
    const todayPrefix = makeOrderRef(now, 0).slice(0, 13);
    // Séquence provisoire côté navigateur : le backend attribuera la séquence définitive et unique
    const seq = [...orders, ...demoOrders].filter((o) => o.ref.startsWith(todayPrefix)).reduce((m, o) => Math.max(m, Number(o.ref.slice(-4))), 0) + 1;
    const ref = makeOrderRef(now, seq);
    const order: Order = {
      ref,
      createdAt: now.toISOString(),
      customer: c,
      lines: totals.lines.map((l) => ({
        productId: l.product.id,
        ref: l.product.ref,
        name: l.product.name,
        univers: l.product.univers,
        variantLabel: variantLabel(l.product, l.line),
        qty: l.line.qty,
        unitPrice: l.product.price,
        madeToOrder: l.madeToOrder,
        measurements: l.line.measurements,
        measurementsByWhatsapp: l.line.measurementsByWhatsapp,
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      promoCode: cart.promoCode ?? undefined,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      depositDue: totals.dueNow,
      paid: 0,
      paymentMode: totals.cashOnDeliveryAllowed ? cart.mode : "orange_money",
      paymentStatus: "en_attente",
      status: totals.dueNow > 0 ? "en_attente_paiement" : "confirmee",
      payments: [],
      makingDays: totals.makingDays || undefined,
      deliveryDays: totals.deliveryDays || undefined,
      splitDelivery: cart.splitDelivery,
      invoiceNumber: `FAC-${now.getFullYear()}-${String(seq).padStart(4, "0")}`,
    };
    addOrder(order);
    cart.clear();
    router.push(`/commande/confirmation/${ref}`);
  };

  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => setC((x) => ({ ...x, [k]: v }));

  return (
    <Container className="pt-8 md:pt-12">
      <Link href="/panier" className="inline-flex items-center gap-1 text-sm text-brun hover:underline">
        <ChevronLeft className="size-4" /> Panier
      </Link>
      <h1 className="title-serif mt-3 text-[44px] md:text-[56px]">Commande</h1>

      {/* Progression */}
      <ol className="mt-5 flex gap-2" aria-label="Étapes de la commande">
        {steps.map((s, i) => (
          <li key={s} className="flex-1">
            <div className="h-1 overflow-hidden rounded-full bg-beige-clair">
              <motion.div className="h-full bg-brun" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }} />
            </div>
            <p className={cn("mt-2 text-xs", i === step ? "font-semibold text-encre" : "text-muted")} aria-current={i === step ? "step" : undefined}>
              <span className="hidden sm:inline">{i + 1}. </span>
              {s}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {step === 0 && (
                <Card className="space-y-4">
                  <h2 className="text-lg font-semibold">Vos coordonnées</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Prénom" htmlFor="fn" error={errors.firstName}>
                      <input id="fn" className="field" autoComplete="given-name" value={c.firstName} onChange={(e) => set("firstName", e.target.value)} />
                    </Field>
                    <Field label="Nom" htmlFor="ln" error={errors.lastName}>
                      <input id="ln" className="field" autoComplete="family-name" value={c.lastName} onChange={(e) => set("lastName", e.target.value)} />
                    </Field>
                    <Field label="Téléphone" htmlFor="tel" error={errors.phone} hint="Utilisé pour le suivi et la livraison">
                      <input id="tel" className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="6XX XX XX XX" value={c.phone} onChange={(e) => set("phone", e.target.value)} />
                    </Field>
                    <Field label="E-mail (facultatif)" htmlFor="mail" error={errors.email}>
                      <input id="mail" className="field" type="email" autoComplete="email" value={c.email} onChange={(e) => set("email", e.target.value)} />
                    </Field>
                  </div>
                  <div>
                    <p className="mb-2 text-[13px] font-medium text-soft">Commune (Conakry)</p>
                    <ChipGroup label="Commune" value={c.commune || undefined} onChange={(v) => set("commune", v)} options={delivery.zones.map((z) => ({ value: z.commune, label: z.commune }))} />
                    {errors.commune && <p className="mt-1.5 text-xs text-danger">{errors.commune}</p>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Quartier" htmlFor="q" error={errors.quartier}>
                      <input id="q" className="field" value={c.quartier} onChange={(e) => set("quartier", e.target.value)} />
                    </Field>
                    <Field label="Adresse, repère" htmlFor="adr">
                      <input id="adr" className="field" autoComplete="street-address" value={c.address} onChange={(e) => set("address", e.target.value)} />
                    </Field>
                  </div>
                  <label className="flex items-start gap-3 rounded-2xl bg-ecru p-3.5 text-[13px] text-soft">
                    <input type="checkbox" className="mt-0.5 size-4 accent-[#683C11]" checked={c.marketingConsent} onChange={(e) => set("marketingConsent", e.target.checked)} />
                    J'accepte de recevoir les nouveautés et offres de H.O.K Boutique (facultatif). Les messages de suivi de commande sont envoyés dans tous les cas.
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Link href="/compte" className="text-sm text-brun hover:underline">J'ai un compte, me connecter</Link>
                    <Button size="lg" onClick={validate1}>Continuer</Button>
                  </div>
                </Card>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <Card>
                    <h2 className="text-lg font-semibold">Livraison</h2>
                    <p className="mt-1 text-sm text-muted">
                      {c.commune}, {c.quartier} · {gnf(totals.deliveryFee - (cart.splitDelivery ? delivery.extraShipmentFee : 0))}
                      {delivery.provisional && " (tarif provisoire)"}
                    </p>
                    <div className="mt-4">
                      <Segmented
                        label="Mode de livraison"
                        value={cart.splitDelivery ? "separee" : "groupee"}
                        onChange={(v) => cart.setSplit(v === "separee")}
                        options={[
                          { value: "groupee", label: "Livraison groupée" },
                          { value: "separee", label: "Livraisons séparées" },
                        ]}
                      />
                      <p className="mt-2 text-[13px] text-muted">
                        {cart.splitDelivery
                          ? `Les articles en stock partent sans attendre la confection. Frais supplémentaires : ${gnf(delivery.extraShipmentFee)}.`
                          : "Par défaut, les articles sont livrés ensemble lorsque c'est possible."}
                      </p>
                    </div>
                  </Card>

                  <Card>
                    <h2 className="text-lg font-semibold">Paiement</h2>
                    {totals.subtotalMade > 0 && (
                      <p className="mt-2 rounded-2xl bg-brun/[0.06] px-4 py-3 text-sm text-soft">
                        Vêtements sur commande : acompte de 50 % (<b className="font-semibold text-encre">{gnf(totals.depositOnMade)}</b>) par Orange Money avant la confection.
                      </p>
                    )}
                    {totals.subtotalStock > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-soft">Articles en stock</p>
                        <Segmented
                          label="Mode de paiement des articles en stock"
                          value={totals.cashOnDeliveryAllowed ? cart.mode : "orange_money"}
                          onChange={cart.setMode}
                          options={[
                            { value: "orange_money", label: "Orange Money" },
                            { value: "a_la_livraison", label: "À la livraison", disabled: !totals.cashOnDeliveryAllowed },
                          ]}
                        />
                      </div>
                    )}
                    <div className="mt-4">
                      <PromoField totals={totals} />
                    </div>
                  </Card>

                  <Card>
                    <h2 className="text-lg font-semibold">Délais applicables</h2>
                    <div className="mt-3 divide-y divide-brun/10 rounded-2xl bg-ecru px-4">
                      {totals.makingDays > 0 && (
                        <div className="flex items-center gap-3 py-3.5 text-sm">
                          <Scissors className="size-5 text-brun" strokeWidth={1.5} aria-hidden />
                          <span className="flex-1">Confection</span>
                          <b className="font-semibold">{totals.makingDays} jours</b>
                        </div>
                      )}
                      <div className="flex items-center gap-3 py-3.5 text-sm">
                        <Truck className="size-5 text-brun" strokeWidth={1.5} aria-hidden />
                        <span className="flex-1">Livraison à Conakry</span>
                        <b className="font-semibold">{totals.deliveryDays || "[X]"} jour{totals.deliveryDays > 1 ? "s" : ""}</b>
                      </div>
                    </div>
                    {totals.requiresMakingAcceptance && (
                      <label className={cn("mt-3 flex items-start gap-3 rounded-2xl p-3.5 text-sm", errors.accept ? "bg-danger/[0.06]" : "bg-sable")}>
                        <input type="checkbox" className="mt-0.5 size-[18px] accent-[#683C11]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                        J'ai pris connaissance des délais de confection et de livraison, et je les accepte.
                      </label>
                    )}
                    {errors.accept && <p className="mt-1.5 text-xs text-danger">{errors.accept}</p>}
                  </Card>

                  <div className="flex justify-between gap-3">
                    <Button variant="ghost" size="lg" onClick={() => go(0)}>Retour</Button>
                    <Button size="lg" onClick={validate2}>Voir le récapitulatif</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <Card>
                    <h2 className="text-lg font-semibold">Récapitulatif</h2>
                    <ul className="mt-4 divide-y divide-brun/10">
                      {totals.lines.map((l) => (
                        <li key={l.line.key} className="flex items-center gap-3 py-3">
                          <ProductVisual univers={l.product.univers} alt="" label="" className="size-14 shrink-0 rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{l.product.name} × {l.line.qty}</p>
                            <p className="truncate text-xs text-muted">{variantLabel(l.product, l.line) || "Article"}{l.madeToOrder ? " · sur mesure" : ""}</p>
                            {l.madeToOrder && <p className="text-[11px] text-soft">{measurementsLabel(l.line)}</p>}
                          </div>
                          <p className="text-sm font-medium tabular-nums">{gnf(l.lineTotal)}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 grid gap-3 rounded-2xl bg-ecru p-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-muted">Livraison</p>
                        <p className="font-medium">{c.firstName} {c.lastName} · {c.phone}</p>
                        <p>{c.commune}, {c.quartier}{c.address ? `, ${c.address}` : ""}</p>
                      </div>
                      <div>
                        <p className="text-muted">Paiement</p>
                        <p className="font-medium">
                          {totals.dueNow > 0 ? `Orange Money : ${gnf(totals.dueNow)} maintenant` : "Paiement à la livraison"}
                        </p>
                        {totals.dueLater > 0 && <p>{gnf(totals.dueLater)} à la livraison</p>}
                      </div>
                    </div>
                  </Card>
                  <label className={cn("flex items-start gap-3 rounded-2xl p-4 text-sm", errors.confirm ? "bg-danger/[0.06]" : "bg-white shadow-[0_1px_2px_rgb(72_40_10/0.06)]")}>
                    <input type="checkbox" className="mt-0.5 size-[18px] accent-[#683C11]" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                    <span>
                      Je confirme ma commande et j'accepte les <Link href="/infos/conditions-de-vente" className="text-brun underline">conditions de vente</Link>.
                    </span>
                  </label>
                  {errors.confirm && <p className="text-xs text-danger">{errors.confirm}</p>}
                  <div className="flex justify-between gap-3">
                    <Button variant="ghost" size="lg" onClick={() => go(1)}>Retour</Button>
                    <Button size="lg" onClick={placeOrder}>
                      <Check className="size-5" strokeWidth={2} /> Confirmer la commande
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <p className="mb-3 font-semibold">Votre commande · {totals.count} article{totals.count > 1 ? "s" : ""}</p>
            <TotalsBlock totals={totals} />
          </Card>
        </aside>
      </div>
    </Container>
  );
}
