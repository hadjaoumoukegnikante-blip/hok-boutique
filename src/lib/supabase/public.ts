import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client public (clé publishable, sans session) pour les pages de la boutique.
 * Les lectures sont mises en cache 30 s : le catalogue reste rapide, et la
 * disponibilité réelle est de toute façon revérifiée par la base à la commande.
 */
export function supabasePublic(revalidate = 30) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate } }) },
  });
}
