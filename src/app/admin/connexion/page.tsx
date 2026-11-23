"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Field } from "@/components/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-beige px-4">
      <div aria-hidden className="absolute -right-24 -top-24 size-[520px] rounded-full bg-brun/35 blur-[100px]" />
      <div aria-hidden className="absolute -bottom-32 -left-20 size-[420px] rounded-full bg-white/70 blur-[90px]" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Authentification réelle via le backend (accès protégé, rôles)
          router.push("/admin");
        }}
        className="glass-strong relative w-full max-w-sm rounded-[32px] p-8 shadow-[0_30px_60px_-30px_rgb(72_40_10/0.5)]"
      >
        <Image src="/logo-hok.png" alt="H.O.K Boutique" width={1067} height={409} className="mx-auto h-12 w-auto" />
        <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">Administration</p>
        <div className="mt-8 space-y-4">
          <Field label="Identifiant" htmlFor="u"><input id="u" className="field bg-white/80" autoComplete="username" required /></Field>
          <Field label="Mot de passe" htmlFor="p"><input id="p" type="password" className="field bg-white/80" autoComplete="current-password" required /></Field>
        </div>
        <Button type="submit" size="lg" className="mt-6 w-full">Se connecter</Button>
      </form>
    </main>
  );
}
