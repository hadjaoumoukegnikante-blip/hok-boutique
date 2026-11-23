import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { Container, Reveal } from "@/components/ui";
import { allProducts, getProduct, getProducts } from "@/lib/api";

export function generateStaticParams() {
  return allProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return { title: p?.name ?? "Produit", description: p?.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const related = (await getProducts({ univers: product.univers })).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <Container className="pt-6 md:pt-10">
      <ProductDetail product={product} />
      {related.length > 0 && (
        <section className="pt-24">
          <Reveal>
            <h2 className="title-serif mb-7 text-[36px]">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </Reveal>
        </section>
      )}
    </Container>
  );
}
