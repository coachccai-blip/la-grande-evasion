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

Les pions (le tien et ceux des robots) sautent de case en case, comme sur un
échiquier en ligne : tu vois chaque animal bondir jusqu'à sa case d'arrivée, y
compris pendant le tour des adversaires. Un bouton **« Abandonner »** permet de
quitter la partie en cours et de revenir à la configuration.

## 🔊 Son

Musique d'ambiance et bruitages sont générés en direct (Web Audio, sans aucun
fichier audio), et fonctionnent hors-ligne. Le dé s'accompagne d'un petit
jingle de loterie avant de s'arrêter sur le chiffre. Le bouton 🔊 / 🔇 en haut à
droite coupe ou réactive le son (la préférence est mémorisée).

## 📁 Structure du projet

| Fichier        | Rôle |
|----------------|------|
| `index.html`   | Interface, assistant de configuration, plateau, logique du jeu, musique et bruitages. |
| `questions.js` | **Générateur** de questions (banques de mots + moteur de conjugaison). |
| `animaux.js`   | Les 10 animaux : nom, trait de caractère et répliques de libération. |
| `sprites.js`   | Décor du plateau dessiné de façon procédurale (les animaux sont des emojis HD). |

## ✏️ Enrichir les questions

Les questions ne sont **pas** une liste figée : elles sont **générées** à la
volée par `questions.js`, à partir de banques de mots et d'un moteur de
conjugaison. Chaque combinaison *matière · thème · difficulté* peut produire des
centaines de variantes, et **les distracteurs sont des erreurs plausibles du
même type que la bonne réponse** (au passé composé, par exemple, toutes les
propositions sont des temps composés : *sont allées / ont allées / ont allé /
étaient allées*). Le **temps ou la notion attendu·e est toujours affiché·e**, ce
qui lève l'ambiguïté quand plusieurs temps seraient possibles (« Pourriez » vs
« Pouvez »), surtout en mode « Tout ».

Pour enrichir le répertoire (aucune compilation) :

- **Conjugaison** : ajoute un verbe dans la table `VERBS` de `questions.js`
  (verbes réguliers via `reg1`/`reg2`, irréguliers via `irr`).
- **Grammaire / Vocabulaire / Orthographe** : ajoute des entrées dans les
  banques correspondantes (`NATURE`, `SYN`, `HOMOPH`, `PLUR`, …).

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
