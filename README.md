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

1. Choisis ton animal parmi les 10 pensionnaires du zoo.
2. Sélectionne une catégorie (ou le mode **Mélange**) puis lance le dé.
3. Réponds à la question à trou :
   - **Bonne réponse** → ton animal avance du nombre indiqué par le dé.
   - **Mauvaise réponse** → il recule d'autant, et la bonne réponse s'affiche.
4. Attention aux **cases spéciales** (banane, toboggan, gardien, défi éclair,
   duel, case mystère) et aux **3 obstacles** (cases 18, 34, 45).
5. Arrivé au **portail** (case 50), ouvre les 3 serrures : 3 bonnes réponses
   d'affilée, sans dé. La moindre erreur referme tout !
6. Gagne pour **libérer** ton animal : une coche verte marque sa mission
   accomplie. Objectif : libérer les 10 animaux.

L'onglet **Historique** conserve toutes les questions jouées (avec la bonne
réponse mise en évidence) pour servir de carnet de révision. Tout est sauvegardé
localement sur l'appareil et survit aux nouvelles parties.

## 📁 Structure du projet

| Fichier        | Rôle |
|----------------|------|
| `index.html`   | Interface, plateau, logique du jeu et rendu pixel art (canvas). |
| `questions.js` | Banque de questions (40 au départ : 10 par catégorie). |
| `animaux.js`   | Les 10 animaux : nom, trait de caractère et répliques de libération. |
| `sprites.js`   | Sprites pixel art dessinés de façon procédurale (aucune image externe). |

## ✏️ Ajouter des questions ou des répliques

Aucune compétence technique n'est requise — pas de base de données, pas de
compilation.

- **Questions** : ouvre `questions.js` et ajoute des objets à la liste.
  Chaque question suit ce format :

  ```js
  { cat: "conjugaison", // ou "grammaire", "vocabulaire", "orthographe"
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
