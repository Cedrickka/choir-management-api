# Choir Management API

Fondation backend SaaS multi-tenant pour la gestion de chorales liturgiques. NestJS est la source de vérité métier commune aux clients Flutter, Web et WordPress.

## Prérequis

- Node.js 24 LTS et npm
- PostgreSQL 17 (ou Docker)
- Redis est facultatif au LOT 1

## Installation

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

Sous PowerShell, utilisez `Copy-Item .env.example .env`. Renseignez des secrets JWT aléatoires d’au moins 32 caractères. Les migrations Prisma, et non `db push`, constituent la stratégie de déploiement.

## Commandes

```bash
npm run build
npm test
npm run test:e2e
npm run start:prod
npm run prisma:migrate:deploy
npm run prisma:studio
```

Swagger : `http://localhost:3000/api/docs`  
Health : `http://localhost:3000/api/v1/health`

### API Lot 1

- `GET /api/v1/me` : compte courant et appartenances actives
- `GET /api/v1/choirs/:choirId` : chorale courante
- `GET /api/v1/choirs/:choirId/organization` : organisation cliente
- `GET|POST /api/v1/choirs/:choirId/members` : membres
- `GET|PATCH|DELETE /api/v1/choirs/:choirId/members/:membershipId` : profil et archivage logique
- `GET|POST|PATCH /api/v1/choirs/:choirId/voice-sections` : pupitres personnalisables
- `GET|POST /api/v1/choirs/:choirId/roles` : rôles et permissions
- `POST /api/v1/choirs/:choirId/roles/memberships/:membershipId` : affectation d’un rôle

Chaque endpoint imbriqué sous une chorale vérifie un membership actif, l’état de la chorale et de l’organisation, puis la permission atomique requise.

## Docker local

```bash
docker compose up --build
docker compose --profile redis up --build
```

Redis est placé derrière un profil Compose et n’est jamais requis pour démarrer l’API.

## Modèle multi-tenant et sécurité

`Organization → Choir → Membership` définit la frontière tenant. Un `User` peut avoir plusieurs memberships. Les données propres à une chorale vivent dans `MemberProfile`; les rôles sont reliés aux permissions atomiques par `RolePermission`. Le guard tenant vérifie systématiquement un membership actif avant l’accès à une chorale, puis le guard de permissions applique le moindre privilège.

Les mots de passe utilisent bcrypt. Les refresh tokens sont rotatifs, révocables et uniquement conservés sous forme hachée. Helmet, validation stricte des DTO, CORS configurable, rate limiting, erreurs normalisées, correlation IDs et redaction des secrets dans les logs sont activés.

## Identifiants de développement

Après `npm run prisma:seed`, le mot de passe commun est `Demo-CSJB-2026!` :

- `admin@csjb.local`
- `maestro@csjb.local`
- `tresorier@csjb.local`
- `secretaire@csjb.local`
- `membre1@csjb.local`, `membre2@csjb.local`

Ces comptes sont strictement destinés au développement. Le seed crée `CSJB Organization`, le `Chœur Saint Jean Bosco` (`Africa/Kinshasa`) et les pupitres Soprano, Alto, Ténor et Basse.

## Déploiement Hostinger

Configurer Node.js 24.x, `npm ci`, `npm run build`, puis `npm run start:prod`. Définir toutes les variables de `.env.example` dans Hostinger et exécuter `npm run prisma:migrate:deploy` lors du déploiement. L’API écoute `PORT` sur `0.0.0.0`; aucun domaine n’est codé en dur. Le build produit `dist/main.js`.

Ne jamais committer `.env`, clés, tokens, fichiers audio ou PDF. Les futurs fichiers seront placés dans un object storage S3-compatible, PostgreSQL ne conservant que leurs métadonnées.
