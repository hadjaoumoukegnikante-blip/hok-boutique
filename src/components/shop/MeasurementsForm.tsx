"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Ruler } from "lucide-react";
import Link from "next/link";
import { Segmented } from "@/components/ui";
import { cn } from "@/lib/format";
import type { Measurements } from "@/lib/types";

export type MeasureMode = "site" | "whatsapp";

export const emptyMeasurements: Measurements = { poitrine: "", taille: "", hanches: "", longueur: "", hauteur: "", note: "" };

const required: { key: keyof Measurements; label: string; hint: string }[] = [
  { key: "poitrine", label: "Tour de poitrine", hint: "Au plus fort de la poitrine" },
  { key: "taille", label: "Tour de taille", hint: "Au plus fin de la taille" },
  { key: "hanches", label: "Tour de hanches", hint: "Au plus fort des hanches" },
  { key: "longueur", label: "Longueur souhaitée", hint: "De l'épaule au bas de la robe" },
];

export function measurementsValid(m: Measurements) {
  return required.every(({ key }) => {
    const v = Number(String(m[key] ?? "").replace(",", "."));
    return v >= 30 && v <= 250;
  });
}

export function MeasurementsForm({
  mode,
  onMode,
  value,
  onChange,
  showErrors,
}: {
  mode: MeasureMode;
  onMode: (m: MeasureMode) => void;
  value: Measurements;
  onChange: (m: Measurements) => void;
  showErrors: boolean;
}) {
  const set = (k: keyof Measurements, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="rounded-3xl bg-ecru p-4 md:p-5">
      <div className="flex items-start gap-3">
        <Ruler className="mt-0.5 size-5 shrink-0 text-brun" strokeWidth={1.5} aria-hidden />
        <div>
          <p className="text-[15px] font-semibold">Vos mesures</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
            Chaque robe est confectionnée sur mesure. La taille sert de repère, vos mesures font la coupe.{" "}
            <Link href="/infos/guide-des-tailles" className="text-brun underline">Comment se mesurer</Link>
          </p>
        </div>
      </div>
      <Segmented<MeasureMode>
        className="mt-4"
        label="Envoi des mesures"
        value={mode}
        onChange={onMode}
        options={[
          { value: "site", label: "Sur le site" },
          { value: "whatsapp", label: "Par WhatsApp" },
        ]}
      />
      <AnimatePresence mode="wait" initial={false}>
        {mode === "site" ? (
          <motion.div key="site" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {required.map(({ key, label, hint }) => {
                const v = String(value[key] ?? "");
                const n = Number(v.replace(",", "."));
                const bad = showErrors && !(n >= 30 && n <= 250);
                return (
                  <div key={key}>
                    <label htmlFor={`m-${key}`} className="mb-1 block text-[13px] font-medium text-soft">{label}</label>
                    <div className="relative">
                      <input
                        id={`m-${key}`}
                        inputMode="decimal"
                        value={v}
                        onChange={(e) => set(key, e.target.value)}
                        aria-invalid={bad}
                        aria-describedby={`m-${key}-h`}
                        className={cn("field bg-white pr-10", bad && "border-danger focus:border-danger focus:ring-danger/10")}
                      />
                      <span className="pointer-events-none absolute right-3.5 top-3.5 text-sm text-muted">cm</span>
                    </div>
                    <p id={`m-${key}-h`} className={cn("mt-1 text-[11px]", bad ? "text-danger" : "text-muted")}>{bad ? "Mesure requise (en cm)" : hint}</p>
                  </div>
                );
              })}
              <div>
                <label htmlFor="m-hauteur" className="mb-1 block text-[13px] font-medium text-soft">Votre hauteur</label>
                <div className="relative">
                  <input id="m-hauteur" inputMode="decimal" value={value.hauteur ?? ""} onChange={(e) => set("hauteur", e.target.value)} className="field bg-white pr-10" />
                  <span className="pointer-events-none absolute right-3.5 top-3.5 text-sm text-muted">cm</span>
                </div>
                <p className="mt-1 text-[11px] text-muted">Facultatif</p>
              </div>
              <div>
                <label htmlFor="m-note" className="mb-1 block text-[13px] font-medium text-soft">Précision</label>
                <input id="m-note" value={value.note ?? ""} onChange={(e) => set("note", e.target.value)} placeholder="Facultatif" className="field bg-white" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.p key="wa" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="mt-4 text-[13px] leading-relaxed text-soft">
            Après la commande, un bouton vous permettra d'envoyer vos mesures sur WhatsApp avec la référence de commande. La confection démarre à réception des mesures et de l'acompte.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
