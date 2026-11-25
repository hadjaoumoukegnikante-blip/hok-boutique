-- Scénarios de test (PostgreSQL local uniquement, après environnement_local.sql, migrations et seed)
\set ON_ERROR_STOP 0
\pset tuples_only on
\pset format unaligned
-- IDs utiles

select id as kid from products where slug='keneya' \gset
select id as nid from products where slug='nene' \gset
select id as bid from products where slug='bracelet-charms-personnalise' \gset
select id as vid from products where slug='vase-sculptural' \gset

\echo '--- 1. Commande visiteur : Kénèya (mesures) + 2 bracelets, Orange Money'
set role anon; set request.jwt.claim.sub = '';
select place_order(jsonb_build_object(
  'customer', jsonb_build_object('first_name','Awa','last_name','Test','phone','+224 620 11 22 33','commune','Ratoma','quartier','Kipé'),
  'lines', jsonb_build_array(
     jsonb_build_object('product_id', :'kid', 'qty', 3, 'selection', jsonb_build_object('taille','M'), 'measurements', jsonb_build_object('poitrine','92','taille','74','hanches','100','longueur','120'), 'price', 1),
     jsonb_build_object('product_id', :'bid', 'qty', 2, 'selection', jsonb_build_object('couleur','dore'))),
  'payment_mode','orange_money','accepted_making_terms', true));
reset role;
select 'vert reserve=' || reserved from materials where id='TIS-VERT';
select 'bracelet reserve=' || reserved from products where id = :'bid';

\echo '--- 2. Sans mesures : refus'
set role anon; set request.jwt.claim.sub = '';
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','A','last_name','B','phone','620000009','commune','Kaloum','quartier','X'),
  'lines', jsonb_build_array(jsonb_build_object('product_id', :'kid','selection', jsonb_build_object('taille','L'))), 'accepted_making_terms', true));
\echo '--- 3. Deux Néné (3 m de rose = 1 pièce) : refus et rien de réservé'
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','A','last_name','B','phone','620000009','commune','Kaloum','quartier','X'),
  'lines', jsonb_build_array(
    jsonb_build_object('product_id', :'nid','selection', jsonb_build_object('taille','L'),'measurements_by_whatsapp',true),
    jsonb_build_object('product_id', :'nid','selection', jsonb_build_object('taille','M'),'measurements_by_whatsapp',true)), 'accepted_making_terms', true));
reset role;
select 'rose reserve=' || reserved from materials where id='TIS-ROSE';

\echo '--- 4. Délais non acceptés : refus'
set role anon; set request.jwt.claim.sub = '';
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','A','last_name','B','phone','620000009','commune','Kaloum','quartier','X'),
  'lines', jsonb_build_array(jsonb_build_object('product_id', :'nid','selection', jsonb_build_object('taille','L'),'measurements_by_whatsapp',true))));
\echo '--- 5. Stock dépassé (100 bracelets) : refus'
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','A','last_name','B','phone','620000009','commune','Kaloum','quartier','X'),
  'lines', jsonb_build_array(jsonb_build_object('product_id', :'bid','qty',100,'selection', jsonb_build_object('couleur','dore')))));
\echo '--- 6. Visiteur : lecture directe des commandes (doit être vide), écriture directe (doit échouer)'
select 'orders visibles=' || count(*) from orders;
select 'materials visibles=' || count(*) from materials;
insert into orders (ref, first_name, last_name, phone, commune, quartier, subtotal, delivery_fee, total, deposit_due, payment_mode, status, invoice_number) values ('X','a','b','1','Kaloum','q',0,0,0,0,'orange_money','confirmee','F');
update products set price = 1 where id = :'bid';
select 'prix bracelet=' || price from products where id = :'bid';
\echo '--- 7. Suivi : mauvais téléphone puis bon téléphone'
select 'suivi faux=' || coalesce(track_order('HOK-' || to_char(now(),'YYYYMMDD') || '-0001', '620999999')::text, 'null');
select 'suivi ok=' || (track_order('hok-' || to_char(now(),'YYYYMMDD') || '-0001', '620112233') ->> 'status');
\echo '--- 8. Preuve de paiement, puis seconde preuve (refus)'
select submit_payment_proof('HOK-' || to_char(now(),'YYYYMMDD') || '-0001', '620112233', '620112233', 'proofs/x.jpg');
select submit_payment_proof('HOK-' || to_char(now(),'YYYYMMDD') || '-0001', '620112233', '620112233');
\echo '--- 9. Visiteur tente de valider un paiement : refus'
select verify_payment((select id from payments limit 1));
reset role;

