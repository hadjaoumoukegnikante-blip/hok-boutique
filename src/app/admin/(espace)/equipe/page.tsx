import { PageHeader } from "@/components/admin/kit";
import { supabaseServer } from "@/lib/supabase/server";
import { requireStaff, type StaffMember } from "@/lib/supabase/staff";
import { updateMember } from "@/app/admin/actions/team";
import { AddMemberForm } from "./AddMemberForm";

export const metadata = { title: "Équipe" };

const roles = [
  { value: "admin", label: "Gérante (accès complet)" },
  { value: "superviseur", label: "Superviseure (catalogue, stocks, paiements)" },
  { value: "atelier", label: "Atelier (confection, matières)" },
  { value: "livreur", label: "Livreur (livraisons)" },
];

export default async function TeamPage() {
  const me = await requireStaff(["admin"]);
  const supabase = await supabaseServer();
  const { data } = await supabase.from("staff").select("user_id, full_name, role, email, active").order("created_at");
  const team = (data ?? []) as StaffMember[];
  const hasSecret = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <>
      <PageHeader title="Équipe" subtitle="Comptes d'accès à l'administration et rôles" />
      <div className="grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgb(72_40_10/0.06)]">
          <ul className="divide-y divide-brun/[0.07]">
            {team.map((m) => {
              const self = m.user_id === me.user_id;
              return (
                <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.full_name}{self && <span className="ml-2 text-xs font-normal text-muted">(vous)</span>}</p>
                    <p className="truncate text-sm text-muted">{m.email ?? ""}</p>
                  </div>
                  <form action={updateMember} className="flex items-center gap-2">
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <label className="sr-only" htmlFor={`r-${m.user_id}`}>Rôle de {m.full_name}</label>
                    <select id={`r-${m.user_id}`} name="role" defaultValue={m.role} disabled={self} className="h-10 rounded-xl border border-brun/15 bg-ecru px-3 text-sm disabled:opacity-60">
                      {roles.map((r) => <option key={r.value} value={r.value}>{r.label.split(" (")[0]}</option>)}
                    </select>
                    {!self && <button type="submit" className="press h-10 rounded-xl bg-sable px-3 text-sm font-medium text-brun hover:bg-beige-clair">Enregistrer</button>}
                  </form>
                  {!self && (
                    <form action={updateMember}>
                      <input type="hidden" name="user_id" value={m.user_id} />
                      <input type="hidden" name="active" value={m.active ? "false" : "true"} />
                      <button type="submit" className={`press h-10 rounded-xl px-3 text-sm font-medium ${m.active ? "text-danger hover:bg-danger/[0.06]" : "text-ok hover:bg-ok/10"}`}>
                        {m.active ? "Désactiver" : "Réactiver"}
                      </button>
                    </form>
                  )}
                  {!m.active && <span className="rounded-full bg-sable px-2.5 py-1 text-xs font-semibold text-muted">Désactivé</span>}
                </li>
              );
            })}
          </ul>
        </section>
        <AddMemberForm roles={roles} hasSecret={hasSecret} />
      </div>
    </>
  );
}
