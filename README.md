# Dressing : ton styliste IA

Web app Next.js (déployable sur Vercel). Elle numérise ta garde-robe en photo et propose chaque jour une tenue complète selon la **météo**, l'**occasion**, ta **morphologie** et tes **couleurs**. Elle repère aussi les **pièces manquantes** et donne des liens de recherche vers **130 enseignes** (multimarques, mode accessible, marques françaises, premium, sport, chaussures, accessoires, seconde main). Le **profil** peut être calculé automatiquement à partir d'une photo en pied, et les pièces s'ajoutent en photo ou en **scannant un ticket de caisse**.

👉 Concept détaillé, recherche mode sourcée et feuille de route : [`docs/CONCEPT.md`](docs/CONCEPT.md)

## Stack
- Next.js 16 (App Router) + Tailwind CSS 4
- **Gemini** (`@google/genai`), côté serveur uniquement : vision pour numériser les pièces, sorties JSON structurées, Google Search grounding pour suivre les tendances du jour
- **Open-Meteo** pour la météo (gratuit, sans clé)
- **Firebase** : comptes (Google ou e-mail) et base **Firestore** synchronisée entre appareils. Sans configuration Firebase, l'app fonctionne en local (IndexedDB)

## Lancer en local
```bash
cp .env.example .env.local   # puis colle ta clé GEMINI_API_KEY
npm install
npm run dev
```
Clé gratuite : https://aistudio.google.com/apikey

## Configurer Firebase (comptes et base de données)
1. Sur https://console.firebase.google.com, **créer un projet** (Google Analytics n'est pas nécessaire).
2. **Authentication** > Commencer > activer **Google** et **Adresse e-mail/Mot de passe**.
3. **Firestore Database** > Créer une base de données > mode **production**, région `eur3` (Europe).
4. Firestore > onglet **Règles** : coller le contenu de [`firestore.rules`](firestore.rules), puis Publier.
5. **Paramètres du projet** > Vos applications > icône **Web `</>`** > enregistrer l'app, puis copier `apiKey`, `authDomain`, `projectId` et `appId` dans les variables `NEXT_PUBLIC_FIREBASE_*` (voir `.env.example`).
6. Authentication > Settings > **Domaines autorisés** : ajouter le domaine Vercel (ex. `dressing-ia.vercel.app`).

Firebase Storage n'est pas utilisé, car il exige le forfait payant Blaze : les photos, compressées à environ 80 Ko, sont stockées directement dans Firestore. Le forfait gratuit Spark suffit.
Une fois Firebase activé, les routes IA exigent un compte connecté (jeton Firebase vérifié côté serveur), ce qui protège ta clé Gemini.

## Déployer sur Vercel
1. Importer le dépôt GitHub sur https://vercel.com/new (le framework Next.js est détecté automatiquement).
2. Ajouter les variables d'environnement `GEMINI_API_KEY` et les 4 variables `NEXT_PUBLIC_FIREBASE_*`.
3. Deploy.

## Structure
```
app/
  page.tsx            Aujourd'hui : météo + occasion → 3 tenues
  compte/             Connexion / inscription (Firebase Auth)
  profil/             Profil et avatar (morphologie, carnation, cheveux, yeux, styles, budget)
  dressing/           Garde-robe : ajout par photo ou ticket de caisse → numérisation IA, édition
  analyse/            Roue des couleurs, saison colorimétrique, coupes, styles, pièces manquantes
  tendances/          Veille tendances en direct (avec sources)
  api/                analyze-item · outfit · audit · trends · body-profile · receipt (appels Gemini)
lib/
  gemini.ts           Client Gemini, consignes du styliste, veille tendances (cache quotidien)
  schemas.ts          Schémas JSON imposés à l'IA
  color.ts            Roue chromatique et harmonies (complémentaire, analogue…)
  shops.ts            Liens de recherche par enseigne
  store.ts            Données : Firestore si connecté, IndexedDB sinon (migration auto à la 1re connexion)
  firebase.ts         Initialisation Firebase
firestore.rules       Règles de sécurité (chacun n'accède qu'à ses données)
```
