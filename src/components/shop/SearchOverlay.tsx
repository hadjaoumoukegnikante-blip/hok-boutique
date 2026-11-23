"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProductVisual } from "@/components/ui";
import { getUniversSync, searchProducts } from "@/lib/api";
import { gnf } from "@/lib/format";
import { useUi } from "@/store/cart";

const suggestions = ["Robe", "Bracelet", "Bougie", "Collier", "Vase"];

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useUi();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const results = searchProducts(q).slice(0, 6);

  useEffect(() => {
    if (!searchOpen) return;
    setTimeout(() => input.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSearch();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen, closeSearch]);

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label="Recherche"
        >
          <motion.div
            className="mx-auto max-w-2xl px-5 pt-6 md:pt-16"
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                closeSearch();
                router.push(`/recherche?q=${encodeURIComponent(q)}`);
              }}
              className="flex items-center gap-3 border-b border-brun/20 pb-3"
            >
              <Search className="size-6 text-brun" strokeWidth={1.6} aria-hidden />
              <label htmlFor="search-input" className="sr-only">Rechercher un produit</label>
              <input
                id="search-input"
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un produit"
                className="flex-1 bg-transparent font-serif text-3xl text-encre placeholder:text-muted/50 focus:outline-none md:text-4xl"
                autoComplete="off"
              />
              <button type="button" aria-label="Fermer la recherche" onClick={closeSearch} className="press grid size-11 place-items-center rounded-full hover:bg-brun/[0.06]">
                <X className="size-5" strokeWidth={1.6} />
              </button>
            </form>

            {!q && (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Suggestions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => setQ(s)} className="press h-10 rounded-full bg-sable px-4 text-sm font-medium hover:bg-beige-clair">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {q && (
              <ul className="mt-6 space-y-1">
                {results.length === 0 && <li className="py-6 text-center text-muted">Aucun résultat pour « {q} ».</li>}
                {results.map((p, i) => (
                  <motion.li key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link
                      href={`/produit/${p.slug}`}
                      onClick={closeSearch}
                      className="flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-ecru"
                    >
                      <ProductVisual univers={p.univers} src={p.images[0]} alt={p.name} label="" className="size-14 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-sm text-muted">{getUniversSync(p.univers).brand}</p>
                      </div>
                      <p className="text-sm font-medium tabular-nums">{gnf(p.price)}</p>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
