"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PasswordForm } from "@/components/shop/PasswordForm";
import { useShopData } from "@/components/shop/ShopData";
import { Button, Card, Container, Field, useMounted } from "@/components/ui";
import { formatPhone } from "@/lib/phone";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useClient } from "@/lib/useClient";
import { changeClientPhone } from "../actions";

export default function ProfilePage() {
  const mounted = useMounted();
  const router = useRouter();
  const { session, reload } = useClient();
  const { zones } = useShopData();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [phoneMsg, setPhoneMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session.status === "guest") router.replace("/compte");
    if (session.status === "staff") router.replace("/compte");
  }, [session.status, router]);

  if (!mounted || session.status !== "client") return <Container className="min-h-[60vh]" />;
  const p = session.profile;

  return (
    <Container className="max-w-3xl pt-12 md:pt-16">
      <Link href="/compte" className="inline-flex items-center gap-1 text-sm text-brun hover:underline"><ChevronLeft className="size-4" /> Mon espace</Link>
      <h1 className="title-serif mt-2 text-[44px] md:text-[56px]">Mon profil</h1>
      <p className="mt-2 text-muted">Ces informations sont préremplies lors de vos commandes.</p>

      {!p ? (
        <Card className="mt-8 text-sm text-muted">Profil introuvable. Contactez la boutique sur WhatsApp.</Card>
      ) : (
        <>
          <Card className="mt-8">
            <h2 className="mb-4 font-semibold">Coordonnées et adresse de livraison</h2>
            <form
              key={p.id + (p.first_name ?? "")}
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const email = String(f.get("email") ?? "").trim();
                if (email && !/^\S+@\S+\.\S+$/.test(email)) return setMsg({ ok: false, text: "Adresse e-mail invalide." });
                setBusy(true);
                const { error } = await supabaseBrowser().rpc("update_my_profile", {
                  p: {
                    first_name: f.get("first_name"), last_name: f.get("last_name"), email,
                    commune: f.get("commune"), quartier: f.get("quartier"), address: f.get("address"),
                    marketing_consent: f.get("marketing") === "on",
                  },
                });
                setBusy(false);
                setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Profil enregistré." });
                if (!error) reload();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prénom" htmlFor="fn"><input id="fn" name="first_name" defaultValue={p.first_name} required className="field" /></Field>
                <Field label="Nom" htmlFor="ln"><input id="ln" name="last_name" defaultValue={p.last_name} required className="field" /></Field>
                <Field label="E-mail (facultatif)" htmlFor="em"><input id="em" name="email" type="email" defaultValue={p.email ?? ""} className="field" /></Field>
                <Field label="Commune" htmlFor="co">
                  <select id="co" name="commune" defaultValue={p.commune ?? ""} className="field">
                    <option value="">Choisir</option>
                    {zones.map((z) => <option key={z.commune} value={z.commune}>{z.commune}</option>)}
                  </select>
                </Field>
                <Field label="Quartier" htmlFor="qu"><input id="qu" name="quartier" defaultValue={p.quartier ?? ""} className="field" /></Field>
                <Field label="Repère ou adresse" htmlFor="ad"><input id="ad" name="address" defaultValue={p.address ?? ""} className="field" /></Field>
              </div>
              <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="marketing" defaultChecked={p.marketing_consent} className="size-4 accent-[#683C11]" /> Recevoir les nouveautés et offres de H.O.K</label>
              {msg && <p role="status" className={`text-sm ${msg.ok ? "text-brun" : "text-danger"}`}>{msg.text}</p>}
              <Button type="submit" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</Button>
            </form>
          </Card>

          <Card className="mt-5">
            <h2 className="font-semibold">Numéro de téléphone</h2>
            <p className="mt-1 text-sm text-muted">Actuel : {formatPhone(p.phone)}. Il sert aussi à vous connecter.</p>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const res = await changeClientPhone(String(new FormData(form).get("phone")));
                if (!res.ok) return setPhoneMsg({ ok: false, text: res.error });
                await supabaseBrowser().auth.refreshSession();
                form.reset();
                setPhoneMsg({ ok: true, text: "Numéro modifié. Utilisez-le désormais pour vous connecter." });
                reload();
              }}
            >
              <Field label="Nouveau numéro" htmlFor="np"><input id="np" name="phone" type="tel" inputMode="tel" required className="field" placeholder="620 00 00 00" /></Field>
              <Button type="submit" variant="soft">Modifier</Button>
            </form>
            {phoneMsg && <p role="status" className={`mt-3 text-sm ${phoneMsg.ok ? "text-brun" : "text-danger"}`}>{phoneMsg.text}</p>}
          </Card>

          <Card className="mt-5">
            <h2 className="mb-4 font-semibold">Mot de passe</h2>
            <PasswordForm onDone={() => setPwMsg({ ok: true, text: "Mot de passe modifié." })} onError={(t) => setPwMsg(t ? { ok: false, text: t } : null)} />
            {pwMsg && <p role="status" className={`mt-3 text-sm ${pwMsg.ok ? "text-brun" : "text-danger"}`}>{pwMsg.text}</p>}
          </Card>
        </>
      )}
    </Container>
  );
}
