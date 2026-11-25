import { PageHeader, Panel, Table, Td } from "@/components/admin/kit";
import { Button, Field } from "@/components/ui";
import { savePromoAction } from "@/app/admin/actions/ops";
import { listPromos } from "@/lib/admin-data";
import { dateFr, gnf } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";

const uLabel: Record<string, string> = { studio: "Vêtements", bijoux: "Bijoux", maison: "Home" };

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  await requireStaff(["admin", "superviseur"]);
  const { e } = await searchParams;
  const promos = await listPromos();

  async function create(form: FormData) {
    "use server";
    const { redirect } = await import("next/navigation");
    try {
      await savePromoAction(form);
    } catch (err) {
      redirect(`/admin/promotions?e=${encodeURIComponent((err as Error).message)}`);
    }
    redirect("/admin/promotions");
  }

  return (
    <>
      <PageHeader title="Promotions" subtitle="Codes de réduction : dates de validité, minimum d'achat, limites et règles de cumul" />
      <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.5fr_1fr]">
        <Table head={["Code", "Réduction", "Minimum", "Éligible", "Validité", "Utilisations", "Cumul", "État"]}>
          {promos.map((p) => (
            <tr key={p.code} className={p.active ? "hover:bg-ecru/60" : "opacity-60 hover:bg-ecru/60"}>
              <Td className="font-semibold tracking-wide">{p.code}</Td>
              <Td>{p.kind === "pourcentage" ? `${p.value} %` : gnf(p.value)}</Td>
              <Td className="tabular-nums">{p.min_purchase ? gnf(p.min_purchase) : "·"}</Td>
              <Td>{p.univers?.length ? p.univers.map((x: string) => uLabel[x] ?? x).join(", ") : "Tout"}</Td>
              <Td className="text-muted">{p.starts_at || p.ends_at ? `${p.starts_at ? dateFr(p.starts_at) : "…"} au ${p.ends_at ? dateFr(p.ends_at) : "…"}` : "Sans limite"}</Td>
              <Td className="tabular-nums">{p.used}{p.max_uses ? ` / ${p.max_uses}` : ""}</Td>
              <Td>{p.cumulable ? "Oui" : "Non"}</Td>
              <Td>
                <form action={savePromoAction}>
                  <input type="hidden" name="op" value="toggle" />
                  <input type="hidden" name="code" value={p.code} />
                  <input type="hidden" name="active" value={String(!p.active)} />
                  <button type="submit" className="press text-xs font-semibold text-brun hover:underline">{p.active ? "Désactiver" : "Activer"}</button>
                </form>
              </Td>
            </tr>
          ))}
          {promos.length === 0 && <tr><Td colSpan={8} className="py-10 text-center text-muted">Aucune promotion.</Td></tr>}
        </Table>
        <Panel title="Nouvelle promotion">
          <form action={create} className="space-y-4">
            <Field label="Code" htmlFor="code"><input id="code" name="code" required pattern="[A-Za-z0-9_-]+" className="field uppercase" placeholder="EX. NOEL2026" /></Field>
            <Field label="Type" htmlFor="kind">
              <select id="kind" name="kind" className="field"><option value="pourcentage">Pourcentage</option><option value="montant">Montant fixe (GNF)</option></select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valeur" htmlFor="value" hint="% ou GNF selon le type"><input id="value" name="value" type="number" min={1} required className="field" /></Field>
              <Field label="Minimum d'achat" htmlFor="min"><input id="min" name="min" type="number" min={0} className="field" /></Field>
              <Field label="Début" htmlFor="start"><input id="start" name="start" type="date" className="field" /></Field>
              <Field label="Fin" htmlFor="end"><input id="end" name="end" type="date" className="field" /></Field>
              <Field label="Utilisations max." htmlFor="max"><input id="max" name="max" type="number" min={0} className="field" /></Field>
              <Field label="Univers éligible" htmlFor="univers">
                <select id="univers" name="univers" className="field"><option value="tous">Tout</option><option value="studio">Vêtements</option><option value="bijoux">Bijoux</option><option value="maison">Home</option></select>
              </Field>
            </div>
            <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="cumul" className="size-4 accent-[#683C11]" /> Cumulable avec d'autres réductions</label>
            {e && <p role="alert" className="rounded-2xl bg-bordeaux/[0.07] px-4 py-3 text-sm text-bordeaux">{e}</p>}
            <Button type="submit" className="w-full">Créer la promotion</Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
