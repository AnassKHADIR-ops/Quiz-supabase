# Guide du projet — Math Exams (QCM en ligne)

Ce document explique, en partant de zéro, comment le projet est construit, comment les
différentes technologies collaborent, et comment développer / déployer au quotidien.

---

## 1. Vue d'ensemble en une phrase

C'est une application web de QCM de mathématiques : le **frontend** (ce que voit
l'utilisateur dans son navigateur) est écrit en **React**, et il parle directement à
**Supabase**, qui joue le rôle de **backend complet** (base de données + authentification

- logique métier), sans serveur intermédiaire à faire tourner soi-même.

```
Navigateur (React / Vite)  <-- HTTPS -->  Supabase (Postgres + Auth + fonctions SQL)
        ^
        |
   déployé sur Vercel, dont le code vit sur GitHub
```

Il n'y a **pas de serveur Node/Express** à héberger : `Quiz-Backend/` dans le repo est
l'ancienne version, elle n'est plus utilisée (voir le README).

---

## 2. Le rôle de chaque brique

### React + Vite (dans `React-Aps/`)

- **React** : bibliothèque pour construire l'interface (pages, boutons, formulaires).
- **Vite** : l'outil qui transforme le code React en fichiers HTML/CSS/JS optimisés
  (`npm run dev` pour développer, `npm run build` pour produire la version finale).
