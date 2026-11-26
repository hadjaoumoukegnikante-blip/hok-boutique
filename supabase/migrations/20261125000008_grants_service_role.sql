-- =====================================================================
-- H.O.K Boutique · 8 · Droits de la clé secrète (service_role)
-- Utilisée uniquement côté serveur : création des fiches clients, équipe,
-- réinitialisation des mots de passe, journal. Les projets Supabase récents
-- ne lui accordent plus ces droits par défaut (« permission denied »).
-- =====================================================================
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
