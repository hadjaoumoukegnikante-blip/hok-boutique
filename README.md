# H.O.K Boutique · Front-end

Boutique en ligne H.O.K Boutique (Fashion · Home · Jewelry), Conakry.
Front complet : boutique client + administration. Le backend sera branché ensuite.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production
npm run start      # servir le build
npm run typecheck  # vérification TypeScript
```

Node 20 ou plus récent.

## Pile technique

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 : jetons de la charte dans `src/app/globals.css` (`@theme`)
- Framer Motion : transitions, pastilles glissantes, tiroirs, apparitions
- Zustand : panier, commandes locales, état de l'administration
- Lucide : icônes
- Polices : Cormorant Garamond (titres) + DM Sans (texte), via `next/font`

## Structure

```
src/
  app/
    (boutique)/          pages client (en-tête, pied de page, panier, recherche, WhatsApp)
      page.tsx           accueil
      [univers]/         /vetements, /bijoux, /maison (+ ?sous=sous-catégorie)
      produit/[slug]/    fiche produit
      panier/            panier
      commande/          tunnel en 3 étapes + confirmation/paiement Orange Money
      suivi/             suivi par référence + téléphone (sans compte)
      compte/            compte client facultatif
      recherche/ a-propos/ contact/ infos/[page]/ (livraison, retours, CGV, confidentialité, guide des tailles)
    facture/[ref]/       facture imprimable / PDF
    admin/
      connexion/         connexion administrateur
      (espace)/          tableau de bord, commandes, paiements, factures, livraisons, clients,
                         produits, catégories, promotions, stocks, matières, confection,
                         statistiques, historique, paramètres
  components/
    ui.tsx               boutons, badges, contrôles segmentés, champs, quantités, apparitions
    shop/                composants boutique
    admin/               coque et kit de l'administration
  lib/
    types.ts             modèle de données (contrat avec le futur backend)
    config.ts            paramètres boutique, règles de paiement, livraison
    pricing.ts           calcul du panier : acompte 50 %, paiement à la livraison, promos, frais, référence HOK
    api.ts               couche d'accès aux données (à remplacer par les appels API)
    data/                DONNÉES DE DÉMONSTRATION (catalogue, commandes, matières)
  store/                 panier, commandes locales, état admin
```

## Règles métier déjà implémentées côté front

- Panier unique pour les trois univers.
- Vêtements (H.O.K Studio) : acompte 50 %, délais de confection et de livraison affichés séparément, acceptation obligatoire avant confirmation.
- Bijoux et Home : pas d'acompte, Orange Money ou paiement à la livraison (activable par univers).
- Statuts de paiement distincts des statuts de commande.
- Frais de livraison par commune, affichés avant confirmation ; livraison groupée par défaut, livraison séparée avec frais annoncés.
- Codes promo : pourcentage ou montant, minimum, dates, limite d'utilisation, univers éligibles.
- Référence de commande `HOK-AAAAMMJJ-XXXX`.
- Preuve de paiement Orange Money (site ou WhatsApp) ; validation manuelle dans l'administration.
- Facture : sous-total, réduction, livraison, total, déjà payé, solde restant dû, statut, délais.
- Contrôle du stock dans le panier (quantités au-delà du disponible signalées).
- CA encaissé calculé uniquement sur les paiements vérifiés.

## Base de données Supabase

Scripts SQL, mode d'emploi et tests dans [`supabase/`](supabase/README.md) : schéma, fonctions métier côté serveur, sécurité par rôle, données de départ.

## À brancher avec le backend

Tout ce qui est marqué « Démonstration » ou passe par `src/lib/api.ts` et `src/store/admin.ts` :
catalogue, commandes, paiements, authentification client et admin, envoi de la preuve (fichier),
séquence définitive des références et des factures, notifications, sauvegarde des paramètres,
mouvements de stock et matières.

## Informations reçues de la boutique (21/11/2026)

- Robes H.O.K Studio : Kénèya, Sira, Néné, Danaya, Boiro, Malika, Kandé (tissu, couleur, métrage, tailles M à XXL, délais). Confection sur mesure : mesures saisies sur le site ou envoyées sur WhatsApp.
- Stock de matières premières (tissus, charms, cire, senteurs, mèches, autocollants).
- Annulation des commandes impayées après 24 h. Tarifs de livraison à définir avec le livreur.
- Politique de retour, guide des tailles (standards internationaux), texte « À propos ».
- Équipe d'administration et domaine hokboutique.com.

## Informations à fournir avant la mise en ligne

Valeurs entre crochets dans `src/lib/config.ts` et dans les pages `infos` :
prix des robes (350 000 GNF provisoire, marqué « Prix à confirmer » dans l'admin), photos des robes,
catalogue des bougies (lien annoncé mais non reçu), catalogue bijoux et autres articles Home,
longueur du rouleau rayé, téléphone, e-mail et WhatsApp Business officiels, code marchand Orange Money
et bénéficiaire, RCCM / NIF, nuance exacte du beige, logo HD ou vectoriel, grille de livraison du livreur,
coûts des matières, textes légaux définitifs.

Note : le logo `public/logo-hok.png` a été détouré à partir du fichier fourni (fond noir retiré), sans modification de forme, de couleur ou de proportions.
