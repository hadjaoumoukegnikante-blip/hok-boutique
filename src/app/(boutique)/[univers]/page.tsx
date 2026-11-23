import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView } from "@/components/shop/CatalogView";
import { Container, Reveal } from "@/components/ui";
import { getProducts, getUnivers, getUniversBySlug } from "@/lib/api";

export async function generateStaticParams() {
  const u = await getUnivers();
  return u.map((x) => ({ univers: x.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ univers: string }> }): Promise<Metadata> {
  const u = await getUniversBySlug((await params).univers);
  return { title: u ? `${u.label} · ${u.brand}` : "Collection" };
}

export default async function UniversPage({ params }: { params: Promise<{ univers: string }> }) {
  const u = await getUniversBySlug((await params).univers);
  if (!u) notFound();
  const products = await getProducts({ univers: u.key });

  return (
    <Container>
      <Reveal className="pb-10 pt-14 md:pt-20">
        <p className="eyebrow">{u.brand}</p>
        <h1 className="title-serif mt-3 text-[52px] leading-none md:text-[72px]">{u.key === "maison" ? "Maison" : u.label}</h1>
        <p className="mt-4 max-w-lg text-lg text-[#5E4B3A]">{u.tagline}</p>
        {u.key === "studio" && (
          <p className="mt-5 inline-flex rounded-full bg-ecru px-4 py-2 text-sm text-soft">
            Confection sur commande · acompte de 50 % · délais affichés sur chaque modèle
          </p>
        )}
      </Reveal>
      <Suspense>
        <CatalogView univers={u} products={products} />
      </Suspense>
    </Container>
  );
}
