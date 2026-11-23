"use client";

import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, Container, Field, Segmented, useMounted } from "@/components/ui";
import { dateFr, gnf, orderStatusMeta } from "@/lib/format";
import { useLocalOrders } from "@/store/cart";

/** Compte client facultatif. L'authentification réelle sera branchée sur le backend. */
export default function AccountPage() {
  const mounted = useMounted();
  const [tab, setTab] = useState<"connexion" | "inscription">("connexion");
  const [logged, setLogged] = useState(false);
  const orders = useLocalOrders((s) => s.orders);

  if (!mounted) return <Container className="min-h-[60vh]" />;

  if (logged)
    return (
      <Container className="max-w-3xl pt-12 md:pt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Mon compte</p>
            <h1 className="title-serif mt-2 text-[44px]">Bonjour</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLogged(false)}>
            <LogOut className="size-4" /> Déconnexion
          </Button>
        </div>
        <h2 className="mt-10 text-lg font-semibold">Mes commandes</h2>
        <div className="mt-3 space-y-2">
          {orders.length === 0 && <Card className="text-sm text-muted">Aucune commande pour le moment.</Card>}
          {orders.map((o) => (
            <Link key={o.ref} href={`/suivi?ref=${o.ref}`} className="lift flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgb(72_40_10/0.06)]">
              <div className="min-w-0 flex-1">
                <p className="font-semibold tracking-wide">{o.ref}</p>
                <p className="text-sm text-muted">{dateFr(o.createdAt)} · {gnf(o.total)}</p>
              </div>
              <Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge>
              <ChevronRight className="size-5 text-muted" />
            </Link>
          ))}
        </div>
      </Container>
    );

  return (
    <Container className="max-w-md pt-12 md:pt-20">
      <h1 className="title-serif text-center text-[44px]">Mon compte</h1>
      <p className="mt-2 text-center text-sm text-muted">Facultatif : vous pouvez commander en invité.</p>
      <Segmented
        className="mt-7"
        label="Connexion ou inscription"
        value={tab}
        onChange={setTab}
        options={[
          { value: "connexion", label: "Connexion" },
          { value: "inscription", label: "Créer un compte" },
        ]}
      />
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLogged(true);
        }}
      >
        {tab === "inscription" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom" htmlFor="pf"><input id="pf" className="field" autoComplete="given-name" required /></Field>
            <Field label="Nom" htmlFor="pn"><input id="pn" className="field" autoComplete="family-name" required /></Field>
          </div>
        )}
        <Field label="Téléphone ou e-mail" htmlFor="id"><input id="id" className="field" autoComplete="username" required /></Field>
        <Field label="Mot de passe" htmlFor="pw"><input id="pw" type="password" className="field" autoComplete={tab === "connexion" ? "current-password" : "new-password"} required minLength={6} /></Field>
        <Button type="submit" size="lg" className="w-full">{tab === "connexion" ? "Se connecter" : "Créer mon compte"}</Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/suivi" className="text-brun hover:underline">Suivre une commande sans compte</Link>
      </p>
    </Container>
  );
}
