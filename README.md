# CloudOps Manager — Guide complet de A à Z

Plateforme web de gestion de projets, serveurs et applications cloud, avec supervision et alertes.
Ce guide couvre **tout le parcours** : outils à installer, lancement, vérification, tests, Git d'équipe, déploiement (VPS ou AWS), CI/CD, livrables et soutenance.

> Commandes données pour **Linux/macOS (bash)**. Les différences **Windows PowerShell** sont indiquées quand elles existent.

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Outils à télécharger](#2-outils-à-télécharger)
3. [Technologies et frameworks](#3-technologies-et-frameworks)
4. [Structure du projet](#4-structure-du-projet)
5. [Étape 1 : récupérer le projet et initialiser Git](#5-étape-1--récupérer-le-projet-et-initialiser-git)
6. [Étape 2 : configurer l'environnement](#6-étape-2--configurer-lenvironnement)
7. [Étape 3A : lancer avec Docker (recommandé)](#7-étape-3a--lancer-avec-docker-recommandé)
8. [Étape 3B : lancer en développement local](#8-étape-3b--lancer-en-développement-local)
9. [Étape 4 : vérifier que tout fonctionne](#9-étape-4--vérifier-que-tout-fonctionne)
10. [Utiliser Swagger](#10-utiliser-swagger)
11. [Lancer les tests](#11-lancer-les-tests)
12. [Commandes utiles](#12-commandes-utiles)
13. [Travail en équipe avec Git](#13-travail-en-équipe-avec-git)
14. [Déploiement sur un VPS / VM](#14-déploiement-sur-un-vps--vm)
15. [Déploiement sur AWS EC2 (bonus)](#15-déploiement-sur-aws-ec2-bonus)
16. [CI/CD avec GitHub Actions (bonus)](#16-cicd-avec-github-actions-bonus)
17. [Planning des 8 semaines](#17-planning-des-8-semaines)
18. [Livrables et soutenance](#18-livrables-et-soutenance)
19. [Dépannage](#19-dépannage)
20. [Checklist finale](#20-checklist-finale)

---

## 1. Vue d'ensemble

| Module | Contenu |
|---|---|
| Authentification | Inscription, connexion JWT, profil, rôles Admin / DevOps / Viewer, comptes créés par seed |
| Projets | CRUD, équipe et affectations (par email), environnements DEV / STAGING / PROD, filtres |
| Serveurs | CRUD (fournisseur, région, CPU, RAM, stockage, IP, statut), recherche, filtres, pagination |
| Applications | Association serveur + environnement, version, statut modifiable |
| Monitoring | Mesures CPU / RAM / disque **simulées** chaque minute, historique, disponibilité, graphiques |
| Alertes | Règles à seuil configurable, gravité, déclenchement automatique, acquittement, résolution, historique |
| Dashboard | Compteurs, répartition des statuts, alertes par gravité, utilisation moyenne, filtre par projet |

Architecture : `Navigateur → Next.js (:3000) → API NestJS (:3001) → Prisma → PostgreSQL`. Tout tourne dans Docker Compose.

---

## 2. Outils à télécharger

| Outil | Rôle | Version | Lien |
|---|---|---|---|
| **Node.js** (avec npm) | Exécuter backend et frontend, lancer le seed | 22 LTS | https://nodejs.org |
| **Docker Desktop** (avec Compose) | PostgreSQL, API et front en conteneurs | dernière stable | https://www.docker.com/products/docker-desktop |
| **Git** | Versionnement, historique par étudiant (exigé) | dernière stable | https://git-scm.com/downloads |
| **Compte GitHub** | Dépôt distant, CI/CD | — | https://github.com |
| **Visual Studio Code** | Éditeur | dernière stable | https://code.visualstudio.com |
| *(optionnel)* **DBeaver** ou **pgAdmin** | Consulter la base PostgreSQL | dernière stable | https://dbeaver.io · https://www.pgadmin.org |
| *(optionnel)* **Postman** | Tester l'API (Swagger suffit déjà) | dernière stable | https://www.postman.com/downloads |
| *(optionnel, bonus AWS)* **Compte AWS** | Déployer sur EC2 | — | https://aws.amazon.com |
| *(optionnel)* **draw.io** ou **mermaid.live** | Exporter les diagrammes UML en image | — | https://app.diagrams.net · https://mermaid.live |

Extensions VS Code utiles : **Prisma**, **ESLint**, **Docker**, **Markdown Preview Mermaid Support**.

### Installation selon le système

**Windows**
1. Installez Node.js, Git et Docker Desktop avec leurs installateurs.
2. Docker Desktop demande **WSL 2** : acceptez l'installation proposée, redémarrez si demandé.
3. Lancez Docker Desktop et attendez l'état **Running**.

**macOS** (avec Homebrew, https://brew.sh)
```bash
brew install node@22 git
brew install --cask docker
```

**Ubuntu / Debian**
```bash
sudo apt update && sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
# Docker : https://docs.docker.com/engine/install/ubuntu/
sudo usermod -aG docker $USER   # puis se déconnecter/reconnecter
```

### Vérifier l'installation
```bash
node -v                 # v22.x
npm -v                  # 10.x ou plus
git --version
docker -v
docker compose version
docker run --rm hello-world   # doit afficher "Hello from Docker!"
```

---

## 3. Technologies et frameworks

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | **Next.js 15** (App Router), **React 19**, **TypeScript** | Interface, navigation, pages protégées |
| Graphiques | **Recharts** | Courbes, camemberts, histogrammes |
| Backend | **NestJS 11**, **TypeScript** | API REST modulaire |
| Documentation API | **@nestjs/swagger** | Swagger UI sur `/api/docs` |
| Validation | **class-validator**, **class-transformer** | DTO et pipes |
| Base de données | **PostgreSQL 16** | 10 entités liées |
| ORM | **Prisma 6** | Schéma, migrations, requêtes typées |
| Sécurité | **JWT** (`@nestjs/jwt`, `passport-jwt`), **bcrypt**, **Guards** | Authentification et RBAC |
| Planification | **@nestjs/schedule** | Mesures simulées chaque minute |
| Tests | **Jest**, **Supertest** | Unitaires et intégration |
| Conteneurs | **Docker**, **Docker Compose** | Déploiement reproductible |

Les dépendances npm s'installent seules avec `npm install` : rien d'autre à télécharger à la main.

---

## 4. Structure du projet

```
cloudops-manager/
├── backend/
│   ├── prisma/             # schema.prisma, seed.ts
│   ├── src/                # auth, users, projects, servers, applications, monitoring, alerts, dashboard, common
│   ├── test/               # test d'intégration HTTP
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/app/            # (auth)/login, register · (app)/dashboard, servers, projects, applications, alerts, users, profile
│   ├── src/lib/            # client API, auth, hook useFetch, types
│   ├── Dockerfile
│   └── package.json
├── docs/analyse-uml.md     # cas d'utilisation, ER, séquences, architecture, RBAC, endpoints
├── .github/workflows/ci.yml
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 5. Étape 1 : récupérer le projet et initialiser Git

**1. Décompressez** `cloudops-manager.zip` et ouvrez un terminal dans le dossier :
```bash
cd cloudops-manager
code .          # ouvre VS Code (facultatif)
```

**2. Créez un dépôt vide sur GitHub** (bouton *New repository*, nom `cloudops-manager`, sans README), puis :
```bash
git init
git config user.name  "Votre Nom"
git config user.email "votre.email@exemple.com"
git add .
git commit -m "feat: squelette initial CloudOps Manager"
git branch -M main
git remote add origin https://github.com/<VOTRE_COMPTE>/cloudops-manager.git
git push -u origin main
```

Le fichier `.gitignore` exclut déjà `node_modules`, `dist`, `.next` et **`.env`** (ne committez jamais vos secrets).

Si vous travaillez en binôme ou trinôme, ajoutez vos coéquipiers : GitHub → *Settings* → *Collaborators*.

---

## 6. Étape 2 : configurer l'environnement

```bash
cp .env.example .env              # Windows PowerShell : copy .env.example .env
```

Ouvrez `.env` et **changez au minimum** `POSTGRES_PASSWORD` et `JWT_SECRET` :

```ini
POSTGRES_USER=cloudops
POSTGRES_PASSWORD=change_me
POSTGRES_DB=cloudops

JWT_SECRET=change_me_with_a_long_random_string
JWT_EXPIRES_IN=1d

FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Générer un secret aléatoire :
```bash
openssl rand -hex 32        # Windows : utilisez Git Bash, ou tapez une longue chaîne aléatoire
```

| Variable | Rôle |
|---|---|
| `POSTGRES_*` | Identifiants de la base créée par Docker |
| `JWT_SECRET` | Clé de signature des tokens (gardez-la secrète) |
| `JWT_EXPIRES_IN` | Durée de validité du token (`1d` = 1 jour) |
| `FRONTEND_URL` | URL autorisée par le CORS de l'API |
| `NEXT_PUBLIC_API_URL` | URL de l'API **vue depuis le navigateur**, figée au build du front |

---

## 7. Étape 3A : lancer avec Docker (recommandé)

**1. Construire et démarrer** (le premier build prend plusieurs minutes) :
```bash
docker compose up --build -d
docker compose ps                 # les 3 services doivent être "running"
docker compose logs -f backend    # Ctrl+C pour quitter les logs
```

Au démarrage, l'API crée automatiquement les tables : elle applique les migrations si le dossier `backend/prisma/migrations` existe, sinon elle exécute `prisma db push`.

**2. Charger les comptes et données de démonstration** (une seule fois) :
```bash
cd backend
npm install
npx prisma generate
```
Linux / macOS :
```bash
DATABASE_URL="postgresql://cloudops:change_me@localhost:5432/cloudops?schema=public" npx prisma db seed
```
Windows PowerShell :
```powershell
$env:DATABASE_URL="postgresql://cloudops:change_me@localhost:5432/cloudops?schema=public"
npx prisma db seed
```
(remplacez `change_me` par votre `POSTGRES_PASSWORD`). Résultat attendu : `Seed terminé : admin / devops / viewer + données de démonstration.`

**3. Ouvrir l'application**

| Service | URL |
|---|---|
| Application web | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |

### Comptes de démonstration

| Rôle | Email | Mot de passe | Droits |
|---|---|---|---|
| Admin | admin@cloudops.io | Admin123! | Tout, dont gestion des utilisateurs |
| DevOps | devops@cloudops.io | Devops123! | Créer/modifier projets, serveurs, applications, règles ; traiter les alertes |
| Viewer | viewer@cloudops.io | Viewer123! | Consultation seule |

Les comptes créés via « Créer un compte » sont des Viewer ; un Admin change leur rôle dans la page **Utilisateurs**. Changez ces mots de passe en production.

**Arrêter / relancer / réinitialiser**
```bash
docker compose down               # arrête, garde les données
docker compose up -d              # relance
docker compose down -v            # arrête ET efface la base (repartir de zéro)
docker compose up --build -d      # reconstruit après modification du code ou de .env
```

---

## 8. Étape 3B : lancer en développement local

Utile pour modifier le code avec rechargement automatique.

**1. Base de données seule**
```bash
docker compose up -d db
```

**2. Backend** (terminal 1)
```bash
cd backend
cp ../.env.example .env           # Windows : copy ..\.env.example .env
```
Ajoutez dans `backend/.env` (hôte `localhost` car l'API tourne hors Docker) :
```ini
DATABASE_URL=postgresql://cloudops:change_me@localhost:5432/cloudops?schema=public
```
Puis :
```bash
npm install
npx prisma migrate dev --name init    # crée la migration (à committer), applique le schéma, lance le seed
npm run start:dev                     # API sur http://localhost:3001/api
```
Si le seed ne se lance pas automatiquement : `npx prisma db seed`.

**3. Frontend** (terminal 2)
```bash
cd frontend
npm install
npm run dev                           # http://localhost:3000
```

Le front lit `NEXT_PUBLIC_API_URL` (défaut `http://localhost:3001/api`). Pour la changer en local, créez `frontend/.env.local` :
```ini
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

> Pensez à **committer le dossier `backend/prisma/migrations`** généré : c'est une preuve de travail sur « modèles de données, entités, migrations » (semaine 2).

---

## 9. Étape 4 : vérifier que tout fonctionne

Parcours de test à suivre dans l'ordre :

1. Ouvrez http://localhost:3000 et connectez-vous en **Admin**.
2. **Dashboard** : compteurs, camembert des statuts de serveurs, histogrammes. Changez le filtre **Projet**.
3. **Serveurs** : recherchez `web`, filtrez par statut, créez un serveur (IP valide obligatoire).
4. Cliquez sur `web-prod-01` : après 1 à 2 minutes, la courbe CPU / RAM / disque se remplit (collecte simulée chaque minute). Un serveur en `MAINTENANCE` n'est pas mesuré.
5. **Alertes → Règles et seuils** : ajoutez « CPU > 20 % » ; à la prochaine collecte une alerte apparaît dans **Incidents**. Cliquez **Acquitter**, puis **Résoudre**.
6. **Projets** : ouvrez un projet, ajoutez un environnement, affectez `viewer@cloudops.io` à l'équipe.
7. **Applications** : créez une application (choisissez d'abord le projet, puis l'environnement), changez son statut.
8. **Utilisateurs** (Admin) : changez le rôle d'un compte.
9. Déconnectez-vous, connectez-vous en **Viewer** : les boutons de création / suppression disparaissent. Même en appelant l'API directement, vous obtenez **403**.
10. Connectez-vous en **DevOps** : peut créer et modifier, mais pas supprimer un serveur ni un projet, ni gérer les utilisateurs.

---

## 10. Utiliser Swagger

1. Ouvrez http://localhost:3001/api/docs.
2. Déroulez **Auth → POST /auth/login**, cliquez *Try it out*, envoyez :
   ```json
   { "email": "admin@cloudops.io", "password": "Admin123!" }
   ```
3. Copiez la valeur `accessToken` de la réponse.
4. Cliquez sur **Authorize** (en haut à droite), collez le token, validez.
5. Testez n'importe quelle route (ex. `GET /servers?page=1&limit=5&status=ONLINE`).

Test en ligne de commande :
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cloudops.io","password":"Admin123!"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')

curl -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/servers?limit=5"
```

Convention de réponse pour les listes : `{ "data": [...], "meta": { "total", "page", "limit", "totalPages" } }`. Paramètres communs : `page`, `limit` (max 100), `search`.

---

## 11. Lancer les tests

```bash
cd backend
npm test              # unitaires : auth, serveurs, alertes, guard des rôles
npm run test:e2e      # intégration HTTP (guards, validation, pagination), Prisma mocké, sans base
npm run test:cov      # rapport de couverture dans backend/coverage/
```

Faites une **capture du résultat** et du rapport de couverture pour le rapport technique.

---

## 12. Commandes utiles

**Docker**
```bash
docker compose ps                       # état
docker compose logs -f backend          # logs API
docker compose logs -f frontend         # logs front
docker compose restart backend          # redémarrer un service
docker compose exec db psql -U cloudops -d cloudops    # console SQL
docker system prune -f                  # nettoyer les images inutilisées
```

**Prisma** (depuis `backend/`)
```bash
npx prisma generate                     # régénère le client après modification du schéma
npx prisma migrate dev --name <nom>     # nouvelle migration en dev
npx prisma migrate deploy               # applique les migrations (production)
npx prisma db seed                      # recharge comptes + données de démo
npx prisma studio                       # interface web de la base (http://localhost:5555)
npx prisma validate                     # vérifie le schéma
```

**NestJS / Next.js**
```bash
npm run build                           # compile
npm run start:dev                       # backend avec rechargement
npm run dev                             # frontend avec rechargement
```

---

## 12 bis. Réinitialiser complètement

```bash
docker compose down -v
docker compose up --build -d
cd backend && npx prisma db seed        # avec DATABASE_URL défini (voir section 7)
```

---

## 13. Travail en équipe avec Git

Le sujet exige un **historique Git reflétant la contribution de chaque étudiant** : chacun commite sous son propre nom, avec des commits fréquents.

**Convention de messages** : `feat:` (fonctionnalité), `fix:` (correction), `docs:`, `test:`, `refactor:`, `chore:`.

**Cycle de travail par fonctionnalité**
```bash
git checkout main && git pull
git checkout -b feature/alerts-page
# ... modifications ...
git add .
git commit -m "feat(alerts): ajoute la page des règles d'alerte"
git push -u origin feature/alerts-page
```
Puis sur GitHub : **Pull Request** vers `main`, relue par un coéquipier, puis *Merge*.
```bash
git checkout main && git pull           # récupérer le merge
```

**Répartition conseillée (trinôme)**

| Membre | Responsabilités |
|---|---|
| A | Backend : auth, users, projets, applications ; tests |
| B | Backend : serveurs, monitoring, alertes, dashboard ; Docker et déploiement |
| C | Frontend : toutes les pages ; documentation et rapport |

En binôme, fusionnez B et C selon la charge. Chaque membre doit pouvoir **expliquer et modifier en direct n'importe quelle partie** (modification technique demandée à la soutenance).

Vérifier les contributions :
```bash
git shortlog -sn                        # nombre de commits par auteur
git log --oneline --graph --all | head -30
```

---

## 14. Déploiement sur un VPS / VM

Ce que le sujet demande : « application déployée ou démontrable sur VM ». N'importe quel fournisseur convient (OVH, Hetzner, DigitalOcean, Scaleway, VM d'école, VirtualBox).

**1. Préparer le serveur** (Ubuntu 22.04 ou 24.04, 2 Go de RAM minimum)
```bash
ssh <utilisateur>@<IP_DU_SERVEUR>
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit    # reconnectez-vous en SSH pour appliquer le groupe docker
```

**2. Récupérer le code**
```bash
git clone https://github.com/<VOTRE_COMPTE>/cloudops-manager.git
cd cloudops-manager
cp .env.example .env
nano .env
```

**3. Adapter `.env` à l'adresse du serveur**
```ini
POSTGRES_PASSWORD=<mot_de_passe_solide>
JWT_SECRET=<résultat de: openssl rand -hex 32>
FRONTEND_URL=http://<IP_OU_DOMAINE>:3000
NEXT_PUBLIC_API_URL=http://<IP_OU_DOMAINE>:3001/api
```
`NEXT_PUBLIC_API_URL` est figée au build : toute modification demande `docker compose up --build -d`.

**4. Pare-feu**
```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000
sudo ufw allow 3001
sudo ufw enable
```
(Chez certains fournisseurs il faut aussi ouvrir les ports dans l'interface web.)

**5. Lancer**
```bash
docker compose up --build -d
docker compose ps
```

**6. Charger les données de démo** (conteneur Node temporaire, sans rien installer sur le serveur) :
```bash
docker run --rm --network host -v "$PWD/backend":/app -w /app \
  -e DATABASE_URL="postgresql://cloudops:<POSTGRES_PASSWORD>@localhost:5432/cloudops?schema=public" \
  node:22-bookworm sh -c "npm install && npx prisma generate && npx prisma db seed"
```
La base n'est exposée que sur `127.0.0.1` (voir `docker-compose.yml`), donc `--network host` permet d'y accéder.

**7. Tester** : http://<IP_OU_DOMAINE>:3000 et http://<IP_OU_DOMAINE>:3001/api/docs.

**Mettre à jour après un nouveau commit**
```bash
git pull
docker compose up --build -d
```

**Sauvegarder la base**
```bash
docker compose exec db pg_dump -U cloudops cloudops > backup.sql
```

**HTTPS (recommandé, facultatif)** : avec un nom de domaine pointant vers le serveur, placez **Caddy** devant l'application. Exemple de `Caddyfile` :
```
mondomaine.com {
    reverse_proxy localhost:3000
}
api.mondomaine.com {
    reverse_proxy localhost:3001
}
```
Dans ce cas, mettez `FRONTEND_URL=https://mondomaine.com` et `NEXT_PUBLIC_API_URL=https://api.mondomaine.com/api`, puis reconstruisez.

---

## 15. Déploiement sur AWS EC2 (bonus)

Le sujet **n'impose pas AWS** : le bonus « déploiement sur AWS/Azure » vaut jusqu'à +2 points (note plafonnée à 20/20). C'est le même déploiement que la section 14, sur une instance EC2.

**1. Créer l'instance** (console AWS → EC2 → *Launch instance*)
- Nom : `cloudops-manager`
- Image : **Ubuntu Server 24.04 LTS**
- Type : `t3.small` (2 Go de RAM) conseillé ; `t2.micro` / `t3.micro` (1 Go) peut manquer de mémoire pour le build du front, dans ce cas ajoutez un swap (voir plus bas)
- Paire de clés : *Create new key pair*, format `.pem`, téléchargez-la et gardez-la en lieu sûr
- Stockage : 20 Go
- **Security Group** : autorisez en entrée
  - SSH (22) depuis *My IP*
  - TCP 3000 et TCP 3001 depuis `0.0.0.0/0`

**2. Se connecter**
```bash
chmod 400 cloudops-key.pem                       # Linux / macOS
ssh -i cloudops-key.pem ubuntu@<IP_PUBLIQUE_EC2>
```
Sous Windows, utilisez PowerShell (`ssh -i cloudops-key.pem ubuntu@<IP>`) ou PuTTY.

**3. Installer Docker**
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit        # puis reconnectez-vous
```

**4. (Si 1 Go de RAM) ajouter un swap**
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
```

**5. Déployer** : suivez les étapes 2, 3, 5, 6 et 7 de la section 14, avec l'IP publique EC2. (Le pare-feu `ufw` est inutile : le Security Group joue ce rôle.)

**6. Adresse stable (recommandé)** : l'IP publique change si l'instance est arrêtée puis relancée. Allouez une **Elastic IP** (EC2 → *Elastic IPs* → *Allocate* → *Associate*), puis mettez à jour `.env` et reconstruisez le front.

**7. À la fin de la soutenance, évitez les frais**
- Arrêtez ou **terminez** l'instance (EC2 → *Instance state*).
- Libérez l'Elastic IP si vous en avez créé une (facturée quand elle n'est pas utilisée).
- Vérifiez la page *Billing* ; créez une alerte de budget (AWS Budgets) dès le début.

> Les mesures de monitoring restent **simulées** : le sujet n'autorise la collecte réelle que sur une infrastructure de test contrôlée.

---

## 16. CI/CD avec GitHub Actions (bonus)

Le fichier `.github/workflows/ci.yml` est déjà fourni. À chaque `push` et `pull request`, GitHub :
1. installe le backend, génère le client Prisma, lance les tests unitaires et d'intégration, compile ;
2. compile le frontend ;
3. construit les images Docker.

Pour l'activer, il suffit de pousser le dépôt sur GitHub :
```bash
git add .github && git commit -m "ci: ajoute le workflow GitHub Actions" && git push
```
Le résultat apparaît dans l'onglet **Actions** du dépôt ; ajoutez le badge dans le README si vous voulez :
```markdown
![CI](https://github.com/<VOTRE_COMPTE>/cloudops-manager/actions/workflows/ci.yml/badge.svg)
```

**Aller plus loin (déploiement automatique)** : ajoutez un job qui se connecte en SSH au serveur et exécute `git pull && docker compose up --build -d`. Stockez la clé privée et l'IP dans *Settings → Secrets and variables → Actions* (jamais en clair dans le dépôt).

---

## 17. Planning des 8 semaines

| Semaine | Livrable du sujet | Où c'est dans le projet | À faire / commandes |
|---|---|---|---|
| 1 | Analyse, UML, architecture, dépôt Git | `docs/analyse-uml.md` | `git init`, premier push, exporter les diagrammes en PNG (mermaid.live) |
| 2 | Modèles de données, entités, migrations, modules NestJS | `backend/prisma/schema.prisma`, `backend/src/*` | `npx prisma migrate dev --name init`, committer `prisma/migrations` |
| 3 | JWT, Guards, rôles, validation, Swagger | `backend/src/auth`, `common`, DTO | Tester dans Swagger les 3 rôles (200 / 401 / 403) |
| 4 | Interface Next.js, authentification, consommation API | `frontend/src/app/(auth)`, `(app)` | **Évaluation intermédiaire (30 %)** : démo login + dashboard + liste de serveurs |
| 5 | Projets, serveurs, applications finalisés | modules `projects`, `servers`, `applications` + pages | Vérifier CRUD, filtres, pagination, états de chargement/erreur |
| 6 | Supervision, graphiques, alertes, dashboard | `monitoring`, `alerts`, `dashboard` + pages | Créer une règle basse, voir l'alerte, acquitter, résoudre |
| 7 | Docker, Compose, tests, déploiement | `Dockerfile`, `docker-compose.yml`, `*.spec.ts`, `test/` | Sections 11 et 14 / 15 ; capture des tests |
| 8 | Correction, documentation, soutenance | README, rapport, présentation | Section 18 ; répétition de la démo |

Gardez toujours une **version démontrable** de l'application, même incomplète.

---

## 18. Livrables et soutenance

### Livrables à remettre

| Livrable | Où le trouver |
|---|---|
| Lien GitHub | dépôt avec historique de chaque membre |
| Application déployée ou démontrable | section 14 ou 15 (ou démo locale Docker) |
| Fichiers Docker | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` |
| README d'installation | ce fichier |
| Swagger | `/api/docs` (ajoutez des captures au rapport) |
| Diagramme d'architecture | `docs/analyse-uml.md` §5 |
| Modèle de données | `docs/analyse-uml.md` §3 (diagramme ER) et `schema.prisma` |
| Rapport technique (10 à 15 pages) | à rédiger (plan ci-dessous) |
| Support de présentation | à préparer (plan ci-dessous) |

### Plan du rapport technique (10 à 15 pages)

1. Introduction : contexte, objectifs, périmètre
2. Analyse des besoins : acteurs, cas d'utilisation, matrice des rôles
3. Conception : diagramme de classes / ER, séquences, architecture
4. Choix technologiques et justification (NestJS, Prisma, Next.js, Docker)
5. Réalisation backend : modules, DTO, validation, filtre d'exceptions, pagination, Swagger
6. Sécurité : JWT, bcrypt, Guards, RBAC (tableau des permissions)
7. Réalisation frontend : navigation, gestion des états, graphiques
8. Monitoring et alertes : simulation, évaluation des règles, cycle de vie d'un incident
9. Docker et déploiement : Dockerfiles multi-stage, Compose, volume de persistance, (AWS / VPS)
10. Tests : stratégie, résultats, couverture
11. Difficultés rencontrées, limites, améliorations (WebSocket, métriques réelles, HTTPS)
12. Conclusion, répartition du travail par membre, annexes (captures)

### Déroulé de la soutenance (5 + 10 + 5 minutes)

| Partie | Durée | Contenu |
|---|---|---|
| Présentation | 5 min | Problème, architecture, stack, modèle de données (4 à 6 diapositives) |
| Démonstration | 10 min | Scénario ci-dessous |
| Questions | 5 min | Questions techniques ; **une modification en direct peut être demandée à chaque membre** |

**Scénario de démo (10 min)**
1. Connexion Admin → dashboard (filtre par projet).
2. Création d'un serveur et d'une application.
3. Page d'un serveur : courbe de monitoring et disponibilité.
4. Règle « CPU > 20 % » → alerte → acquittement → résolution.
5. Connexion Viewer : boutons absents ; montrer le 403 dans Swagger.
6. Swagger : endpoints documentés ; `docker compose ps` ; URL déployée.

**Modifications en direct possibles** (entraînez-vous) : ajouter un champ à un DTO, ajouter un filtre à une liste, changer un seuil ou une règle de rôle (`@Roles(...)`), ajouter un compteur au dashboard.

**Conseils** : répétez deux fois ; préparez une base avec des données de démo (`prisma db seed`) ; ayez un plan B local si le réseau tombe ; sachez expliquer chaque fichier que vous avez écrit.

---

## 19. Dépannage

| Problème | Cause probable | Solution |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop non lancé | Lancer Docker Desktop, attendre « Running » |
| `port is already allocated` (3000, 3001, 5432) | Port déjà utilisé | Arrêter l'autre programme, ou changer le port à gauche dans `docker-compose.yml` (ex. `"3100:3000"`) |
| Page web OK mais connexion échoue (« Erreur réseau ») | `NEXT_PUBLIC_API_URL` incorrecte ou API arrêtée | `docker compose ps`, corriger `.env`, relancer avec `--build` |
| Erreur CORS dans la console du navigateur | `FRONTEND_URL` ≠ URL réelle du front | Corriger `FRONTEND_URL`, `docker compose up -d --build backend` |
| Connexion impossible avec les comptes de démo | Seed non exécuté | Section 7, étape 2 |
| `Environment variable not found: DATABASE_URL` | `backend/.env` manquant (mode local) | Ajouter la ligne `DATABASE_URL=...` |
| `P1001: Can't reach database server` | Base arrêtée ou mauvais hôte | `docker compose up -d db` ; hôte `localhost` hors Docker, `db` dans Docker |
| `P1000: Authentication failed` | Mot de passe différent de celui déjà stocké dans le volume | Aligner `POSTGRES_PASSWORD`, ou `docker compose down -v` pour recréer la base |
| `The table ... does not exist` | Schéma non créé | `docker compose restart backend` (il applique `db push`/migrations) ou `npx prisma migrate dev` |
| Seed : `Cannot find module '@prisma/client'` ou `.prisma/client` | Client non généré | `npx prisma generate` |
| Aucune mesure sur la page d'un serveur | Collecte toutes les minutes | Attendre 1 à 2 min ; un serveur `MAINTENANCE` n'est pas mesuré |
| Build du front tué (`Killed`, code 137) sur petite VM | Manque de RAM | Ajouter un swap (section 15, étape 4) ou une instance plus grande |
| `permission denied` sur `docker` (Linux) | Utilisateur hors du groupe docker | `sudo usermod -aG docker $USER`, reconnexion |
| Après avoir changé l'IP du serveur, le front appelle l'ancienne adresse | `NEXT_PUBLIC_API_URL` est figée au build | Corriger `.env`, `docker compose up --build -d` |
| Erreur de version Node (`engine`) | Node trop ancien | Installer Node 22 LTS |
| Voir les logs détaillés | — | `docker compose logs -f backend` ou `frontend` |

---

## 20. Checklist finale

**Fonctionnel**
- [ ] 3 rôles testés (Admin, DevOps, Viewer) avec permissions distinctes côté backend
- [ ] CRUD projets, serveurs, applications opérationnels, avec filtres, recherche, pagination
- [ ] Monitoring : mesures, historique, disponibilité, graphiques
- [ ] Alertes : règles, déclenchement, acquittement, résolution, historique
- [ ] Dashboard avec compteurs, graphiques et filtre

**Exigences techniques**
- [ ] 8 entités liées minimum (10 dans le schéma) et 20 endpoints documentés (42 réalisés)
- [ ] DTO + pipes de validation, filtre d'exceptions global
- [ ] Interface responsive, états de chargement et d'erreur
- [ ] Tests unitaires et d'intégration qui passent (`npm test`, `npm run test:e2e`)

**Livrables**
- [ ] Dépôt GitHub avec commits de **chaque** membre et dossier `prisma/migrations`
- [ ] Application déployée (ou démo Docker locale prête)
- [ ] Rapport technique de 10 à 15 pages
- [ ] Support de présentation, scénario de démo répété
- [ ] Diagrammes exportés en images (UML, ER, architecture)
- [ ] Secrets absents du dépôt (`.env` ignoré)

**Bonus (jusqu'à +2)**
- [ ] CI/CD GitHub Actions actif (section 16)
- [ ] Déploiement AWS EC2 (section 15)
- [ ] WebSocket / métriques temps réel (non inclus : à ajouter si le temps le permet)
