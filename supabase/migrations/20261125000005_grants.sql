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
