-- =====================================================================
-- H.O.K Boutique · INSTALLATION COMPLÈTE (fichier généré, ne pas modifier)
-- Contient, dans l'ordre : schéma, fonctions, sécurité, données de départ, droits d'accès.
-- À coller en une fois dans le SQL Editor de Supabase, puis « Run ».
-- L'annulation automatique (migrations/20261125000004_cron.sql) se lance à part.
-- =====================================================================

-- >>> migrations/20261125000001_schema.sql
-- =====================================================================
-- H.O.K Boutique · 1/4 · Schéma de la base
-- À exécuter en premier dans le SQL Editor de Supabase.
-- =====================================================================

-- ---------- Types ----------------------------------------------------
create type public.univers_key as enum ('studio', 'bijoux', 'maison');
create type public.product_status as enum ('en_stock', 'sur_commande', 'precommande', 'indisponible');
create type public.order_status as enum (
  'en_attente_paiement', 'paiement_a_verifier', 'confirmee', 'en_preparation',
  'partiellement_prete', 'prete_a_expedier', 'expediee', 'livree', 'annulee'
);
create type public.payment_status as enum (
  'en_attente', 'preuve_recue', 'a_verifier', 'partiellement_paye', 'paye', 'echec', 'rembourse'
);
create type public.payment_mode as enum ('orange_money', 'a_la_livraison');
create type public.staff_role as enum ('admin', 'superviseur', 'atelier', 'livreur');
create type public.production_stage as enum ('a_demarrer', 'decoupe', 'couture', 'finitions', 'terminee');

-- ---------- Équipe (comptes d'administration) ------------------------
-- Chaque membre a un compte Supabase Auth ; cette table lui donne un rôle.
create table public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  role       public.staff_role not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Paramètres de la boutique (une seule ligne) --------------
create table public.settings (
  id                  int primary key default 1 check (id = 1),
  shop_name           text not null default 'H.O.K Boutique',
  phone               text,
  email               text,
  whatsapp            text,           -- format international sans + ni espaces
  domain              text default 'hokboutique.com',
  workshop            text,
  om_merchant_code    text,
  om_beneficiary      text,
  rccm                text,
  nif                 text,
  reservation_hours   int default 24, -- annulation des commandes impayées
  extra_shipment_fee  int not null default 25000,
  delivery_provisional boolean not null default true,
  updated_at          timestamptz not null default now()
);

-- Règles de paiement par univers
create table public.payment_rules (
  univers                   public.univers_key primary key,
  deposit_rate              numeric(4,3) not null check (deposit_rate between 0 and 1),
  allow_cash_on_delivery    boolean not null,
  requires_making_acceptance boolean not null
);

-- Zones et frais de livraison (Conakry)
create table public.delivery_zones (
  commune  text primary key,
  fee      int not null check (fee >= 0),
  active   boolean not null default true,
  position int not null default 0
);

-- ---------- Catalogue -------------------------------------------------
create table public.univers (
  key      public.univers_key primary key,
  slug     text not null unique,
  label    text not null,
  brand    text not null,
  tagline  text,
  position int not null default 0
);

create table public.subcategories (
  id       uuid primary key default gen_random_uuid(),
  univers  public.univers_key not null references public.univers (key),
  slug     text not null,
  label    text not null,
  active   boolean not null default true,
  position int not null default 0,
  unique (univers, slug)
);

-- Matières premières (tissus, charms, cire, etc.)
create table public.materials (
  id         text primary key,
  name       text not null,
  univers    public.univers_key not null,
  unit       text not null,
  quantity   numeric(10,2) not null default 0 check (quantity >= 0),
  reserved   numeric(10,2) not null default 0 check (reserved >= 0),
  threshold  numeric(10,2) not null default 0,
  unit_cost  int,
  note       text,
  updated_at timestamptz not null default now(),
  check (reserved <= quantity)
);

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  ref              text not null unique,
  slug             text not null unique,
  name             text not null,
  description      text not null default '',
  price            int not null check (price >= 0),
  price_pending    boolean not null default false,
  univers          public.univers_key not null references public.univers (key),
  subcategory_id   uuid references public.subcategories (id),
  status           public.product_status not null,
  stock            int not null default 0 check (stock >= 0),
  reserved         int not null default 0 check (reserved >= 0),
  making_days      int,
  delivery_days    int,
  is_new           boolean not null default false,
  -- Variantes, même format que le front : [{kind, label, options:[{value,label,hex?}]}]
  variants         jsonb not null default '[]'::jsonb,
  -- Tissu imposé par le modèle (robes)
  fabric_material_id text references public.materials (id),
  fabric_meters    numeric(6,2),
  fabric_color     text,
  fabric_hex       text,
  fabric_pattern   text check (fabric_pattern in ('uni', 'rayures')),
  active           boolean not null default true,
  is_demo          boolean not null default false, -- exemples à supprimer avant lancement
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (reserved <= stock),
  check (fabric_material_id is null or fabric_meters > 0)
);
create index on public.products (univers, active);

-- Coût d'achat ou de production (marge) : table séparée, invisible du public
create table public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  cost       int not null check (cost >= 0),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path       text not null,          -- chemin dans le bucket product-images
  position   int not null default 0
);
create index on public.product_images (product_id, position);

create table public.promos (
  code          text primary key check (code = upper(code)),
  kind          text not null check (kind in ('pourcentage', 'montant')),
  value         int not null check (value > 0),
  min_purchase  int,
  starts_at     timestamptz,
  ends_at       timestamptz,
  max_uses      int,
  used          int not null default 0,
  univers       public.univers_key[],  -- null = tous les univers
  cumulable     boolean not null default false,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  check (kind <> 'pourcentage' or value <= 100)
);

-- ---------- Clients et commandes -------------------------------------
create table public.customers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid unique references auth.users (id) on delete set null,
  first_name        text not null,
  last_name         text not null,
  phone             text not null,
  email             text,
  marketing_consent boolean not null default false,
  created_at        timestamptz not null default now()
);
create index on public.customers (phone);

create table public.orders (
  ref               text primary key,        -- HOK-AAAAMMJJ-XXXX
  created_at        timestamptz not null default now(),
  customer_id       uuid references public.customers (id),
  first_name        text not null,
  last_name         text not null,
  phone             text not null,
  email             text,
  commune           text not null,
  quartier          text not null,
  address           text,
  marketing_consent boolean not null default false,
  subtotal          int not null,
  discount          int not null default 0,
  promo_code        text references public.promos (code),
  delivery_fee      int not null,
  total             int not null,
  deposit_due       int not null,          -- exigé avant confection / livraison
  paid              int not null default 0,
  payment_mode      public.payment_mode not null,
  payment_status    public.payment_status not null default 'en_attente',
  status            public.order_status not null,
  making_days       int,
  delivery_days     int,
  split_delivery    boolean not null default false,
  invoice_number    text not null unique,
  expires_at        timestamptz,           -- annulation auto si impayée
  delivery_staff    uuid references public.staff (user_id),
  updated_at        timestamptz not null default now(),
  check (paid >= 0 and paid <= total)
);
create index on public.orders (status);
create index on public.orders (phone);

