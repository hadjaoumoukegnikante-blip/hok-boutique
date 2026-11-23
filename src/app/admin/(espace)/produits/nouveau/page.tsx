"use client";

import { ChevronDown, ChevronLeft, ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Panel } from "@/components/admin/kit";
import { Button, ChipGroup, Field, Segmented } from "@/components/ui";
import { allProducts } from "@/lib/api";
import { univers } from "@/lib/data/catalogue";
import { productStatusMeta } from "@/lib/format";
import type { ProductStatus, UniversKey } from "@/lib/types";
import { useUi } from "@/store/cart";

function ProductForm() {
  const params = useSearchParams();
  const existing = allProducts().find((p) => p.ref === params.get("ref"));
  const notify = useUi((s) => s.notify);
  const [u, setU] = useState<UniversKey>(existing?.univers ?? "studio");
  const [status, setStatus] = useState<ProductStatus>(existing?.status ?? (u === "studio" ? "sur_commande" : "en_stock"));
  const [sub, setSub] = useState(existing?.subcategory ?? univers[0].subcategories[0].slug);
  const [variants, setVariants] = useState<string[]>(existing?.variants.flatMap((g) => g.options.map((o) => o.label)) ?? []);
  const [vInput, setVInput] = useState("");
  const [saved, setSaved] = useState(false);
  const uni = univers.find((x) => x.key === u)!;
  const made = status === "sur_commande";

  return (
    <>
      <Link href="/admin/produits" className="inline-flex items-center gap-1 text-sm text-brun hover:underline">
        <ChevronLeft className="size-4" /> Produits
      </Link>
      <h1 className="title-serif mb-6 mt-2 text-[36px] md:text-[44px]">{existing ? existing.name : "Nouveau produit"}</h1>

      <form
        className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.5fr_1fr]"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
          notify("Produit enregistré", "Démonstration : enregistrement réel via le backend");
        }}
      >
        <div className="space-y-5">
          <Panel title="Informations">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom" htmlFor="name"><input id="name" className="field" defaultValue={existing?.name} required /></Field>
              <Field label="Référence unique" htmlFor="ref" hint="Ex. HOK-ST-006"><input id="ref" className="field" defaultValue={existing?.ref} required /></Field>
              <Field label="Prix (GNF)" htmlFor="price"><input id="price" className="field" type="number" min={0} step={1000} defaultValue={existing?.price} required /></Field>
              <Field label="Quantité disponible" htmlFor="stock" hint={made ? "Non utilisé pour la confection sur commande" : undefined}>
                <input id="stock" className="field" type="number" min={0} defaultValue={existing?.stock ?? 0} disabled={made} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Description" htmlFor="desc"><textarea id="desc" rows={4} className="field h-auto py-3" defaultValue={existing?.description} /></Field>
            </div>
          </Panel>

          <Panel title="Photos">
            <label className="press flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-brun/20 bg-ecru px-5 py-10 text-center text-sm text-soft hover:border-brun/40">
              <ImagePlus className="size-7 text-brun" strokeWidth={1.4} />
              Glisser des photos ou cliquer pour ajouter
              <span className="text-xs text-muted">Fond clair, lumière naturelle, même cadrage pour toutes les fiches</span>
              <input type="file" accept="image/*" multiple className="sr-only" />
            </label>
          </Panel>

          <Panel title="Variantes">
            <p className="mb-3 text-sm text-muted">Tailles, couleurs, senteurs ou modèles selon le produit.</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <span key={v} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sable pl-3.5 pr-1.5 text-sm">
                  {v}
                  <button type="button" aria-label={`Retirer ${v}`} onClick={() => setVariants(variants.filter((x) => x !== v))} className="grid size-6 place-items-center rounded-full hover:bg-white">
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <label htmlFor="var" className="sr-only">Nouvelle variante</label>
              <input id="var" className="field" placeholder="Ex. M, Chocolat, Vanille" value={vInput} onChange={(e) => setVInput(e.target.value)} />
              <Button
                type="button"
                variant="soft"
                onClick={() => {
                  if (vInput.trim() && !variants.includes(vInput.trim())) setVariants([...variants, vInput.trim()]);
                  setVInput("");
                }}
              >
                Ajouter
              </Button>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Classement">
            <p className="mb-2 text-[13px] font-medium text-soft">Univers</p>
            <Segmented<UniversKey>
              label="Univers"
              value={u}
              onChange={(v) => {
                setU(v);
                setSub(univers.find((x) => x.key === v)!.subcategories[0].slug);
                setStatus(v === "studio" ? "sur_commande" : "en_stock");
              }}
              options={univers.map((x) => ({ value: x.key, label: x.label }))}
            />
            <div className="relative mt-4">
              <Field label="Sous-catégorie" htmlFor="sub">
                <select id="sub" className="field appearance-none pr-10" value={sub} onChange={(e) => setSub(e.target.value)}>
                  {uni.subcategories.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                </select>
              </Field>
              <ChevronDown className="pointer-events-none absolute right-4 top-[38px] size-4 text-brun" />
            </div>
          </Panel>
          <Panel title="Statut et délais">
            <ChipGroup<ProductStatus>
              label="Statut"
              value={status}
              onChange={setStatus}
              options={(Object.keys(productStatusMeta) as ProductStatus[]).map((k) => ({ value: k, label: productStatusMeta[k].label }))}
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Confection (jours)" htmlFor="mk"><input id="mk" type="number" min={0} className="field" defaultValue={existing?.makingDays} disabled={!made} /></Field>
              <Field label="Livraison (jours)" htmlFor="dl"><input id="dl" type="number" min={0} className="field" defaultValue={existing?.deliveryDays} /></Field>
            </div>
            {!made && <p className="mt-3 text-xs text-muted">Un produit en stock n'est jamais présenté comme nécessitant une confection.</p>}
            {made && (
              <div className="mt-4">
                <Field label="Consommation de tissu (m)" htmlFor="fab" hint="Sert à réserver la matière à chaque commande">
                  <input id="fab" type="number" min={0} step={0.1} className="field" />
                </Field>
              </div>
            )}
          </Panel>
          <Panel title="Coûts (pour la marge estimée)">
            <Field label="Coût d'achat ou de production (GNF)" htmlFor="cost"><input id="cost" type="number" min={0} className="field" /></Field>
          </Panel>
          <Button type="submit" size="lg" className="w-full">{saved ? "Enregistré" : "Enregistrer le produit"}</Button>
        </div>
      </form>
    </>
  );
}

export default function NewProductPage() {
  return (
    <Suspense>
      <ProductForm />
    </Suspense>
  );
}
