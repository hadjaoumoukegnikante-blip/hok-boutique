import { PageHeader, Table, Td } from "@/components/admin/kit";
import { listAudit } from "@/lib/admin-data";
import { dateFr } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";

export default async function AuditPage() {
  await requireStaff(["admin", "superviseur"]);
  const log = await listAudit();
  return (
    <>
      <PageHeader title="Historique des opérations" subtitle="Commandes, paiements, stocks, confection, équipe : tout ce qui est sensible est tracé" />
      <Table head={["Date", "Action", "Cible", "Détail"]}>
        {log.map((l) => (
          <tr key={l.id} className="hover:bg-ecru/60">
            <Td className="text-muted">{dateFr(l.at, true)}</Td>
            <Td className="font-medium">{l.action}</Td>
            <Td className="text-brun">{l.target}</Td>
            <Td className="whitespace-normal text-soft">{l.detail}</Td>
          </tr>
        ))}
        {log.length === 0 && <tr><Td colSpan={4} className="py-10 text-center text-muted">Aucune opération pour le moment.</Td></tr>}
      </Table>
    </>
  );
}
