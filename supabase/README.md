# Base de données Supabase · H.O.K Boutique

Projet Supabase : `phruhfpjudfnliopxlnp` (compte de la boutique).

## Installer (15 minutes, une seule fois)

### 1. Créer la base
1. Supabase › **SQL Editor** › **New query**.
2. Coller tout le contenu de `installation_complete.sql`, puis **Run**.
3. Résultat attendu : « Success. No rows returned ».

Ce fichier contient, dans l'ordre : le schéma, les fonctions métier, la sécurité (RLS et stockage) et les données de départ. Si une erreur apparaît, rien n'est enregistré : corriger, puis relancer.

### 2. Activer l'annulation automatique des impayés (24 h)
1. **Database › Extensions** : activer `pg_cron`.
2. **SQL Editor** : coller `migrations/20261125000004_cron.sql`, puis **Run**.

### 3. Créer les comptes de l'équipe
1. **Authentication › Users › Add user › Create new user** : une adresse e-mail et un mot de passe par personne. Cocher « Auto Confirm User ».
2. **SQL Editor** : donner un rôle à chacun (remplacer les adresses) :

```sql
insert into public.staff (user_id, full_name, role)
select id, v.full_name, v.role::public.staff_role
from auth.users u
join (values
  ('hadjaoumoukegnikante@gmail.com', 'Hadja Oumou Kanté', 'admin'),
  ('ADRESSE_KADIATOU',               'Kadiatou Kanté',    'admin'),
  ('ADRESSE_FATOUMATA',              'Fatoumata Kanté',   'superviseur'),
  ('ADRESSE_CELLOU',                 'Cellou Kanté',      'admin')
) as v(email, full_name, role) on v.email = u.email;
```

Rôles disponibles :

| Rôle | Peut faire |
|---|---|
| `admin` | Tout, y compris l'équipe, les zones de livraison et les règles de paiement |
| `superviseur` | Catalogue, stocks, matières, promotions, validation des paiements, historique |
| `atelier` | Consulter les commandes et les matières, faire avancer la confection |
| `livreur` | Voir les commandes, passer en « expédiée » ou « livrée », déclarer un paiement à la livraison |

### 4. Vérifier
```sql
select name, price, available from public.catalogue order by univers, name;  -- 12 produits
select id, quantity, unit from public.materials order by id;                -- 12 matières
select * from public.staff;                                                  -- l'équipe
```

### 5. Récupérer les clés pour le site
**Project Settings › API** :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- clé `anon` / `publishable` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

La clé `service_role` et le mot de passe de la base ne se partagent jamais : ni dans le code, ni dans une discussion.

## Ce que fait la base

- **Prix et montants recalculés côté serveur** (`place_order`) : le navigateur n'envoie que des choix. Acompte de 50 % sur le sur-mesure, paiement à la livraison selon l'univers, frais de livraison, code promo.
- **Stock et tissu réservés à la commande.** Une robe ne peut pas être commandée sans assez de tissu (3 m de rose = une seule Néné). Le tissu est consommé à la découpe ; une annulation après découpe ne le libère pas (perte).
- **Références uniques** `HOK-AAAAMMJJ-XXXX` et factures `FAC-AAAA-XXXX`, jamais réutilisées.
- **Commandes impayées annulées après 24 h** (`settings.reservation_hours`), sauf si une preuve de paiement est en vérification.
- **Paiements Orange Money vérifiés à la main** : le client dépose une preuve, une gérante ou la superviseure valide ou refuse.
- **Sécurité** : un visiteur lit le catalogue, passe commande et suit sa commande avec la référence et le téléphone. Il ne voit ni les autres commandes, ni les clients, ni les matières, ni les coûts. Chaque action sensible est tracée dans `audit_log`.
- **Fichiers** : bucket `product-images` (public) pour les photos, bucket `payment-proofs` (privé) pour les preuves.

## Avant le lancement

```sql
delete from public.products where is_demo;   -- retire les 5 produits d'exemple (bijoux, maison)
update public.products set price = ..., price_pending = false where ref = 'HOK-ST-001';  -- vrais prix des robes
update public.settings set phone = '...', whatsapp = '224...', email = '...',
  om_merchant_code = '...', om_beneficiary = '...' where id = 1;
```

## Sauvegardes (offre gratuite)

L'offre gratuite n'a pas de sauvegarde automatique, et le projet se met en pause après environ une semaine sans activité. Faire un export régulier : **Database › Backups** si disponible, sinon depuis un ordinateur :

```bash
pg_dump "postgresql://postgres:MOT_DE_PASSE@db.phruhfpjudfnliopxlnp.supabase.co:5432/postgres" > hok-$(date +%F).sql
```

## Tester en local (développeurs)

Avec un PostgreSQL 15 ou plus récent :

```bash
createdb hok
psql -d hok -f supabase/tests/environnement_local.sql
psql -d hok -f supabase/installation_complete.sql
psql -d hok -f supabase/tests/scenarios.sql
```

Les 18 scénarios couvrent : commande avec mesures, refus sans mesures, tissu insuffisant, délais non acceptés, stock dépassé, isolation des données, suivi, preuve de paiement, droits par rôle, validation, découpe, annulation, paiement à la livraison, annulation automatique, code promo, unicité des références, client connecté, commande saisie par l'équipe.
