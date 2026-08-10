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
2. **Le thème** (sous-catégorie). L'éventail va des bases jusqu'à des thèmes de
   **niveau avancé (vers le C1)** :
   - **Conjugaison** : Présent, Passé composé, Futur, Imparfait, Impératif,
     Subjonctif, Conditionnel présent, **Plus-que-parfait**, **Conditionnel
     passé**, **Subjonctif passé**, **Futur antérieur**.
   - **Grammaire** : Nature des mots, Déterminants, Pronoms, Prépositions,
     Accords, Types de phrases, **Accord du participe passé**, **Connecteurs
     logiques**, **Voix passive**.
   - **Vocabulaire** : Synonymes, Contraires, Homonymes, Familles de mots, Mots
     du quotidien, **Expressions idiomatiques**, **Registres de langue**,
     **Paronymes**.
   - **Orthographe** : Homophones, é/er, Accents, Pluriels, m devant m·b·p,
     **Homophones grammaticaux**, **Adverbes en -ment**.
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

**Duel « Questions pour un champion » :** à ton tour, au lieu de lancer le dé, tu
peux **défier un adversaire**. Pendant **20 secondes**, vous répondez chacun au
plus grand nombre de questions possible (écran *versus* avec les deux emojis face
à face et les scores en direct). Le bot répond **plus ou moins vite selon la
difficulté** choisie. Le **gagnant avance de 6 cases**, le **perdant recule de 6**.

**Collection :** gagner libère ton animal pour la combinaison
*matière · thème · difficulté* jouée (coche verte). Le vrai défi est de libérer
**tous les animaux, dans toutes les matières, tous les thèmes et toutes les
difficultés** — de quoi jouer très longtemps !

L'onglet **Historique** conserve toutes les questions jouées (avec la bonne
réponse mise en évidence) pour servir de carnet de révision. Les pastilles
**✓** et **✗** en haut sont **cliquables** : touche la croix rouge **✗** pour
n'afficher que les **questions ratées** (idéal pour réviser ses erreurs), la
coche verte **✓** pour ne voir que les réussites, et re-touche pour tout revoir.
**Touche une carte** pour dérouler l'**explication de la réponse** : la bonne
réponse et un **rappel de la règle** associée (temps, accord, homophone…).
Tout est sauvegardé localement sur l'appareil et survit aux nouvelles parties.

**Dialogues d'ambiance :** de temps en temps, quand un gros écart se creuse (en
tête ou distancé) ou au **lancement d'un duel**, ton animal et son rival
s'échangent une petite réplique amusante, dans leur caractère.

**Anti-répétition (mémoire longue) :** chaque question déjà posée est mémorisée
durablement. À chaque tirage, le jeu propose **en priorité une question jamais
vue** ; une même question ne réapparaît qu'après que **toutes** les autres du
même *matière · thème · difficulté* soient repassées. Les répétitions sont donc
fortement réduites, d'une partie à l'autre.

Les pions (le tien et ceux des robots) sautent de case en case, comme sur un
échiquier en ligne : tu vois chaque animal bondir jusqu'à sa case d'arrivée, y
compris pendant le tour des adversaires. Un bouton **« Abandonner »** permet de
quitter la partie en cours et de revenir à la configuration.

## 🔊 Son

Musique d'ambiance et bruitages sont générés en direct (Web Audio, sans aucun
fichier audio), et fonctionnent hors-ligne. Le dé s'accompagne d'un petit
jingle de loterie avant de s'arrêter sur le chiffre. Le bouton 🔊 / 🔇 en haut à
droite coupe ou réactive le son (la préférence est mémorisée).

## 📲 Installer l'application (PWA)

L'application est une **PWA** : une fois installée, elle se lance **en plein
écran, en dehors du navigateur**, comme une vraie application, et fonctionne
**hors-ligne** (toutes les ressources sont mises en cache par un *service
worker*).

- **Android / Chrome** : ouvre le site, puis touche **📲 Installer** (en haut à
  droite) ou le menu ⋮ → *Ajouter à l'écran d'accueil*.
- **iPhone / iPad (Safari)** : bouton *Partager* → *Sur l'écran d'accueil*.
- **Ordinateur (Chrome/Edge)** : icône d'installation dans la barre d'adresse,
  ou le bouton **📲**.

> ⚠️ L'installation nécessite une adresse **HTTPS** (l'URL Netlify convient).
> En ouvrant simplement le fichier `index.html` (`file://`), l'app fonctionne
> mais ne peut pas être installée.

L'icône de l'application se trouve dans `assets/` (`icon-512.png`,
`icon-192.png`, `apple-touch-icon.png`) et peut être remplacée par votre propre
logo (mêmes noms, mêmes dimensions).

## 📁 Structure du projet

| Fichier        | Rôle |
|----------------|------|
| `index.html`   | Interface, assistant de configuration, plateau, logique du jeu, musique et bruitages. |
| `questions.js` | **Générateur** de questions (banques de mots + moteur de conjugaison). |
| `animaux.js`   | Les 10 animaux : nom, trait, répliques de libération et **dialogues d'ambiance** (`BANTER`). |
| `sprites.js`   | Décor du plateau dessiné de façon procédurale (les animaux sont des emojis HD). |
| `manifest.webmanifest` | Manifeste PWA (nom, icônes, lancement autonome plein écran). |
| `sw.js`        | *Service worker* : mise en cache pour un fonctionnement hors-ligne. |
| `assets/`      | Icônes de l'application (logo). |

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
