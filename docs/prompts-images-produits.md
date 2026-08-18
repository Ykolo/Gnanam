# Prompts Gemini — visuels produits du catalogue

18 images, **une par produit**, à générer une par une (jamais plusieurs produits dans la même image).
Les identifiants `p1`…`p18` correspondent à `Product.id` dans `lib/gnanam/data.ts`.

## Prompt de base

Coller ce bloc dans Gemini en remplaçant `[SUJET]` et `[FOND]` par les valeurs du tableau correspondant.

```
Photographie produit e-commerce B2B, sur fond uni [FOND] (couleur plate, aucun dégradé, aucune texture).
Sujet : [SUJET]
Cadrage : vue 3/4 légèrement en plongée, sujet centré et entier, occupant environ 80 % du cadre, marge régulière autour.
Lumière : studio douce et diffuse, ombre portée courte sous le produit, couleurs naturelles et appétissantes, netteté sur toute la profondeur.
Interdits : aucun texte, aucun logo, aucune marque, aucune écriture sur les emballages, aucune main, aucune personne, aucun accessoire décoratif, aucun cadre ni bordure.
Format carré 1:1, rendu photoréaliste haute définition.
```

**Cohérence de série** : générer `p1` en premier, puis joindre cette image aux prompts suivants en ajoutant en fin de prompt :
« Garde exactement le même style photo, le même cadrage et la même lumière que l'image jointe. »
Sans ça, les 18 visuels n'auront pas l'air de la même série.

## Variante — prompt de session (le plus rapide)

Gemini ne rend qu'une image par tour : demander les 18 d'un coup produit 1 à 3 images puis du texte.
La méthode la plus rapide est d'envoyer **une seule fois** ce cadrage en début de conversation, puis d'enchaîner
les produits avec une ligne courte à chaque tour.

Message n°1 (cadrage, ne produit aucune image) :

```
Tu vas générer pour moi une série de 18 photos produit pour un catalogue de grossiste alimentaire exotique.
IMPORTANT : une seule image par message, jamais plusieurs produits dans la même image, et aucune image tant
que je ne t'ai pas envoyé un produit.

Règles identiques pour TOUTES les images de la série :
- Photographie produit e-commerce B2B, fond uni de la couleur que je te donne (couleur plate, aucun dégradé,
  aucune texture).
- Cadrage : vue 3/4 légèrement en plongée, sujet centré et entier, occupant environ 80 % du cadre, marge
  régulière autour.
- Lumière : studio douce et diffuse, ombre portée courte sous le produit, couleurs naturelles et appétissantes,
  netteté sur toute la profondeur.
- Interdits : aucun texte, aucun logo, aucune marque, aucune écriture sur les emballages, aucune main, aucune
  personne, aucun accessoire décoratif, aucun cadre ni bordure.
- Format carré 1:1, rendu photoréaliste haute définition.
- Style, cadrage et lumière strictement identiques d'une image à l'autre.

Réponds simplement « prêt », puis je t'enverrai les produits un par un sous la forme :
FOND : #XXXXXX — SUJET : ...
Tu génères alors l'image correspondante, sans commentaire.
```

Messages suivants (un par produit, 18 fois) — reprendre la couleur et le sujet dans les tableaux ci-dessous :

```
FOND : #EAF4EC — SUJET : un cageot en carton kraft ouvert rempli de mangues Kent mûres à peau vert-rouge,
deux mangues posées devant dont une coupée en deux montrant la chair orange
```

Si la série dérive au bout de quelques images, joindre à nouveau l'image `p1` en rappelant :
« Garde exactement le même style photo, le même cadrage et la même lumière que l'image jointe. »

**Pour obtenir réellement les 18 fichiers d'un coup**, il faut passer par l'API Gemini et boucler sur la liste
en script (clé `GEMINI_API_KEY`), pas par l'interface de chat.

---

## Fruits & Légumes — fond `#EAF4EC`

