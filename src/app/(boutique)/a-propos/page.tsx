import type { Metadata } from "next";
import { ButtonLink, Container, ProductVisual, Reveal } from "@/components/ui";
import { getUnivers } from "@/lib/api";
import { shop } from "@/lib/config";

export const metadata: Metadata = { title: "À propos" };

export default async function AboutPage() {
  const univers = await getUnivers();
  return (
    <>
      <Container className="pt-16 text-center md:pt-24">
        <Reveal>
          <p className="eyebrow tracking-[0.28em]">{shop.signature}</p>
          <h1 className="title-serif mx-auto mt-5 max-w-3xl text-[48px] leading-[1.05] md:text-[72px]">Bienvenue chez H.O.K Boutique</h1>
          <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-[#5E4B3A]">
            <p>Hello, bienvenue chez H.O.K Boutique ! 🤎</p>
            <p>Tu sais, ces petites choses qui te font sourire dès que tu les découvres ? C'est exactement ce qu'on aime ici.</p>
            <p>Une jolie tenue, un bijou qui attire le regard, une bougie qui rend ton intérieur encore plus chaleureux… On aime tout ce qui apporte ce petit quelque chose en plus.</p>
            <p>Chez H.O.K Boutique, on réunit trois univers qu'on adore : la mode, les bijoux et la décoration.</p>
            <p>Alors, que tu sois venue chercher ta prochaine tenue préférée, un petit coup de cœur ou simplement de l'inspiration, installe-toi, explore et fais comme chez toi.</p>
            <p className="title-serif text-[28px] text-encre md:text-[32px]">Bienvenue dans notre univers. Bienvenue chez H.O.K Boutique.</p>
          </div>
        </Reveal>
      </Container>
      <Container className="pt-16">
        <div className="grid gap-5 md:grid-cols-3">
          {univers.map((u, i) => (
            <Reveal key={u.key} delay={i * 0.08} className="overflow-hidden rounded-[28px] bg-ecru">
              <ProductVisual univers={u.key} alt={u.brand} label="Photo d'ambiance" className="h-72" />
              <div className="p-6">
                <p className="eyebrow">{u.brand}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-soft">{u.tagline}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-14 text-center">
          <ButtonLink href="/contact" size="lg" variant="soft">Nous contacter</ButtonLink>
        </div>
      </Container>
    </>
  );
}
