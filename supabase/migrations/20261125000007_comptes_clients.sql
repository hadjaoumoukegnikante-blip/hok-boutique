-- =====================================================================
-- H.O.K Boutique · 7 · Comptes clients (facultatifs)
-- Connexion par téléphone + mot de passe. Le compte Supabase utilise une
-- adresse technique <9 chiffres>@clients.hokboutique.com (jamais affichée).
-- Sans vérification par SMS, un compte ne voit QUE :
--   - les commandes passées en étant connecté ;
--   - les commandes qu'il rattache en prouvant la référence + le téléphone
--     (même niveau de preuve que le suivi de commande).
-- =====================================================================

alter table public.customers add column if not exists commune  text;
alter table public.customers add column if not exists quartier text;
alter table public.customers add column if not exists address  text;

alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_user_id_idx on public.orders (user_id);

-- Une commande passée par un client connecté lui appartient (jamais pour l'équipe)
create or replace function public.set_order_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not is_staff() then new.user_id := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists orders_owner on public.orders;
create trigger orders_owner before insert on public.orders for each row execute function public.set_order_owner();

-- Mes commandes : même contenu que le suivi (sans champs internes)
create or replace function public.my_orders() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare out jsonb := '[]'::jsonb; o orders;
begin
  if auth.uid() is null then return out; end if;
  for o in select * from orders where user_id = auth.uid() order by created_at desc loop
    out := out || jsonb_build_array(track_order(o.ref, o.phone));
  end loop;
  return out;
end $$;

-- Rattacher une commande passée sans compte (référence + téléphone)
create or replace function public.claim_order(p_ref text, p_phone text) returns boolean
language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  if auth.uid() is null or is_staff() then return false; end if;
  select * into o from orders where ref = upper(trim(p_ref)) for update;
  if not found or not same_phone(o.phone, p_phone) then return false; end if;
  if o.user_id is null then update orders set user_id = auth.uid() where ref = o.ref; return true; end if;
  return o.user_id = auth.uid();
end $$;

-- Profil : le client met à jour sa fiche (le téléphone se change côté serveur,
-- car il sert d'identifiant de connexion)
create or replace function public.update_my_profile(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Non connecté.' using errcode = 'P0001'; end if;
  if coalesce(trim(p ->> 'first_name'), '') = '' or coalesce(trim(p ->> 'last_name'), '') = '' then
    raise exception 'Nom et prénom requis.' using errcode = 'P0001';
  end if;
  update customers set
    first_name = trim(p ->> 'first_name'),
    last_name = trim(p ->> 'last_name'),
    email = nullif(trim(p ->> 'email'), ''),
    commune = nullif(trim(p ->> 'commune'), ''),
    quartier = nullif(trim(p ->> 'quartier'), ''),
    address = nullif(trim(p ->> 'address'), ''),
    marketing_consent = coalesce((p ->> 'marketing_consent')::boolean, false)
  where user_id = auth.uid();
  if not found then raise exception 'Profil introuvable.' using errcode = 'P0001'; end if;
end $$;

revoke execute on function public.set_order_owner(), public.my_orders(), public.claim_order(text, text),
  public.update_my_profile(jsonb) from public, anon, authenticated;
grant execute on function public.my_orders(), public.claim_order(text, text), public.update_my_profile(jsonb) to authenticated;
