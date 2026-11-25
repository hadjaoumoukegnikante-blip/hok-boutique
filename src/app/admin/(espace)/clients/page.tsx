import { PageHeader, Table, Td } from "@/components/admin/kit";
import { Badge } from "@/components/ui";
import { listCustomers, listOrders } from "@/lib/admin-data";
import { dateFr, gnf } from "@/lib/format";
import { requireStaff } from "@/lib/supabase/staff";
import { whatsappLink } from "@/lib/whatsapp";
import { ResetPassword } from "./ResetPassword";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff(["admin", "superviseur"]);
  const { q = "" } = await searchParams;
  const [customers, orders] = await Promise.all([listCustomers(), listOrders()]);
  const list = customers
    .map((c) => {
      const mine = orders.filter((o) => o.customer.phone.slice(-9) === String(c.phone).slice(-9));
      return { ...c, count: mine.length, spent: mine.reduce((s, o) => s + o.paid, 0), last: mine[0]?.createdAt ?? c.created_at };
    })
    .filter((c) => `${c.first_name} ${c.last_name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Clients enregistrés à leur première commande ou à la création de leur compte. Mot de passe oublié : vérifiez que la demande WhatsApp vient bien du numéro du compte."
        actions={
          <form className="flex h-11 items-center rounded-full bg-white px-4 shadow-[0_1px_2px_rgb(72_40_10/0.06)]">
            <label htmlFor="q" className="sr-only">Rechercher</label>
            <input id="q" name="q" defaultValue={q} placeholder="Nom ou téléphone" className="w-56 bg-transparent text-sm focus:outline-none" />
          </form>
        }
      />
      <Table head={["Client", "Téléphone", "Compte", "Commandes", "Encaissé", "Dernière commande", "Offres", ""]}>
        {list.map((c) => (
          <tr key={c.id} className="hover:bg-ecru/60">
            <Td className="font-medium">{c.first_name} {c.last_name}{c.email && <span className="block text-xs text-muted">{c.email}</span>}</Td>
            <Td className="tabular-nums">{c.phone}</Td>
            <Td>{c.user_id ? <><Badge tone="brun">Compte</Badge><span className="mt-1 block"><ResetPassword customerId={c.id} name={`${c.first_name} ${c.last_name}`} /></span></> : <span className="text-xs text-muted">Invité</span>}</Td>
            <Td>{c.count}</Td>
            <Td className="tabular-nums">{gnf(c.spent)}</Td>
            <Td className="text-muted">{dateFr(c.last)}</Td>
            <Td>{c.marketing_consent ? <Badge tone="ok">Accepte</Badge> : <Badge>Non</Badge>}</Td>
            <Td><a href={whatsappLink({ intro: `Bonjour ${c.first_name},` }, c.phone.length === 9 ? `224${c.phone}` : c.phone)} target="_blank" rel="noopener noreferrer" className="text-brun hover:underline">WhatsApp</a></Td>
          </tr>
        ))}
        {list.length === 0 && <tr><Td colSpan={8} className="py-10 text-center text-muted">Aucun client.</Td></tr>}
      </Table>
    </>
  );
}
