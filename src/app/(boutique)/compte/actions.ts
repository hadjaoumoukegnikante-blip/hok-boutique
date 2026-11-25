"use server";

import { normalizePhone, phoneToEmail } from "@/lib/phone";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type AccountResult = { ok: true; email: string } | { ok: false; error: string };

/**
 * Création d'un compte client : téléphone + mot de passe.
 * Créé côté serveur (clé secrète) pour qu'aucun e-mail de confirmation ne parte
 * vers l'adresse technique ; le navigateur se connecte ensuite avec le mot de passe.
 */
export async function signUpClient(form: FormData): Promise<AccountResult> {
  if (String(form.get("website") ?? "") !== "") return { ok: false, error: "Création impossible." }; // piège à robots
  const firstName = String(form.get("first_name") ?? "").trim();
  const lastName = String(form.get("last_name") ?? "").trim();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  const password = String(form.get("password") ?? "");
  if (!firstName || !lastName) return { ok: false, error: "Prénom et nom requis." };
  if (!phone) return { ok: false, error: "Numéro guinéen invalide (9 chiffres, commençant par 6)." };
  if (password.length < 8) return { ok: false, error: "Mot de passe : 8 caractères minimum." };

  const admin = supabaseAdmin();
  if (!admin) return { ok: false, error: "La création de compte est momentanément indisponible." };

  const email = phoneToEmail(phone);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { kind: "client", full_name: `${firstName} ${lastName}` },
  });
  if (error || !data.user) {
    const taken = error?.message.toLowerCase().includes("already");
    return { ok: false, error: taken ? "Un compte existe déjà avec ce numéro. Connectez-vous." : "Création impossible, réessayez." };
  }
  const { error: e2 } = await admin.from("customers").insert({ user_id: data.user.id, first_name: firstName, last_name: lastName, phone });
  if (e2) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: "Création impossible, réessayez." };
  }
  return { ok: true, email };
}

/** Changement de numéro : c'est aussi l'identifiant de connexion. */
export async function changeClientPhone(newPhone: string): Promise<AccountResult> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée, reconnectez-vous." };
  const phone = normalizePhone(newPhone);
  if (!phone) return { ok: false, error: "Numéro guinéen invalide (9 chiffres, commençant par 6)." };
  const admin = supabaseAdmin();
  if (!admin) return { ok: false, error: "Modification momentanément indisponible." };
  const { data: cust } = await admin.from("customers").select("id").eq("user_id", user.id).maybeSingle();
  if (!cust) return { ok: false, error: "Profil introuvable." };
  const email = phoneToEmail(phone);
  const { error } = await admin.auth.admin.updateUserById(user.id, { email, email_confirm: true });
  if (error) return { ok: false, error: error.message.toLowerCase().includes("already") ? "Ce numéro est déjà utilisé par un autre compte." : "Modification impossible." };
  await admin.from("customers").update({ phone }).eq("id", cust.id);
  return { ok: true, email };
}
