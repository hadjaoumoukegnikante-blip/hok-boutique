import { ArrowDown, ArrowUp, Check, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/admin/kit";
import { Button } from "@/components/ui";
import { saveSubcategoryAction } from "@/app/admin/actions/ops";
import { getCatalogMeta } from "@/lib/admin-data";
import { requireStaff } from "@/lib/supabase/staff";

const btn = "press grid size-8 shrink-0 place-items-center rounded-full hover:bg-white disabled:opacity-30";

export default async function CategoriesPage() {
  await requireStaff(["admin", "superviseur"]);
  const { univers } = await getCatalogMeta();

  return (
    <>
      <PageHeader title="Catégories" subtitle="Ajouter, renommer, réordonner ou masquer. Une sous-catégorie masquée disparaît du menu de la boutique." />
      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-3">
        {univers.map((u) => {
          const subs = u.subcategories as (typeof u.subcategories[number] & { id: string })[];
          return (
            <Panel key={u.key} title={`${u.brand} · ${u.label}`}>
              <ul className="space-y-1.5">
                {subs.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-1 rounded-2xl bg-ecru px-3 py-1.5">
                    <form action={saveSubcategoryAction} className="flex min-w-0 flex-1 items-center gap-1">
                      <input type="hidden" name="op" value="rename" />
                      <input type="hidden" name="id" value={s.id} />
                      <input name="label" aria-label="Nom de la sous-catégorie" defaultValue={s.label} className={`min-w-0 flex-1 bg-transparent text-sm focus:outline-none ${s.active ? "" : "text-muted line-through"}`} />
                      <button type="submit" aria-label={`Renommer ${s.label}`} className={btn}><Check className="size-3.5" /></button>
                    </form>
                    {/* Échange de position avec la voisine : deux mises à jour */}
                    <form action={saveSubcategoryAction}>
                      <input type="hidden" name="op" value="move" />
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="position" value={i - 1} />
                      <button type="submit" aria-label="Monter" disabled={i === 0} className={btn}><ArrowUp className="size-3.5" /></button>
                    </form>
                    <form action={saveSubcategoryAction}>
                      <input type="hidden" name="op" value="move" />
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="position" value={i + 1} />
                      <button type="submit" aria-label="Descendre" disabled={i === subs.length - 1} className={btn}><ArrowDown className="size-3.5" /></button>
                    </form>
                    <form action={saveSubcategoryAction}>
                      <input type="hidden" name="op" value="toggle" />
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="active" value={String(!s.active)} />
                      <button type="submit" className="press h-8 shrink-0 rounded-full px-2.5 text-xs font-semibold text-brun hover:bg-white">{s.active ? "Masquer" : "Afficher"}</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={saveSubcategoryAction} className="mt-3 flex gap-2">
                <input type="hidden" name="op" value="add" />
                <input type="hidden" name="univers" value={u.key} />
                <input type="hidden" name="position" value={subs.length} />
                <label className="sr-only" htmlFor={`new-${u.key}`}>Nouvelle sous-catégorie</label>
                <input id={`new-${u.key}`} name="label" required className="field h-10" placeholder="Nouvelle sous-catégorie" />
                <Button type="submit" size="sm" variant="soft" aria-label="Ajouter"><Plus className="size-4" /></Button>
              </form>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
