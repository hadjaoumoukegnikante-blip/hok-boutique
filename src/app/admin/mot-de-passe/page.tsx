"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Choisir un nouveau mot de passe (après le lien reçu par e-mail ou à la première connexion). */
export default function NewPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) return setErr("10 caractères minimum.");
    if (pw !== pw2) return setErr("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw, data: { must_change_password: false } });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-beige px-4">
      <form onSubmit={submit} className="glass-strong w-full max-w-sm rounded-[32px] p-8">
        <Image src="/logo-hok.png" alt="H.O.K Boutique" width={1067} height={409} className="mx-auto h-12 w-auto" />
        <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">Nouveau mot de passe</p>
        <div className="mt-8 space-y-4">
          <Field label="Nouveau mot de passe" htmlFor="a" hint="10 caractères minimum">
            <input id="a" type="password" className="field bg-white/80" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Field label="Confirmer" htmlFor="b">
            <input id="b" type="password" className="field bg-white/80" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </Field>
        </div>
        {err && <p className="mt-4 rounded-2xl bg-danger/[0.08] px-4 py-3 text-sm text-danger">{err}</p>}
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>Enregistrer</Button>
      </form>
    </main>
  );
}
