-- =====================================================================
-- H.O.K Boutique · 4/4 · Annulation automatique des commandes impayées
-- Toutes les 15 minutes, les commandes non payées depuis plus de 24 h
-- (paramètre settings.reservation_hours) sont annulées et leur stock libéré,
-- sauf si une preuve de paiement est en cours de vérification.
-- Prérequis : extension pg_cron (incluse dans Supabase).
-- =====================================================================
create extension if not exists pg_cron;

select cron.schedule(
  'hok-annulation-impayes',
  '*/15 * * * *',
  $$select public.cancel_expired_orders()$$
);
