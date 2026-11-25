"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "./supabase/client";

export type ClientProfile = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  commune: string | null;
  quartier: string | null;
  address: string | null;
  marketing_consent: boolean;
};

export type ClientSession =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "staff"; user: User }
  | { status: "client"; user: User; profile: ClientProfile | null; mustChange: boolean };

/** Session du visiteur : invité, client connecté ou membre de l'équipe. */
export function useClient() {
  const [s, setS] = useState<ClientSession>({ status: "loading" });

  const load = useCallback(async () => {
    const db = supabaseBrowser();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return setS({ status: "guest" });
    const { data: staff } = await db.rpc("is_staff");
    if (staff) return setS({ status: "staff", user });
    const { data: profile } = await db.from("customers").select("*").eq("user_id", user.id).maybeSingle();
    setS({ status: "client", user, profile: profile as ClientProfile | null, mustChange: !!user.user_metadata?.must_change_password });
  }, []);

  useEffect(() => {
    load();
    const { data } = supabaseBrowser().auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT" || e === "USER_UPDATED") load();
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  return { session: s, reload: load };
}
