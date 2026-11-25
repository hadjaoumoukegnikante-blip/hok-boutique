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
