"use client";

import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink, Card, Container, Field } from "@/components/ui";
import { shop } from "@/lib/config";
import { useShopData, useWhatsapp } from "@/components/shop/ShopData";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { settings } = useShopData();
  const whatsappLink = useWhatsapp();
  return (
    <Container className="pt-12 md:pt-16">
      <h1 className="title-serif text-[48px] md:text-[64px]">Contact</h1>
      <p className="mt-2 max-w-lg text-lg text-[#5E4B3A]">Une question sur un modèle, une commande ou un paiement ? Nous répondons rapidement.</p>

      <div className="mt-10 grid gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <a href={whatsappLink({ intro: "Bonjour H.O.K Boutique," })} target="_blank" rel="noopener noreferrer" className="lift flex items-center gap-4 rounded-3xl bg-brun p-6 text-white">
            <MessageCircle className="size-7" strokeWidth={1.5} />
            <div>
              <p className="text-lg font-semibold">WhatsApp Business</p>
              <p className="text-sm text-white/80">Le plus rapide pour une question ou une preuve de paiement</p>
            </div>
          </a>
          {[
            { icon: Phone, t: "Téléphone", d: settings.phone ?? "À venir" },
            { icon: Mail, t: "E-mail", d: settings.email ?? "À venir" },
            { icon: MapPin, t: "Ville", d: shop.city },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-center gap-4 rounded-3xl bg-ecru p-5">
              <Icon className="size-6 text-brun" strokeWidth={1.5} />
              <div>
                <p className="text-sm text-muted">{t}</p>
                <p className="font-medium">{d}</p>
              </div>
            </div>
          ))}
        </div>

        <Card className="md:p-8">
          {sent ? (
            <div className="py-10 text-center">
              <p className="title-serif text-3xl">Message envoyé</p>
              <p className="mt-2 text-muted">Merci, nous revenons vers vous rapidement.</p>
              <ButtonLink href="/" variant="soft" className="mt-6">Retour à l'accueil</ButtonLink>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom" htmlFor="n"><input id="n" className="field" required autoComplete="name" /></Field>
                <Field label="Téléphone" htmlFor="t"><input id="t" className="field" required inputMode="tel" autoComplete="tel" /></Field>
              </div>
              <Field label="Référence de commande (facultatif)" htmlFor="r"><input id="r" className="field" placeholder="HOK-AAAAMMJJ-XXXX" /></Field>
              <Field label="Message" htmlFor="m">
                <textarea id="m" required rows={5} className="field h-auto py-3" />
              </Field>
              <Button type="submit" size="lg" className="w-full">Envoyer</Button>
            </form>
          )}
        </Card>
      </div>
    </Container>
  );
}
