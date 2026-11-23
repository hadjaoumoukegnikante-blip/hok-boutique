"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Segmented } from "@/components/ui";
import type { Product, UniversKey } from "@/lib/types";
import { ProductCard } from "./ProductCard";

type F = "tous" | UniversKey;

export function NewArrivals({ products }: { products: Product[] }) {
  const [f, setF] = useState<F>("tous");
  const list = f === "tous" ? products : products.filter((p) => p.univers === f);
  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <h2 className="title-serif text-[40px] md:text-[44px]">Nouveautés</h2>
        <Segmented<F>
          label="Filtrer par univers"
          value={f}
          onChange={setF}
          className="w-full sm:w-auto"
          options={[
            { value: "tous", label: "Tout" },
            { value: "studio", label: "Vêtements" },
            { value: "bijoux", label: "Bijoux" },
            { value: "maison", label: "Home" },
          ]}
        />
      </div>
      <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
