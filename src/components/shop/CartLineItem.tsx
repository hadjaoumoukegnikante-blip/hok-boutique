"use client";

import { Trash } from "lucide-react";
import Link from "next/link";
import { Badge, ProductVisual, QtyStepper } from "@/components/ui";
import { useUniversOf } from "./ShopData";
import { gnf } from "@/lib/format";
import { measurementsLabel, variantLabel, type PricedLine } from "@/lib/pricing";
import { useCart } from "@/store/cart";

export function CartLineItem({ item, compact = false }: { item: PricedLine; compact?: boolean }) {
  const { setQty, remove } = useCart();
  const { product, line } = item;
  const u = useUniversOf()(product.univers);
  const label = variantLabel(product, line);
  const max = product.status === "en_stock" ? product.available ?? product.stock : undefined;

  return (
    <div className="flex gap-4">
      <Link href={`/produit/${product.slug}`} className="shrink-0">
        <ProductVisual univers={product.univers} src={product.images[0]} alt={product.name} label="" className={compact ? "h-24 w-20 rounded-2xl" : "h-28 w-24 rounded-2xl"} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brun">{u.brand}</p>
        <Link href={`/produit/${product.slug}`} className="mt-0.5 truncate text-[15px] font-semibold hover:text-brun">
          {product.name}
        </Link>
        {label && <p className="truncate text-[13px] text-muted">{label}</p>}
        {item.madeToOrder && measurementsLabel(line) && (
          <p className="mt-0.5 text-[12px] leading-snug text-soft">{measurementsLabel(line)}</p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {item.madeToOrder ? (
            <Badge tone="brun" className="px-2.5 py-0.5 text-[11px]">Sur commande · 50 %</Badge>
          ) : product.status === "precommande" ? (
            <Badge tone="bordeaux" className="px-2.5 py-0.5 text-[11px]">Précommande</Badge>
          ) : (
            <Badge tone="ok" className="px-2.5 py-0.5 text-[11px]">En stock</Badge>
          )}
          {item.overStock && (
            <Badge tone="danger" className="px-2.5 py-0.5 text-[11px]">
              {item.madeToOrder ? "Tissu insuffisant pour cette pièce" : `Seulement ${product.available ?? product.stock} disponible(s)`}
            </Badge>
          )}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pt-2">
          <p className="text-[15px] font-semibold tabular-nums">{gnf(item.lineTotal)}</p>
          <div className="flex items-center gap-1">
            {item.madeToOrder ? (
              <span className="px-2 text-[13px] text-muted">1 pièce</span>
            ) : (
              <QtyStepper size="sm" value={line.qty} max={max} onChange={(v) => setQty(line.key, v)} />
            )}
            <button
              type="button"
              aria-label={`Retirer ${product.name} du panier`}
              onClick={() => remove(line.key)}
              className="press grid size-9 place-items-center rounded-full text-muted hover:bg-brun/[0.06] hover:text-danger"
            >
              <Trash className="size-4" strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
