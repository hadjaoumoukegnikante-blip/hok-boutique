"use client";

import { ChevronRight, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, ButtonLink, Card, Container, Field, Segmented, useMounted } from "@/components/ui";
import { rowToOrder } from "@/lib/db";
import { dateFr, gnf, orderStatusMeta } from "@/lib/format";
import { normalizePhone, phoneToEmail } from "@/lib/phone";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";
import { useClient } from "@/lib/useClient";
import { trackOrder } from "@/lib/useOrder";
import { useLocalOrders } from "@/store/cart";
import { signUpClient } from "./actions";
import { PasswordForm } from "@/components/shop/PasswordForm";

export default function AccountPage() {
  const mounted = useMounted();
  const { session, reload } = useClient();

  return (
    <Container className="max-w-3xl pt-12 md:pt-16">
      <p className="eyebrow">Mon espace</p>
      {!mounted || session.status === "loading" ? (
        <div className="min-h-[40vh]" />
      ) : session.status === "staff" ? (
        <>
          <h1 className="title-serif mt-2 text-[44px] md:text-[56px]">Compte de l'équipe</h1>
          <p className="mt-2 text-muted">Vous êtes connecté avec un compte de l'équipe H.O.K. L'espace client sert aux clients de la boutique.</p>
          <ButtonLink href="/admin" className="mt-6">Aller à l'administration</ButtonLink>
        </>
      ) : session.status === "client" ? (
        session.mustChange ? (
          <ForcedPassword onDone={reload} />
        ) : (
          <ClientSpace name={session.profile?.first_name ?? ""} />
        )
      ) : (
        <GuestSpace />
      )}
    </Container>
  );
}

/* ---------- Visiteur : connexion, création de compte, commandes de l'appareil ---------- */
function GuestSpace() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  return (
    <>
      <h1 className="title-serif mt-2 text-[44px] md:text-[56px]">{tab === "login" ? "Connexion" : "Créer un compte"}</h1>
      <p className="mt-2 text-muted">Le compte est facultatif : vous pouvez toujours commander sans compte. Il garde vos commandes et vos coordonnées sur tous vos appareils.</p>
      <Card className="mt-8">
        <Segmented<"login" | "signup"> label="Connexion ou création" value={tab} onChange={setTab} className="mb-5" options={[{ value: "login", label: "J'ai un compte" }, { value: "signup", label: "Créer un compte" }]} />
        {tab === "login" ? <LoginForm /> : <SignupForm />}
      </Card>
      <DeviceOrders />
    </>
  );
}

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const phone = normalizePhone(String(f.get("phone")));
        if (!phone) return setError("Numéro guinéen invalide (9 chiffres, commençant par 6).");
        setBusy(true);
        setError(null);
        const { error } = await supabaseBrowser().auth.signInWithPassword({ email: phoneToEmail(phone), password: String(f.get("password")) });
        setBusy(false);
        if (error) setError("Numéro ou mot de passe incorrect.");
      }}
    >
      <Field label="Téléphone" htmlFor="l-phone"><input id="l-phone" name="phone" type="tel" inputMode="tel" autoComplete="username" required className="field" placeholder="620 00 00 00" /></Field>
      <Field label="Mot de passe" htmlFor="l-pw"><input id="l-pw" name="password" type="password" autoComplete="current-password" required className="field" /></Field>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</Button>
      <p className="text-center text-xs text-muted">Mot de passe oublié ? Écrivez-nous sur WhatsApp depuis votre numéro : nous vous enverrons un mot de passe provisoire.</p>
    </form>
  );
}

function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (f.get("password") !== f.get("password2")) return setError("Les deux mots de passe ne correspondent pas.");
        setBusy(true);
        setError(null);
        const res = await signUpClient(f);
        if (!res.ok) { setBusy(false); return setError(res.error); }
        const { error } = await supabaseBrowser().auth.signInWithPassword({ email: res.email, password: String(f.get("password")) });
        setBusy(false);
        if (error) setError("Compte créé. Connectez-vous avec votre numéro et votre mot de passe.");
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" htmlFor="s-fn"><input id="s-fn" name="first_name" autoComplete="given-name" required className="field" /></Field>
        <Field label="Nom" htmlFor="s-ln"><input id="s-ln" name="last_name" autoComplete="family-name" required className="field" /></Field>
      </div>
      <Field label="Téléphone" htmlFor="s-phone" hint="Il vous servira à vous connecter"><input id="s-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="field" placeholder="620 00 00 00" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mot de passe" htmlFor="s-pw" hint="8 caractères minimum"><input id="s-pw" name="password" type="password" minLength={8} autoComplete="new-password" required className="field" /></Field>
        <Field label="Confirmer" htmlFor="s-pw2"><input id="s-pw2" name="password2" type="password" minLength={8} autoComplete="new-password" required className="field" /></Field>
      </div>
      {/* Champ invisible : seuls les robots le remplissent */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Création…" : "Créer mon compte"}</Button>
    </form>
  );
}

