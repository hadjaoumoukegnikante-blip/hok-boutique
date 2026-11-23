"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/format";
import type { Product, Univers } from "@/lib/types";
import { ProductCard } from "./ProductCard";

type Sort = "pertinence" | "prix-asc" | "prix-desc" | "nouveautes";

export function CatalogView({ univers, products }: { univers: Univers; products: Product[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sous = params.get("sous") ?? "";
  const [sort, setSort] = useState<Sort>("pertinence");
  const [dispo, setDispo] = useState(false);

  const setSous = (s: string) => {
    const q = new URLSearchParams(params.toString());
    if (s) q.set("sous", s);
    else q.delete("sous");
    router.replace(`${pathname}${q.toString() ? `?${q}` : ""}`, { scroll: false });
  };

  const list = useMemo(() => {
    let l = products.filter((p) => !sous || p.subcategory === sous);
    if (dispo) l = l.filter((p) => p.status !== "indisponible");
    if (sort === "prix-asc") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "prix-desc") l = [...l].sort((a, b) => b.price - a.price);
    if (sort === "nouveautes") l = [...l].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    return l;
  }, [products, sous, sort, dispo]);

  const chips = [{ slug: "", label: "Tout" }, ...univers.subcategories.filter((s) => s.active)];

  return (
    <>
      <div className="glass sticky top-16 z-30 -mx-5 border-b border-brun/[0.08] px-5 py-3 md:top-[68px] md:-mx-6 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="tablist" aria-label="Sous-catégories">
            {chips.map((c) => {
              const on = c.slug === sous;
              return (
                <button
                  key={c.slug || "tout"}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSous(c.slug)}
                  className={cn(
                    "press relative h-10 shrink-0 rounded-full px-4 text-sm font-medium",
                    on ? "text-white" : "text-soft hover:bg-brun/[0.06]",
                  )}
                >
                  {on && (
                    <motion.span layoutId="subcat-pill" className="absolute inset-0 rounded-full bg-brun" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                  )}
                  <span className="relative">{c.label}</span>
                </button>
              );
            })}
          </div>
          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <label className="flex items-center gap-2 text-sm text-soft">
              <input type="checkbox" checked={dispo} onChange={(e) => setDispo(e.target.checked)} className="size-4 accent-[#683C11]" />
              Disponibles
            </label>
            <SortSelect value={sort} onChange={setSort} />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between md:hidden">
          <label className="flex items-center gap-2 text-sm text-soft">
            <input type="checkbox" checked={dispo} onChange={(e) => setDispo(e.target.checked)} className="size-4 accent-[#683C11]" />
            Disponibles
          </label>
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">{list.length} article{list.length > 1 ? "s" : ""}</p>
      <motion.div layout className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {list.length === 0 && (
        <div className="rounded-3xl bg-ecru py-16 text-center">
          <p className="title-serif text-2xl">Bientôt disponible</p>
          <p className="mt-2 text-sm text-muted">Aucun article dans cette sélection pour le moment.</p>
        </div>
      )}
    </>
  );
}

function SortSelect({ value, onChange }: { value: Sort; onChange: (s: Sort) => void }) {
  return (
    <div className="relative">
      <label htmlFor="tri" className="sr-only">Trier</label>
      <select
        id="tri"
        value={value}
        onChange={(e) => onChange(e.target.value as Sort)}
        className="h-10 appearance-none rounded-full bg-sable pl-4 pr-9 text-sm font-medium text-encre focus:outline-none"
      >
        <option value="pertinence">Pertinence</option>
        <option value="nouveautes">Nouveautés</option>
        <option value="prix-asc">Prix croissant</option>
        <option value="prix-desc">Prix décroissant</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-brun" strokeWidth={1.8} />
    </div>
  );
}