create table public.order_lines (
  id                       uuid primary key default gen_random_uuid(),
  order_ref                text not null references public.orders (ref) on delete cascade,
  product_id               uuid references public.products (id),
  product_ref              text not null,
  name                     text not null,
  univers                  public.univers_key not null,
  variant_label            text not null default '',
  selection                jsonb not null default '{}'::jsonb,
  qty                      int not null check (qty > 0),
  unit_price               int not null,
  made_to_order            boolean not null,
  measurements             jsonb,           -- {poitrine, taille, hanches, longueur, hauteur?, note?}
  measurements_by_whatsapp boolean not null default false,
  fabric_material_id       text references public.materials (id),
  fabric_meters_reserved   numeric(6,2) not null default 0,
  stock_reserved           int not null default 0,
  cut_done                 boolean not null default false  -- tissu découpé : perte en cas d'annulation
);
create index on public.order_lines (order_ref);

create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  order_ref    text not null references public.orders (ref) on delete cascade,
  created_at   timestamptz not null default now(),
  amount       int not null check (amount > 0),
  mode         public.payment_mode not null,
  payer_number text,
  status       public.payment_status not null,
  proof_path   text,                       -- chemin dans le bucket payment-proofs
  verified_by  uuid references auth.users (id),
  verified_at  timestamptz
);
create index on public.payments (order_ref);
create index on public.payments (status);

create table public.production_jobs (
  id            uuid primary key default gen_random_uuid(),
  order_line_id uuid not null unique references public.order_lines (id) on delete cascade,
  stage         public.production_stage not null default 'a_demarrer',
  due_date      date,
  updated_at    timestamptz not null default now()
);

-- Mouvements de stock (produits finis et matières)
create table public.stock_movements (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  product_id  uuid references public.products (id),
  material_id text references public.materials (id),
  kind        text not null check (kind in ('entree', 'reservation', 'liberation', 'sortie', 'perte', 'ajustement')),
  quantity    numeric(10,2) not null,
  order_ref   text references public.orders (ref),
  user_id     uuid,
  note        text,
  check (product_id is not null or material_id is not null)
);

-- Journal des opérations sensibles
create table public.audit_log (
  id      bigint generated always as identity primary key,
  at      timestamptz not null default now(),
  user_id uuid,
  action  text not null,
  target  text not null,
  detail  text
);
create index on public.audit_log (target);

-- Compteurs pour des références uniques, jamais réutilisées
create table public.order_counters (day date primary key, last int not null);
create table public.invoice_counters (year int primary key, last int not null);

-- ---------- Mises à jour automatiques de updated_at ------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

create trigger t_products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger t_orders_touch before update on public.orders for each row execute function public.touch_updated_at();
create trigger t_materials_touch before update on public.materials for each row execute function public.touch_updated_at();
create trigger t_settings_touch before update on public.settings for each row execute function public.touch_updated_at();
create trigger t_jobs_touch before update on public.production_jobs for each row execute function public.touch_updated_at();

-- >>> migrations/20261125000002_functions.sql
-- =====================================================================
-- H.O.K Boutique · 2/4 · Fonctions métier (exécutées côté serveur)
-- Le navigateur n'envoie que des choix ; prix, acompte, frais, stock et
-- références sont toujours recalculés ici. On ne fait jamais confiance au client.
-- =====================================================================

-- ---------- Rôles ----------------------------------------------------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and active);
$$;

create or replace function public.has_role(roles public.staff_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and active and role = any (roles));
$$;

create or replace function public.log_action(p_action text, p_target text, p_detail text)
returns void language sql security definer set search_path = public as $$
  insert into audit_log (user_id, action, target, detail) values (auth.uid(), p_action, p_target, p_detail);
$$;

create or replace function public.digits(p text) returns text
language sql immutable as $$ select regexp_replace(coalesce(p, ''), '\D', '', 'g') $$;

-- Deux numéros identiques si leurs 9 derniers chiffres concordent (avec ou sans 224)
create or replace function public.same_phone(a text, b text) returns boolean
language sql immutable as $$
  select length(public.digits(a)) >= 9 and right(public.digits(a), 9) = right(public.digits(b), 9)
$$;

-- ---------- Références -----------------------------------------------
create or replace function public.next_order_ref() returns text
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Africa/Conakry')::date; n int;
begin
  insert into order_counters (day, last) values (d, 1)
  on conflict (day) do update set last = order_counters.last + 1
  returning last into n;
  return 'HOK-' || to_char(d, 'YYYYMMDD') || '-' || lpad(n::text, 4, '0');
end $$;

create or replace function public.next_invoice_number() returns text
language plpgsql security definer set search_path = public as $$
declare y int := extract(year from (now() at time zone 'Africa/Conakry'))::int; n int;
begin
  insert into invoice_counters (year, last) values (y, 1)
  on conflict (year) do update set last = invoice_counters.last + 1
  returning last into n;
  return 'FAC-' || y || '-' || lpad(n::text, 4, '0');
end $$;

-- ---------- Disponibilité --------------------------------------------
-- Pièces vendables : stock libre pour les produits finis, tissu libre pour la confection
create or replace function public.available_qty(p public.products) returns int
language sql stable security definer set search_path = public as $$
  select case
    when not p.active or p.status = 'indisponible' then 0
    when p.status = 'sur_commande' and p.fabric_material_id is not null then
      coalesce((select floor((m.quantity - m.reserved) / p.fabric_meters)::int from materials m where m.id = p.fabric_material_id), 0)
    when p.status in ('sur_commande', 'precommande') then 99
    else greatest(p.stock - p.reserved, 0)
  end
$$;

-- Vue publique du catalogue (avec la disponibilité calculée, sans les coûts)
create or replace view public.catalogue with (security_invoker = true) as
select p.id, p.ref, p.slug, p.name, p.description, p.price, p.price_pending, p.univers,
       s.slug as subcategory, p.status, p.making_days, p.delivery_days, p.is_new, p.variants,
       p.fabric_material_id, p.fabric_meters, p.fabric_color, p.fabric_hex, p.fabric_pattern,
       public.available_qty(p) as available, p.stock, p.created_at,
       coalesce((select jsonb_agg(i.path order by i.position) from product_images i where i.product_id = p.id), '[]'::jsonb) as images
from products p
left join subcategories s on s.id = p.subcategory_id
where p.active;

