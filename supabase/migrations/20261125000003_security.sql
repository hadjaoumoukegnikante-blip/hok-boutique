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
