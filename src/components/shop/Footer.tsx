import Image from "next/image";
import Link from "next/link";
import { shop } from "@/lib/config";

const cols = [
  {
    title: "Boutique",
    links: [
      { href: "/vetements", label: "Vêtements" },
      { href: "/bijoux", label: "Bijoux" },
      { href: "/maison", label: "Home" },
      { href: "/recherche", label: "Rechercher" },
    ],
  },
  {
    title: "Aide",
    links: [
      { href: "/suivi", label: "Suivre ma commande" },
      { href: "/infos/livraison", label: "Livraison" },
      { href: "/infos/retours", label: "Retours et échanges" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Informations",
    links: [
      { href: "/a-propos", label: "À propos" },
      { href: "/infos/conditions-de-vente", label: "Conditions de vente" },
      { href: "/infos/confidentialite", label: "Confidentialité" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-28 bg-brun text-ecru">
      <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-12 px-5 pb-10 pt-16 md:px-6">
        <div className="max-w-xs">
          <Image src="/logo-hok-blanc.png" alt="H.O.K Boutique" width={1067} height={409} className="h-16 w-auto" />
          <p className="mt-5 text-sm leading-relaxed text-[#EADFCF]">
            {shop.tagline} {shop.city}.
          </p>
          <p className="mt-3 text-xs tracking-[0.2em] text-[#D8C9B6]">{shop.signature}</p>
        </div>
        <div className="flex flex-wrap gap-14 text-sm">
          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-2.5">
              <p className="mb-1 font-semibold text-white">{c.title}</p>
              {c.links.map((l) => (
                <Link key={l.href} href={l.href} className="text-[#EADFCF] transition-colors hover:text-white">
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2 border-t border-white/15 px-5 pb-8 pt-5 text-[13px] text-[#D8C9B6] md:px-6">
        <span>© {new Date().getFullYear()} {shop.name} · Prix en GNF</span>
        <span>Paiement Orange Money · Livraison à Conakry</span>
      </div>
    </footer>
  );
}
