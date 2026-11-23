"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { delivery } from "@/lib/config";
import { gnf } from "@/lib/format";
import { validatePromo, type CartTotals } from "@/lib/pricing";
import type { UniversKey } from "@/lib/types";
import { useCart } from "@/store/cart";

export function AnimatedAmount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={`whitespace-nowrap ${className ?? ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="inline-block tabular-nums"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {gnf(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function PromoField({ totals }: { totals: CartTotals }) {
  const { promoCode, setPromo } = useCart();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const byU: Record<UniversKey, number> = { studio: 0, bijoux: 0, maison: 0 };
  totals.lines.forEach((l) => (byU[l.product.univers] += l.lineTotal));

  if (promoCode)
    return (
      <div className="flex items-center justify-between rounded-2xl bg-ok/[0.08] px-4 py-3 text-sm">
        <span>
          Code <b className="font-semibold">{promoCode}</b> appliqué
        </span>
        <button onClick={() => setPromo(null)} className="font-medium text-brun hover:underline">Retirer</button>
      </div>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const r = validatePromo(code, byU);
        if (r.ok) {
          setPromo(r.promo.code);
          setMsg(null);
        } else setMsg(r.message);
      }}
    >
      <div className="flex gap-2">
        <label htmlFor="promo" className="sr-only">Code promo</label>
        <input id="promo" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code promo" className="field flex-1 uppercase placeholder:normal-case" />
        <button type="submit" className="press h-12 rounded-[14px] bg-sable px-5 text-sm font-semibold text-brun hover:bg-beige-clair">Appliquer</button>
      </div>
      {msg && <p className="mt-2 text-xs text-danger">{msg}</p>}
    </form>
  );
}

export function TotalsBlock({ totals, showSplit = true }: { totals: CartTotals; showSplit?: boolean }) {
  return (
    <div className="text-[15px]">
      <Row label="Sous-total" value={totals.subtotal} />
      {totals.discount > 0 && <Row label="Réduction" value={-totals.discount} accent />}
      <Row label={`Livraison${delivery.provisional ? " (tarif provisoire)" : ""}`} value={totals.deliveryFee} />
      <div className="mt-2 flex justify-between border-t border-brun/10 pb-3 pt-3 text-[17px] font-semibold">
        <span>Total</span>
        <AnimatedAmount value={totals.total} />
      </div>
      {showSplit && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-brun p-3.5 text-white">
            <p className="text-xs opacity-85">À payer maintenant</p>
            <AnimatedAmount value={totals.dueNow} className="mt-1 block text-[15px] font-semibold sm:text-[17px]" />
          </div>
          <div className="rounded-2xl bg-sable p-3.5">
            <p className="text-xs text-muted">À la livraison</p>
            <AnimatedAmount value={totals.dueLater} className="mt-1 block text-[15px] font-semibold sm:text-[17px]" />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5">
      <span className="text-soft">{label}</span>
      <span className={accent ? "font-medium text-ok tabular-nums" : "tabular-nums"}>
        {value < 0 ? `− ${gnf(-value)}` : gnf(value)}
      </span>
    </div>
  );
}
