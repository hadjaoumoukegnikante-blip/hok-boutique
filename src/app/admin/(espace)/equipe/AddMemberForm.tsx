"use client";

import { Check, Copy, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field } from "@/components/ui";
import { addMember, type TeamResult } from "@/app/admin/actions/team";

export function AddMemberForm({ roles, hasSecret }: { roles: { value: string; label: string }[]; hasSecret: boolean }) {
  const [state, action, pending] = useActionState<TeamResult | null, FormData>(addMember, null);
  const [copied, setCopied] = useState(false);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgb(72_40_10/0.06)]">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        <UserPlus className="size-[18px] text-brun" strokeWidth={1.7} /> Ajouter un membre
      </h2>
      {!hasSecret && (
        <p className="mt-3 rounded-2xl bg-bordeaux/[0.06] px-4 py-3 text-xs leading-relaxed text-bordeaux">
          La clé secrète Supabase n'est pas encore configurée sur le serveur : l'ajout de membres est désactivé.
        </p>
      )}
      {state?.ok ? (
        <div className="mt-4 rounded-2xl bg-ok/[0.08] p-4 text-sm">
          <p className="font-semibold text-ok">Compte créé pour {state.email}</p>
          <p className="mt-2 text-soft">Mot de passe provisoire, à transmettre en privé (il ne sera plus affiché) :</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-xl bg-white px-3 py-2 font-mono text-[15px] tracking-wide">{state.password}</code>
            <button
              type="button"
              aria-label="Copier le mot de passe"
              onClick={async () => {
                await navigator.clipboard.writeText(state.password);
                setCopied(true);
              }}
              className="grid size-10 place-items-center rounded-xl bg-white text-brun"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">À la première connexion, le membre choisit son propre mot de passe.</p>
        </div>
      ) : (
        <form action={action} className="mt-4 space-y-4">
          <Field label="Nom complet" htmlFor="full_name"><input id="full_name" name="full_name" className="field" required disabled={!hasSecret} /></Field>
          <Field label="E-mail" htmlFor="email"><input id="email" name="email" type="email" className="field" required disabled={!hasSecret} /></Field>
          <Field label="Rôle" htmlFor="role">
            <select id="role" name="role" className="field" defaultValue="superviseur" disabled={!hasSecret}>
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          {state && !state.ok && <p className="rounded-2xl bg-danger/[0.08] px-4 py-3 text-sm text-danger">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending || !hasSecret}>{pending ? "Création…" : "Créer le compte"}</Button>
        </form>
      )}
    </section>
  );
}
