# Dressing : ton styliste IA

Web app Next.js (déployable sur Vercel). Elle numérise ta garde-robe en photo et propose chaque jour une tenue complète selon la **météo**, l'**occasion**, ta **morphologie** et tes **couleurs**. Elle repère aussi les **pièces manquantes** et donne des liens vers Zalando, Uniqlo, H&M, Zara, Levi's et Vinted.

👉 Concept détaillé, recherche mode sourcée et feuille de route : [`docs/CONCEPT.md`](docs/CONCEPT.md)

## Stack
- Next.js 16 (App Router) + Tailwind CSS 4
- **Gemini** (`@google/genai`), côté serveur uniquement : vision pour numériser les pièces, sorties JSON structurées, Google Search grounding pour suivre les tendances du jour
- **Open-Meteo** pour la météo (gratuit, sans clé)
- Stockage **local** (IndexedDB) : aucune base de données à configurer pour le MVP

## Lancer en local
```bash
cp .env.example .env.local   # puis colle ta clé GEMINI_API_KEY
npm install
npm run dev
```
Clé gratuite : https://aistudio.google.com/apikey

## Déployer sur Vercel
1. Importer le dépôt GitHub sur https://vercel.com/new (le framework Next.js est détecté automatiquement).
2. Ajouter la variable d'environnement `GEMINI_API_KEY` (et, en option, `GEMINI_MODEL`).
3. Deploy.

## Structure
```
app/
  page.tsx            Aujourd'hui : météo + occasion → 3 tenues
  profil/             Profil et avatar (morphologie, carnation, cheveux, yeux, styles, budget)
  dressing/           Garde-robe : ajout photo → numérisation IA, édition
  analyse/            Roue des couleurs, saison colorimétrique, coupes, styles, pièces manquantes
  tendances/          Veille tendances en direct (avec sources)
  api/                analyze-item · outfit · audit · trends (appels Gemini)
lib/
  gemini.ts           Client Gemini, consignes du styliste, veille tendances (cache quotidien)
  schemas.ts          Schémas JSON imposés à l'IA
  color.ts            Roue chromatique et harmonies (complémentaire, analogue…)
  shops.ts            Liens de recherche par enseigne
```
