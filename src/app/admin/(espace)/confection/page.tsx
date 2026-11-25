import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/kit";
import { setStageAction } from "@/app/admin/actions/ops";
import { listJobs } from "@/lib/admin-data";
import { dateFr } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";

const stages = [
  { key: "a_demarrer", label: "À démarrer" },
  { key: "decoupe", label: "Découpe" },
  { key: "couture", label: "Couture" },
  { key: "finitions", label: "Finitions" },
  { key: "terminee", label: "Terminée" },
];

export default async function ProductionPage() {
  await requireStaff(["admin", "superviseur", "atelier"]);
  const jobs = await listJobs();
  return (
    <>
      <PageHeader title="Confection" subtitle="Pièces sur mesure, de la découpe à la finition. Le tissu est consommé au passage en découpe." />
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        {stages.map((st, i) => {
          const col = jobs.filter((j) => j.stage === st.key);
          const next = stages[i + 1];
          return (
            <section key={st.key} className="w-72 shrink-0 rounded-3xl bg-ecru p-3">
              <div className="mb-3 flex items-center justify-between px-2 pt-1">
                <h2 className="text-sm font-semibold">{st.label}</h2>
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white px-2 text-xs font-semibold">{col.length}</span>
              </div>
              <div className="space-y-2.5">
                {col.map((j) => {
                  const l = j.order_lines;
                  const m = l?.measurements;
                  return (
                    <article key={j.id} className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgb(72_40_10/0.08)]">
                      <p className="font-medium">{l?.name}</p>
                      <p className="text-xs text-muted">{l?.variant_label} · {l?.orders?.first_name} {l?.orders?.last_name?.[0]}.</p>
                      <p className="mt-1 text-[11px] text-soft">
                        {m ? `P ${m.poitrine} · T ${m.taille} · H ${m.hanches} · L ${m.longueur} cm` : l?.measurements_by_whatsapp ? "Mesures attendues (WhatsApp)" : ""}
                      </p>
                      <Link href={`/admin/commandes/${l?.order_ref}`} className="mt-2 block text-xs font-semibold text-brun hover:underline">{l?.order_ref}</Link>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-xs text-muted">{j.due_date ? `Pour le ${dateFr(j.due_date)}` : "Acompte en attente"}</span>
                        {next && (
                          <form action={setStageAction}>
                            <input type="hidden" name="job_id" value={j.id} />
                            <input type="hidden" name="stage" value={next.key} />
                            <button type="submit" className="press inline-flex h-8 items-center gap-1 rounded-full bg-brun/[0.07] px-3 text-xs font-semibold text-brun hover:bg-brun/[0.12]">
                              {next.label} <ChevronRight className="size-3.5" />
                            </button>
                          </form>
                        )}
                      </div>
                    </article>
                  );
                })}
                {col.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted">Aucune pièce</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