-- ---------- Codes promo ----------------------------------------------
-- p_amounts : {"studio": 350000, "bijoux": 0, "maison": 120000}
create or replace function public.check_promo(p_code text, p_amounts jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare pr promos; eligible int := 0; k text;
begin
  select * into pr from promos where code = upper(trim(p_code));
  if not found or not pr.active then return jsonb_build_object('ok', false, 'message', 'Ce code n''est pas valide.'); end if;
  if pr.starts_at is not null and pr.starts_at > now() then return jsonb_build_object('ok', false, 'message', 'Ce code n''est pas encore actif.'); end if;
  if pr.ends_at is not null and pr.ends_at < now() then return jsonb_build_object('ok', false, 'message', 'Ce code a expiré.'); end if;
  if pr.max_uses is not null and pr.used >= pr.max_uses then return jsonb_build_object('ok', false, 'message', 'Ce code a atteint sa limite d''utilisation.'); end if;
  for k in select jsonb_object_keys(p_amounts) loop
    if pr.univers is null or k::univers_key = any (pr.univers) then
      eligible := eligible + coalesce((p_amounts ->> k)::int, 0);
    end if;
  end loop;
  if eligible <= 0 then return jsonb_build_object('ok', false, 'message', 'Aucun article éligible à ce code.'); end if;
  if pr.min_purchase is not null and eligible < pr.min_purchase then
    return jsonb_build_object('ok', false, 'message', 'Minimum d''achat requis : ' || pr.min_purchase || ' GNF.');
  end if;
  return jsonb_build_object('ok', true, 'code', pr.code, 'kind', pr.kind, 'value', pr.value, 'univers', pr.univers,
    'discount', case when pr.kind = 'pourcentage' then round(eligible * pr.value / 100.0)::int else least(pr.value, eligible) end);
end $$;

-- ---------- Passer une commande --------------------------------------
-- p : {
--   customer: {first_name, last_name, phone, email, commune, quartier, address, marketing_consent},
--   lines: [{product_id, qty, selection: {taille: "M"}, measurements: {...} | null, measurements_by_whatsapp: bool}],
--   payment_mode: "orange_money" | "a_la_livraison", promo_code, split_delivery: bool, accepted_making_terms: bool
-- }
create or replace function public.place_order(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c jsonb := p -> 'customer';
  l jsonb;
  prod products;
  mat materials;
  rule payment_rules;
  st settings;
  zone delivery_zones;
  v_ref text; v_invoice text; v_customer uuid;
  v_qty int; v_label text; v_group jsonb; v_choice text; v_opt jsonb;
  v_meters numeric; v_m jsonb; k text; n numeric;
  amounts jsonb := '{"studio":0,"bijoux":0,"maison":0}'::jsonb;
  sub_made int := 0; sub_stock int := 0; deposit_made numeric := 0;
  v_discount int := 0; disc_made int := 0; eligible_made int := 0; eligible int := 0;
  v_promo jsonb; v_fee int; v_total int; v_due_now int; v_mode payment_mode;
  cod_ok boolean := true; needs_accept boolean := false;
  v_making int := 0; v_delivery int := 0;
  pending jsonb := '[]'::jsonb;  -- lignes validées, insérées après la commande
begin
  -- 1. Client et adresse
  if coalesce(trim(c ->> 'first_name'), '') = '' or coalesce(trim(c ->> 'last_name'), '') = '' then
    raise exception 'Nom et prénom requis.' using errcode = 'P0001';
  end if;
  if length(digits(c ->> 'phone')) < 9 then raise exception 'Numéro de téléphone invalide.' using errcode = 'P0001'; end if;
  if coalesce(trim(c ->> 'quartier'), '') = '' then raise exception 'Quartier requis.' using errcode = 'P0001'; end if;
  select * into zone from delivery_zones where commune = c ->> 'commune' and active;
  if not found then raise exception 'Commune de livraison non desservie.' using errcode = 'P0001'; end if;
  if jsonb_typeof(p -> 'lines') <> 'array' or jsonb_array_length(p -> 'lines') = 0 then
    raise exception 'Panier vide.' using errcode = 'P0001';
  end if;
  select * into st from settings where id = 1;

  -- 2. Lignes : prix relus en base, variantes et disponibilité vérifiées, stock réservé
  for l in select * from jsonb_array_elements(p -> 'lines') loop
    select * into prod from products where id = (l ->> 'product_id')::uuid and active for update;
    if not found then raise exception 'Produit introuvable.' using errcode = 'P0001'; end if;
    if prod.status = 'indisponible' then raise exception '« % » est indisponible.', prod.name using errcode = 'P0001'; end if;
    select * into rule from payment_rules where univers = prod.univers;
    v_qty := greatest(coalesce((l ->> 'qty')::int, 1), 1);

    -- Variantes : toutes requises, valeurs existantes
    v_label := '';
    for v_group in select * from jsonb_array_elements(prod.variants) loop
      v_choice := l -> 'selection' ->> (v_group ->> 'kind');
      v_opt := null;
      select o into v_opt from jsonb_array_elements(v_group -> 'options') o where o ->> 'value' = v_choice;
      if v_opt is null then raise exception 'Choisissez : % (%).', lower(v_group ->> 'label'), prod.name using errcode = 'P0001'; end if;
      v_label := v_label || case when v_label = '' then '' else ' · ' end || (v_opt ->> 'label');
    end loop;
    if prod.fabric_color is not null then
      v_label := v_label || case when v_label = '' then '' else ' · ' end || prod.fabric_color;
    end if;

    v_meters := 0;
    v_m := null; -- jamais hérité de la ligne précédente
    if prod.status = 'sur_commande' then
      v_qty := 1; -- une pièce sur mesure = une ligne
      if coalesce((l ->> 'measurements_by_whatsapp')::boolean, false) then
        v_m := null;
      else
        v_m := l -> 'measurements';
        foreach k in array array['poitrine', 'taille', 'hanches', 'longueur'] loop
          begin n := replace(v_m ->> k, ',', '.')::numeric; exception when others then n := null; end;
          if n is null or n < 30 or n > 250 then
            raise exception 'Mesures incomplètes pour « % ».', prod.name using errcode = 'P0001';
          end if;
        end loop;
      end if;
      if prod.fabric_material_id is not null then
        select * into mat from materials where id = prod.fabric_material_id for update;
        v_meters := prod.fabric_meters;
        if mat.quantity - mat.reserved < v_meters then
          raise exception 'Tissu insuffisant pour « % ».', prod.name using errcode = 'P0001';
        end if;
        update materials set reserved = reserved + v_meters where id = mat.id;
      end if;
      sub_made := sub_made + prod.price;
      deposit_made := deposit_made + prod.price * rule.deposit_rate;
      if rule.requires_making_acceptance then needs_accept := true; end if;
      v_making := greatest(v_making, coalesce(prod.making_days, 0));
    elsif prod.status = 'en_stock' then
      if prod.stock - prod.reserved < v_qty then
        raise exception 'Stock insuffisant pour « % » (% disponible).', prod.name, prod.stock - prod.reserved using errcode = 'P0001';
      end if;
      update products set reserved = reserved + v_qty where id = prod.id;
      sub_stock := sub_stock + prod.price * v_qty;
      if not rule.allow_cash_on_delivery then cod_ok := false; end if;
    else -- précommande
      sub_stock := sub_stock + prod.price * v_qty;
      if not rule.allow_cash_on_delivery then cod_ok := false; end if;
    end if;
    v_delivery := greatest(v_delivery, coalesce(prod.delivery_days, 0));
    amounts := jsonb_set(amounts, array[prod.univers::text], to_jsonb((amounts ->> prod.univers::text)::int + prod.price * v_qty));

    pending := pending || jsonb_build_object(
      'product_id', prod.id, 'product_ref', prod.ref, 'name', prod.name, 'univers', prod.univers,
      'variant_label', v_label, 'selection', coalesce(l -> 'selection', '{}'::jsonb), 'qty', v_qty,
      'unit_price', prod.price, 'made', prod.status = 'sur_commande', 'measurements', v_m,
      'by_whatsapp', prod.status = 'sur_commande' and v_m is null,
      'material', prod.fabric_material_id, 'meters', v_meters,
      'stock_reserved', case when prod.status = 'en_stock' then v_qty else 0 end);
  end loop;

  -- 3. Acceptation des délais de confection
  if needs_accept and not coalesce((p ->> 'accepted_making_terms')::boolean, false) then
    raise exception 'Les délais de confection et de livraison doivent être acceptés.' using errcode = 'P0001';
  end if;

  -- 4. Code promo (répartition de la remise au prorata entre confection et stock)
  if coalesce(trim(p ->> 'promo_code'), '') <> '' then
    v_promo := check_promo(p ->> 'promo_code', amounts);
    if not (v_promo ->> 'ok')::boolean then raise exception '%', v_promo ->> 'message' using errcode = 'P0001'; end if;
    v_discount := (v_promo ->> 'discount')::int;
    select coalesce(sum((x ->> 'unit_price')::int * (x ->> 'qty')::int), 0) into eligible_made
      from jsonb_array_elements(pending) x
      where (x ->> 'made')::boolean and (v_promo -> 'univers' = 'null'::jsonb or v_promo -> 'univers' ? (x ->> 'univers'));
    select coalesce(sum((x ->> 'unit_price')::int * (x ->> 'qty')::int), 0) into eligible
      from jsonb_array_elements(pending) x
      where v_promo -> 'univers' = 'null'::jsonb or v_promo -> 'univers' ? (x ->> 'univers');
    disc_made := case when eligible > 0 then round(v_discount::numeric * eligible_made / eligible)::int else 0 end;
    update promos set used = used + 1 where code = v_promo ->> 'code';
  end if;

  -- 5. Livraison, total, montant exigé maintenant
  v_fee := zone.fee + case when coalesce((p ->> 'split_delivery')::boolean, false) then st.extra_shipment_fee else 0 end;
  v_total := sub_made + sub_stock - v_discount + v_fee;
  v_mode := case when cod_ok and p ->> 'payment_mode' = 'a_la_livraison' then 'a_la_livraison' else 'orange_money' end;
  v_due_now := round(case when sub_made > 0 then deposit_made * (sub_made - disc_made) / sub_made else 0 end)::int
             + case when v_mode = 'orange_money' then (sub_stock - (v_discount - disc_made)) + v_fee else 0 end;

  -- 6. Client : son compte s'il est connecté (jamais celui d'un membre de l'équipe
  --    qui saisit une commande WhatsApp), sinon retrouvé par téléphone, sinon créé
  if auth.uid() is not null and not is_staff() then
    select id into v_customer from customers where user_id = auth.uid();
  end if;
  if v_customer is null then
    select id into v_customer from customers where same_phone(phone, c ->> 'phone') order by created_at limit 1;
  end if;
  if v_customer is null then
    insert into customers (first_name, last_name, phone, email, marketing_consent, user_id)
    values (trim(c ->> 'first_name'), trim(c ->> 'last_name'), digits(c ->> 'phone'), nullif(trim(c ->> 'email'), ''),
            coalesce((c ->> 'marketing_consent')::boolean, false),
            case when auth.uid() is not null and not is_staff()
                  and not exists (select 1 from customers where user_id = auth.uid()) then auth.uid() end)
    returning id into v_customer;
  else
    update customers set marketing_consent = coalesce((c ->> 'marketing_consent')::boolean, marketing_consent),
      email = coalesce(nullif(trim(c ->> 'email'), ''), email) where id = v_customer;
  end if;

  v_ref := next_order_ref();
  v_invoice := next_invoice_number();
  insert into orders (ref, customer_id, first_name, last_name, phone, email, commune, quartier, address, marketing_consent,
    subtotal, discount, promo_code, delivery_fee, total, deposit_due, payment_mode, payment_status, status,
    making_days, delivery_days, split_delivery, invoice_number, expires_at)
  values (v_ref, v_customer, trim(c ->> 'first_name'), trim(c ->> 'last_name'), digits(c ->> 'phone'), nullif(trim(c ->> 'email'), ''),
    zone.commune, trim(c ->> 'quartier'), nullif(trim(c ->> 'address'), ''), coalesce((c ->> 'marketing_consent')::boolean, false),
    sub_made + sub_stock, v_discount, v_promo ->> 'code', v_fee, v_total, v_due_now, v_mode, 'en_attente',
    case when v_due_now > 0 then 'en_attente_paiement'::order_status else 'confirmee'::order_status end,
    nullif(v_making, 0), nullif(v_delivery, 0), coalesce((p ->> 'split_delivery')::boolean, false), v_invoice,
    case when v_due_now > 0 and st.reservation_hours is not null then now() + make_interval(hours => st.reservation_hours) end);

  -- 7. Lignes, mouvements de stock, fiches de confection
  for l in select * from jsonb_array_elements(pending) loop
    with ins as (
      insert into order_lines (order_ref, product_id, product_ref, name, univers, variant_label, selection, qty, unit_price,
        made_to_order, measurements, measurements_by_whatsapp, fabric_material_id, fabric_meters_reserved, stock_reserved)
      values (v_ref, (l ->> 'product_id')::uuid, l ->> 'product_ref', l ->> 'name', (l ->> 'univers')::univers_key,
        l ->> 'variant_label', l -> 'selection', (l ->> 'qty')::int, (l ->> 'unit_price')::int, (l ->> 'made')::boolean,
        case when jsonb_typeof(l -> 'measurements') = 'object' then l -> 'measurements' end, (l ->> 'by_whatsapp')::boolean,
        l ->> 'material', (l ->> 'meters')::numeric, (l ->> 'stock_reserved')::int)
      returning id
    )
    insert into production_jobs (order_line_id) select id from ins where (l ->> 'made')::boolean;

    if (l ->> 'meters')::numeric > 0 then
      insert into stock_movements (material_id, kind, quantity, order_ref, note)
      values (l ->> 'material', 'reservation', (l ->> 'meters')::numeric, v_ref, l ->> 'name');
    end if;
    if (l ->> 'stock_reserved')::int > 0 then
      insert into stock_movements (product_id, kind, quantity, order_ref)
      values ((l ->> 'product_id')::uuid, 'reservation', (l ->> 'stock_reserved')::int, v_ref);
    end if;
  end loop;

  insert into audit_log (user_id, action, target, detail)
  values (auth.uid(), 'Commande créée', v_ref, v_total || ' GNF, ' || v_due_now || ' GNF exigés maintenant');

  return jsonb_build_object('ref', v_ref, 'invoice_number', v_invoice, 'total', v_total, 'due_now', v_due_now,
    'due_later', v_total - v_due_now, 'payment_mode', v_mode, 'delivery_fee', v_fee, 'discount', v_discount);
end $$;

-- ---------- Libérer ce qui est encore réservé (annulation) ----------
create or replace function public.release_reservations(p_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare ln order_lines;
begin
  for ln in select * from order_lines where order_ref = p_ref for update loop
    if ln.fabric_meters_reserved > 0 and not ln.cut_done then
      update materials set reserved = greatest(reserved - ln.fabric_meters_reserved, 0) where id = ln.fabric_material_id;
      insert into stock_movements (material_id, kind, quantity, order_ref) values (ln.fabric_material_id, 'liberation', ln.fabric_meters_reserved, p_ref);
      update order_lines set fabric_meters_reserved = 0 where id = ln.id;
    end if;
    if ln.stock_reserved > 0 then
      update products set reserved = greatest(reserved - ln.stock_reserved, 0) where id = ln.product_id;
      insert into stock_movements (product_id, kind, quantity, order_ref) values (ln.product_id, 'liberation', ln.stock_reserved, p_ref);
      update order_lines set stock_reserved = 0 where id = ln.id;
    end if;
  end loop;
end $$;

-- Sortie définitive du stock des produits finis (expédition / livraison)
create or replace function public.consume_stock(p_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare ln order_lines;
begin
  for ln in select * from order_lines where order_ref = p_ref and stock_reserved > 0 for update loop
    update products set stock = stock - ln.stock_reserved, reserved = reserved - ln.stock_reserved where id = ln.product_id;
    insert into stock_movements (product_id, kind, quantity, order_ref) values (ln.product_id, 'sortie', ln.stock_reserved, p_ref);
    update order_lines set stock_reserved = 0 where id = ln.id;
  end loop;
end $$;

-- ---------- Suivi de commande sans compte ----------------------------
create or replace function public.track_order(p_ref text, p_phone text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare o orders;
begin
  select * into o from orders where ref = upper(trim(p_ref));
  if not found or not same_phone(o.phone, p_phone) then return null; end if;
  return to_jsonb(o) - 'customer_id' - 'delivery_staff' - 'marketing_consent'
    || jsonb_build_object(
      'lines', (select coalesce(jsonb_agg(to_jsonb(x) - 'fabric_material_id' - 'fabric_meters_reserved' - 'stock_reserved' - 'cut_done' order by x.name), '[]'::jsonb) from order_lines x where x.order_ref = o.ref),
      'payments', (select coalesce(jsonb_agg(jsonb_build_object('created_at', y.created_at, 'amount', y.amount, 'mode', y.mode, 'status', y.status) order by y.created_at), '[]'::jsonb) from payments y where y.order_ref = o.ref));
end $$;

-- ---------- Preuve de paiement Orange Money (client) -----------------
create or replace function public.submit_payment_proof(p_ref text, p_phone text, p_payer_number text, p_proof_path text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o orders; v_amount int;
begin
  select * into o from orders where ref = upper(trim(p_ref)) for update;
  if not found or not same_phone(o.phone, p_phone) then raise exception 'Commande introuvable.' using errcode = 'P0001'; end if;
  if o.status = 'annulee' then raise exception 'Cette commande est annulée.' using errcode = 'P0001'; end if;
  if length(digits(p_payer_number)) < 9 then raise exception 'Numéro Orange Money invalide.' using errcode = 'P0001'; end if;
  if exists (select 1 from payments where order_ref = o.ref and status in ('preuve_recue', 'a_verifier')) then
    raise exception 'Une preuve est déjà en cours de vérification.' using errcode = 'P0001';
  end if;
  v_amount := case when o.paid < o.deposit_due then o.deposit_due - o.paid else o.total - o.paid end;
  if v_amount <= 0 then raise exception 'Aucun montant restant à payer.' using errcode = 'P0001'; end if;
  insert into payments (order_ref, amount, mode, payer_number, status, proof_path)
  values (o.ref, v_amount, 'orange_money', digits(p_payer_number), 'a_verifier', p_proof_path);
  update orders set payment_status = 'a_verifier',
    status = case when status = 'en_attente_paiement' then 'paiement_a_verifier' else status end
  where ref = o.ref;
  insert into audit_log (action, target, detail) values ('Preuve de paiement reçue', o.ref, v_amount || ' GNF, Orange Money ' || digits(p_payer_number));
  return jsonb_build_object('amount', v_amount);
end $$;

-- ---------- Administration : paiements --------------------------------
create or replace function public.verify_payment(p_payment_id uuid, p_amount int default null)
returns void language plpgsql security definer set search_path = public as $$
declare pay payments; o orders; v_amount int;
begin
  if not has_role(array['admin', 'superviseur']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  select * into pay from payments where id = p_payment_id for update;
  if not found or pay.status not in ('preuve_recue', 'a_verifier', 'en_attente') then raise exception 'Paiement non vérifiable.' using errcode = 'P0001'; end if;
  select * into o from orders where ref = pay.order_ref for update;
  v_amount := coalesce(p_amount, pay.amount);
  if v_amount <= 0 or o.paid + v_amount > o.total then raise exception 'Montant incohérent.' using errcode = 'P0001'; end if;
  update payments set status = 'paye', amount = v_amount, verified_by = auth.uid(), verified_at = now() where id = pay.id;
  update orders set paid = paid + v_amount,
    payment_status = case when paid + v_amount >= total then 'paye'::payment_status else 'partiellement_paye'::payment_status end,
    status = case when status in ('en_attente_paiement', 'paiement_a_verifier') and paid + v_amount >= deposit_due then 'confirmee'::order_status else status end,
    expires_at = case when paid + v_amount >= deposit_due then null else expires_at end
  where ref = o.ref;
  -- Échéance de confection à partir de la validation de l'acompte
  update production_jobs j set due_date = (now() at time zone 'Africa/Conakry')::date + coalesce(o.making_days, 0)
  from order_lines x where x.id = j.order_line_id and x.order_ref = o.ref and j.due_date is null;
  perform log_action('Validation de paiement', o.ref, v_amount || ' GNF vérifié');
end $$;

create or replace function public.reject_payment(p_payment_id uuid, p_reason text default 'Transaction non retrouvée')
returns void language plpgsql security definer set search_path = public as $$
declare pay payments;
begin
  if not has_role(array['admin', 'superviseur']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  select * into pay from payments where id = p_payment_id for update;
  if not found or pay.status not in ('preuve_recue', 'a_verifier') then raise exception 'Paiement non refusable.' using errcode = 'P0001'; end if;
  update payments set status = 'echec', verified_by = auth.uid(), verified_at = now() where id = pay.id;
  update orders set payment_status = case when paid > 0 then 'partiellement_paye'::payment_status else 'echec'::payment_status end,
    status = case when status = 'paiement_a_verifier' then 'en_attente_paiement' else status end,
    expires_at = case when expires_at is not null then greatest(expires_at, now() + interval '2 hours') end
  where ref = pay.order_ref;
  perform log_action('Paiement refusé', pay.order_ref, p_reason);
end $$;

-- Paiement reçu en main propre (à la livraison)
create or replace function public.record_cash_payment(p_ref text, p_amount int)
returns void language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if not has_role(array['admin', 'superviseur', 'livreur']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  insert into payments (order_ref, amount, mode, status) values (upper(p_ref), p_amount, 'a_la_livraison', 'a_verifier') returning id into pid;
  -- Le livreur déclare, l'administration valide ; un admin valide directement
  if has_role(array['admin', 'superviseur']::staff_role[]) then perform verify_payment(pid, p_amount); end if;
  perform log_action('Paiement à la livraison déclaré', upper(p_ref), p_amount || ' GNF');
end $$;

-- ---------- Administration : statut de commande ----------------------
create or replace function public.set_order_status(p_ref text, p_status public.order_status)
returns void language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  if not is_staff() then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  if has_role(array['livreur']::staff_role[]) and p_status not in ('expediee', 'livree') then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  select * into o from orders where ref = p_ref for update;
  if not found then raise exception 'Commande introuvable.' using errcode = 'P0001'; end if;
  if o.status = 'annulee' then raise exception 'Une commande annulée ne peut pas être modifiée.' using errcode = 'P0001'; end if;
  if p_status = 'annulee' then perform release_reservations(p_ref); end if;
  if p_status in ('expediee', 'livree') then perform consume_stock(p_ref); end if;
  update orders set status = p_status, expires_at = null where ref = p_ref;
  perform log_action('Changement de statut', p_ref, o.status || ' → ' || p_status);
end $$;

-- ---------- Administration : confection ------------------------------
-- Le passage à la découpe consomme le tissu : il n'est plus libérable en cas d'annulation (perte).
create or replace function public.set_production_stage(p_job_id uuid, p_stage public.production_stage)
returns void language plpgsql security definer set search_path = public as $$
declare j production_jobs; ln order_lines;
begin
  if not has_role(array['admin', 'superviseur', 'atelier']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  select * into j from production_jobs where id = p_job_id for update;
  select * into ln from order_lines where id = j.order_line_id for update;
  if p_stage <> 'a_demarrer' and not ln.cut_done and ln.fabric_meters_reserved > 0 then
    update materials set quantity = quantity - ln.fabric_meters_reserved, reserved = reserved - ln.fabric_meters_reserved where id = ln.fabric_material_id;
    insert into stock_movements (material_id, kind, quantity, order_ref, note) values (ln.fabric_material_id, 'sortie', ln.fabric_meters_reserved, ln.order_ref, 'Découpe ' || ln.name);
    update order_lines set cut_done = true, fabric_meters_reserved = 0 where id = ln.id;
  end if;
  update production_jobs set stage = p_stage where id = j.id;
  perform log_action('Étape de confection', ln.order_ref, ln.name || ' → ' || p_stage);
end $$;

-- ---------- Annulation automatique des commandes impayées ------------
-- Jamais pendant la vérification d'une preuve de paiement.
create or replace function public.cancel_expired_orders() returns int
language plpgsql security definer set search_path = public as $$
declare o orders; n int := 0;
begin
  for o in select * from orders
    where status = 'en_attente_paiement' and paid = 0 and expires_at is not null and expires_at < now()
      and not exists (select 1 from payments y where y.order_ref = orders.ref and y.status in ('preuve_recue', 'a_verifier'))
    for update skip locked
  loop
    perform release_reservations(o.ref);
    update orders set status = 'annulee', expires_at = null where ref = o.ref;
    insert into audit_log (action, target, detail) values ('Annulation automatique', o.ref, 'Non payée dans le délai');
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------- Entrée / ajustement de matière (admin) ------------------
create or replace function public.adjust_material(p_id text, p_delta numeric, p_kind text default 'entree', p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(array['admin', 'superviseur']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  update materials set quantity = quantity + p_delta where id = p_id;
  insert into stock_movements (material_id, kind, quantity, user_id, note) values (p_id, p_kind, p_delta, auth.uid(), p_note);
  perform log_action('Mouvement de matière', p_id, p_delta || ' (' || p_kind || ')');
end $$;

create or replace function public.adjust_stock(p_product uuid, p_delta int, p_kind text default 'entree', p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(array['admin', 'superviseur']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  update products set stock = stock + p_delta where id = p_product;
  insert into stock_movements (product_id, kind, quantity, user_id, note) values (p_product, p_kind, p_delta, auth.uid(), p_note);
  perform log_action('Modification du stock', (select ref from products where id = p_product), p_delta::text);
end $$;

-- >>> migrations/20261125000003_security.sql
-- =====================================================================
-- H.O.K Boutique · 3/4 · Sécurité (RLS), droits, stockage des fichiers
-- Principe : le public lit le catalogue ; il ne touche aux commandes et aux
-- paiements qu'à travers les fonctions du fichier 2. L'équipe agit selon son rôle.
-- =====================================================================

-- ---------- Activer la sécurité ligne par ligne partout --------------
alter table public.staff            enable row level security;
alter table public.settings         enable row level security;
alter table public.payment_rules    enable row level security;
alter table public.delivery_zones   enable row level security;
alter table public.univers          enable row level security;
alter table public.subcategories    enable row level security;
alter table public.materials        enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_costs    enable row level security;
alter table public.promos           enable row level security;
alter table public.customers        enable row level security;
alter table public.orders           enable row level security;
alter table public.order_lines      enable row level security;
alter table public.payments         enable row level security;
alter table public.production_jobs  enable row level security;
alter table public.stock_movements  enable row level security;
alter table public.audit_log        enable row level security;
alter table public.order_counters   enable row level security;
alter table public.invoice_counters enable row level security;

-- ---------- Lecture publique : catalogue et paramètres utiles --------
create policy "public lit les univers" on public.univers for select using (true);
create policy "public lit les sous-catégories actives" on public.subcategories for select using (active or public.is_staff());
create policy "public lit les produits actifs" on public.products for select using (active or public.is_staff());
create policy "public lit les photos" on public.product_images for select using (true);
create policy "public lit les zones actives" on public.delivery_zones for select using (active or public.is_staff());
create policy "public lit les règles de paiement" on public.payment_rules for select using (true);
create policy "public lit les paramètres" on public.settings for select using (true);

-- ---------- Gestion du catalogue : gérantes et superviseure ----------
create policy "gestion univers" on public.univers for all
  using (public.has_role('{admin,superviseur}')) with check (public.has_role('{admin,superviseur}'));
create policy "gestion sous-catégories" on public.subcategories for all
  using (public.has_role('{admin,superviseur}')) with check (public.has_role('{admin,superviseur}'));
create policy "gestion produits" on public.products for all
  using (public.has_role('{admin,superviseur}')) with check (public.has_role('{admin,superviseur}'));
create policy "gestion coûts" on public.product_costs for all
  using (public.has_role('{admin,superviseur}')) with check (public.has_role('{admin,superviseur}'));
create policy "gestion photos" on public.product_images for all
  using (public.has_role('{admin,superviseur}')) with check (public.has_role('{admin,superviseur}'));
create policy "gestion zones" on public.delivery_zones for all
  using (public.has_role('{admin}')) with check (public.has_role('{admin}'));
create policy "gestion règles de paiement" on public.payment_rules for all
  using (public.has_role('{admin}')) with check (public.has_role('{admin}'));
create policy "gestion paramètres" on public.settings for update
  using (public.has_role('{admin}')) with check (public.has_role('{admin}'));
create policy "gestion promotions" on public.promos for all
  using (public.has_role('{admin,superviseur}')) with check (public.has_role('{admin,superviseur}'));

-- Matières : l'atelier consulte, la gestion modifie (via adjust_material de préférence)
create policy "équipe lit les matières" on public.materials for select using (public.has_role('{admin,superviseur,atelier}'));
create policy "gestion matières" on public.materials for all
  using (public.has_role('{admin,superviseur}')) with check (public.has_role('{admin,superviseur}'));

-- ---------- Commandes, clients, paiements : équipe en lecture -------
-- Les modifications passent par les fonctions (traçabilité, stock cohérent).
create policy "équipe lit les clients" on public.customers for select using (public.has_role('{admin,superviseur}'));
create policy "client lit sa fiche" on public.customers for select using (user_id = auth.uid());
create policy "équipe lit les commandes" on public.orders for select using (public.is_staff());
create policy "équipe lit les lignes" on public.order_lines for select using (public.is_staff());
create policy "équipe lit les paiements" on public.payments for select using (public.has_role('{admin,superviseur}'));
create policy "équipe lit la confection" on public.production_jobs for select using (public.has_role('{admin,superviseur,atelier}'));
create policy "gestion lit les mouvements" on public.stock_movements for select using (public.has_role('{admin,superviseur}'));
create policy "gestion lit l'historique" on public.audit_log for select using (public.has_role('{admin,superviseur}'));

-- ---------- Équipe ---------------------------------------------------
create policy "équipe se voit" on public.staff for select using (public.is_staff());
create policy "admin gère l'équipe" on public.staff for all
  using (public.has_role('{admin}')) with check (public.has_role('{admin}'));

-- Compteurs : aucune politique = inaccessibles directement (seules les fonctions y écrivent)

-- ---------- Droits d'exécution des fonctions ------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

-- Public (visiteurs et clients)
grant execute on function public.place_order(jsonb)                          to anon, authenticated;
grant execute on function public.track_order(text, text)                     to anon, authenticated;
grant execute on function public.submit_payment_proof(text, text, text, text) to anon, authenticated;
grant execute on function public.check_promo(text, jsonb)                    to anon, authenticated;
grant execute on function public.available_qty(public.products)              to anon, authenticated;
grant execute on function public.is_staff()                                  to anon, authenticated;
grant execute on function public.has_role(public.staff_role[])               to anon, authenticated;
grant execute on function public.digits(text)                                to anon, authenticated;
grant execute on function public.same_phone(text, text)                      to anon, authenticated;

-- Équipe connectée (chaque fonction vérifie le rôle)
grant execute on function public.verify_payment(uuid, int)                   to authenticated;
grant execute on function public.reject_payment(uuid, text)                  to authenticated;
grant execute on function public.record_cash_payment(text, int)              to authenticated;
grant execute on function public.set_order_status(text, public.order_status) to authenticated;
grant execute on function public.set_production_stage(uuid, public.production_stage) to authenticated;
grant execute on function public.adjust_material(text, numeric, text, text)  to authenticated;
grant execute on function public.adjust_stock(uuid, int, text, text)         to authenticated;

-- Les fonctions internes (références, libération de stock, annulation auto,
-- journal) restent réservées au propriétaire de la base.

-- Vue catalogue lisible par tous
grant select on public.catalogue to anon, authenticated;

-- ---------- Stockage des fichiers ------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- Photos produits : lecture publique, envoi par la gestion
create policy "photos lisibles par tous" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "photos gérées par la gestion" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.has_role('{admin,superviseur}'));
create policy "photos modifiées par la gestion" on storage.objects for update
  using (bucket_id = 'product-images' and public.has_role('{admin,superviseur}'));
create policy "photos supprimées par la gestion" on storage.objects for delete
  using (bucket_id = 'product-images' and public.has_role('{admin,superviseur}'));

-- Preuves de paiement : le client dépose (dossier proofs/), seule la gestion les lit
create policy "client dépose une preuve" on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = 'proofs');
create policy "gestion lit les preuves" on storage.objects for select
  using (bucket_id = 'payment-proofs' and public.has_role('{admin,superviseur}'));

-- >>> seed.sql
-- =====================================================================
-- H.O.K Boutique · Données de départ
-- Données réelles reçues de la boutique le 21/11/2026 (robes, matières,
-- règles) + quelques produits d'exemple (is_demo = true) pour les bijoux et
-- la maison, à supprimer quand le vrai catalogue est saisi :
--   delete from public.products where is_demo;
-- =====================================================================

-- ---------- Paramètres ----------
insert into public.settings (id, shop_name, domain, workshop, reservation_hours, extra_shipment_fee, delivery_provisional)
values (1, 'H.O.K Boutique', 'hokboutique.com', 'Lambangni, Cimetière (Conakry)', 24, 25000, true)
on conflict (id) do nothing;

insert into public.payment_rules (univers, deposit_rate, allow_cash_on_delivery, requires_making_acceptance) values
  ('studio', 0.5, false, true),
  ('bijoux', 0,   true,  false),
  ('maison', 0,   true,  false)
on conflict (univers) do nothing;

-- Tarifs à définir avec le livreur : 25 000 GNF provisoire partout
insert into public.delivery_zones (commune, fee, position) values
  ('Kaloum', 25000, 1), ('Dixinn', 25000, 2), ('Matam', 25000, 3), ('Ratoma', 25000, 4), ('Matoto', 25000, 5)
on conflict (commune) do nothing;

-- ---------- Univers et sous-catégories ----------
insert into public.univers (key, slug, label, brand, tagline, position) values
  ('studio', 'vetements', 'Vêtements', 'H.O.K Studio',  'Confectionnés pour vous, à vos mesures.', 1),
  ('bijoux', 'bijoux',    'Bijoux',    'H.O.K Jewelry', 'Des détails qui vous ressemblent.', 2),
  ('maison', 'maison',    'Home',      'H.O.K Home',    'La chaleur d''un intérieur soigné.', 3)
on conflict (key) do nothing;

insert into public.subcategories (univers, slug, label, position) values
  ('studio', 'robes', 'Robes', 1), ('studio', 'outside-dress', 'Outside dress', 2),
  ('studio', 'office', 'Office', 3), ('studio', 'suits', 'Suits', 4),
  ('bijoux', 'charms-custom', 'Charms bracelet custom', 1), ('bijoux', 'bagues', 'Bagues', 2),
  ('bijoux', 'boucles-oreilles', 'Boucles d''oreilles', 3), ('bijoux', 'bracelets', 'Bracelets', 4),
  ('bijoux', 'colliers', 'Colliers', 5),
  ('maison', 'bougies', 'Bougies', 1), ('maison', 'vases', 'Vases', 2), ('maison', 'plateaux', 'Plateaux', 3),
  ('maison', 'vaisselle', 'Vaisselle', 4), ('maison', 'ensembles', 'Ensembles', 5)
on conflict (univers, slug) do nothing;

-- ---------- Matières premières (stock du 21/11/2026) ----------
insert into public.materials (id, name, univers, unit, quantity, threshold, note) values
  ('TIS-ROSE',        'Tissu rose',                    'studio', 'm',        3,   3,  null),
  ('TIS-MARRON',      'Tissu marron',                  'studio', 'm',        9,   3,  null),
  ('TIS-BEIGE',       'Tissu beige',                   'studio', 'm',        6,   4,  null),
  ('TIS-VERT',        'Tissu vert',                    'studio', 'm',        7,   3,  null),
  ('TIS-ROUGE',       'Tissu rouge',                   'studio', 'm',        6,   4,  null),
  ('TIS-JAUNE',       'Tissu jaune',                   'studio', 'm',        6.5, 4,  null),
  ('TIS-RAYURES',     'Tissu rayé rose et blanc',      'studio', 'm',        10,  3,  '1 rouleau : longueur réelle à confirmer (10 m provisoire)'),
  ('BJ-CHARMS',       'Charms (bracelets)',            'bijoux', 'bracelet', 20,  5,  null),
  ('HM-CIRE',         'Cire',                          'maison', 'kg',       9,   2,  null),
  ('HM-SENTEURS',     'Senteurs',                      'maison', 'flacon',   27,  5,  null),
  ('HM-MECHES',       'Mèches',                        'maison', 'pièce',    100, 20, null),
  ('HM-AUTOCOLLANTS', 'Autocollants de mèche',         'maison', 'pièce',    200, 40, null)
on conflict (id) do nothing;

-- ---------- Robes H.O.K Studio (sur mesure, prix à confirmer) ----------
with t as (select '[{"kind":"taille","label":"Taille","options":[{"value":"M","label":"M"},{"value":"L","label":"L"},{"value":"XL","label":"XL"},{"value":"XXL","label":"XXL"}]}]'::jsonb as tailles),
r(ref, slug, name, description, material, meters, color, hex, pattern, making, is_new) as (values
  ('HOK-ST-001', 'keneya', 'Kénèya', 'Robe corset avec nœud.',   'TIS-VERT',    3.0, 'Vert',          '#3F6B4A', 'uni',     4, true),
  ('HOK-ST-002', 'sira',   'Sira',   'Robe beige à boutons.',    'TIS-BEIGE',   4.0, 'Beige',         '#D8C3A9', 'uni',     3, true),
  ('HOK-ST-003', 'nene',   'Néné',   'Robe asymétrique.',        'TIS-ROSE',    3.0, 'Rose',          '#E7A9B6', 'uni',     3, true),
  ('HOK-ST-004', 'danaya', 'Danaya', 'Robe fine à bretelles.',   'TIS-MARRON',  1.5, 'Marron',        '#683C11', 'uni',     4, false),
  ('HOK-ST-005', 'boiro',  'Boiro',  'Robe à nœud dans le dos.', 'TIS-ROUGE',   4.0, 'Rouge',         '#A3202A', 'uni',     3, false),
  ('HOK-ST-006', 'malika', 'Malika', 'Robe à col.',              'TIS-JAUNE',   4.0, 'Jaune',         '#E3B53B', 'uni',     3, false),
  ('HOK-ST-007', 'kande',  'Kandé',  'Robe rayée.',              'TIS-RAYURES', 3.0, 'Rose et blanc', '#F1C6CF', 'rayures', 3, false)
)
insert into public.products (ref, slug, name, description, price, price_pending, univers, subcategory_id, status,
  making_days, delivery_days, is_new, variants, fabric_material_id, fabric_meters, fabric_color, fabric_hex, fabric_pattern)
select r.ref, r.slug, r.name, r.description, 350000, true, 'studio',
  (select id from public.subcategories where univers = 'studio' and slug = 'robes'), 'sur_commande',
  r.making, 1, r.is_new, t.tailles, r.material, r.meters, r.color, r.hex, r.pattern
from r, t
on conflict (ref) do nothing;

-- ---------- Exemples bijoux et maison (à remplacer) ----------
with metal as (select '[{"kind":"couleur","label":"Finition","options":[{"value":"dore","label":"Doré","hex":"#C9A45C"},{"value":"argent","label":"Argenté","hex":"#C8C8C8"}]}]'::jsonb v),
senteur as (select '[{"kind":"senteur","label":"Senteur","options":[{"value":"vanille","label":"Vanille"},{"value":"ambre","label":"Ambre"},{"value":"fleur-coton","label":"Fleur de coton"}]}]'::jsonb v),
d(ref, slug, name, description, price, univers, sub, status, stock, variants, is_new) as (values
  ('HOK-BJ-001', 'bracelet-charms-personnalise', 'Bracelet charms personnalisé', 'Composez votre bracelet avec les charms de votre choix.', 180000, 'bijoux'::public.univers_key, 'charms-custom', 'en_stock'::public.product_status, 12, (select v from metal), true),
  ('HOK-BJ-002', 'bague-fine',                   'Bague fine',                   'Bague fine et lumineuse.',                              95000,  'bijoux', 'bagues',           'en_stock', 8,  (select v from metal), false),
  ('HOK-BJ-003', 'creoles-dorees',               'Créoles dorées',               'Créoles légères au fini poli.',                         120000, 'bijoux', 'boucles-oreilles', 'en_stock', 5,  (select v from metal), false),
  ('HOK-HM-001', 'bougie-parfumee',              'Bougie parfumée',              'Bougie coulée à la main, mèche en coton.',              120000, 'maison', 'bougies',          'en_stock', 20, (select v from senteur), true),
  ('HOK-HM-002', 'vase-sculptural',              'Vase sculptural',              'Vase aux lignes organiques, finition mate.',            260000, 'maison', 'vases',            'en_stock', 4,  '[]'::jsonb, false)
)
insert into public.products (ref, slug, name, description, price, univers, subcategory_id, status, stock, delivery_days, is_new, variants, is_demo)
select d.ref, d.slug, d.name, d.description, d.price, d.univers,
  (select id from public.subcategories s where s.univers = d.univers and s.slug = d.sub), d.status, d.stock, 1, d.is_new, d.variants, true
from d
on conflict (ref) do nothing;

-- >>> migrations/20261125000005_grants.sql
-- =====================================================================
-- H.O.K Boutique · 5 · Droits d'accès aux tables (API Supabase)
-- Les projets Supabase récents n'ouvrent plus les tables par défaut :
-- chaque accès est accordé ici, puis filtré ligne par ligne par la RLS (fichier 3).
-- Corrige aussi le search_path de 3 fonctions et ajoute l'e-mail de l'équipe.
-- =====================================================================
alter function public.touch_updated_at() set search_path = public;
alter function public.digits(text) set search_path = public;
alter function public.same_phone(text, text) set search_path = public;
alter table public.staff add column if not exists email text;

grant usage on schema public to anon, authenticated;

-- Lecture publique du catalogue (la RLS ne montre que l'actif)
grant select on public.univers, public.subcategories, public.products, public.product_images,
  public.delivery_zones, public.payment_rules, public.settings to anon, authenticated;
grant select on public.catalogue to anon, authenticated;

-- Équipe connectée : lecture et écriture, filtrées par rôle via la RLS
grant insert, update, delete on public.univers, public.subcategories, public.products, public.product_images,
  public.product_costs, public.delivery_zones, public.payment_rules, public.promos, public.materials, public.staff
  to authenticated;
grant select on public.product_costs, public.promos, public.materials, public.staff, public.customers,
  public.orders, public.order_lines, public.payments, public.production_jobs, public.stock_movements, public.audit_log
  to authenticated;
grant update on public.settings to authenticated;
