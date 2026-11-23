"use client";

import { LayoutGroup, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/admin/kit";
import { productionJobs, productionStages, type ProductionJob } from "@/lib/data/admin";
import { dateFr } from "@/lib/format";

export default function ProductionPage() {
  const [jobs, setJobs] = useState<ProductionJob[]>(productionJobs);
  const advance = (id: string) =>
    setJobs((js) =>
      js.map((j) => {
        if (j.id !== id) return j;
        const i = productionStages.findIndex((s) => s.key === j.stage);
        return { ...j, stage: productionStages[Math.min(i + 1, productionStages.length - 1)].key };
      }),
    );

  return (
    <>
      <PageHeader title="Confection" subtitle="Suivi des pièces sur commande, de la découpe à la finition" />
      <LayoutGroup>
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
          {productionStages.map((st) => {
            const col = jobs.filter((j) => j.stage === st.key);
            return (
              <section key={st.key} className="w-72 shrink-0 rounded-3xl bg-ecru p-3">
                <div className="mb-3 flex items-center justify-between px-2 pt-1">
                  <h2 className="text-sm font-semibold">{st.label}</h2>
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white px-2 text-xs font-semibold">{col.length}</span>
                </div>
                <div className="space-y-2.5">
                  {col.map((j) => (
                    <motion.article
                      layout
                      layoutId={j.id}
                      key={j.id}
                      transition={{ type: "spring", stiffness: 400, damping: 36 }}
                      className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgb(72_40_10/0.08)]"
                    >
                      <p className="font-medium">{j.product}</p>
                      <p className="text-xs text-muted">{j.variant} · {j.customer}</p>
                      <Link href={`/admin/commandes/${j.orderRef}`} className="mt-2 block text-xs font-semibold text-brun hover:underline">{j.orderRef}</Link>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted">Pour le {dateFr(j.dueDate)}</span>
                        {st.key !== "terminee" && (
                          <button onClick={() => advance(j.id)} className="press inline-flex h-8 items-center gap-1 rounded-full bg-brun/[0.07] px-3 text-xs font-semibold text-brun hover:bg-brun/[0.12]">
                            Étape suivante <ChevronRight className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.article>
                  ))}
                  {col.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted">Aucune pièce</p>}
                </div>
              </section>
            );
          })}
        </div>
      </LayoutGroup>
    </>
  );
}
