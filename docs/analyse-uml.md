# CloudOps Manager — Dossier d'analyse et de conception (Semaines 1-2)

> Les diagrammes sont en **Mermaid** : ils s'affichent directement sur GitHub et peuvent être exportés en PNG/SVG
> via https://mermaid.live pour le rapport technique.

## 1. Acteurs et rôles

| Rôle | Description |
|---|---|
| **Admin** | Gère les utilisateurs et leurs rôles, a tous les droits sur les ressources |
| **DevOps** | Gère projets, serveurs, applications, règles d'alerte ; traite les incidents |
| **Viewer** | Consultation seule (dashboard, listes, graphiques, historique) |

## 2. Diagramme de cas d'utilisation

```mermaid
flowchart LR
  V([Viewer])
  D([DevOps])
  A([Admin])
  D -->|hérite de| V
  A -->|hérite de| D

  subgraph CloudOps Manager
    UC1(S'authentifier / gérer son profil)
    UC2(Consulter dashboard et graphiques)
    UC3(Consulter projets, serveurs, applications)
    UC4(Consulter alertes et historique)
    UC5(Gérer projets, équipes, environnements)
    UC6(Gérer serveurs)
    UC7(Gérer applications)
    UC8(Configurer règles d'alerte)
    UC9(Acquitter / résoudre une alerte)
    UC10(Gérer utilisateurs et rôles)
  end

  V --- UC1 & UC2 & UC3 & UC4
  D --- UC5 & UC6 & UC7 & UC8 & UC9
  A --- UC10
```

## 3. Diagramme de classes / modèle de données (10 entités)

```mermaid
erDiagram
  USER ||--o{ PROJECT_MEMBER : "participe"
  PROJECT ||--o{ PROJECT_MEMBER : "a"
  PROJECT ||--o{ ENVIRONMENT : "possède"
  PROJECT |o--o{ SERVER : "héberge"
  PROJECT ||--o{ APPLICATION : "contient"
  SERVER ||--o{ APPLICATION : "exécute"
  ENVIRONMENT ||--o{ APPLICATION : "cible"
  SERVER ||--o{ METRIC : "produit"
  SERVER |o--o{ ALERT_RULE : "surveillé par"
  ALERT_RULE ||--o{ ALERT : "déclenche"
  SERVER ||--o{ ALERT : "concerne"
  USER |o--o{ ALERT : "acquitte / résout"
  USER |o--o{ AUDIT_LOG : "effectue"

  USER {
    uuid id PK
    string email UK
    string passwordHash
    string firstName
    string lastName
    enum role "ADMIN|DEVOPS|VIEWER"
    bool isActive
  }
  PROJECT {
    uuid id PK
    string name UK
    string description
    enum status "ACTIVE|ARCHIVED"
  }
  PROJECT_MEMBER {
    uuid id PK
    uuid projectId FK
    uuid userId FK
    enum role "OWNER|MEMBER"
  }
  ENVIRONMENT {
    uuid id PK
    uuid projectId FK
    string name
    enum type "DEV|STAGING|PROD"
    string url
  }
  SERVER {
    uuid id PK
    uuid projectId FK
    string name
    string provider
    string region
    int cpuCores
    int ramGb
    int storageGb
    string ipAddress UK
    enum status "ONLINE|OFFLINE|MAINTENANCE"
  }
  APPLICATION {
    uuid id PK
    uuid projectId FK
    uuid serverId FK
    uuid environmentId FK
    string name
    string version
    enum status "RUNNING|STOPPED|FAILED|DEPLOYING"
  }
  METRIC {
    uuid id PK
    uuid serverId FK
    float cpuUsage
    float ramUsage
    float diskUsage
    bool isUp
    datetime recordedAt
  }
  ALERT_RULE {
    uuid id PK
    uuid serverId FK
    string name
    enum metric "CPU|RAM|DISK"
    enum operator "GT|GTE|LT|LTE"
    float threshold
    enum severity "INFO|WARNING|CRITICAL"
    bool enabled
  }
  ALERT {
    uuid id PK
    uuid ruleId FK
    uuid serverId FK
    enum status "OPEN|ACKNOWLEDGED|RESOLVED"
    enum severity
    float value
    string message
    datetime triggeredAt
    datetime resolvedAt
  }
  AUDIT_LOG {
    uuid id PK
    uuid userId FK
    string action
    string entityType
    json details
  }
```

## 4. Diagrammes de séquence

### 4.1 Authentification et accès protégé (JWT + RBAC)

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant F as Next.js
  participant A as API NestJS
  participant G as JwtAuthGuard / RolesGuard
  participant DB as PostgreSQL

  U->>F: Saisit email + mot de passe
  F->>A: POST /api/auth/login
  A->>DB: Recherche utilisateur
  A->>A: bcrypt.compare()
  A-->>F: { accessToken, user }
  F->>F: Stocke le JWT
  U->>F: Ouvre la page Serveurs
  F->>A: GET /api/servers (Authorization: Bearer JWT)
  A->>G: Vérifie signature + rôle requis
  alt Token invalide
    G-->>F: 401 Unauthorized
  else Rôle insuffisant
    G-->>F: 403 Forbidden
  else Autorisé
    A->>DB: SELECT servers (pagination, filtres)
    A-->>F: 200 { data, meta }
  end
