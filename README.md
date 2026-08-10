# La Grande Évasion 🦁🚪

**Jeu de plateau en pixel art pour apprendre le français.**
Aide ton animal à s'échapper du zoo en répondant juste !

L'élève incarne un animal du zoo qui rêve de liberté : à chaque tour, il lance
un dé, répond à une question de français et avance (ou recule) sur un parcours
de 50 cases qui traverse tout le zoo, jusqu'au grand portail d'entrée. Trois
autres animaux, contrôlés par l'ordinateur, font la course en même temps — le
premier qui franchit le portail s'échappe et gagne.

Application web **100 % statique**, pensée en priorité pour le mobile (portrait,
une main), mais jouable aussi sur ordinateur. Aucune dépendance serveur, aucun
compte, aucune donnée transmise en ligne.

## 🎮 Comment jouer

Avant chaque partie, un petit assistant configure l'aventure :

1. **La matière** : Conjugaison, Grammaire, Vocabulaire, Orthographe ou **Tout**.
2. **Le thème** (sous-catégorie) : par ex. pour la Conjugaison — Présent, Passé
   composé, Futur, Imparfait, Impératif, Subjonctif, Conditionnel présent, ou Tout.
3. **La difficulté** : Très facile, Facile, Normal, Difficile, Très difficile,
   Extrême. Plus la difficulté est élevée, plus **les bots sont forts** et plus
   **les questions posées sont difficiles**.
4. **L'animal** : choisis ton pensionnaire parmi les 10 du zoo.

Ensuite, la course commence :

- Lance le dé, réponds à la question à trou.
  - **Bonne réponse** → ton animal avance du nombre indiqué par le dé.
  - **Mauvaise réponse** → il recule d'autant, et la bonne réponse s'affiche.
- Attention aux **cases spéciales** (banane, toboggan, ressort, cadeau, tornade,
  piège, gardien, défi éclair, duel, case mystère) et aux **3 obstacles**
  (cases 18, 34, 45).
- Arrivé au **portail** (case 50), ouvre les 3 serrures : 3 bonnes réponses
  d'affilée, sans dé. La moindre erreur referme tout !

**Collection :** gagner libère ton animal pour la combinaison
*matière · thème · difficulté* jouée (coche verte). Le vrai défi est de libérer
**tous les animaux, dans toutes les matières, tous les thèmes et toutes les
difficultés** — de quoi jouer très longtemps !

L'onglet **Historique** conserve toutes les questions jouées (avec la bonne
réponse mise en évidence) pour servir de carnet de révision. Tout est sauvegardé
localement sur l'appareil et survit aux nouvelles parties.

## 🔊 Son

Musique d'ambiance et bruitages sont générés en direct (Web Audio, sans aucun
fichier audio), et fonctionnent hors-ligne. Le bouton 🔊 / 🔇 en haut à droite
coupe ou réactive le son (la préférence est mémorisée).

## 📁 Structure du projet

| Fichier        | Rôle |
|----------------|------|
| `index.html`   | Interface, assistant de configuration, plateau, logique du jeu, musique et bruitages. |
| `questions.js` | Banque de questions, classées par matière, thème et difficulté. |
| `animaux.js`   | Les 10 animaux : nom, trait de caractère et répliques de libération. |
| `sprites.js`   | Décor du plateau dessiné de façon procédurale (les animaux sont des emojis HD). |

## ✏️ Ajouter des questions ou des répliques

Aucune compétence technique n'est requise — pas de base de données, pas de
compilation.

- **Questions** : ouvre `questions.js` et ajoute des objets à la liste.
  Chaque question suit ce format :

  ```js
  { cat: "conjugaison",  // ou "grammaire", "vocabulaire", "orthographe"
    sub: "Futur",         // le thème (voir la liste en tête de questions.js)
    diff: 2,              // difficulté de 1 (très facile) à 6 (extrême)
    phrase: "Demain, nous ___ au parc.",  // le trou est noté ___
    options: ["irons", "allons", "irions", "allions"],
    answer: 0 }          // index (0 à 3) de la bonne réponse
  ```

- **Répliques de libération** : ouvre `animaux.js` et complète le tableau
  `phrases` de l'animal concerné.

L'ordre des propositions est automatiquement mélangé à chaque affichage.

## 🚀 Déploiement (Netlify Drop)

Le projet est un simple dossier statique :

1. Rends-toi sur <https://app.netlify.com/drop>.
2. Glisse-dépose le dossier du projet.
3. C'est en ligne ! Pour mettre à jour, re-dépose le dossier après avoir modifié
   `questions.js` ou `animaux.js`.

Aucune étape de build : les fichiers peuvent aussi être ouverts directement dans
un navigateur (`index.html`).

## 🎨 Direction artistique

Pixel art rendu sur un canvas HTML5 en résolution logique, agrandi sans lissage
(*nearest neighbor*) pour des pixels nets. Chaque zone du zoo a sa palette :
tons paille pour les enclos, ocres pour la savane, verts pour la serre, bleus
glacés pour le bassin polaire, gris chauds pour l'esplanade.
