# Dressing : concept produit

> **Cible** : les personnes qui veulent bien s'habiller sans savoir comment s'y prendre. Elles ont souvent assez de vêtements, mais ne savent pas les associer et achètent sans plan.
>
> **Promesse** : *« Ouvre l'app le matin, tu sais quoi mettre. Ouvre-la avant d'acheter, tu sais quoi acheter. »*

---

## 1. Le problème

1. **La fatigue de décision du matin** : « j'ai plein de vêtements mais rien à me mettre ».
2. **L'achat au hasard** : on rachète la même chose, ou une pièce qui ne va avec rien.
3. **L'absence de repères** : la morphologie, la colorimétrie et les tendances paraissent obscures, et les conseils sont contradictoires.

## 2. Les 4 piliers

| Pilier | Ce que fait l'app | État |
|---|---|---|
| **Profil et avatar** | Genre, âge, taille, morphologie, carnation, sous-ton, yeux, cheveux, styles souhaités, budget, enseignes préférées. Avatar SVG qui s'adapte au profil | ✅ MVP |
| **Dressing numérique** | Une photo par pièce. Gemini Vision détecte le type, les couleurs exactes (#hex), la matière, la coupe, la formalité (1 à 5), la chaleur (1 à 5), les saisons et le style | ✅ MVP |
| **Tenue du jour** | Météo (Open-Meteo) + occasion + profil + tendances du jour → 3 tenues complètes (sûre / tendance / audacieuse) avec explication, harmonie de couleurs, astuce et pièce manquante éventuelle. Bouton « Je porte celle-ci » pour l'historique et l'anti-répétition | ✅ MVP |
| **Analyse et shopping intelligent** | Saison colorimétrique (selfie en option), palette flatteuse, couleurs à éloigner du visage, coupes adaptées, directions de style tirées du dressing existant, forces et faiblesses, **pièces manquantes classées par impact** avec liens Zalando / Uniqlo / H&M / Zara / Levi's / Vinted | ✅ MVP |

### Pourquoi l'IA plutôt que des règles codées
La mode change chaque saison. Les règles figées vieillissent mal. L'app combine donc trois couches :
- **Un socle court de principes stables** (coupe et proportions, sous-ton, harmonies de couleurs), validés par plusieurs sources (section 4). Il est dans `lib/gemini.ts → STYLIST_SYSTEM`.
- **Une veille en direct** : Gemini avec *Google Search grounding* résume chaque jour les tendances confirmées par plusieurs médias reconnus, **en citant ses sources** (page Tendances). Ce résumé est injecté dans chaque proposition de tenue et dans chaque audit.
- **Du code déterministe** seulement pour ce qui relève des mathématiques : la roue chromatique et le calcul de l'harmonie (complémentaire, analogue, ton sur ton…), qui servent à visualiser et à expliquer.

Le modèle par défaut est l'alias `gemini-flash-latest`, maintenu par Google, donc l'app suit les nouvelles versions sans changer de code. On peut le remplacer avec `GEMINI_MODEL`.

## 3. Parcours utilisateur

1. **Onboarding (2 min)** : profil et avatar → « numérise 10 essentiels » (hauts, bas, chaussures, une veste).
2. **Chaque matin** : la météo s'affiche, on choisit l'occasion (quotidien, travail, rendez-vous, soirée, sport, entretien, mariage, voyage) et on ajoute une précision libre → 3 tenues → « Je porte celle-ci ».
3. **De temps en temps** : l'analyse donne la palette, les styles possibles et la liste des pièces qui débloquent le plus de tenues, ce qui sert de liste de courses.
4. **Avant d'acheter** *(V2)* : prendre en photo une pièce en magasin → « Combien de tenues je peux faire avec ? Elle me va ? »

## 4. Recherche mode : ce qui est validé par plusieurs sources (octobre 2026)

Méthode : on ne garde une tendance que si **au moins deux sources indépendantes** la citent. Vogue, GQ, Elle et Harper's Bazaar bloquent les robots de recherche. Ils sont donc recoupés via des médias qui les relaient (Numéro, FashionUnited, Who What Wear, Marie Claire, Bustle…). La veille quotidienne de l'app, elle, peut les lire via Google Search.

### Tendances automne-hiver 2026-27 (recoupées)
| Tendance | Confirmée par |
|---|---|
| **Retour du tailoring / power dressing** : tailleur-jupe, blazers structurés, taille marquée (femme). Coupes plus ajustées, classiques revisités : manteau Chesterfield, croisé, imperméable, col roulé (homme) | Bustle, Who What Wear, Numéro, Fashion Magazine, FACES, Trendalytics |
| **Superposition (layering)** et retour du pull sans manches | Trendalytics, FACES, modexmag, The Double F (street style Paris) |
| **Carreaux / tartan** (grunge assagi) | FashionUnited, Trendalytics, Friptadium, modexmag |
| **Texture** : velours, fausse fourrure, effet croco, maille | Numéro (FW homme), Elle Belgique, Flannels, Who What Wear, Luxus+ |
| **Bordeaux et chocolat comme nouveaux neutres** ; associations rose poudré + chocolat / bordeaux / marine | FashionUnited (pré-automne), Who What Wear, Marie Claire (Pantone NYFW), substack *FW26 Color Stats* |
| **Saison sombre** : noir, anthracite, minuit dominent les podiums | substack *FW26 Color Stats*, Who What Wear |
| **Denim : wide-leg et barrel restent la base** ; le slim revient surtout de façon symbolique | Levi's, Denimology, Galaxus, desired.de (H&M) |
| **Couleur Pantone 2026 : Cloud Dancer** (blanc cassé, PANTONE 11-4201) | Hypebeast, Star Tribune, Good Morning America, Interior Design |
| **Retour à l'essentiel et à la portabilité**, savoir-faire, pièces durables | FashionUnited (2 articles), Lidewij Edelkoort |

Points de désaccord, gardés avec prudence : le **violet royal** (Who What Wear seul), le **retour des cravates fines et des survêtements** (Numéro seul), le **slim** (podium oui, boutiques pas encore).

### Principes stables (consensus)
- **Coupe et proportions priment sur la taille et la tendance.** Beaucoup de problèmes de coupe sont verticaux (hauteur de taille, longueur de l'ourlet). Sources : étude de stylistes, Cornell / ITAA ; MasterClass (Tan France) ; Petite Dressing.
- **La morphologie est un point de départ, pas une case.** Les catégories rigides sont critiquées parce qu'elles ignorent le buste, la taille et les courbes : l'app raisonne en proportions. Sources : ITAA ; Free People ; guides 2026.
- **Colorimétrie** : on part du sous-ton (chaud, froid ou neutre), puis on regarde la valeur et le contraste cheveux / peau / yeux. On teste à la lumière du jour, sans maquillage, et on place les meilleures couleurs près du visage. Sources : Color Me Beautiful ; Sterling Style Academy ; HunterLab ; University of Tennessee Extension.
- **Harmonies de couleurs** : base neutre + un accent ; ton sur ton ; analogues ; complémentaires dosées.

## 5. Catalogue des marques : la réalité technique

- **Zara, Uniqlo, H&M, Levi's : aucune API catalogue publique.** Le scraping est contraire à leurs CGU et fragile. On ne l'utilise pas.
- **Zalando** : l'API *Partner Program / zDirect* est réservée aux **vendeurs**, pas à la lecture du catalogue.
- **MVP** : l'IA décrit la pièce manquante (type, couleur #hex, matière, pourquoi) et l'app génère des **liens de recherche pré-remplis** par enseigne (`lib/shops.ts`). L'IA n'invente jamais d'URL produit.
- **V2, la voie propre** : les **flux produits affiliés** (Awin, Effiliation, Kelkoo, ShopStyle Collective, flux Zalando via Awin). On obtient de vraies fiches (image, prix, lien) **et une rémunération par commission**. On importe le flux, on vectorise les fiches (embeddings image + texte) et on fait du *matching* avec la pièce manquante décrite par l'IA.

## 6. Feuille de route

**V1.1 (court terme)**
- ✅ Comptes et synchronisation multi-appareils : Firebase Auth + Firestore (fait).
- Détourage automatique des photos (fond blanc) et ajout depuis une capture d'écran e-shop.
- Calendrier : planifier les tenues de la semaine ou d'une valise de voyage.
- Limite de requêtes IA par utilisateur (protection du coût de l'API).

**V2**
- Flux affiliés et matching visuel (section 5).
- « Avant d'acheter » : scan d'une pièce en boutique → nombre de tenues possibles + compatibilité couleur / morphologie.
- Essayage virtuel de la tenue sur l'avatar (génération d'image Gemini).
- Statistiques : coût par port, pièces jamais portées → revente Vinted en un clic.

**Modèle économique** : gratuit jusqu'à N pièces et N tenues par jour. Premium (environ 4,99 €/mois) : illimité, essayage virtuel, planification. Commission d'affiliation sur les achats.

## 7. Risques et garde-fous
- **Vie privée** : photos et selfie sensibles. Règles Firestore strictes (chacun n'accède qu'à ses données), selfie jamais conservé.
- **Biais** : ne jamais formuler la morphologie comme un défaut à cacher (ton bienveillant imposé dans le prompt).
- **Coût de l'IA** : photos compressées à 720 px, garde-robe envoyée sans images, cache quotidien des tendances.

## 8. Sources
- Trendalytics, *Top 10 menswear runway trends FW26* : https://trendalytics.co/insights/the-top-10-menswear-runway-trends-fall-winter-2026
- Numéro, *11 trends spotted at FW26-27 men's fashion week* : https://numero.com/en/fashion/fashion-week-en/11-trends-spotted-at-the-fall-winter-2026-2027-mens-fashion-week/
- Numéro, *Tendances fashion week homme AH26-27* : https://numero.com/mode/fashion-week/les-tendances-fashion-week-homme-automne-hiver-2026-2027/
- FACES Magazin, *Top 13 menswear trends FW26-27* : https://facesmag.com/fashion-en/faces-trend-report-the-top-13-menswear-trends-for-fall-winter-2026-27/
- The Impression, *Fall 2026 men's trend forecast* : https://theimpression.com/the-fall-2026-mens-collections-trend-forecast/
- The Double F, *Street style menswear Paris FW* : https://www.thedoublef.com/en-fr/blogs/the-rooster/street-style-menswear-paris-fashion-week-fall-winter
- modexmag, *Layer* / *Grunge* : https://modexmag.blogspot.com/2026/02/menswear-trend-fallwinter-2026-layer.html, https://modexmag.blogspot.com/2026/02/menswear-trend-fallwinter-2026-grunge.html
- Bustle, *Fall 2026 fashion trends* : https://www.bustle.com/style/fall-2026-fashion-trends
- Who What Wear, *Fall 2026 pieces editors are buying* : https://www.whowhatwear.com/fashion/shopping/editor-favorite-fall-fashion-2026
- Who What Wear, *7 colors that matter for fall 2026* : https://www.whowhatwear.com/fashion/shopping/colorful-new-fall-arrivals-2026
- Who What Wear, *Winter colour trends 2026* : https://www.whowhatwear.com/fashion/winter/winter-fashion-colour-trends-2026
- Fashion Magazine, *Fall 2026 trends* : https://fashionmagazine.com/style/fall-2026-trends/
- Flannels, *AW26 womenswear trend report* : https://www.flannels.com/stylenews/fashion/aw26-ww-trend-report
- FashionUnited, *Ce qui va cartonner en boutiques AH26* : https://fashionunited.fr/actualite/mode/tendances-ce-qui-va-cartonner-en-boutiques-pour-lautomne-hiver-2026/2026080442582
- FashionUnited, *Retour à l'essentiel AH26* : https://fashionunited.fr/actualite/mode/retour-a-lessentiel-le-raffinement-discret-de-la-saison-automne-hiver-2026/2026040141223
- FashionUnited, *Pre-fall 2026 colour* : https://fashionunited.uk/news/fashion/pre-fall-2026-colour-in-sophisticated-combinations/2026010785571
- Elle Belgique, *Tendances mode automne 2026* : https://www.elle.be/fr/477242-tendances-mode-automne-2026.html
- Luxus+, *5 tendances FW AH26-27* : https://luxus-plus.com/luxus-magazine-franges-transparence-fentes-5-tendances-reperes-a-la-fashion-week-automne-hiver-2026-2027/
- Marie Claire, *NYFW color trends fall 2026 (Pantone)* : https://www.marieclaire.com/fashion/pantone-new-york-fashion-week-fall-2026-fashion-color-trends/
- Substack, *FW26 Color Stats* : https://sarahconstantin.substack.com/p/fw26-color-stats
- Hypebeast, *Pantone 2026 Cloud Dancer* : https://hypebeast.com/2025/12/pantone-2026-color-of-the-year-cloud-dancer-info
- Star Tribune, *Pantone 2026* : https://www.startribune.com/what-pantones-2026-choice-for-color-of-the-year-says-about-the-year-ahead/601540277
- Levi's, *What jeans are in style 2026* : https://levis.co.nz/blogs/post/what-jeans-are-in-style-2026
- Denimology, *Barrel jeans* : https://www.denimology.com/?p=17846
- Galaxus, *Skinny jeans are striking back* : https://www.galaxus.fr/en/page/the-end-of-oversize-skinny-jeans-are-striking-back-43982
- ITAA / Cornell, *Style recommendations for female body shape: a case study from fashion stylists* : https://www.iastatedigitalpress.com/itaa/article/id/15772/
- MasterClass, *Tan France on dressing for your proportions* : https://www.masterclass.com/articles/tan-frances-tips-on-dressing-for-your-proportions
- Petite Dressing, *10 dressing habits that improve proportion* : https://blog.petitedressing.com/10-dressing-habits-that-instantly-improve-proportion/
- Color Me Beautiful, *Ultimate guide to color analysis* : https://colormebeautiful.com/blogs/colormenow/the-ultimate-guide-to-color-analysis
- Sterling Style Academy, *Seasonal color analysis* : https://sterlingstyleacademy.com/what-is-seasonal-color-analysis-options-for-color-analysis/
- HunterLab, *Seasonal color analysis* : https://www.hunterlab.com/en/blog/seasonal-color-analysis/
- Lengow / Channable, *Zalando Partner Program* : https://help.lengow.com/hc/en-us/articles/360031112032-Zalando-Onboarding
