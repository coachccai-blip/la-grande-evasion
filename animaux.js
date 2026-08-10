/*
 * La Grande Évasion — Animaux et répliques de libération
 * ------------------------------------------------------
 * Ce fichier est indépendant du code de l'application (voir §11.2).
 * Pour chaque animal : son identifiant, son nom, son trait de caractère,
 * une couleur d'accent (pour l'interface) et sa dizaine de répliques de
 * libération. Quand un animal s'échappe, une réplique est tirée au hasard.
 *
 * L'enseignant peut modifier les répliques ou en ajouter librement.
 */
const ANIMAUX = [
  {
    id: "lion", name: "Lion", trait: "Fier et théâtral, se prend pour le roi",
    color: "#e0a02b",
    phrases: [
      "Le roi retrouve sa savane, tremblez gazelles !",
      "Libre ! Que la foule m'acclame !",
      "Un roi ne reste jamais en cage.",
      "Rugissement de la victoire… ROAAAR !",
      "Ma crinière au vent, enfin !",
      "Poussez-vous, majesté passe !",
      "La liberté me va à ravir, non ?",
      "Je retourne régner sur les plaines.",
      "Personne n'enferme un roi, jamais.",
      "Applaudissez, l'évasion royale est réussie !"
    ]
  },
  {
    id: "elephant", name: "Éléphant", trait: "Sage et pince-sans-rire, n'oublie jamais rien",
    color: "#8b93a1",
    phrases: [
      "Je n'oublierai jamais ce jour de liberté.",
      "Lentement mais sûrement, me voilà dehors.",
      "Un éléphant se souvient toujours du chemin.",
      "Trompette de la victoire : pouêt !",
      "La sortie ? Je la connaissais depuis le début.",
      "Grand, gris et enfin libre.",
      "Pas besoin de courir pour gagner.",
      "Je garde tout en mémoire, surtout cette évasion.",
      "La sagesse ouvre toutes les grilles.",
      "Voilà, c'était écrit dans ma mémoire."
    ]
  },
  {
    id: "girafe", name: "Girafe", trait: "Rêveuse, voit toujours plus loin que les autres",
    color: "#e8c15a",
    phrases: [
      "De là-haut, j'ai toujours vu la liberté.",
      "La tête dans les nuages, et libre !",
      "Je voyais déjà le portail au loin.",
      "Plus haut, plus loin, enfin dehors !",
      "Mon cou m'avait montré le chemin.",
      "Les rêves les plus hauts se réalisent.",
      "Je touche presque le ciel, et la liberté.",
      "Regarder loin, ça finit par payer.",
      "Petite girafe deviendra libre.",
      "Au revoir le zoo, bonjour l'horizon !"
    ]
  },
  {
    id: "singe", name: "Singe", trait: "Farceur, toujours une blague en réserve",
    color: "#9c6b3f",
    phrases: [
      "Et hop, un tour de plus : je m'évade !",
      "Qui a laissé la grille ouverte ? Moi !",
      "Bananes pour tout le monde, c'est ma tournée !",
      "Trop facile, même pas drôle… si, un peu !",
      "Je grimpe, je saute, je disparais !",
      "Coucou, c'est déjà fini, je suis dehors !",
      "La liberté, c'est ma meilleure farce.",
      "Attrapez-moi si vous pouvez !",
      "Un dernier pitre et je file !",
      "Ho ho ho, la belle évasion rigolote !"
    ]
  },
  {
    id: "panda", name: "Panda", trait: "Nonchalant, motivé uniquement par le bambou",
    color: "#3a3f4a",
    phrases: [
      "Libre… mais d'abord, une sieste.",
      "Le bambou m'attend dehors, allons-y mollo.",
      "J'ai gagné ? Cool, je me repose.",
      "Pas pressé, mais quand même libre.",
      "Une pousse de bambou pour fêter ça ?",
      "L'évasion la plus tranquille de l'histoire.",
      "Doucement, la liberté ne s'enfuit pas.",
      "Bâillement… ah oui, je suis dehors.",
      "Objectif bambou : atteint !",
      "Libre et confortable, le rêve."
    ]
  },
  {
    id: "manchot", name: "Manchot", trait: "Pressé et maladroit, glisse partout",
    color: "#40495a",
    phrases: [
      "Glissade vers la liberté, wouhou !",
      "Oups, j'ai glissé… jusqu'à la sortie !",
      "Plus vite que mon ombre, presque !",
      "Ventre à terre, et me voilà libre !",
      "Attention, manchot pressé qui passe !",
      "J'ai dérapé pile devant le portail !",
      "La banquise m'appelle, j'y file !",
      "Toboggan de la victoire, youpi !",
      "Maladroit mais champion, quand même.",
      "Zou ! Libre en trois glissades !"
    ]
  },
  {
    id: "flamant", name: "Flamant rose", trait: "Coquet, très soucieux de son style",
    color: "#ec78ac",
    phrases: [
      "Libre, et toujours aussi élégant.",
      "Une patte, puis l'autre, avec classe.",
      "Rose, chic et enfin dehors !",
      "L'évasion la plus stylée du zoo.",
      "Je pose, je souris, je m'échappe.",
      "Pas un plume de travers, et libre !",
      "La liberté me va à merveille.",
      "Regardez ce port de tête… vainqueur !",
      "Le rose est la couleur de la victoire.",
      "Élégance et évasion, mon duo gagnant."
    ]
  },
  {
    id: "crocodile", name: "Crocodile", trait: "Faussement menaçant, en réalité sentimental",
    color: "#3a9a52",
    phrases: [
      "Grrr… bon, d'accord, je suis surtout content.",
      "Une petite larme de crocodile… de joie !",
      "Je fais peur, mais la liberté m'attendrit.",
      "Snap ! La grille n'a pas résisté.",
      "Au fond, je suis un tendre libre.",
      "Mes dents sourient, c'est rare !",
      "La rivière m'attend, à moi les câlins d'eau.",
      "Menaçant dehors, ému dedans.",
      "Enfin libre… ça me touche vraiment.",
      "Croc de la victoire, tout en douceur."
    ]
  },
  {
    id: "zebre", name: "Zèbre", trait: "Sportif, obsédé par la vitesse",
    color: "#c9ced6",
    phrases: [
      "Sprint final… et je franchis la ligne !",
      "Rayures au vent, record battu !",
      "Trop rapide pour rester enfermé !",
      "Champion du 50 mètres évasion !",
      "Prêts, feu, LIBRE !",
      "Je cours donc je m'échappe.",
      "Vitesse maximale vers la sortie !",
      "Les rayures, c'est plus aérodynamique.",
      "Médaille d'or de la liberté !",
      "Personne ne me rattrape, personne !"
    ]
  },
  {
    id: "hibou", name: "Hibou", trait: "Intello, adore corriger tout le monde",
    color: "#a07a4a",
    phrases: [
      "Logiquement, la sortie était par ici.",
      "J'avais tout calculé, évidemment.",
      "Hou hou ! La sagesse l'emporte.",
      "Une évasion parfaitement raisonnée.",
      "Je vous l'avais bien dit : par la gauche.",
      "Le savoir ouvre toutes les portes.",
      "Correct, exact, et libre !",
      "Mes grands yeux voient tout, même la sortie.",
      "Question suivante : où fêter ma liberté ?",
      "La connaissance, voilà la vraie clé."
    ]
  }
];

/* Export pour un usage éventuel hors navigateur (tests, scripts). */
if (typeof module !== "undefined" && module.exports) { module.exports = ANIMAUX; }
