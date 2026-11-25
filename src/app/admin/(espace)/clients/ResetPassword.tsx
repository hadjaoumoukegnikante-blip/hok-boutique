"use client";

import { KeyRound } from "lucide-react";
import { useActionState } from "react";
import { resetClientPassword, type ResetResult } from "@/app/admin/actions/clients";

export function ResetPassword({ customerId, name }: { customerId: string; name: string }) {
  const [state, action, pending] = useActionState<ResetResult, FormData>(resetClientPassword, null);
  if (state?.ok)
    return (
      <span className="block text-xs">
        Provisoire : <b className="select-all font-mono text-sm tracking-wide">{state.password}</b>
        <span className="block text-muted">À envoyer sur WhatsApp. Le client le changera à la connexion.</span>
      </span>
    );
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(`Générer un mot de passe provisoire pour ${name} ?`)) e.preventDefault(); }}>
      <input type="hidden" name="customer_id" value={customerId} />
      <button type="submit" disabled={pending} className="press inline-flex items-center gap-1 text-xs font-semibold text-brun hover:underline disabled:opacity-50">
        <KeyRound className="size-3.5" /> {pending ? "…" : "Mot de passe"}
      </button>
      {state && !state.ok && <span className="block text-xs text-danger">{state.error}</span>}
    </form>
  );
}
