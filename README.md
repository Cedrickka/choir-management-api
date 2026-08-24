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

### Connexion Supabase sur Hostinger

Le fichier racine `db.js` expose un client `@supabase/supabase-js` compatible avec l’assistant Hostinger. Il lit `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (ou `SUPABASE_ANON_KEY`/`SUPABASE_KEY`) sans coder de secret en dur. Ce client est réservé aux futurs services Supabase comme Storage. Prisma continue d’utiliser `DATABASE_URL` pour toutes les données métier, transactions et migrations PostgreSQL ; les variables Supabase ne remplacent donc pas `DATABASE_URL`.

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

### API Lot 2 — calendrier pastoral

- `GET|POST /api/v1/choirs/:choirId/pastoral-years`
- `GET|POST /api/v1/choirs/:choirId/activities`
- `GET|PATCH /api/v1/choirs/:choirId/activities/:activityId`
- `POST /api/v1/choirs/:choirId/activities/:activityId/cancel`
- `PATCH /api/v1/choirs/:choirId/activity-series/:seriesId`

Les activités acceptent un fuseau IANA, une visibilité, un responsable, l’exigence de présence et des offsets de rappel. Les récurrences disponibles sont `WEEKLY`, `MONTHLY` et `CUSTOM`; les jours hebdomadaires suivent ISO-8601 (lundi = 1, dimanche = 7). Une série est limitée à 500 occurrences. Pour une récurrence mensuelle, un jour inexistant dans un mois est ignoré. Une occurrence modifiée devient une exception et n’est plus écrasée par les changements futurs de sa série. Les occurrences passées sont immuables.

## Lot 3 — présence QR

- `POST /api/v1/choirs/:choirId/activities/:activityId/attendance/qr`
- `POST /api/v1/choirs/:choirId/activities/:activityId/attendance/scan`
- `GET /api/v1/choirs/:choirId/activities/:activityId/attendance`
- `POST /api/v1/choirs/:choirId/attendance/:attendanceId/corrections`

Le QR signé vaut deux minutes. Seul le hash de son identifiant est stocké et sa consommation atomique empêche sa réutilisation. L’heure serveur calcule retard et ponctualité ; la sortie calcule durée et participation. Toute correction exige un motif et crée un audit avant/après.

## Lot 4 — notifications

- `GET|POST /api/v1/choirs/:choirId/notification-templates`
- `PATCH /api/v1/choirs/:choirId/notification-templates/:id`
- `GET /api/v1/choirs/:choirId/notifications`
- `POST /api/v1/choirs/:choirId/notifications/:id/read`
- `POST /api/v1/choirs/:choirId/devices`

Les jobs gardent un instantané des messages et une clé d’idempotence unique. Le scheduler PostgreSQL fonctionne sans Redis ; BullMQ s’active avec `REDIS_URL`. Les rappels de retard sont annulés dès l’arrivée et revérifiés à l’exécution. Firebase Cloud Messaging s’active avec `FIREBASE_PROJECT_ID` et `FIREBASE_SERVICE_ACCOUNT_BASE64` (JSON du compte de service encodé en Base64).

## Lot 5 — statistiques

- `GET /api/v1/me/statistics`
- `GET /api/v1/choirs/:choirId/statistics`
- `GET /api/v1/choirs/:choirId/statistics/members`
- `GET /api/v1/choirs/:choirId/statistics/export.csv`

Les statistiques sont recalculées depuis les activités et pointages sources : aucune agrégation non auditable n’est la source de vérité. Les filtres initiaux couvrent période, type d’activité, membre et pupitre. Le dénominateur est explicité dans chaque réponse : seules les activités passées, non annulées/reportées, avec présence requise, et pour lesquelles le membre est attendu, entrent dans le taux d’assiduité. La ponctualité utilise les arrivées à l’heure divisées par les présences enregistrées. Les statistiques personnelles ne dévoilent jamais les données d’autres choristes ; les statistiques globales et exports exigent la permission de lecture des présences.

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