- Le frontend ne fait **aucune logique métier sensible** (pas de calcul de note "en
  confiance" côté client, par exemple) : il appelle des fonctions Supabase qui, elles,
  vérifient les droits et calculent les résultats côté serveur.

### Supabase

Supabase fournit trois choses que ce projet utilise :

1. **Authentification** (`supabase.auth.*`) : inscription/connexion par email + mot de
   passe. Chaque utilisateur a une ligne dans `auth.users` (géré par Supabase) et une
   ligne miroir dans `public.profiles` (créée automatiquement par un trigger) qui
   contient son `role` (`student` ou `teacher`).
2. **Base de données Postgres** : toutes les tables (`schools`,
   `subjects`, `exams`, `questions`, `choices`, `results`, `profiles`...) vivent ici.
3. **Fonctions RPC** (`create or replace function public.xxx(...)`) : au lieu de laisser
   le frontend écrire des requêtes SQL directement (dangereux), tout passe par des
   fonctions PostgreSQL prédéfinies, appelées via `supabase.rpc("nom_fonction", {...})`.
   Ces fonctions vivent dans `supabase/migrations/*.sql` et sont la seule porte d'entrée
   pour lire/écrire des données sensibles (ex. `create_exam`, `delete_school`,
   `submit_exam_attempt`, `get_exam_results`...).
   - Ce fichier `React-Aps/src/api.js` est la **seule** partie du frontend qui appelle
     Supabase : chaque fonction JS (`examsApi.create`, `schoolsApi.delete`, etc.)
     correspond à une fonction RPC côté base de données.
4. **RLS (Row Level Security)** : chaque table a des règles qui disent qui peut lire ou
   écrire quoi (ex. un étudiant ne peut jamais lire `choices.is_correct` directement).
   C'est ce qui rend sûr le fait d'exposer les clés Supabase dans le frontend (elles sont
   publiques par design, la sécurité vient des RLS + fonctions `security definer`).

### GitHub

- **Stocke le code** et son historique (`git log`, branches, etc.).
- **Déclenche le déploiement** : dès qu'on pousse (`git push`) sur la branche `master`,
  Vercel est prévenu automatiquement et republie le site.
- Le dépôt de ce projet : `https://github.com/AnassKHADIR-ops/Quiz-supabase`

### Vercel

- Héberge la version "buildée" du frontend (résultat de `npm run build`, dossier `dist/`).
- Détecte automatiquement que c'est un projet Vite et sait comment le construire.
- Ne touche jamais à la base de données : Vercel héberge uniquement le frontend, la base
  reste sur Supabase.

---

## 3. Structure des dossiers importants

```
Quiz-supabase/
├── React-Aps/              ← le frontend (c'est LUI qu'on déploie sur Vercel)
│   ├── src/
│   │   ├── api.js          ← tous les appels à Supabase (RPC)
│   │   ├── lib/supabase.js ← création du client Supabase (lit les variables d'env)
│   │   ├── pages/          ← les grandes pages (Home, Management, QcmEditor...)
│   │   ├── components/     ← briques réutilisables (Navbar, Quiz, Login...)
│   │   └── context/        ← contexte React (ex. utilisateur connecté)
│   ├── .env.local          ← tes variables Supabase EN LOCAL (jamais commité)
│   └── .env.example        ← modèle pour savoir quelles variables sont attendues
├── supabase/
│   └── migrations/         ← tout le schéma SQL, dans l'ordre chronologique
├── Quiz-Backend/           ← ANCIEN backend Node.js, plus utilisé (ignorable)
└── README.md
```

---

## 4. Variables d'environnement

Le frontend a besoin de deux variables pour savoir à quel projet Supabase se connecter :

```
VITE_SUPABASE_URL=https://rucpggahyiwufbzjznhf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
```

- On les trouve dans le dashboard Supabase → **Settings → API**.
- La clé "anon/publishable" est faite pour être publique (elle finit dans le code
  JavaScript envoyé au navigateur) — ce n'est pas un secret, la sécurité réelle vient des
  règles RLS côté base de données.
- **En local** : ces variables vont dans `React-Aps/.env.local` (fichier non versionné).
- **Sur Vercel** : il faut les ajouter dans les Settings du projet Vercel (voir §6).

---

## 5. Développement en local — commandes essentielles

```bash
cd Quiz-supabase/React-Aps

# 1. Installer les dépendances (une seule fois, ou après un git pull qui change package.json)
npm install

# 2. Lancer le serveur de développement (rechargement automatique)
npm run dev
# → ouvre http://localhost:5173

# 3. Vérifier que la version de production compile sans erreur
npm run build

# 4. Prévisualiser la version buildée localement
npm run preview
```

---

## 6. Déployer sur Vercel (première fois)

1. Va sur [vercel.com](https://vercel.com) et connecte-toi avec ton compte GitHub.
2. **Add New → Project**, choisis le repo `AnassKHADIR-ops/Quiz-supabase`.
3. Vercel doit détecter un monorepo : configure le **Root Directory** sur `React-Aps`
   (important — sinon il essaiera de builder à la racine, là où il n'y a pas d'app Vite).
4. Framework Preset : **Vite** (auto-détecté normalement).
   - Build command : `npm run build`
   - Output directory : `dist`
5. Dans **Environment Variables**, ajoute :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
     (les mêmes valeurs que dans ton `.env.local`)
6. Clique **Deploy**.

**Une fois configuré**, tout nouveau `git push` sur `master` republie automatiquement le
site — plus besoin de repasser par l'interface Vercel.

---

## 7. Modifier la base de données (migrations Supabase)

Le schéma (tables, fonctions, règles de sécurité) vit dans
`supabase/migrations/*.sql`, appliqué dans l'ordre des noms de fichiers (d'où le préfixe
`20260704...`).

Deux façons d'appliquer une migration à ta base réelle :

**Option A — via le CLI Supabase (méthode "propre", garde un historique) :**

```bash
cd Quiz-supabase
supabase login
supabase link --project-ref rucpggahyiwufbzjznhf
supabase db push          # applique les migrations pas encore appliquées
```

_(Sur ce poste, le téléchargement du CLI a échoué à cause du réseau — voir Option B.)_

**Option B — via le SQL Editor du dashboard (dépannage rapide) :**

1. Dashboard Supabase → **SQL Editor → New query**.
2. Copie-colle le contenu du fichier `.sql` concerné.
3. **Run**.

Les deux méthodes produisent le même résultat ; l'option A a l'avantage de garder une
trace propre de "quelle migration a été appliquée quand", l'option B est plus rapide
quand on est bloqué techniquement (c'est ce qu'on a fait pour
`20260704030000_delete_academic_hierarchy.sql`).

⚠️ Une migration modifie la base **réelle**, utilisée par de vrais comptes — toujours relire
le SQL avant de l'exécuter.

---

## 8. Rôles et Système d'Accès Privé (Modèle d'approbation)

La plateforme est **privée** : l'inscription seule ne donne pas accès aux contenus.

### Statuts d'un utilisateur :
- **`pending`** (par défaut à l'inscription) : le compte est créé mais ne peut accéder à aucun examen ni matière. Un écran d'attente s'affiche.
- **`approved`** : accès autorisé par l'administrateur. L'utilisateur peut passer les examens et consulter ses résultats.
- **`rejected`** : demande refusée par l'administrateur.
- **`revoked`** : accès retiré immédiatement par l'administrateur (même avec une session active).

### Rôles :
- **`student`** (par défaut) : utilisateur standard accédant aux QCM une fois validé.
- **`teacher` / `admin`** : administrateur de la plateforme. Accède au tableau de bord (`/dashboard`) pour gérer les demandes d'accès et au panneau de gestion (`/management`).

Pour promouvoir un compte en administrateur / professeur :

```sql
update public.profiles
set role = 'teacher', status = 'approved', approved_at = now()
where email = 'anass.khadir@usmba.ac.ma';
```

(à exécuter dans le SQL Editor Supabase).

---

## 9. Workflow quotidien type

```bash
# 1. Développer et tester en local
cd Quiz-supabase/React-Aps
npm run dev

# 2. Une fois satisfait, valider les changements
cd ..
git add -A
git commit -m "Description du changement"
git push origin master

# 3. Vercel republie automatiquement en 1-2 minutes
```

Si le changement touche aussi la base de données (nouvelle table, nouvelle fonction) :
ajoute un fichier dans `supabase/migrations/`, applique-le (§7), **puis** commit/push le
code frontend qui l'utilise.

---

## 10. Glossaire express

| Terme              | Explication                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| RPC                | "Remote Procedure Call" — le frontend appelle une fonction Postgres par son nom, comme un appel de fonction normal.                                   |
| RLS                | Row Level Security — règles Postgres qui filtrent qui peut voir/modifier quelle ligne.                                                                |
| Migration          | Fichier `.sql` qui décrit un changement de schéma, horodaté, appliqué une fois.                                                                       |
| `security definer` | Une fonction SQL qui s'exécute avec les droits de son créateur (pas de l'appelant) — permet de contrôler précisément ce qu'un utilisateur peut faire. |
| Anon key           | Clé publique du projet Supabase, sûre à exposer côté client grâce aux RLS.                                                                            |
