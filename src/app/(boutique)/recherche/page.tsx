"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { Container } from "@/components/ui";
import { searchProducts } from "@/lib/api";

function Results() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const results = searchProducts(q);

  return (
    <Container className="pt-12 md:pt-16">
      <h1 className="title-serif text-[44px] md:text-[56px]">Recherche</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.replace(`/recherche?q=${encodeURIComponent(q)}`, { scroll: false });
        }}
        className="mt-5 flex max-w-xl items-center gap-3 rounded-full bg-sable px-5"
      >
        <Search className="size-5 text-brun" strokeWidth={1.6} aria-hidden />
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Robe, bracelet, bougie…" className="h-14 flex-1 bg-transparent text-base focus:outline-none" />
      </form>
      {q && <p className="mt-6 text-sm text-muted">{results.length} résultat{results.length > 1 ? "s" : ""} pour « {q} »</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {results.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </Container>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <Results />
    </Suspense>
  );
}