\echo '--- 10. Équipe : admin valide, livreur refusé'
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111','admin@x'), ('22222222-2222-2222-2222-222222222222','livreur@x');
insert into staff values ('11111111-1111-1111-1111-111111111111','Hadja Oumou Kanté','admin'), ('22222222-2222-2222-2222-222222222222','Livreur','livreur');
select id as pid from payments limit 1 \gset
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select verify_payment(:'pid');
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select verify_payment(:'pid');
select 'commande: ' || status || ' / ' || payment_status || ' / paye=' || paid || ' / total=' || total || ' / exige=' || deposit_due || ' / expire=' || coalesce(expires_at::text,'null') from orders where ref like 'HOK-%-0001';
select 'echeance confection=' || coalesce(due_date::text,'null') from production_jobs;
\echo '--- 11. Atelier : découpe = tissu consommé'
select set_production_stage((select id from production_jobs limit 1), 'decoupe');
reset role;
select 'vert qte=' || quantity || ' reserve=' || reserved from materials where id='TIS-VERT';
\echo '--- 12. Annulation : bracelets libérés, tissu découpé non libéré'
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select set_order_status((select ref from orders where ref like 'HOK-%-0001'), 'annulee');
reset role;
select 'bracelet reserve=' || reserved || ' stock=' || stock from products where id = :'bid';
select 'vert qte=' || quantity || ' reserve=' || reserved from materials where id='TIS-VERT';

\echo '--- 13. Paiement à la livraison (vase seul) : rien à payer maintenant'
set role anon; set request.jwt.claim.sub = '';
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','Binta','last_name','T','phone','620445566','commune','Matoto','quartier','Sangoyah'),
  'lines', jsonb_build_array(jsonb_build_object('product_id', :'vid')), 'payment_mode','a_la_livraison'));
reset role;
select 'COD: ' || status || ' / exige=' || deposit_due || ' / expire=' || coalesce(expires_at::text,'null') from orders where phone like '%445566';

\echo '--- 14. Annulation auto 24 h : impayée annulée, celle avec preuve conservée'
set role anon; set request.jwt.claim.sub = '';
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','C','last_name','D','phone','620778899','commune','Dixinn','quartier','Q'),
  'lines', jsonb_build_array(jsonb_build_object('product_id', :'bid','qty',3,'selection', jsonb_build_object('couleur','argent')))));
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','E','last_name','F','phone','620778800','commune','Dixinn','quartier','Q'),
  'lines', jsonb_build_array(jsonb_build_object('product_id', :'bid','qty',1,'selection', jsonb_build_object('couleur','argent')))));
select submit_payment_proof('HOK-' || to_char(now(),'YYYYMMDD') || '-0004', '620778800', '620778800');
reset role;
update orders set expires_at = now() - interval '1 minute' where phone in ('620778899','620778800');
select 'annulees=' || cancel_expired_orders();
select phone || ': ' || status from orders where phone in ('620778899','620778800') order by phone;
select 'bracelet reserve=' || reserved from products where id = :'bid';

\echo '--- 15. Code promo -10 %'
insert into promos (code, kind, value, min_purchase) values ('BIENVENUE10','pourcentage',10,100000);
set role anon; set request.jwt.claim.sub = '';
select check_promo('bienvenue10', '{"studio":0,"bijoux":180000,"maison":0}');
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','G','last_name','H','phone','620121212','commune','Kaloum','quartier','Q'),
  'lines', jsonb_build_array(jsonb_build_object('product_id', :'bid','selection', jsonb_build_object('couleur','dore'))), 'promo_code','BIENVENUE10'));
reset role;
\echo '--- 16. Références et factures uniques'
select ref || ' ' || invoice_number from orders order by ref;
select 'audit=' || count(*) from audit_log;

\echo '--- 17. Client connecté : deux commandes, une seule fiche client'
insert into auth.users (id, email) values ('33333333-3333-3333-3333-333333333333','cliente@x');
set role authenticated; set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','I','last_name','J','phone','620343434','commune','Kaloum','quartier','Q'),
  'lines', jsonb_build_array(jsonb_build_object('product_id', :'vid'))))->>'ref';
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','I','last_name','J','phone','620565656','commune','Kaloum','quartier','Q'),
  'lines', jsonb_build_array(jsonb_build_object('product_id', :'vid'))))->>'ref';
reset role;
select 'fiches client 33..=' || count(*) from customers where user_id = '33333333-3333-3333-3333-333333333333';
\echo '--- 18. Admin saisit une commande WhatsApp : pas rattachée à son compte'
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select place_order(jsonb_build_object('customer', jsonb_build_object('first_name','K','last_name','L','phone','620787878','commune','Kaloum','quartier','Q'),
  'lines', jsonb_build_array(jsonb_build_object('product_id', :'vid'))))->>'ref';
reset role;
select 'client admin rattache=' || count(*) from customers where user_id = '11111111-1111-1111-1111-111111111111';
select 'vase stock=' || stock || ' reserve=' || reserved from products where id = :'vid';
