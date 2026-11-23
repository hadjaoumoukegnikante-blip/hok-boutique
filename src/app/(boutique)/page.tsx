import { ArrowRight, FileText, MessageCircle, Smartphone, Truck } from "lucide-react";
import Link from "next/link";
import { NewArrivals } from "@/components/shop/NewArrivals";
import { ButtonLink, Container, ProductVisual, Reveal } from "@/components/ui";
import { getNewProducts, getUnivers } from "@/lib/api";
import { shop } from "@/lib/config";

const steps = [
  { t: "Choisir", d: "Modèle, taille, couleur et tissu disponibles." },
  { t: "Verser l'acompte", d: "50 % via Orange Money, vérifié par la boutique." },
  { t: "Confection", d: "Suivez l'avancement depuis votre espace commande." },
  { t: "Livraison", d: "À Conakry, le solde est réglé à la réception." },
];

const reassurance = [
  { icon: Smartphone, t: "Orange Money", d: "Paiement vérifié par la boutique." },
  { icon: Truck, t: "Livraison à Conakry", d: "Frais affichés avant validation." },
  { icon: FileText, t: "Facture téléchargeable", d: "Solde restant toujours à jour." },
  { icon: MessageCircle, t: "WhatsApp Business", d: "Une question, une preuve de paiement." },
];

export default async function HomePage() {
  const [univers, nouveautes] = await Promise.all([getUnivers(), getNewProducts()]);

  return (
    <>
      {/* Accroche */}
      <Container className="pt-16 text-center md:pt-24">
        <Reveal>
          <p className="eyebrow tracking-[0.28em]">{shop.signature}</p>
          <h1 className="title-serif mx-auto mt-5 max-w-4xl text-[clamp(46px,7vw,92px)] leading-[1.02]">
            {shop.tagline}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#5E4B3A] md:text-[19px]">
            Vêtements confectionnés sur commande, bijoux et bougies. Livraison à Conakry.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/vetements" size="lg">Découvrir la collection</ButtonLink>
            <ButtonLink href="/suivi" variant="soft" size="lg">Suivre ma commande</ButtonLink>
          </div>
        </Reveal>
      </Container>

      {/* Visuel principal */}
      <Container className="pt-10 md:pt-14">
        <Reveal delay={0.1}>
          <ProductVisual univers="studio" alt="Collection H.O.K Studio" label="" className="h-[440px] rounded-[28px] md:h-[560px] md:rounded-[36px]">
            <div aria-hidden className="absolute -right-16 -top-32 size-[520px] rounded-full bg-brun/35 blur-[90px]" />
            <p className="absolute left-6 top-6 text-xs tracking-[0.14em] text-soft md:left-8 md:top-7">PHOTO ÉDITORIALE · H.O.K STUDIO</p>
            <div className="glass-strong absolute bottom-5 left-5 right-5 max-w-sm rounded-3xl px-6 py-5 shadow-[0_20px_40px_-20px_rgb(72_40_10/0.35)] md:bottom-8 md:left-8 md:right-auto">
              <p className="eyebrow tracking-[0.14em]">H.O.K Studio</p>
              <p className="title-serif mt-2 text-[28px] leading-tight md:text-[30px]">Confectionné pour vous, à vos mesures.</p>
              <p className="mt-2.5 text-sm leading-relaxed text-soft">
                Acompte de 50 % · délais de confection et de livraison affichés avant validation.
              </p>
            </div>
            <Link
              href="/vetements?sous=robes"
              className="press glass-strong absolute bottom-8 right-8 hidden h-12 items-center gap-2.5 rounded-full px-6 text-[15px] font-medium text-encre hover:bg-white/75 md:inline-flex"
            >
              Voir les robes <ArrowRight className="size-4" strokeWidth={1.8} />
            </Link>
          </ProductVisual>
        </Reveal>
      </Container>

      {/* Univers */}
      <Container className="pt-24 md:pt-28">
        <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <h2 className="title-serif text-[44px] leading-[1.05] md:text-[52px]">
            Trois univers.
            <br />
            <span className="text-[#8A7663]">Une seule boutique.</span>
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-[#5E4B3A]">
            Composez un seul panier avec des articles de la mode, des bijoux et de la maison.
          </p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {univers.map((u, i) => (
            <Reveal key={u.key} delay={i * 0.08}>
              <Link href={`/${u.slug}`} className="lift group flex flex-col overflow-hidden rounded-[28px] bg-ecru">
                <ProductVisual univers={u.key} alt={u.label} label="" className="h-[300px] md:h-[380px]">
                  <span className="glass-strong absolute bottom-5 left-5 rounded-full px-3.5 py-1.5 text-xs font-medium text-soft">
                    {u.key === "studio" ? "Sur commande" : "En stock"}
                  </span>
                </ProductVisual>
                <div className="px-6 pb-7 pt-6">
                  <p className="eyebrow">{u.brand}</p>
                  <p className="title-serif mt-1.5 text-[32px]">{u.label === "Home" ? "Maison" : u.label}</p>
                  <p className="mt-2 text-sm text-[#5E4B3A]">{u.subcategories.map((s) => s.label).slice(0, 4).join(" · ")}</p>
                  <p className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-brun">
                    Explorer
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.8} />
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Nouveautés */}
      <Container className="pt-24 md:pt-28">
        <Reveal>
          <NewArrivals products={nouveautes} />
        </Reveal>
      </Container>

      {/* Confection */}
      <Container className="pt-24 md:pt-28">
        <Reveal className="rounded-[28px] bg-ecru px-5 py-12 md:rounded-[36px] md:px-10 md:py-14">
          <p className="eyebrow text-center tracking-[0.2em]">Confection sur commande</p>
          <h2 className="title-serif mx-auto mt-3 max-w-2xl text-center text-[36px] leading-[1.1] md:text-[44px]">
            Votre tenue, en quatre étapes claires.
          </h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.t} className="rounded-3xl border border-white/90 bg-white/70 p-6">
                <span className="grid size-9 place-items-center rounded-full bg-brun text-[15px] font-semibold text-white">{i + 1}</span>
                <p className="mt-5 text-[17px] font-semibold">{s.t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5E4B3A]">{s.d}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </Container>

      {/* Réassurance */}
      <Container className="pt-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reassurance.map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-start gap-3.5">
              <Icon className="mt-0.5 size-6 shrink-0 text-brun" strokeWidth={1.5} aria-hidden />
              <div>
                <p className="text-[15px] font-semibold">{t}</p>
                <p className="mt-1 text-sm text-[#5E4B3A]">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
