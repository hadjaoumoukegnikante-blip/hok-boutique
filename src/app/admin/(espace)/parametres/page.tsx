import { PageHeader, Panel } from "@/components/admin/kit";
import { Button, Field } from "@/components/ui";
import { saveSettingsAction } from "@/app/admin/actions/ops";
import { getSettingsBundle } from "@/lib/admin-data";
import { requireStaff } from "@/lib/supabase/staff";
import type { UniversKey } from "@/lib/types";

const names: Record<UniversKey, string> = { studio: "H.O.K Studio · Vêtements", bijoux: "H.O.K Jewelry · Bijoux", maison: "H.O.K Home" };
const check = "size-4 accent-[#683C11]";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireStaff(["admin"]);
  const { ok } = await searchParams;
  const { settings: s, rules } = await getSettingsBundle();

  async function save(form: FormData) {
    "use server";
    const { redirect } = await import("next/navigation");
    await saveSettingsAction(form);
    redirect("/admin/parametres?ok=1");
  }

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Informations de la boutique, règles de paiement et réservations" />
      <form action={save} className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-2">
        <Panel title="Boutique">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Téléphone officiel" htmlFor="ph"><input id="ph" name="phone" className="field" defaultValue={s.phone ?? ""} /></Field>
            <Field label="E-mail officiel" htmlFor="em"><input id="em" name="email" type="email" className="field" defaultValue={s.email ?? ""} /></Field>
            <Field label="WhatsApp Business" htmlFor="wa" hint="Format international, ex. 224620000000"><input id="wa" name="whatsapp" inputMode="numeric" className="field" defaultValue={s.whatsapp ?? ""} /></Field>
            <Field label="Nom de domaine" htmlFor="dom"><input id="dom" name="domain" className="field" defaultValue={s.domain ?? ""} placeholder="hokboutique.com" /></Field>
            <Field label="RCCM" htmlFor="rccm"><input id="rccm" name="rccm" className="field" defaultValue={s.rccm ?? ""} /></Field>
            <Field label="NIF" htmlFor="nif"><input id="nif" name="nif" className="field" defaultValue={s.nif ?? ""} /></Field>
            <div className="sm:col-span-2">
              <Field label="Atelier" htmlFor="ws"><input id="ws" name="workshop" className="field" defaultValue={s.workshop ?? ""} /></Field>
            </div>
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel title="Orange Money">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code marchand" htmlFor="om"><input id="om" name="om_merchant_code" className="field" defaultValue={s.omMerchantCode ?? ""} /></Field>
              <Field label="Nom du bénéficiaire" htmlFor="ben"><input id="ben" name="om_beneficiary" className="field" defaultValue={s.omBeneficiary ?? ""} /></Field>
            </div>
            <p className="mt-3 text-xs text-muted">Affichés au client après la commande. Les transactions sont vérifiées à la main dans la page Paiements.</p>
          </Panel>
          <Panel title="Réservations">
            <Field label="Annulation des commandes impayées après (heures)" htmlFor="res" hint="Vérifié toutes les 15 minutes. Une commande dont la preuve de paiement est en vérification n'est jamais annulée.">
              <input id="res" name="reservation_hours" type="number" min={1} className="field" defaultValue={s.reservationHours ?? ""} placeholder="Vide : jamais d'annulation automatique" />
            </Field>
          </Panel>
        </div>
        <Panel title="Règles de paiement par univers" className="xl:col-span-2">
          <div className="grid gap-3 [&>*]:min-w-0 md:grid-cols-3">
            {(Object.keys(names) as UniversKey[]).map((k) => {
              const r = rules[k];
              return (
                <div key={k} className="rounded-2xl bg-ecru p-4">
                  <p className="mb-2 font-semibold">{names[k]}</p>
                  <Field label="Acompte exigé (%)" htmlFor={`dep-${k}`}>
                    <input id={`dep-${k}`} name={`dep_${k}`} type="number" min={0} max={100} className="field bg-white" defaultValue={Math.round((r?.depositRate ?? 0) * 100)} />
                  </Field>
                  <label className="mt-3 flex items-center justify-between gap-3 text-sm">Paiement à la livraison <input type="checkbox" name={`cod_${k}`} defaultChecked={r?.allowCashOnDelivery} className={check} /></label>
                  <label className="mt-2 flex items-center justify-between gap-3 text-sm">Acceptation des délais <input type="checkbox" name={`acc_${k}`} defaultChecked={r?.requiresMakingAcceptance} className={check} /></label>
                </div>
              );
            })}
          </div>
        </Panel>
        <div className="flex flex-wrap items-center gap-4 xl:col-span-2">
          <Button type="submit" size="lg">Enregistrer</Button>
          {ok && <span role="status" className="text-sm font-medium text-brun">Paramètres enregistrés.</span>}
          <a href="/admin/equipe" className="ml-auto text-sm text-brun hover:underline">Comptes et rôles : page Équipe</a>
        </div>
      </form>
    </>
  );
}
