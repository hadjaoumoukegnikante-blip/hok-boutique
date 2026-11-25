"use server";

import { isClientEmail } from "@/lib/phone";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/supabase/staff";
import { tempPassword } from "@/lib/temp-password";

export type ResetResult = { ok: true; password: string } | { ok: false; error: string } | null;

/**
 * Mot de passe oublié d'un client : la boutique vérifie l'identité sur WhatsApp
 * (message venant du numéro du compte), puis génère un mot de passe provisoire.
 */
export async function resetClientPassword(_: ResetResult, form: FormData): Promise<ResetResult> {
  const me = await requireStaff(["admin", "superviseur"]);
  const admin = supabaseAdmin();
  if (!admin) return { ok: false, error: "Clé secrète Supabase absente du serveur." };
  const customerId = String(form.get("customer_id"));
  const { data: c } = await admin.from("customers").select("user_id, first_name, last_name, phone").eq("id", customerId).maybeSingle();
  if (!c?.user_id) return { ok: false, error: "Ce client n'a pas de compte." };
  const { data: u } = await admin.auth.admin.getUserById(c.user_id);
  if (!isClientEmail(u.user?.email)) return { ok: false, error: "Compte non client : réinitialisation refusée." };
  const password = tempPassword();
  const { error } = await admin.auth.admin.updateUserById(c.user_id, {
    password,
    user_metadata: { ...(u.user?.user_metadata ?? {}), must_change_password: true },
  });
  if (error) return { ok: false, error: "Réinitialisation impossible." };
  await admin.from("audit_log").insert({ user_id: me.user_id, action: "Mot de passe client réinitialisé", target: c.phone, detail: `${c.first_name} ${c.last_name}` });
  return { ok: true, password };
}
