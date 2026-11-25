"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Field } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "err" | "ok"; text: string } | null>(
    params.get("erreur") === "acces" ? { tone: "err", text: "Ce compte n'a pas accès à l'administration." } : null,
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = supabaseBrowser();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMsg({ tone: "err", text: error.message.includes("Invalid") ? "E-mail ou mot de passe incorrect." : error.message });
        setBusy(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin/mot-de-passe`,
      });
      setMsg(error ? { tone: "err", text: error.message } : { tone: "ok", text: "Si ce compte existe, un e-mail de réinitialisation vient d'être envoyé." });
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-strong relative w-full max-w-sm rounded-[32px] p-8 shadow-[0_30px_60px_-30px_rgb(72_40_10/0.5)]">
      <Image src="/logo-hok.png" alt="H.O.K Boutique" width={1067} height={409} className="mx-auto h-12 w-auto" priority />
      <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
        {mode === "login" ? "Administration" : "Mot de passe oublié"}
      </p>
      <div className="mt-8 space-y-4">
        <Field label="E-mail" htmlFor="u">
          <input id="u" type="email" className="field bg-white/80" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {mode === "login" && (
          <Field label="Mot de passe" htmlFor="p">
            <div className="relative">
              <input id="p" type={show ? "text" : "password"} className="field bg-white/80 pr-12" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} onClick={() => setShow(!show)} className="absolute right-1 top-1 grid size-10 place-items-center rounded-xl text-muted hover:text-brun">
                {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            </div>
          </Field>
        )}
      </div>
      {msg && <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${msg.tone === "err" ? "bg-danger/[0.08] text-danger" : "bg-ok/10 text-ok"}`}>{msg.text}</p>}
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
        {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Envoyer le lien"}
      </Button>
      <button type="button" onClick={() => { setMode(mode === "login" ? "reset" : "login"); setMsg(null); }} className="mt-4 w-full text-center text-sm text-brun hover:underline">
        {mode === "login" ? "Mot de passe oublié ?" : "Retour à la connexion"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-beige px-4">
      <div aria-hidden className="absolute -right-24 -top-24 size-[520px] rounded-full bg-brun/35 blur-[100px]" />
      <div aria-hidden className="absolute -bottom-32 -left-20 size-[420px] rounded-full bg-white/70 blur-[90px]" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
