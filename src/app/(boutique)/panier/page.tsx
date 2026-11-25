"use client";

import { ShoppingBag } from "lucide-react";
import { CartLineItem } from "@/components/shop/CartLineItem";
import { PromoField, TotalsBlock } from "@/components/shop/Summary";
import { ButtonLink, Card, Container, ChipGroup, useMounted } from "@/components/ui";
import { useShopData } from "@/components/shop/ShopData";
import { useCartTotals } from "@/lib/useCartTotals";
import { useCart } from "@/store/cart";

export default function CartPage() {
  const mounted = useMounted();
  const totals = useCartTotals();
  const { commune, setCommune } = useCart();
  const { zones } = useShopData();

  if (!mounted) return <Container className="min-h-[60vh] pt-16" />;

  if (totals.lines.length === 0)
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center pt-16 text-center">
        <div className="grid size-20 place-items-center rounded-full bg-sable text-brun">
          <ShoppingBag className="size-8" strokeWidth={1.3} />
        </div>
        <h1 className="title-serif mt-6 text-[44px]">Votre panier est vide</h1>
        <p className="mt-2 text-muted">Un seul panier pour la mode, les bijoux et la maison.</p>
        <ButtonLink href="/" size="lg" className="mt-7">Continuer mes achats</ButtonLink>
      </Container>
    );

  return (
    <Container className="pt-12 md:pt-16">
      <h1 className="title-serif text-[48px] md:text-[60px]">Panier</h1>
      <p className="mt-1 text-muted">{totals.count} article{totals.count > 1 ? "s" : ""}</p>

      <div className="mt-8 grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="space-y-3">
          {totals.lines.map((l) => (
            <Card key={l.line.key} className="p-4 md:p-5">
              <CartLineItem item={l} />
            </Card>
          ))}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <Card className="bg-ecru shadow-none">
            <p className="font-semibold">Livraison à Conakry</p>
            <p className="mb-3 mt-0.5 text-[13px] text-muted">Choisissez votre commune pour estimer les frais.</p>
            <ChipGroup label="Commune" value={commune || undefined} onChange={setCommune} options={zones.map((z) => ({ value: z.commune, label: z.commune }))} />
          </Card>
          <Card>
            <PromoField totals={totals} />
            <div className="mt-4">
              <TotalsBlock totals={totals} showSplit={false} />
            </div>
            {totals.subtotalMade > 0 && (
              <p className="mt-2 rounded-2xl bg-brun/[0.06] px-3.5 py-2.5 text-[13px] text-soft">
                Vêtements sur commande : acompte de 50 % avant confection, solde à la livraison.
              </p>
            )}
            {totals.hasStockIssue && (
              <p className="mt-2 rounded-2xl bg-danger/[0.06] px-3.5 py-2.5 text-[13px] text-danger">
                Certaines quantités dépassent le stock disponible. Ajustez votre panier.
              </p>
            )}
            <ButtonLink href={totals.hasStockIssue ? "#" : "/commande"} size="lg" className="mt-4 w-full" aria-disabled={totals.hasStockIssue}>
              Passer la commande
            </ButtonLink>
            <p className="mt-2.5 text-center text-xs text-muted">Commande possible sans créer de compte</p>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
