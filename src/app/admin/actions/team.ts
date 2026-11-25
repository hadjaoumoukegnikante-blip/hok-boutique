"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { requireStaff, type StaffRole } from "@/lib/supabase/staff";

const ROLES: StaffRole[] = ["admin", "superviseur", "atelier", "livreur"];

export type TeamResult = { ok: true; email: string; password: string } | { ok: false; error: string };

function tempPassword() {
  // 12 caractères lisibles (sans 0/O, 1/l), à changer à la première connexion
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(12), (b) => alphabet[b % alphabet.length]).join("");
}

/** Crée le compte d'un membre de l'équipe (réservé aux gérantes). */
export async function addMember(_: TeamResult | null, form: FormData): Promise<TeamResult> {
  const me = await requireStaff(["admin"]);
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const fullName = String(form.get("full_name") ?? "").trim();
  const role = String(form.get("role") ?? "") as StaffRole;
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Adresse e-mail invalide." };
  if (fullName.length < 2) return { ok: false, error: "Nom requis." };
  if (!ROLES.includes(role)) return { ok: false, error: "Rôle invalide." };

  const admin = supabaseAdmin();
  if (!admin) return { ok: false, error: "Clé secrète Supabase absente du serveur (SUPABASE_SERVICE_ROLE_KEY). Voir le README." };

  const password = tempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, must_change_password: true },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message.includes("already") ? "Un compte existe déjà avec cet e-mail." : (error?.message ?? "Création impossible.") };
  }
  const { error: e2 } = await admin.from("staff").insert({ user_id: data.user.id, full_name: fullName, role, email });
  if (e2) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: "Rôle non enregistré : " + e2.message };
  }
  await admin.from("audit_log").insert({ user_id: me.user_id, action: "Membre ajouté", target: email, detail: `${fullName} (${role})` });
  revalidatePath("/admin/equipe");
  return { ok: true, email, password };
}

/** Change le rôle ou active / désactive un membre (RLS : gérantes uniquement). */
export async function updateMember(form: FormData) {
  const me = await requireStaff(["admin"]);
  const userId = String(form.get("user_id"));
  const role = form.get("role") ? (String(form.get("role")) as StaffRole) : undefined;
  const active = form.get("active") !== null ? form.get("active") === "true" : undefined;
  if (userId === me.user_id) return; // on ne se retire pas soi-même ses droits
  if (role && !ROLES.includes(role)) return;
  const supabase = await supabaseServer();
  const patch: Record<string, unknown> = {};
  if (role) patch.role = role;
  if (active !== undefined) patch.active = active;
  await supabase.from("staff").update(patch).eq("user_id", userId);
  const admin = supabaseAdmin();
  await admin?.from("audit_log").insert({ user_id: me.user_id, action: "Membre modifié", target: userId, detail: JSON.stringify(patch) });
  revalidatePath("/admin/equipe");
}
