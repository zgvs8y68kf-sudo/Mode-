# Volley · Équipes

Web app (Next.js + Firebase, déployable sur Vercel) pour ne plus perdre de temps à faire les équipes en début de séance.

1. **Une seule fois** : chaque joueur·se crée son compte et remplit un questionnaire bienveillant de 2 minutes (prénom, sexe, année de naissance, 6 gestes : service, réception, passe, attaque, contre, défense, plus l'ancienneté, le cadre de jeu et le poste préféré). Les réponses décrivent des situations de jeu plutôt qu'une note à s'attribuer.
2. **À chaque séance** : on clique « Je viens », « Peut-être » ou « Absent·e ». On peut ajouter un·e invité·e sans compte avec un niveau global.
3. **Sur place** : « Faire les équipes » compose 2 à 6 équipes équilibrées, visibles par tout le monde en temps réel, et copiables pour le groupe WhatsApp. « Refaire » propose une autre répartition tout aussi équilibrée.

## Comment les équipes sont équilibrées
`lib/teams.ts` cherche la répartition qui minimise, par ordre d'importance :
- l'écart de niveau moyen (niveau sur 10 = 80 % gestes, 20 % expérience, voir `lib/questionnaire.ts`) ;
- l'écart du nombre de femmes par équipe ;
- l'absence d'un bon passeur dans une équipe, et l'écart sur chaque geste ;
- l'écart d'âge moyen (l'âge sert à mélanger les générations, il ne baisse pas le niveau).

Tailles à ±1 joueur. Plusieurs départs aléatoires + échanges de joueurs, puis tirage parmi les meilleures solutions (moins de 0,3 s pour 30 joueurs). Le niveau individuel n'est jamais affiché, seulement la moyenne par équipe.

## Lancer en local
```bash
cd volley
npm install
npm run dev      # http://localhost:3000
npm test         # vérifie l'algorithme d'équipes
```
Sans variables Firebase, l'app tourne en **mode démo** (données dans le navigateur, bouton pour ajouter 14 joueurs fictifs).

## Configurer Firebase (gratuit, forfait Spark)
1. https://console.firebase.google.com : **créer un projet** dédié (ex. `volley-equipes`).
2. **Authentication** > activer **Google** et **Adresse e-mail/Mot de passe**.
3. **Firestore Database** > créer en mode production, région `eur3`.
4. Firestore > **Règles** : coller [`firestore.rules`](firestore.rules), Publier.
5. Paramètres du projet > Vos applications > **Web `</>`** : copier `apiKey`, `authDomain`, `projectId`, `appId` dans les variables `NEXT_PUBLIC_FIREBASE_*` (voir `.env.example`, à copier en `.env.local` pour le local).
6. Authentication > Settings > **Domaines autorisés** : ajouter le domaine Vercel.

## Déployer sur Vercel
1. https://vercel.com/new : importer ce dépôt une **deuxième fois** (projet séparé de Dressing).
2. **Root Directory** : `volley`.
3. Ajouter les 4 variables `NEXT_PUBLIC_FIREBASE_*`, puis Deploy. Partager le lien à l'équipe.

## Données (Firestore)
- `players/{uid}` : profil (modifiable uniquement par son propriétaire).
- `sessions/{id}` : date, heure, lieu, `presence` {uid: yes|maybe|no}, `guests`, `teams`. Tout membre connecté peut indiquer sa présence, ajouter un invité ou refaire les équipes ; seul·e le ou la créateur·rice peut modifier la date ou supprimer la séance.

## Structure
```
app/page.tsx              Séances à venir + présence + création
app/seance/[id]/page.tsx  Présents, invités, génération des équipes
app/profil/page.tsx       Questionnaire et récapitulatif du profil
lib/questionnaire.ts      Questions, calcul du niveau
lib/teams.ts              Algorithme d'équilibrage
lib/store.ts              Firestore (temps réel) ou stockage local en mode démo
```