```

### 4.2 Monitoring et déclenchement d'une alerte

```mermaid
sequenceDiagram
  participant C as Job @Cron (chaque minute)
  participant M as MonitoringService
  participant DB as PostgreSQL
  participant R as AlertsService
  actor D as DevOps
  participant F as Dashboard Next.js

  C->>M: collectMetrics()
  M->>DB: Liste serveurs ONLINE
  M->>M: Génère CPU/RAM/DISK simulés
  M->>DB: INSERT Metric
  M->>R: evaluateRules(serveur, mesure)
  R->>DB: Règles actives du serveur + globales
  alt Seuil franchi et aucune alerte OPEN identique
    R->>DB: INSERT Alert (OPEN, gravité)
  end
  F->>M: GET /monitoring/servers/:id/metrics (polling)
  M-->>F: Historique pour graphiques
  D->>R: PATCH /alerts/:id/acknowledge puis /resolve
  R->>DB: UPDATE Alert (status, resolvedAt, resolvedById)
```

## 5. Architecture

```mermaid
flowchart LR
  B[Navigateur] -->|HTTP :3000| FE[Next.js<br/>App Router]
  FE -->|REST + JWT :3001| API[NestJS<br/>Guards, DTO, Swagger]
  API --> ORM[Prisma]
  ORM --> PG[(PostgreSQL<br/>volume pgdata)]
  CRON[@nestjs/schedule<br/>mesures simulées + règles] --> API
  subgraph Docker Compose sur VPS/VM
    FE
    API
    ORM
    PG
    CRON
  end
```

Architecture backend : un module NestJS par domaine (`auth`, `users`, `projects`, `servers`, `applications`, `monitoring`, `alerts`, `dashboard`), avec controller → service → Prisma, DTO validés (class-validator), filtre d'exceptions global et guards globaux (`JwtAuthGuard` puis `RolesGuard`).

## 6. Matrice des permissions (RBAC)

| Action | Viewer | DevOps | Admin |
|---|:--:|:--:|:--:|
| Login, profil, dashboard, consultation (GET) | ✅ | ✅ | ✅ |
| CRUD projets, membres, environnements | ❌ | ✅ | ✅ |
| CRUD serveurs, applications | ❌ | ✅ | ✅ |
| CRUD règles d'alerte | ❌ | ✅ | ✅ |
| Acquitter / résoudre une alerte | ❌ | ✅ | ✅ |
| Supprimer projet / serveur | ❌ | ❌ | ✅ |
| Gérer utilisateurs et rôles | ❌ | ❌ | ✅ |

## 7. Liste des endpoints REST (42, objectif minimum : 20)

| Module | Endpoints |
|---|---|
| Auth (3) | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` |
| Users (7) | `GET /users/me` · `PATCH /users/me` · `GET /users` · `GET /users/:id` · `PATCH /users/:id` · `PATCH /users/:id/role` · `DELETE /users/:id` |
| Projects (10) | `GET /projects` · `POST /projects` · `GET /projects/:id` · `PATCH /projects/:id` · `DELETE /projects/:id` · `POST /projects/:id/members` · `DELETE /projects/:id/members/:userId` · `GET /projects/:id/environments` · `POST /projects/:id/environments` · `DELETE /projects/:id/environments/:envId` |
| Servers (5) | `GET /servers` · `POST /servers` · `GET /servers/:id` · `PATCH /servers/:id` · `DELETE /servers/:id` |
| Applications (5) | `GET /applications` · `POST /applications` · `GET /applications/:id` · `PATCH /applications/:id` · `DELETE /applications/:id` |
| Monitoring (3) | `POST /monitoring/metrics` · `GET /monitoring/servers/:id/metrics` · `GET /monitoring/servers/:id/uptime` |
| Alerts (7) | `GET/POST /alert-rules` · `PATCH/DELETE /alert-rules/:id` · `GET /alerts` · `PATCH /alerts/:id/acknowledge` · `PATCH /alerts/:id/resolve` |
| Dashboard (2) | `GET /dashboard/summary` · `GET /dashboard/alerts-by-severity` |

Convention : listes paginées `?page=1&limit=10&search=...` + filtres propres à chaque ressource, réponse `{ data, meta: { total, page, limit, totalPages } }`.

## 8. Choix techniques justifiés

- **Prisma** : schéma déclaratif lisible (utile pour le rapport), migrations versionnées, client typé.
- **Guards globaux** : sécurité « fermée par défaut », `@Public()` pour les seules routes ouvertes.
- **Monitoring simulé** : job planifié, conforme au cahier des charges ; remplaçable plus tard par un agent réel ou des WebSockets (bonus).
- **Docker multi-stage** : images légères, migrations appliquées au démarrage, volume `pgdata` pour la persistance.