function DeviceOrders() {
  const refs = useLocalOrders((s) => s.orders);
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => {
    Promise.all(refs.map((r) => trackOrder(r.ref, r.phone))).then((list) => setOrders(list.filter(Boolean) as Order[]));
  }, [refs]);
  if (refs.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Commandes passées depuis cet appareil</h2>
      <OrderList orders={orders} />
    </section>
  );
}

/* ---------- Client connecté ---------- */
function ClientSpace({ name }: { name: string }) {
  const local = useLocalOrders((s) => s.orders);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [claim, setClaim] = useState<{ msg: string; ok: boolean } | null>(null);
  const claimed = useRef(false);

  const load = async () => {
    const { data } = await supabaseBrowser().rpc("my_orders");
    setOrders(((data as Record<string, unknown>[] | null) ?? []).filter(Boolean).map((r) => rowToOrder(r)));
  };

  useEffect(() => {
    // Rattache une seule fois les commandes passées sans compte sur cet appareil
    (async () => {
      if (!claimed.current && local.length) {
        claimed.current = true;
        const db = supabaseBrowser();
        await Promise.all(local.map((r) => db.rpc("claim_order", { p_ref: r.ref, p_phone: r.phone })));
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="title-serif text-[44px] md:text-[56px]">Bonjour{name ? ` ${name}` : ""}</h1>
        <div className="flex gap-2">
          <ButtonLink href="/compte/profil" variant="soft" size="sm"><UserRound className="size-4" /> Mon profil</ButtonLink>
          <Button variant="ghost" size="sm" onClick={() => supabaseBrowser().auth.signOut()}><LogOut className="size-4" /> Déconnexion</Button>
        </div>
      </div>
      <h2 className="mt-8 text-lg font-semibold">Mes commandes</h2>
      <OrderList orders={orders} empty="Aucune commande pour le moment." />

      <Card className="mt-8">
        <h3 className="font-semibold">Rattacher une commande passée sans compte</h3>
        <p className="mt-1 text-sm text-muted">Indiquez sa référence et le téléphone utilisé pour la commande.</p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const { data } = await supabaseBrowser().rpc("claim_order", { p_ref: String(f.get("ref")), p_phone: String(f.get("phone")) });
            setClaim(data ? { ok: true, msg: "Commande ajoutée à votre compte." } : { ok: false, msg: "Référence ou téléphone incorrect." });
            if (data) { e.currentTarget.reset(); load(); }
          }}
        >
          <Field label="Référence" htmlFor="c-ref"><input id="c-ref" name="ref" required className="field uppercase" placeholder="HOK-20261201-0001" /></Field>
          <Field label="Téléphone" htmlFor="c-phone"><input id="c-phone" name="phone" type="tel" required className="field" /></Field>
          <Button type="submit" variant="soft">Rattacher</Button>
        </form>
        {claim && <p role="status" className={`mt-3 text-sm ${claim.ok ? "text-brun" : "text-danger"}`}>{claim.msg}</p>}
      </Card>
    </>
  );
}

function OrderList({ orders, empty }: { orders: Order[] | null; empty?: string }) {
  return (
    <div className="mt-3 space-y-2">
      {orders === null && <Card className="text-sm text-muted">Chargement…</Card>}
      {orders?.length === 0 && empty && <Card className="text-sm text-muted">{empty}</Card>}
      {orders?.map((o) => (
        <Link key={o.ref} href={`/commande/confirmation/${o.ref}`} className="lift flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgb(72_40_10/0.06)]">
          <div className="min-w-0 flex-1">
            <p className="font-semibold tracking-wide">{o.ref}</p>
            <p className="text-sm text-muted">{dateFr(o.createdAt)} · {gnf(o.total)}{o.total - o.paid > 0 && o.status !== "annulee" ? ` · reste ${gnf(o.total - o.paid)}` : ""}</p>
          </div>
          <Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge>
          <ChevronRight className="size-5 shrink-0 text-muted" />
        </Link>
      ))}
    </div>
  );
}

/* ---------- Mot de passe provisoire à remplacer ---------- */
function ForcedPassword({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <h1 className="title-serif mt-2 text-[44px] md:text-[56px]">Nouveau mot de passe</h1>
      <p className="mt-2 text-muted">Vous êtes connecté avec un mot de passe provisoire. Choisissez le vôtre pour continuer.</p>
      <Card className="mt-8">
        <PasswordForm onDone={onDone} onError={setError} />
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      </Card>
    </>
  );
}
