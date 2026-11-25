"use client";

import { useState } from "react";
import { Button, Field } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Changement de mot de passe du compte connecté (client). */
export function PasswordForm({ onDone, onError }: { onDone: () => void; onError: (e: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const pw = String(f.get("password"));
        if (pw.length < 8) return onError("8 caractères minimum.");
        if (pw !== f.get("password2")) return onError("Les deux mots de passe ne correspondent pas.");
        setBusy(true);
        const { error } = await supabaseBrowser().auth.updateUser({ password: pw, data: { must_change_password: false } });
        setBusy(false);
        if (error) return onError(error.message.includes("different") ? "Choisissez un mot de passe différent de l'ancien." : "Modification impossible.");
        onError(null);
        e.currentTarget.reset();
        onDone();
      }}
    >
      <Field label="Nouveau mot de passe" htmlFor="p1"><input id="p1" name="password" type="password" minLength={8} autoComplete="new-password" required className="field" /></Field>
      <Field label="Confirmer" htmlFor="p2"><input id="p2" name="password2" type="password" minLength={8} autoComplete="new-password" required className="field" /></Field>
      <Button type="submit" disabled={busy}>{busy ? "…" : "Enregistrer"}</Button>
    </form>
  );
}
