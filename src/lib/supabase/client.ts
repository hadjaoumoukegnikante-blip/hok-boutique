"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase pour le navigateur (clé publique uniquement). */
export function supabaseBrowser() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
