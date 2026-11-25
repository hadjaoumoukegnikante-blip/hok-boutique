"use client";

import { useState } from "react";
import { PageHeader, Panel, Toggle } from "@/components/admin/kit";
import { Button, Field } from "@/components/ui";
import { paymentRules, reservationHours, shop } from "@/lib/config";
import type { UniversKey } from "@/lib/types";
import { useUi } from "@/store/cart";


const names: Record<UniversKey, string> = { studio: "H.O.K Studio · Vêtements", bijoux: "H.O.K Jewelry · Bijoux", maison: "H.O.K Home" };

export default function SettingsPage() {
  const [rules, setRules] = useState(paymentRules);
  const notify = useUi((s) => s.notify);

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Informations de la boutique, règles de paiement et réservations" />
      <form
        className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          notify("Paramètres enregistrés", "Démonstration : enregistrement réel via le backend");
        }}
      >
        <Panel title="Boutique">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Téléphone officiel" htmlFor="ph"><input id="ph" className="field" defaultValue={shop.phone} /></Field>
            <Field label="E-mail officiel" htmlFor="em"><input id="em" className="field" defaultValue={shop.email} /></Field>
            <Field label="WhatsApp Business" htmlFor="wa" hint="Format international, ex. 224620000000"><input id="wa" className="field" defaultValue={shop.whatsapp} /></Field>
            <Field label="Nom de domaine" htmlFor="dom"><input id="dom" className="field" defaultValue={shop.domain} /></Field>
            <Field label="RCCM / NIF" htmlFor="lg"><input id="lg" className="field" defaultValue={`${shop.legal.rccm} / ${shop.legal.nif}`} /></Field>
          </div>
        </Panel>
        <Panel title="Orange Money">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code marchand" htmlFor="om"><input id="om" className="field" defaultValue={shop.orangeMoney.merchantCode} /></Field>
            <Field label="Nom du bénéficiaire" htmlFor="ben"><input id="ben" className="field" defaultValue={shop.orangeMoney.beneficiary} /></Field>
          </div>
          <p className="mt-3 text-xs text-muted">Vérification manuelle des transactions. Une API marchand pourra automatiser cette étape si elle est disponible.</p>
        </Panel>
        <Panel title="Règles de paiement par univers" className="xl:col-span-2">
          <div className="grid gap-3 [&>*]:min-w-0 md:grid-cols-3">
            {(Object.keys(rules) as UniversKey[]).map((k) => (
              <div key={k} className="rounded-2xl bg-ecru p-4">
                <p className="font-semibold">{names[k]}</p>
                <Field label="Acompte exigé (%)" htmlFor={`dep-${k}`}>
                  <input
                    id={`dep-${k}`}
                    type="number"
                    min={0}
                    max={100}
                    className="field mt-0 bg-white"
                    value={Math.round(rules[k].depositRate * 100)}
                    onChange={(e) => setRules({ ...rules, [k]: { ...rules[k], depositRate: Number(e.target.value) / 100 } })}
                  />
                </Field>
                <div className="mt-3 flex items-center justify-between text-sm">
                  Paiement à la livraison
                  <Toggle label={`Paiement à la livraison ${names[k]}`} checked={rules[k].allowCashOnDelivery} onChange={(v) => setRules({ ...rules, [k]: { ...rules[k], allowCashOnDelivery: v } })} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  Acceptation des délais
                  <Toggle label={`Acceptation des délais ${names[k]}`} checked={rules[k].requiresMakingAcceptance} onChange={(v) => setRules({ ...rules, [k]: { ...rules[k], requiresMakingAcceptance: v } })} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Réservations">
          <Field label="Annulation des commandes impayées après (heures)" htmlFor="res" hint="Le stock n'est jamais libéré pendant la vérification d'une preuve de paiement.">
            <input id="res" type="number" min={0} className="field" defaultValue={reservationHours ?? ""} placeholder="Non définie" />
          </Field>
        </Panel>
        <Panel title="Accès et rôles">
          <p className="text-sm text-soft">Les comptes et les rôles se gèrent dans la page Équipe.</p>
          <a href="/admin/equipe" className="mt-3 inline-flex h-10 items-center rounded-full bg-sable px-4 text-sm font-medium text-brun hover:bg-beige-clair">Gérer l'équipe</a>
          <p className="mt-3 text-xs text-muted">Atelier : {shop.workshop}.</p>
        </Panel>
        <div className="xl:col-span-2">
          <Button type="submit" size="lg">Enregistrer</Button>
        </div>
      </form>
    </>
  );
}
