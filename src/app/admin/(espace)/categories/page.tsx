"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader, Panel, Toggle } from "@/components/admin/kit";
import { Button } from "@/components/ui";
import { univers as initial } from "@/lib/data/catalogue";
import type { Univers } from "@/lib/types";

export default function CategoriesPage() {
  const [data, setData] = useState<Univers[]>(initial);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const update = (key: string, fn: (u: Univers) => Univers) => setData((d) => d.map((u) => (u.key === key ? fn(u) : u)));
  const move = (key: string, i: number, dir: -1 | 1) =>
    update(key, (u) => {
      const s = [...u.subcategories];
      const j = i + dir;
      if (j < 0 || j >= s.length) return u;
      [s[i], s[j]] = [s[j], s[i]];
      return { ...u, subcategories: s };
    });

  return (
    <>
      <PageHeader title="Catégories" subtitle="Ajouter, renommer, réordonner ou désactiver. Prévu pour accueillir sacs, chaussures et autres." />
      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-3">
        {data.map((u) => (
          <Panel key={u.key} title={`${u.brand} · ${u.label}`}>
            <ul className="space-y-1.5">
              {u.subcategories.map((s, i) => (
                <li key={s.slug} className="flex items-center gap-2 rounded-2xl bg-ecru px-3 py-2">
                  <input
                    aria-label="Nom de la sous-catégorie"
                    value={s.label}
                    onChange={(e) => update(u.key, (x) => ({ ...x, subcategories: x.subcategories.map((y) => (y.slug === s.slug ? { ...y, label: e.target.value } : y)) }))}
                    className={`min-w-0 flex-1 bg-transparent text-sm focus:outline-none ${s.active ? "" : "text-muted line-through"}`}
                  />
                  <button aria-label="Monter" onClick={() => move(u.key, i, -1)} className="grid size-8 place-items-center rounded-full hover:bg-white"><ArrowUp className="size-3.5" /></button>
                  <button aria-label="Descendre" onClick={() => move(u.key, i, 1)} className="grid size-8 place-items-center rounded-full hover:bg-white"><ArrowDown className="size-3.5" /></button>
                  <Toggle
                    label={`Activer ${s.label}`}
                    checked={s.active}
                    onChange={(v) => update(u.key, (x) => ({ ...x, subcategories: x.subcategories.map((y) => (y.slug === s.slug ? { ...y, active: v } : y)) }))}
                  />
                </li>
              ))}
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const label = (draft[u.key] ?? "").trim();
                if (!label) return;
                const slug = label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
                update(u.key, (x) => ({ ...x, subcategories: [...x.subcategories, { slug, label, active: true }] }));
                setDraft({ ...draft, [u.key]: "" });
              }}
            >
              <label className="sr-only" htmlFor={`new-${u.key}`}>Nouvelle sous-catégorie</label>
              <input id={`new-${u.key}`} className="field h-10" placeholder="Nouvelle sous-catégorie" value={draft[u.key] ?? ""} onChange={(e) => setDraft({ ...draft, [u.key]: e.target.value })} />
              <Button type="submit" size="sm" variant="soft" aria-label="Ajouter"><Plus className="size-4" /></Button>
            </form>
          </Panel>
        ))}
      </div>
      <Button variant="outline" className="mt-5"><Plus className="size-4" /> Nouvel univers (sacs, chaussures…)</Button>
    </>
  );
}
