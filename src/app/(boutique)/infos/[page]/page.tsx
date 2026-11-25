import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { getShopData } from "@/lib/api";
import { gnf } from "@/lib/format";

type Section = { h: string; p: string[]; table?: { head: string[]; rows: string[][] } };
const pages = (fee: string): Record<string, { title: string; intro: string; sections: Section[] }> => ({
  livraison: {
    title: "Livraison",
    intro: "Nous livrons à Conakry. Les frais sont toujours affichés avant la confirmation de votre commande.",
    sections: [
      { h: "Zone et tarifs", p: [`Les tarifs par commune sont en cours de définition avec notre livreur. Tarif affiché pour le moment : ${fee}.`] },
      { h: "Livraison groupée ou séparée", p: ["Par défaut, les articles d'une même commande sont livrés ensemble lorsque c'est possible.", "Si vous souhaitez recevoir vos articles en stock sans attendre une confection, des frais supplémentaires vous sont indiqués avant votre accord."] },
      { h: "Délais", p: ["Le délai de livraison est affiché sur chaque fiche produit. Pour un vêtement, il s'ajoute au délai de confection, affiché séparément."] },
    ],
  },
  retours: {
    title: "Retours et échanges",
    intro: "Un article peut être retourné ou échangé s'il nous revient intact. Les frais de retour sont à la charge du client.",
    sections: [
      { h: "Produit intact", p: ["Le produit doit être retourné en parfait état. Un article abîmé, porté ou utilisé ne peut être ni remboursé ni échangé."] },
      { h: "Vêtements sur mesure", p: ["Les vêtements confectionnés sur mesure ne font l'objet d'aucun retour, remboursement ou échange."] },
      { h: "Frais de retour", p: ["Les frais de retour sont payés par le client."] },
      { h: "Erreur ou produit endommagé à la réception", p: ["Contactez-nous avec votre référence de commande dès réception : chaque cas est étudié."] },
    ],
  },
  "conditions-de-vente": {
    title: "Conditions de vente",
    intro: "[Texte définitif à rédiger et à valider par la boutique.]",
    sections: [
      { h: "Prix", p: ["Les prix sont indiqués en francs guinéens (GNF)."] },
      { h: "Paiement", p: ["Vêtements confectionnés sur commande : acompte de 50 % avant la confection, solde à la livraison.", "Bijoux et Home en stock : paiement intégral par Orange Money avant livraison, ou paiement à la livraison lorsque ce mode est proposé.", "Les paiements Orange Money sont vérifiés manuellement. La commande est confirmée après vérification."] },
      { h: "Commande", p: ["Chaque commande reçoit une référence unique au format HOK-AAAAMMJJ-XXXX, qui reste attribuée même en cas d'annulation.", "Une commande non payée est annulée au bout de 24 heures."] },
      { h: "Vêtements sur mesure", p: ["Chaque robe est confectionnée à vos mesures. La confection démarre après réception de l'acompte et de vos mesures."] },
    ],
  },
  confidentialite: {
    title: "Confidentialité",
    intro: "Nous collectons uniquement les informations nécessaires au traitement et à la livraison de vos commandes.",
    sections: [
      { h: "Données collectées", p: ["Nom, téléphone, adresse de livraison, e-mail facultatif, et le numéro Orange Money utilisé lorsqu'il est communiqué."] },
      { h: "Données de paiement", p: ["Les données de paiement ne sont pas conservées au-delà de ce qui est nécessaire."] },
      { h: "Communications", p: ["Les messages de suivi de commande sont distincts des communications commerciales, qui demandent votre accord explicite."] },
    ],
  },
  "guide-des-tailles": {
    title: "Guide des tailles",
    intro: "Nos tailles suivent les standards internationaux. Chaque robe étant confectionnée sur mesure, vos propres mesures priment toujours sur la taille.",
    sections: [
      {
        h: "Correspondances (en cm, à titre indicatif)",
        p: [],
        table: {
          head: ["Taille", "Poitrine", "Taille", "Hanches"],
          rows: [
            ["M", "88 à 92", "70 à 74", "96 à 100"],
            ["L", "96 à 100", "78 à 82", "104 à 108"],
            ["XL", "104 à 108", "86 à 90", "112 à 116"],
            ["XXL", "112 à 116", "94 à 98", "120 à 124"],
          ],
        },
      },
      {
        h: "Comment se mesurer",
        p: [
          "Tour de poitrine : mètre ruban horizontal, au plus fort de la poitrine.",
          "Tour de taille : au plus fin de la taille, sans serrer.",
          "Tour de hanches : au plus fort des hanches, pieds joints.",
          "Longueur souhaitée : du haut de l'épaule jusqu'au bas de la robe désiré.",
          "Un doute ? Envoyez-nous vos mesures sur WhatsApp, nous vous conseillons.",
        ],
      },
    ],
  },
});

export function generateStaticParams() {
  return Object.keys(pages("")).map((page) => ({ page }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  return { title: pages("")[(await params).page]?.title };
}

export default async function InfoPage({ params }: { params: Promise<{ page: string }> }) {
  const { zones, settings } = await getShopData();
  const fee = zones.length ? `${gnf(Math.min(...zones.map((z) => z.fee)))}${settings.deliveryProvisional ? " (provisoire)" : ""}` : "à définir";
  const data = pages(fee)[(await params).page];
  if (!data) notFound();
  return (
    <Container className="max-w-3xl pt-12 md:pt-16">
      <p className="eyebrow">Informations</p>
      <h1 className="title-serif mt-3 text-[44px] md:text-[56px]">{data.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#5E4B3A]">{data.intro}</p>
      <div className="mt-10 space-y-8">
        {data.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="mt-2 leading-relaxed text-soft">{t}</p>
            ))}
            {s.table && (
              <div className="mt-4 overflow-x-auto rounded-3xl bg-ecru">
                <table className="w-full min-w-[320px] text-sm">
                  <thead>
                    <tr className="border-b border-brun/10 text-left text-[11px] uppercase tracking-[0.12em] text-muted">
                      {s.table.head.map((h, i) => <th key={i} className="px-4 py-3 font-semibold">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brun/[0.07]">
                    {s.table.rows.map((r) => (
                      <tr key={r[0]}>
                        {r.map((c, i) => <td key={i} className={i === 0 ? "px-4 py-3 font-semibold" : "px-4 py-3 tabular-nums"}>{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </Container>
  );
}