| # | Fichier | `[SUJET]` |
|---|---|---|
| p1 | `mangue-kent` | un cageot en carton kraft ouvert rempli de mangues Kent mûres à peau vert-rouge, deux mangues posées devant dont une coupée en deux montrant la chair orange |
| p2 | `banane-plantain` | un carton kraft ouvert rempli de bananes plantain vert-jaune, un régime de plantains posé devant |
| p3 | `igname-ghana` | trois grosses ignames du Ghana à écorce brune rugueuse posées devant un sac de jute ouvert rempli d'ignames |
| p4 | `manioc-frais` | plusieurs racines de manioc frais à écorce brune cireuse, une coupée montrant la chair blanche, devant un carton kraft ouvert |
| p5 | `patate-douce` | un colis carton ouvert de patates douces à peau rouge-violacée, une coupée en deux révélant la chair orange vif |
| p6 | `piment-antillais` | un colis carton rempli de petits piments antillais habanero brillants, jaunes, orange et rouges |
| p7 | `gombo-frais` | un colis carton de gombos verts frais bien alignés, deux gombos coupés en rondelles devant |
| p8 | `fruit-passion` | un colis carton de fruits de la passion violets à peau ridée, un fruit coupé en deux montrant la pulpe jaune et les graines |

## Épicerie — fond `#F6EEDA`

| # | Fichier | `[SUJET]` |
|---|---|---|
| p9 | `riz-basmati` | un grand sac de riz en toile blanche vierge (sans aucune inscription), ouvert sur le dessus, laissant voir les longs grains de riz basmati, un petit tas de riz devant |
| p10 | `lait-coco` | un carton ouvert de boîtes de conserve de lait de coco 400 ml aux étiquettes blanches totalement vierges, une demi-noix de coco fraîche posée devant |
| p11 | `farine-gari` | un sac de toile ouvert rempli de gari, farine de manioc granuleuse beige clair, un bol en bois rempli de gari posé devant |
| p12 | `curry-madras` | un carton ouvert de pots de poudre de curry de Madras aux étiquettes vierges, un petit tas de poudre orange vif et un bol devant |
| p13 | `dattes-deglet` | un carton kraft ouvert rempli de dattes Deglet Nour ambrées et brillantes, une petite branche de dattes posée devant |

## Surgelés — fond `#E5EFF5`

| # | Fichier | `[SUJET]` |
|---|---|---|
| p14 | `litchis-surgeles` | des litchis surgelés à coque rouge couverts de givre, débordant d'un carton ouvert, un litchi pelé blanc translucide devant, ambiance froide |
| p15 | `tilapia-surgele` | des tilapias entiers surgelés couverts de cristaux de glace, alignés dans un carton ouvert, reflets argentés, ambiance froide |
| p16 | `feuilles-manioc` | un bloc surgelé de feuilles de manioc pilées vert foncé légèrement givré, posé devant un carton ouvert, quelques feuilles de manioc fraîches à côté |

## Boissons — fond `#F3E9E4`

| # | Fichier | `[SUJET]` |
|---|---|---|
| p17 | `jus-mangue` | un pack de briques de jus de mangue aux étiquettes orange totalement vierges, un verre de jus de mangue et deux tranches de mangue devant |
| p18 | `ginger-beer` | un pack de canettes de ginger beer aux étiquettes ambrées totalement vierges, un verre avec glaçons et une racine de gingembre devant |

---

## Intégration dans l'app

- Enregistrer les fichiers sous `public/produits/p1.webp` … `public/produits/p18.webp` (le nom `p<id>` correspond à `Product.id`).
- Les fonds proviennent de `CAT_COLORS` (`lib/gnanam/data.ts`) : la tuile produit garde ainsi la même couleur que l'image.
- La tuile de `product-card.tsx` fait 120 px de haut sur ~210 px de large : avec un sujet centré occupant ~80 % du cadre, un recadrage `object-cover` depuis un carré 1:1 reste propre.

---

## Prompts découpés, un fichier par image

Gemini ne tenant pas la cadence sur 18 images d'affilée, chaque visuel a son propre fichier
prêt à copier-coller dans [`prompts-images/`](prompts-images/README.md).
