# GNANAM EXO — Portail B2B

Application de commande et de logistique pour un grossiste en produits exotiques.
Elle couvre tout le parcours d'une commande : saisie par le client, préparation en
entrepôt, contrôle de sortie, livraison, et suivi du stock et des ventes.

**En production :** https://gnanam.vercel.app

---

## Les six modules

L'application est découpée en modules, et chaque profil de connexion ne voit que
ceux qui le concernent.

| Module | Rôle qui y accède | À quoi il sert |
| --- | --- | --- |
| **Commander** | Client B2B, Admin | Catalogue, panier, envoi de la commande |
| **Préparation** | Entrepôt, Admin | Pointage des lignes, constitution des caddies |
| **Contrôle sortie** | Sécurité, Admin | Visa avant que la marchandise quitte le dépôt |
| **Livraison** | Entrepôt, Admin | Tournée du jour, signature client |
| **Stock dépôt** | Entrepôt, Admin | Stock physique, réservé, disponible, réceptions |
| **Rapports** | Admin | CA, conformité, ruptures, top produits |

L'admin traverse tous les postes : c'est le profil de démonstration, il permet de
rejouer le parcours complet sans changer de compte.

## Le parcours d'une commande

1. **Le client** remplit son panier et valide → la commande est créée avec le statut
   *à préparer*. Le prix et l'adresse sont **figés à cet instant**, pour que
   l'historique des rapports ne bouge pas si un tarif ou un client change ensuite.
2. **L'entrepôt** ouvre la commande (statut *en cours*), puis pointe chaque ligne :
   validée, partielle ou manquante. Chaque validation **sort la marchandise du stock**
   et l'inscrit au journal des mouvements, dans la même transaction. Une fois toutes
   les lignes traitées, la commande passe *prête*.
3. **La sécurité** vérifie le caddie ligne par ligne et **autorise la sortie**. Une
   commande ne peut recevoir qu'un seul visa.
4. **L'entrepôt** fait signer le client et **confirme la livraison** → statut *livrée*.
5. **Stock et Rapports** reflètent tout ça en direct : les écrans partagés se
   resynchronisent toutes les 5 secondes.

## Comptes de démonstration

Créés par `bun run db:seed`. Mot de passe commun : **`gnanam2026`**

| Profil | E-mail |
| --- | --- |
| Client B2B | `client@gnanam.test` |
| Entrepôt | `entrepot@gnanam.test` |
| Sécurité | `securite@gnanam.test` |
| Admin | `admin@gnanam.test` |

Sur l'écran de connexion, les quatre boutons pré-remplissent le compte
correspondant — c'est un simple raccourci de saisie, l'authentification reste
réelle et le rôle vient de la session serveur.

Le seed génère aussi le catalogue (18 références), 4 établissements clients et
environ 90 jours de commandes livrées, sans quoi les rapports n'auraient rien à
agréger.

---

## Démarrer en local

> Le projet utilise **bun**, pas npm.

```bash
bun install
```

### Variables d'environnement

Copier `.env.example` en `.env.local` et le remplir, ou laisser Vercel le faire :

```bash
vercel env pull .env.local
```

Trois variables sont indispensables :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion **poolée**, utilisée par l'application |
| `DATABASE_URL_UNPOOLED` | Connexion **directe**, utilisée par les migrations Prisma |
| `BETTER_AUTH_SECRET` | Signature des sessions (`openssl rand -base64 32`) |

Les deux URLs sont nécessaires : le pooler Neon ne supporte pas les verrous de
session dont Prisma a besoin pour migrer, donc les migrations passent par la
connexion directe pendant que l'app utilise la poolée.

### Base de données

```bash
bun run db:migrate   # applique le schéma
bun run db:seed      # catalogue, comptes, historique de démo
```

⚠️ `db:seed` **vide la base** avant de la recharger.

### Lancer

```bash
bun run dev          # http://localhost:3000
```

---

## Scripts

| Commande | Effet |
| --- | --- |
| `bun run dev` | Serveur de développement |
| `bun run build` | Build de production (génère Prisma, applique les migrations, compile) |
| `bun run start` | Sert le build de production |
| `bun run lint` | ESLint |
| `bun run test` | Suite Vitest (73 tests) |
| `bun run test:watch` | Vitest en mode watch |
| `bun run db:migrate` | Crée et applique une migration |
| `bun run db:seed` | Recharge les données de démonstration |
| `bun run db:studio` | Prisma Studio (exploration de la base) |

---

## Architecture

```
app/                      Pages et routes API (auth, tRPC)
components/gnanam/        Un dossier par module métier
lib/
  auth.ts                 Better Auth (e-mail + mot de passe)
  db.ts                   Client Prisma
  trpc/client.tsx         Client tRPC + TanStack Query
  gnanam/                 État d'interface, types, helpers d'affichage
server/
  trpc.ts                 Contexte et procédures par rôle
  routers/                Un routeur par domaine métier
prisma/
  schema.prisma           Schéma
  seed.ts                 Données de démonstration
```

**Stack :** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Prisma 7 + Postgres (Neon) · Better Auth · tRPC 11 + TanStack Query · Vitest

### Trois partis pris

- **Le rôle vient toujours de la session serveur**, jamais du corps de la requête.
  Chaque procédure tRPC est protégée par un middleware de rôle.
- **Les prix sont des entiers en centimes.** Les cumuls de chiffre d'affaires en
  flottant dérivent.
- **Le client ne garde que l'état d'interface** (panier en cours, filtres, écran
  ouvert). Commandes, stock et rapports viennent du serveur.

---

## Déploiement

Le projet est relié à Vercel : **un push sur `main` déclenche le déploiement de
production**. Le build applique les migrations en attente avant de compiler.

Variables à configurer côté Vercel : `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
`BETTER_AUTH_SECRET` et `BETTER_AUTH_URL` (le domaine de production).

---

## Limites connues

- **Fuseau horaire.** Les fonctions Vercel tournent en UTC. Le rapport journalier
  et la file « commandes du jour » basculent donc à 2 h du matin heure française
  plutôt qu'à minuit. Les calculs de date devraient forcer `Europe/Paris`.
- **Authentification en preview.** `BETTER_AUTH_URL` n'est défini qu'en production.
  Les déploiements de preview, dont l'URL est dynamique, nécessiteraient de dériver
  l'URL depuis `VERCEL_URL`.
- **Créneau de livraison figé** à « 8h – 11h » : le sélecteur côté client reste à
  faire.
- **Écart au contrôle sortie non exposé.** La base et l'API acceptent un visa non
  conforme avec commentaire, mais l'interface ne propose pas encore le bouton.
- **Pas d'administration du catalogue.** Produits, clients et comptes se gèrent via
  le seed ou Prisma Studio.
