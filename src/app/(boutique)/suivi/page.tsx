"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { OrderView } from "@/components/shop/OrderView";
import { Button, Container, Field } from "@/components/ui";
import type { Order } from "@/lib/types";
import { useFindOrder } from "@/lib/useOrder";

function Tracking() {
  const params = useSearchParams();
  const find = useFindOrder();
  const [ref, setRef] = useState(params.get("ref") ?? "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const o = find(ref, phone);
    if (!o) {
      setOrder(null);
      setErr("Aucune commande ne correspond à cette référence et ce numéro.");
    } else {
      setErr("");
      setOrder(o);
    }
  };

  return (
    <Container className="max-w-2xl pt-12 md:pt-16">
      <h1 className="title-serif text-[44px] md:text-[56px]">Suivre ma commande</h1>
      <p className="mt-2 text-muted">Sans compte : la référence et le téléphone utilisés suffisent.</p>

      <form onSubmit={submit} className="mt-7 grid gap-3 sm:grid-cols-[1.3fr_1fr_auto] sm:items-end">
        <Field label="Référence" htmlFor="ref">
          <input id="ref" className="field uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal" placeholder="HOK-AAAAMMJJ-XXXX" value={ref} onChange={(e) => setRef(e.target.value)} required />
        </Field>
        <Field label="Téléphone" htmlFor="phone">
          <input id="phone" className="field" inputMode="tel" placeholder="6XX XX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </Field>
        <Button type="submit" size="md" className="h-12">Suivre</Button>
      </form>
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}
      <p className="mt-3 text-xs text-muted">Démo : HOK-20261119-0001 avec 620000001.</p>

      <AnimatePresence mode="wait">
        {order && (
          <motion.div key={order.ref} className="mt-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <OrderView order={order} />
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}

export default function TrackingPage() {
  return (
    <Suspense>
      <Tracking />
    </Suspense>
  );
}
