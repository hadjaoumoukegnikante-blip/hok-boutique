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
