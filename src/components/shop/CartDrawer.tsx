"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";
import { ButtonLink, IconButton } from "@/components/ui";
import { allProducts } from "@/lib/api";
import { gnf } from "@/lib/format";
import { computeCart } from "@/lib/pricing";
import { useCart, useUi } from "@/store/cart";
import { CartLineItem } from "./CartLineItem";

export function CartDrawer() {
  const { cartOpen, closeCart } = useUi();
  const { lines, commune, mode } = useCart();
  const totals = computeCart(lines, allProducts(), { commune, mode });

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, closeCart]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-encre/25 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Panier"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-creme sm:inset-y-3 sm:right-3 sm:rounded-[28px] sm:shadow-2xl"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <p className="font-serif text-[28px]">Votre panier</p>
              <IconButton label="Fermer le panier" onClick={closeCart}>
                <X className="size-5" strokeWidth={1.6} />
              </IconButton>
            </div>

            {totals.lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-sable text-brun">
                  <ShoppingBag className="size-7" strokeWidth={1.4} />
                </div>
                <p className="mt-5 font-serif text-2xl">Votre panier est vide</p>
                <p className="mt-2 text-sm text-muted">Découvrez nos trois univers : mode, bijoux et maison.</p>
                <ButtonLink href="/vetements" className="mt-6" onClick={closeCart}>
                  Découvrir la collection
                </ButtonLink>
              </div>
            ) : (
              <>
                <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 pb-4">
                  {totals.lines.map((l) => (
                    <div key={l.line.key} className="rounded-3xl bg-white p-3">
                      <CartLineItem item={l} compact />
                    </div>
                  ))}
                </div>
                <div className="glass border-t border-brun/10 px-5 pb-6 pt-4 sm:rounded-b-[28px]">
                  <div className="flex justify-between text-[15px]">
                    <span className="text-soft">Sous-total</span>
                    <span className="font-semibold tabular-nums">{gnf(totals.subtotal)}</span>
                  </div>
                  {totals.subtotalMade > 0 && (
                    <p className="mt-1.5 text-xs text-muted">
                      Les vêtements sur commande demandent un acompte de 50 %. Livraison calculée à l'étape suivante.
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ButtonLink href="/panier" variant="soft" onClick={closeCart}>
                      Voir le panier
                    </ButtonLink>
                    <ButtonLink href="/commande" onClick={closeCart} aria-disabled={totals.hasStockIssue}>
                      Commander
                    </ButtonLink>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
