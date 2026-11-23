"use client";

import { useState } from "react";
import { PageHeader, Panel, Table, Td, Toggle } from "@/components/admin/kit";
import { Button, ChipGroup, Field, Segmented } from "@/components/ui";
import { demoPromos } from "@/lib/data/orders";
import { gnf } from "@/lib/format";
import type { Promo } from "@/lib/types";

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>(demoPromos);
  const [kind, setKind] = useState<Promo["kind"]>("pourcentage");
  const [scope, setScope] = useState("tous");

  return (
    <>
      <PageHeader title="Promotions" subtitle="Codes, remises automatiques, dates de validité, limites et règles de cumul" />
      <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.5fr_1fr]">
        <Table head={["Code", "Réduction", "Minimum", "Éligible", "Utilisations", "Cumul", "Actif"]}>
          {promos.map((p) => (
            <tr key={p.code} className="hover:bg-ecru/60">
              <Td className="font-semibold tracking-wide">{p.code}</Td>
              <Td>{p.kind === "pourcentage" ? `${p.value} %` : gnf(p.value)}</Td>
              <Td className="tabular-nums">{p.minPurchase ? gnf(p.minPurchase) : "·"}</Td>
              <Td>{p.univers?.length ? p.univers.join(", ") : "Tout"}</Td>
              <Td className="tabular-nums">{p.used}{p.maxUses ? ` / ${p.maxUses}` : ""}</Td>
              <Td>{p.cumulable ? "Oui" : "Non"}</Td>
              <Td><Toggle label={`Activer ${p.code}`} checked={p.active} onChange={(v) => setPromos(promos.map((x) => (x.code === p.code ? { ...x, active: v } : x)))} /></Td>
            </tr>
          ))}
        </Table>
        <Panel title="Nouvelle promotion">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const code = String(f.get("code") || "").toUpperCase().trim();
              if (!code) return;
              setPromos([
                ...promos,
                { code, kind, value: Number(f.get("value") || 0), minPurchase: Number(f.get("min") || 0) || undefined, maxUses: Number(f.get("max") || 0) || undefined, startsAt: String(f.get("start") || "") || undefined, endsAt: String(f.get("end") || "") || undefined, used: 0, cumulable: f.get("cumul") === "on", active: true, univers: scope === "tous" ? undefined : [scope as "studio"] },
              ]);
              e.currentTarget.reset();
            }}
          >
            <Field label="Code" htmlFor="code"><input id="code" name="code" className="field uppercase" placeholder="EX. NOEL2026" /></Field>
            <Segmented label="Type" value={kind} onChange={setKind} options={[{ value: "pourcentage", label: "Pourcentage" }, { value: "montant", label: "Montant fixe" }]} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={kind === "pourcentage" ? "Valeur (%)" : "Valeur (GNF)"} htmlFor="value"><input id="value" name="value" type="number" min={0} className="field" /></Field>
              <Field label="Minimum d'achat" htmlFor="min"><input id="min" name="min" type="number" min={0} className="field" /></Field>
              <Field label="Début" htmlFor="start"><input id="start" name="start" type="date" className="field" /></Field>
              <Field label="Fin" htmlFor="end"><input id="end" name="end" type="date" className="field" /></Field>
              <Field label="Utilisations max." htmlFor="max"><input id="max" name="max" type="number" min={0} className="field" /></Field>
            </div>
            <div>
              <p className="mb-2 text-[13px] font-medium text-soft">Univers éligible</p>
              <ChipGroup label="Univers éligible" value={scope} onChange={setScope} options={[{ value: "tous", label: "Tout" }, { value: "studio", label: "Vêtements" }, { value: "bijoux", label: "Bijoux" }, { value: "maison", label: "Home" }]} />
            </div>
            <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="cumul" className="size-4 accent-[#683C11]" /> Cumulable avec d'autres réductions</label>
            <Button type="submit" className="w-full">Créer la promotion</Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
