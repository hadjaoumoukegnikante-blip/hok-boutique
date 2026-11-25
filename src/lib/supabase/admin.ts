import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client avec la clé secrète (service_role) : uniquement côté serveur,
 * uniquement pour ce que la RLS ne permet pas (création de comptes de l'équipe).
 * La clé vit dans SUPABASE_SERVICE_ROLE_KEY (.env.local et variables Vercel), jamais dans le code.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
