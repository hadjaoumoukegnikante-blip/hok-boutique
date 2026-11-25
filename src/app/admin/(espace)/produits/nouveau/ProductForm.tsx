"use client";

import { ChevronLeft, ImagePlus, Loader2, Plus, Star, Trash, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Panel } from "@/components/admin/kit";
import { Button, ChipGroup, Field, Segmented } from "@/components/ui";
import { saveProductAction } from "@/app/admin/actions/ops";
import { imageUrl } from "@/lib/db";
import { productStatusMeta } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Product, ProductStatus, UniversKey, VariantGroup, VariantKind } from "@/lib/types";
import { useUi } from "@/store/cart";

type Uni = { key: UniversKey; label: string; subs: { id: string; label: string; active: boolean }[] };

const kinds: { value: VariantKind; label: string }[] = [
  { value: "taille", label: "Taille" },
  { value: "couleur", label: "Couleur" },
  { value: "senteur", label: "Senteur" },
  { value: "modele", label: "Modèle" },
];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Chemin dans le bucket à partir de l'URL publique (ou du chemin brut). */
const toPath = (u: string) => (u.includes("/product-images/") ? u.split("/product-images/")[1] : u);

export default function ProductForm({ existing, univers, materials }: { existing: (Product & { cost: number | null }) | null; univers: Uni[]; materials: { id: string; name: string }[] }) {
  const router = useRouter();
  const notify = useUi((s) => s.notify);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [u, setU] = useState<UniversKey>(existing?.univers ?? "studio");
  const [status, setStatus] = useState<ProductStatus>(existing?.status ?? "sur_commande");
  const [sub, setSub] = useState<string>(existing?.subcategoryId ?? univers.find((x) => x.key === (existing?.univers ?? "studio"))?.subs[0]?.id ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [ref, setRef] = useState(existing?.ref ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [price, setPrice] = useState(existing?.price ?? 0);
  const [pricePending, setPricePending] = useState(existing?.pricePending ?? false);
  const [desc, setDesc] = useState(existing?.description ?? "");
  const [stock, setStock] = useState(existing?.stock ?? 0);
  const [making, setMaking] = useState<number | "">(existing?.makingDays ?? "");
  const [delivery, setDelivery] = useState<number | "">(existing?.deliveryDays ?? "");
  const [isNew, setIsNew] = useState(existing?.isNew ?? true);
  const [active, setActive] = useState(existing?.active ?? true);
  const [cost, setCost] = useState<number | "">(existing?.cost ?? "");
  const [images, setImages] = useState<string[]>((existing?.images ?? []).map(toPath));
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<VariantGroup[]>(existing?.variants ?? []);
  const [drafts, setDrafts] = useState<Record<number, { label: string; hex: string }>>({});
  const [fabric, setFabric] = useState({
    materialId: existing?.fabric?.materialId ?? "",
    meters: existing?.fabric?.meters ?? 0,
    color: existing?.fabric?.color ?? "",
    hex: existing?.fabric?.hex ?? "#D8C3A9",
    pattern: existing?.fabric?.pattern ?? "uni",
  });

  const uni = univers.find((x) => x.key === u)!;
  const made = status === "sur_commande";

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const db = supabaseBrowser();
    const added: string[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 5 * 1024 * 1024) { notify("Photo trop lourde", `${f.name} dépasse 5 Mo`); continue; }
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${u}/${crypto.randomUUID()}.${ext}`;
      const { error } = await db.storage.from("product-images").upload(path, f, { contentType: f.type, upsert: false });
      if (error) notify("Envoi impossible", error.message);
      else added.push(path);
    }
    setImages((cur) => [...cur, ...added]);
    setUploading(false);
  }

  function addOption(gi: number) {
    const d = drafts[gi];
    const label = d?.label.trim();
    if (!label) return;
    setVariants((vs) =>
      vs.map((g, i) =>
        i !== gi || g.options.some((o) => o.label === label)
          ? g
          : { ...g, options: [...g.options, { value: slugify(label), label, ...(g.kind === "couleur" ? { hex: d.hex || "#D8C3A9" } : {}) }] },
      ),
    );
    setDrafts((ds) => ({ ...ds, [gi]: { label: "", hex: d?.hex ?? "#D8C3A9" } }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveProductAction({
        id: existing?.id,
        ref: ref.trim().toUpperCase(),
        slug: slug.trim() || slugify(name),
        name: name.trim(),
        description: desc,
        price: Number(price) || 0,
        price_pending: pricePending,
        univers: u,
        subcategory_id: sub || null,
        status,
        stock: made ? 0 : Number(stock) || 0,
        making_days: made && making !== "" ? Number(making) : null,
        delivery_days: delivery !== "" ? Number(delivery) : null,
        is_new: isNew,
        active,
        variants: variants.filter((g) => g.options.length > 0),
        fabric_material_id: made && fabric.materialId ? fabric.materialId : null,
        fabric_meters: made && fabric.materialId ? Number(fabric.meters) : null,
        fabric_color: made && fabric.materialId ? fabric.color || null : null,
        fabric_hex: made && fabric.materialId ? fabric.hex || null : null,
        fabric_pattern: made && fabric.materialId ? fabric.pattern : null,
        images,
        cost: cost === "" ? null : Number(cost),
      });
      if (!res.ok) { setError(res.error ?? "Enregistrement impossible."); return; }
      notify("Produit enregistré", name);
      router.push("/admin/produits");
      router.refresh();
    });
  }

  return (
    <>
      <Link href="/admin/produits" className="inline-flex items-center gap-1 text-sm text-brun hover:underline">
        <ChevronLeft className="size-4" /> Produits
      </Link>
      <h1 className="title-serif mb-6 mt-2 text-[36px] md:text-[44px]">{existing ? existing.name : "Nouveau produit"}</h1>

      <form className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.5fr_1fr]" onSubmit={submit}>
        <div className="space-y-5">
          <Panel title="Informations">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom" htmlFor="name"><input id="name" className="field" value={name} onChange={(e) => { setName(e.target.value); if (!existing) setSlug(slugify(e.target.value)); }} required /></Field>
              <Field label="Référence unique" htmlFor="ref" hint="Ex. HOK-ST-008"><input id="ref" className="field uppercase" value={ref} onChange={(e) => setRef(e.target.value)} required /></Field>
              <Field label="Prix (GNF)" htmlFor="price"><input id="price" className="field" type="number" min={0} step={1000} value={price} onChange={(e) => setPrice(Number(e.target.value))} required /></Field>
              <Field label="Adresse de la page" htmlFor="slug" hint="Lettres, chiffres et tirets"><input id="slug" className="field" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required /></Field>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-soft"><input type="checkbox" checked={pricePending} onChange={(e) => setPricePending(e.target.checked)} className="size-4 accent-[#683C11]" /> Prix à confirmer (affiché comme tel sur le site)</label>
            <div className="mt-4">
              <Field label="Description" htmlFor="desc"><textarea id="desc" rows={4} className="field h-auto py-3" value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
            </div>
          </Panel>

          <Panel title="Photos">
            {images.length > 0 && (
              <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((p, i) => (
                  <li key={p} className="group relative aspect-square overflow-hidden rounded-2xl bg-ecru">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl(p)} alt="" className="size-full object-cover" />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-brun">Couverture</span>}
                    <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
                      {i > 0 && (
                        <button type="button" aria-label="Mettre en couverture" onClick={() => setImages([p, ...images.filter((x) => x !== p)])} className="grid size-7 place-items-center rounded-full bg-white/90 text-brun"><Star className="size-3.5" /></button>
                      )}
                      <button type="button" aria-label="Retirer la photo" onClick={() => setImages(images.filter((x) => x !== p))} className="grid size-7 place-items-center rounded-full bg-white/90 text-bordeaux"><Trash className="size-3.5" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <label className="press flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-brun/20 bg-ecru px-5 py-8 text-center text-sm text-soft hover:border-brun/40">
              {uploading ? <Loader2 className="size-7 animate-spin text-brun" /> : <ImagePlus className="size-7 text-brun" strokeWidth={1.4} />}
              {uploading ? "Envoi en cours" : "Cliquer pour ajouter des photos"}
              <span className="text-xs text-muted">JPG, PNG ou WebP, 5 Mo maximum. Fond clair, même cadrage pour toutes les fiches.</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploading} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
            </label>
          </Panel>

          <Panel title="Variantes" action={
            <Button type="button" size="sm" variant="soft" onClick={() => setVariants([...variants, { kind: "taille", label: "Taille", options: [] }])}><Plus className="size-4" /> Groupe</Button>
          }>
            <p className="mb-3 text-sm text-muted">Tailles, couleurs, senteurs ou modèles. Le client choisit une option par groupe.</p>
            <div className="space-y-4">
              {variants.map((g, gi) => (
                <div key={gi} className="rounded-2xl bg-ecru p-3">
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`k-${gi}`}>Type</label>
                    <select id={`k-${gi}`} className="field h-10 w-36" value={g.kind} onChange={(e) => {
                      const kind = e.target.value as VariantKind;
                      setVariants(variants.map((x, i) => (i === gi ? { ...x, kind, label: kinds.find((k) => k.value === kind)!.label } : x)));
                    }}>
                      {kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                    </select>
                    <button type="button" aria-label="Supprimer le groupe" onClick={() => setVariants(variants.filter((_, i) => i !== gi))} className="ml-auto grid size-9 place-items-center rounded-full text-bordeaux hover:bg-white"><Trash className="size-4" /></button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {g.options.map((o) => (
                      <span key={o.value} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white pl-3 pr-1.5 text-sm">
                        {o.hex && <span className="size-3.5 rounded-full border border-brun/15" style={{ background: o.hex }} />}
                        {o.label}
                        <button type="button" aria-label={`Retirer ${o.label}`} onClick={() => setVariants(variants.map((x, i) => (i === gi ? { ...x, options: x.options.filter((y) => y.value !== o.value) } : x)))} className="grid size-6 place-items-center rounded-full hover:bg-sable"><X className="size-3.5" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <label htmlFor={`o-${gi}`} className="sr-only">Nouvelle option</label>
                    <input id={`o-${gi}`} className="field h-10" placeholder={g.kind === "taille" ? "Ex. M" : g.kind === "couleur" ? "Ex. Chocolat" : "Ex. Vanille"} value={drafts[gi]?.label ?? ""}
                      onChange={(e) => setDrafts({ ...drafts, [gi]: { label: e.target.value, hex: drafts[gi]?.hex ?? "#D8C3A9" } })}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(gi); } }} />
                    {g.kind === "couleur" && (
                      <input type="color" aria-label="Teinte" className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-brun/15 bg-white" value={drafts[gi]?.hex ?? "#D8C3A9"} onChange={(e) => setDrafts({ ...drafts, [gi]: { label: drafts[gi]?.label ?? "", hex: e.target.value } })} />
                    )}
                    <Button type="button" variant="soft" onClick={() => addOption(gi)}>Ajouter</Button>
                  </div>
                </div>
              ))}
              {variants.length === 0 && <p className="text-sm text-muted">Aucune variante.</p>}
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
                setSub(univers.find((x) => x.key === v)?.subs[0]?.id ?? "");
                setStatus(v === "studio" ? "sur_commande" : "en_stock");
              }}
              options={univers.map((x) => ({ value: x.key, label: x.label }))}
            />
            <div className="mt-4">
              <Field label="Sous-catégorie" htmlFor="sub">
                <select id="sub" className="field" value={sub} onChange={(e) => setSub(e.target.value)}>
                  {uni.subs.map((s) => <option key={s.id} value={s.id}>{s.label}{s.active ? "" : " (masquée)"}</option>)}
                </select>
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-soft"><input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="size-4 accent-[#683C11]" /> Afficher dans les nouveautés</label>
            <label className="mt-2 flex items-center gap-2 text-sm text-soft"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-[#683C11]" /> En ligne sur la boutique</label>
          </Panel>

          <Panel title="Statut et délais">
            <ChipGroup<ProductStatus>
              label="Statut"
              value={status}
              onChange={setStatus}
              options={(Object.keys(productStatusMeta) as ProductStatus[]).map((k) => ({ value: k, label: productStatusMeta[k].label }))}
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {made ? (
                <Field label="Confection (jours)" htmlFor="mk"><input id="mk" type="number" min={0} className="field" value={making} onChange={(e) => setMaking(e.target.value === "" ? "" : Number(e.target.value))} /></Field>
              ) : (
                <Field label={existing ? "Stock (page Stocks)" : "Stock initial"} htmlFor="stock">
                  <input id="stock" className="field" type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} disabled={!!existing} />
                </Field>
              )}
              <Field label="Livraison (jours)" htmlFor="dl"><input id="dl" type="number" min={0} className="field" value={delivery} onChange={(e) => setDelivery(e.target.value === "" ? "" : Number(e.target.value))} /></Field>
            </div>
            {!made && existing && <p className="mt-3 text-xs text-muted">Le stock se corrige dans la page Stocks, pour garder la trace des mouvements.</p>}
          </Panel>

          {made && (
            <Panel title="Tissu du modèle">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Matière" htmlFor="mat" hint="Réservée à chaque commande, consommée à la découpe">
                    <select id="mat" className="field" value={fabric.materialId} onChange={(e) => setFabric({ ...fabric, materialId: e.target.value })}>
                      <option value="">Aucune</option>
                      {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </Field>
                </div>
                {fabric.materialId && (
                  <>
                    <Field label="Métrage par pièce (m)" htmlFor="fm"><input id="fm" type="number" min={0} step={0.1} className="field" value={fabric.meters} onChange={(e) => setFabric({ ...fabric, meters: Number(e.target.value) })} required /></Field>
                    <Field label="Motif" htmlFor="fp">
                      <select id="fp" className="field" value={fabric.pattern} onChange={(e) => setFabric({ ...fabric, pattern: e.target.value as "uni" | "rayures" })}>
                        <option value="uni">Uni</option><option value="rayures">Rayures</option>
                      </select>
                    </Field>
                    <Field label="Couleur affichée" htmlFor="fc"><input id="fc" className="field" value={fabric.color} onChange={(e) => setFabric({ ...fabric, color: e.target.value })} placeholder="Ex. Vert sapin" /></Field>
                    <Field label="Teinte" htmlFor="fh"><input id="fh" type="color" className="h-12 w-full cursor-pointer rounded-2xl border border-brun/15 bg-white" value={fabric.hex} onChange={(e) => setFabric({ ...fabric, hex: e.target.value })} /></Field>
                  </>
                )}
              </div>
            </Panel>
          )}

          <Panel title="Coût (pour la marge, jamais affiché aux clients)">
            <Field label="Coût d'achat ou de production (GNF)" htmlFor="cost"><input id="cost" type="number" min={0} className="field" value={cost} onChange={(e) => setCost(e.target.value === "" ? "" : Number(e.target.value))} /></Field>
          </Panel>

          {error && <p role="alert" className="rounded-2xl bg-bordeaux/[0.07] px-4 py-3 text-sm text-bordeaux">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={pending || uploading}>
            {pending ? "Enregistrement…" : "Enregistrer le produit"}
          </Button>
        </div>
      </form>
    </>
  );
}
