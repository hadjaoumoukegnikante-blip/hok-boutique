"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock, MessageCircle, Scissors, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, ButtonLink, ChipGroup, ProductVisual, QtyStepper } from "@/components/ui";
import { getUniversSync } from "@/lib/api";
import { availableQty } from "@/lib/availability";
import { emptyMeasurements, MeasurementsForm, measurementsValid, type MeasureMode } from "./MeasurementsForm";
import { paymentRules } from "@/lib/config";
import { cn, gnf, productStatusMeta } from "@/lib/format";
import type { Measurements, Product, VariantKind } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { useCart, useUi } from "@/store/cart";

export function ProductDetail({ product }: { product: Product }) {
  const u = getUniversSync(product.univers);
  const meta = productStatusMeta[product.status];
  const made = product.status === "sur_commande";
  const available = availableQty(product);
  const unavailable = available <= 0;
  const deposit = Math.round(product.price * paymentRules[product.univers].depositRate);

  const [selection, setSelection] = useState<Partial<Record<VariantKind, string>>>({});
  const [fabric, setFabric] = useState(product.fabrics?.[0]);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [tried, setTried] = useState(false);
  const [mode, setMode] = useState<MeasureMode>("site");
  const [measures, setMeasures] = useState<Measurements>(emptyMeasurements);
  const add = useCart((s) => s.add);
  const { notify, openCart } = useUi();

  const [pageUrl, setPageUrl] = useState<string>();
  useEffect(() => setPageUrl(window.location.href), []);

  const missing = product.variants.filter((g) => !selection[g.kind]);
  const gallery = product.images.length ? product.images : [undefined, undefined, undefined];
  const maxQty = product.status === "en_stock" ? product.stock : undefined;
  const measuresMissing = made && mode === "site" && !measurementsValid(measures);

  const onAdd = () => {
    setTried(true);
    if (missing.length || unavailable || measuresMissing) return;
    add({
      productId: product.id,
      qty: made ? 1 : qty,
      selection,
      fabric: made && product.fabrics?.length ? fabric : undefined,
      measurements: made && mode === "site" ? measures : undefined,
      measurementsByWhatsapp: made && mode === "whatsapp" ? true : undefined,
    });
    if (made) {
      setMeasures(emptyMeasurements);
      setSelection({});
      setTried(false);
    }
    notify("Ajouté au panier", `${product.name}${Object.values(selection).length ? " · " + Object.values(selection).join(" · ") : ""}`);
  };

  const wa = whatsappLink({
    intro: "Bonjour H.O.K Boutique, j'ai une question sur ce produit.",
    productName: product.name,
    productRef: product.ref,
    productUrl: pageUrl,
  });

  return (
    <div className="grid gap-8 pb-28 md:grid-cols-[1.1fr_1fr] md:gap-12 md:pb-0 lg:gap-16">
      {/* Galerie */}
      <div className="md:sticky md:top-24 md:self-start">
        <div className="relative overflow-hidden rounded-[28px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={img} initial={{ opacity: 0.4, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0.4 }} transition={{ duration: 0.4 }}>
              <ProductVisual univers={product.univers} src={gallery[img]} alt={`${product.name}, vue ${img + 1}`} label={`Photo produit ${img + 1} / ${gallery.length}`} className="aspect-[4/5] w-full" />
            </motion.div>
          </AnimatePresence>
          <span className="glass-strong absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-xs font-medium text-brun">{meta.label}</span>
        </div>
        <div className="mt-3 flex gap-2.5" role="tablist" aria-label="Photos">
          {gallery.map((src, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={img === i}
              aria-label={`Photo ${i + 1}`}
              onClick={() => setImg(i)}
              className={cn("press overflow-hidden rounded-2xl ring-2 ring-offset-2 transition", img === i ? "ring-brun" : "ring-transparent opacity-70 hover:opacity-100")}
            >
              <ProductVisual univers={product.univers} src={src} alt="" label="" className="size-16 md:size-20" />
            </button>
          ))}
        </div>
      </div>

      {/* Informations */}
      <div>
        <nav aria-label="Fil d'Ariane" className="text-xs font-semibold uppercase tracking-[0.14em] text-brun">
          <Link href={`/${u.slug}`} className="hover:underline">{u.brand}</Link>
          <span className="mx-1.5 text-muted">·</span>
          <Link href={`/${u.slug}?sous=${product.subcategory}`} className="hover:underline">
            {u.subcategories.find((s) => s.slug === product.subcategory)?.label}
          </Link>
        </nav>
        <h1 className="title-serif mt-3 text-[40px] leading-[1.05] md:text-[52px]">{product.name}</h1>
        <div className="mt-3 flex items-baseline justify-between gap-4">
          <p className="text-2xl font-semibold tabular-nums">{gnf(product.price)}</p>
          <p className="text-xs text-muted">Réf. {product.ref}</p>
        </div>
        {made && product.fabric && (
          <div className="mt-4 flex items-center gap-3">
            <span
              aria-hidden
              className="size-7 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]"
              style={{
                background:
                  product.fabric.pattern === "rayures"
                    ? `repeating-linear-gradient(135deg, ${product.fabric.hex} 0 5px, #ffffff 5px 10px)`
                    : product.fabric.hex,
              }}
            />
            <p className="text-sm">
              <span className="text-muted">Couleur : </span>
              <b className="font-semibold">{product.fabric.color}</b>
            </p>
          </div>
        )}
        {made && (
          <p className={cn("mt-2 text-sm", available === 0 ? "text-danger" : available <= 1 ? "text-bordeaux" : "text-ok")}>
            {available === 0 ? "Tissu épuisé pour ce modèle" : available === 1 ? "Tissu disponible pour une dernière pièce" : "Disponible à la confection"}
          </p>
        )}
        {product.status === "en_stock" && (
          <p className={cn("mt-2 text-sm", product.stock <= 3 ? "text-bordeaux" : "text-ok")}>
            {product.stock <= 0 ? "Épuisé" : product.stock <= 3 ? `Plus que ${product.stock} en stock` : "En stock, expédié rapidement"}
          </p>
        )}

        {/* Variantes */}
        <div className="mt-8 space-y-6">
          {product.variants.map((g) => {
            const err = tried && !selection[g.kind];
            return (
              <div key={g.kind}>
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="text-[15px] font-semibold">
                    {g.label}
                    {selection[g.kind] && (
                      <span className="font-normal text-muted"> · {g.options.find((o) => o.value === selection[g.kind])?.label}</span>
                    )}
                  </p>
                  {g.kind === "taille" && made && <Link href="/infos/guide-des-tailles" className="text-[13px] text-brun hover:underline">Guide des tailles</Link>}
                </div>
                {g.options.some((o) => o.hex) ? (
                  <div role="radiogroup" aria-label={g.label} className="flex flex-wrap gap-3">
                    {g.options.map((o) => {
                      const on = selection[g.kind] === o.value;
                      return (
                        <button
                          key={o.value}
                          role="radio"
                          aria-checked={on}
                          aria-label={o.label}
                          onClick={() => setSelection((s) => ({ ...s, [g.kind]: o.value }))}
                          className={cn("press grid size-11 place-items-center rounded-full border-2", on ? "border-brun" : "border-transparent hover:border-brun/30")}
                        >
                          <span className="block size-8 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]" style={{ background: o.hex }} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <ChipGroup
                    label={g.label}
                    value={selection[g.kind]}
                    onChange={(v) => setSelection((s) => ({ ...s, [g.kind]: v }))}
                    options={g.options.map((o) => ({ value: o.value, label: o.label, disabled: o.stock === 0 }))}
                  />
                )}
                {err && <p className="mt-2 text-xs text-danger">Choisissez une option.</p>}
              </div>
            );
          })}

          {made && product.fabrics?.length ? (
            <div>
              <label htmlFor="tissu" className="mb-3 block text-[15px] font-semibold">Tissu</label>
              <div className="relative">
                <select id="tissu" value={fabric} onChange={(e) => setFabric(e.target.value)} className="field appearance-none bg-ecru pr-10">
                  {product.fabrics.map((f) => <option key={f}>{f}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-4 size-4 text-brun" strokeWidth={1.8} />
              </div>
            </div>
          ) : null}

          {made && !unavailable && (
            <MeasurementsForm mode={mode} onMode={setMode} value={measures} onChange={setMeasures} showErrors={tried && measuresMissing} />
          )}

          {!made && !unavailable && (
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold">Quantité</p>
              <QtyStepper value={qty} onChange={setQty} max={maxQty} />
            </div>
          )}
        </div>

        {/* Délais, affichés séparément */}
        <div className="mt-8 rounded-3xl bg-ecru px-5 py-1.5">
          {made && (
            <div className="flex items-center gap-3.5 border-b border-brun/10 py-4">
              <Scissors className="size-5 shrink-0 text-brun" strokeWidth={1.5} aria-hidden />
              <div className="flex-1">
                <p className="text-sm font-semibold">Délai de confection</p>
                <p className="text-[13px] text-muted">Après validation de l'acompte</p>
              </div>
              <p className="text-sm font-semibold">{product.makingDays ? `${product.makingDays} jours` : "[X] jours"}</p>
            </div>
          )}
          <div className="flex items-center gap-3.5 py-4">
            <Truck className="size-5 shrink-0 text-brun" strokeWidth={1.5} aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-semibold">Délai de livraison</p>
              <p className="text-[13px] text-muted">{made ? "Conakry, après confection" : "Conakry"}</p>
            </div>
            <p className="text-sm font-semibold">{product.deliveryDays ? `${product.deliveryDays} jour${product.deliveryDays > 1 ? "s" : ""}` : "[X] jours"}</p>
          </div>
        </div>

        {made && (
          <div className="mt-3 rounded-3xl border border-brun/15 p-5">
            <p className="text-sm font-semibold">Paiement en deux temps</p>
            <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-sable">
              <motion.div className="h-full rounded-full bg-brun" initial={{ width: 0 }} whileInView={{ width: "50%" }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} />
            </div>
            <div className="mt-3 flex justify-between text-[13px]">
              <div>
                <p className="text-muted">Acompte 50 % à la commande</p>
                <p className="mt-0.5 text-base font-semibold tabular-nums">{gnf(deposit)}</p>
              </div>
              <div className="text-right">
                <p className="text-muted">Solde à la livraison</p>
                <p className="mt-0.5 text-base font-semibold tabular-nums">{gnf(product.price - deposit)}</p>
              </div>
            </div>
          </div>
        )}

        {product.status === "precommande" && (
          <p className="mt-3 flex items-center gap-2 rounded-2xl bg-bordeaux/[0.06] px-4 py-3 text-sm text-bordeaux">
            <Clock className="size-4" strokeWidth={1.8} /> Article en précommande : livraison dès réception du stock.
          </p>
        )}

        {/* Actions (bureau) */}
        <div className="mt-7 hidden gap-3 md:flex">
          {unavailable ? (
            <Button size="lg" className="flex-1" disabled>{made ? "Tissu épuisé" : "Indisponible"}</Button>
          ) : (
            <Button size="lg" className="flex-1" onClick={onAdd}>Ajouter au panier</Button>
          )}
          <ButtonLink href={wa} variant="soft" size="lg" aria-label="Poser une question sur WhatsApp">
            <MessageCircle className="size-5" strokeWidth={1.7} /> WhatsApp
          </ButtonLink>
        </div>
        <button onClick={openCart} className="mt-3 hidden text-sm text-brun hover:underline md:block">Voir mon panier</button>

        {/* Accordéons */}
        <div className="mt-8 border-t border-brun/10">
          <Accordion title="Description" defaultOpen>
            <p>{product.description}</p>
          </Accordion>
          <Accordion title="Livraison">
            <p>Livraison à Conakry. Les frais dépendent de votre commune et sont affichés avant la confirmation de la commande.</p>
          </Accordion>
          <Accordion title="Retours et échanges">
            <p>
              {made
                ? "Les vêtements confectionnés sur mesure ne sont ni repris ni échangés."
                : "Retour possible pour un article intact, frais de retour à la charge du client."}{" "}
              <Link href="/infos/retours" className="text-brun underline">Voir la politique de retour</Link>.
            </p>
          </Accordion>
        </div>

        <a href={wa} target="_blank" rel="noopener noreferrer" className="press mt-6 flex items-center gap-3 rounded-[20px] bg-ecru px-4 py-3.5 hover:bg-sable">
          <MessageCircle className="size-5 shrink-0 text-brun" strokeWidth={1.6} aria-hidden />
          <span className="text-sm">
            <b className="block font-semibold">Une question sur ce modèle ?</b>
            <span className="text-muted">Écrire sur WhatsApp, la référence est jointe.</span>
          </span>
        </a>

        {tried && (missing.length > 0 || measuresMissing) && (
          <Badge tone="danger" className="mt-4">
            À compléter : {[...missing.map((m) => m.label.toLowerCase()), ...(measuresMissing ? ["vos mesures"] : [])].join(", ")}
          </Badge>
        )}
      </div>

      {/* Barre d'action mobile */}
      <div className="glass fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-brun/[0.08] px-4 pb-6 pt-3 md:hidden">
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Contacter la boutique sur WhatsApp" className="press grid size-[54px] shrink-0 place-items-center rounded-full bg-sable text-brun">
          <MessageCircle className="size-[22px]" strokeWidth={1.7} />
        </a>
        <Button size="lg" className="flex-1" onClick={onAdd} disabled={unavailable}>
          {unavailable ? (made ? "Tissu épuisé" : "Indisponible") : "Ajouter au panier"}
        </Button>
      </div>
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-brun/10">
      <button aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-14 w-full items-center justify-between text-left text-[15px] font-semibold">
        {title}
        <motion.span aria-hidden animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }} className="grid size-6 shrink-0 place-items-center text-xl font-normal leading-none text-brun">+</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm leading-relaxed text-soft">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
