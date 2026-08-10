/*
 * La Grande Évasion — Banque de questions
 * ---------------------------------------
 * Ce fichier est indépendant du code de l'application.
 * L'enseignant peut l'enrichir librement : il suffit d'ajouter des objets
 * à la liste ci-dessous puis de re-déposer le dossier sur Netlify.
 *
 * Format d'une question (voir cahier des charges, §11.1) :
 *   {
 *     cat:     "conjugaison" | "grammaire" | "vocabulaire" | "orthographe",
 *     phrase:  "La phrase à trou, le trou étant noté ___",
 *     options: ["proposition 1", "proposition 2", "proposition 3", "proposition 4"],
 *     answer:  0 à 3  // l'index de la bonne réponse dans le tableau options
 *   }
 *
 * La banque démarre avec 10 questions par catégorie (40 au total).
 */
const QUESTIONS = [
  /* ============================ CONJUGAISON ============================ */
  { cat: "conjugaison", phrase: "Demain, nous ___ au parc.",
    options: ["irons", "allons", "irions", "allions"], answer: 0 },
  { cat: "conjugaison", phrase: "Hier, j'___ tous mes devoirs.",
    options: ["ai fini", "finis", "finirai", "finissais"], answer: 0 },
  { cat: "conjugaison", phrase: "Quand j'étais petit, je ___ souvent au ballon.",
    options: ["jouais", "ai joué", "jouerai", "joue"], answer: 0 },
  { cat: "conjugaison", phrase: "Si tu veux, tu ___ venir avec nous.",
    options: ["peux", "peut", "peus", "pouvez"], answer: 0 },
  { cat: "conjugaison", phrase: "Les enfants ___ dans le jardin en ce moment.",
    options: ["jouent", "joue", "jouez", "jouons"], answer: 0 },
  { cat: "conjugaison", phrase: "Vous ___ très bien le français.",
    options: ["parlez", "parlent", "parles", "parle"], answer: 0 },
  { cat: "conjugaison", phrase: "Nous ___ contents de te voir.",
    options: ["sommes", "sont", "êtes", "est"], answer: 0 },
  { cat: "conjugaison", phrase: "Il faut que tu ___ prudent.",
    options: ["sois", "es", "seras", "étais"], answer: 0 },
  { cat: "conjugaison", phrase: "L'année prochaine, ils ___ en Espagne.",
    options: ["partiront", "partent", "partaient", "partis"], answer: 0 },
  { cat: "conjugaison", phrase: "Elle a ___ la porte tout doucement.",
    options: ["ouvert", "ouvré", "ouvri", "ouverte"], answer: 0 },

  /* ============================= GRAMMAIRE ============================= */
  { cat: "grammaire", phrase: "Je vais ___ Paris cet été.",
    options: ["à", "au", "en", "dans"], answer: 0 },
  { cat: "grammaire", phrase: "Le livre ___ je t'ai parlé est passionnant.",
    options: ["dont", "que", "qui", "où"], answer: 0 },
  { cat: "grammaire", phrase: "C'est la ville ___ je suis né.",
    options: ["où", "que", "dont", "qui"], answer: 0 },
  { cat: "grammaire", phrase: "Il habite ___ Portugal.",
    options: ["au", "en", "à", "aux"], answer: 0 },
  { cat: "grammaire", phrase: "___ enfants jouent dehors.",
    options: ["Les", "Le", "La", "L'"], answer: 0 },
  { cat: "grammaire", phrase: "Elle téléphone ___ sa mère.",
    options: ["à", "de", "en", "avec"], answer: 0 },
  { cat: "grammaire", phrase: "La personne ___ vient d'arriver est mon oncle.",
    options: ["qui", "que", "dont", "où"], answer: 0 },
  { cat: "grammaire", phrase: "Je n'ai ___ argent sur moi.",
    options: ["pas d'", "pas de", "pas des", "pas du"], answer: 0 },
  { cat: "grammaire", phrase: "Nous partons ___ vacances demain.",
    options: ["en", "à", "dans", "aux"], answer: 0 },
  { cat: "grammaire", phrase: "Range tes affaires ___ ton sac.",
    options: ["dans", "à", "en", "sur"], answer: 0 },

  /* ============================ VOCABULAIRE =========================== */
  { cat: "vocabulaire", phrase: "Un synonyme de « content » est ___.",
    options: ["heureux", "triste", "fatigué", "méchant"], answer: 0 },
  { cat: "vocabulaire", phrase: "Le contraire de « grand » est ___.",
    options: ["petit", "gros", "long", "haut"], answer: 0 },
  { cat: "vocabulaire", phrase: "Un synonyme de « rapide » est ___.",
    options: ["vif", "lent", "lourd", "calme"], answer: 0 },
  { cat: "vocabulaire", phrase: "Le contraire de « jour » est ___.",
    options: ["nuit", "soir", "matin", "midi"], answer: 0 },
  { cat: "vocabulaire", phrase: "Pour écrire, on utilise un ___.",
    options: ["stylo", "verre", "balai", "oreiller"], answer: 0 },
  { cat: "vocabulaire", phrase: "Le contraire de « ouvrir » est ___.",
    options: ["fermer", "casser", "pousser", "tirer"], answer: 0 },
  { cat: "vocabulaire", phrase: "Un synonyme de « débuter » est ___.",
    options: ["commencer", "finir", "arrêter", "continuer"], answer: 0 },
  { cat: "vocabulaire", phrase: "Pour voir la nuit, on allume une ___.",
    options: ["lampe", "fleur", "assiette", "chaise"], answer: 0 },
  { cat: "vocabulaire", phrase: "Le contraire de « vrai » est ___.",
    options: ["faux", "juste", "réel", "sûr"], answer: 0 },
  { cat: "vocabulaire", phrase: "Un bébé chien s'appelle un ___.",
    options: ["chiot", "chaton", "poulain", "agneau"], answer: 0 },

  /* ============================ ORTHOGRAPHE =========================== */
  { cat: "orthographe", phrase: "Elle ___ partie à l'école.",
    options: ["est", "et", "es", "ait"], answer: 0 },
  { cat: "orthographe", phrase: "Il joue ___ la balle.",
    options: ["à", "a", "as", "ah"], answer: 0 },
  { cat: "orthographe", phrase: "Paul ___ Marie sont amis.",
    options: ["et", "est", "ait", "ai"], answer: 0 },
  { cat: "orthographe", phrase: "Les oiseaux ___ dans le ciel.",
    options: ["sont", "son", "s'ont", "sonts"], answer: 0 },
  { cat: "orthographe", phrase: "Il a mis ___ manteau.",
    options: ["son", "sont", "sons", "s'on"], answer: 0 },
  { cat: "orthographe", phrase: "Je vais ___ une pomme.",
    options: ["manger", "mangé", "mangeais", "mangés"], answer: 0 },
  { cat: "orthographe", phrase: "Elle a ___ son travail.",
    options: ["terminé", "terminer", "terminez", "terminés"], answer: 0 },
  { cat: "orthographe", phrase: "Tu ___ mon meilleur ami.",
    options: ["es", "est", "ai", "et"], answer: 0 },
  { cat: "orthographe", phrase: "Il ___ mangé une pomme.",
    options: ["a", "à", "as", "ah"], answer: 0 },
  { cat: "orthographe", phrase: "Nous allons ___ prudents.",
    options: ["être", "été", "étais", "étai"], answer: 0 }
];

/* Export pour un usage éventuel hors navigateur (tests, scripts). */
if (typeof module !== "undefined" && module.exports) { module.exports = QUESTIONS; }
