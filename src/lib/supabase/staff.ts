import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "./server";

export type StaffRole = "admin" | "superviseur" | "atelier" | "livreur";
export interface StaffMember {
  user_id: string;
  full_name: string;
  role: StaffRole;
  email: string | null;
  active: boolean;
}

/** Membre de l'équipe connecté, ou redirection vers la connexion. */
export async function requireStaff(roles?: StaffRole[]): Promise<StaffMember> {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/admin/connexion");
  const { data: me } = await supabase.from("staff").select("user_id, full_name, role, email, active").eq("user_id", auth.user.id).maybeSingle();
  if (!me || !me.active) redirect("/admin/connexion?erreur=acces");
  // Compte créé avec un mot de passe provisoire : il doit d'abord en choisir un
  if (auth.user.user_metadata?.must_change_password) redirect("/admin/mot-de-passe");
  if (roles && !roles.includes(me.role)) redirect("/admin?erreur=role");
  return me as StaffMember;
}
