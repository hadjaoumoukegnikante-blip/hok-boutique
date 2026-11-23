"use client";

import { PageHeader, Table, Td } from "@/components/admin/kit";
import { dateFr } from "@/lib/format";
import { useAdmin } from "@/store/admin";

export default function AuditPage() {
  const log = useAdmin((s) => s.log);
  return (
    <>
      <PageHeader title="Historique des opérations" subtitle="Validations de paiement, mouvements de stock, annulations, remboursements et changements de statut" />
      <Table head={["Date", "Utilisateur", "Action", "Cible", "Détail"]}>
        {log.map((l) => (
          <tr key={l.id} className="hover:bg-ecru/60">
            <Td className="text-muted">{dateFr(l.date, true)}</Td>
            <Td>{l.user}</Td>
            <Td className="font-medium">{l.action}</Td>
            <Td className="text-brun">{l.target}</Td>
            <Td className="whitespace-normal text-soft">{l.detail}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
