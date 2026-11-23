"use client";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductVisual } from "@/components/ui";
import { getUniversSync } from "@/lib/api";
import { isSoldOut } from "@/lib/availability";
import { cn, gnf, productStatusMeta, toneClass } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart, useUi } from "@/store/cart";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const u = getUniversSync(product.univers);
  const meta = productStatusMeta[product.status];
  const add = useCart((s) => s.add);
  const notify = useUi((s) => s.notify);
  const router = useRouter();
  const needsChoice = product.variants.length > 0 || product.status === "sur_commande";
  const unavailable = isSoldOut(product);

  const quickAdd = () => {
    if (needsChoice) return router.push(`/produit/${product.slug}`);
    add({ productId: product.id, qty: 1, selection: {} });
    notify("Ajouté au panier", product.name);
  };

  return (
    <article className="lift group relative overflow-hidden rounded-3xl border border-brun/[0.08] bg-white" data-priority={priority ? "" : undefined}>
      <Link href={`/produit/${product.slug}`} className="block" aria-label={`${product.name}, ${gnf(product.price)}`}>
        <ProductVisual univers={product.univers} src={product.images[0]} alt={product.name} className="aspect-[4/5] w-full">
          <span className={cn("absolute left-2.5 top-2.5 max-w-[calc(100%-20px)] truncate whitespace-nowrap rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md sm:left-3.5 sm:top-3.5 sm:px-3 sm:py-1.5 sm:text-xs", toneClass[meta.tone].split(" ")[1])}>
            {unavailable && product.status === "sur_commande" ? "Tissu épuisé" : meta.short}
          </span>
        </ProductVisual>
        <div className="px-3.5 pb-4 pt-3.5 sm:px-4 sm:pb-5 sm:pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brun">{u.brand}</p>
          <p className="mt-1 text-[15px] font-medium leading-snug sm:text-base">{product.name}</p>
          <p className="mt-1 text-[15px] text-soft tabular-nums">{gnf(product.price)}</p>
        </div>
      </Link>
      {!unavailable && (
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/5]">
          <button
            type="button"
            onClick={quickAdd}
            aria-label={needsChoice ? `Choisir les options de ${product.name}` : `Ajouter ${product.name} au panier`}
            className="press glass-strong pointer-events-auto absolute bottom-3.5 right-3.5 grid size-11 place-items-center rounded-full text-brun transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
          >
            {needsChoice ? <ArrowRight className="size-[18px]" strokeWidth={1.8} /> : <Plus className="size-[18px]" strokeWidth={1.8} />}
          </button>
        </div>
      )}
    </article>
  );
}
