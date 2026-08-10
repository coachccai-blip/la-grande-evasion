/*
 * La Grande Évasion — Banque de questions
 * ---------------------------------------
 * Ce fichier est indépendant du code de l'application.
 * L'enseignant peut l'enrichir librement : il suffit d'ajouter des objets
 * à la liste ci-dessous puis de re-déposer le dossier sur Netlify.
 *
 * Format d'une question :
 *   {
 *     cat:    "conjugaison" | "grammaire" | "vocabulaire" | "orthographe",
 *     sub:    le thème (sous-catégorie), ex. "Présent", "Synonymes"…
 *     diff:   1 (très facile) à 6 (extrême)
 *     phrase: la phrase à trou, le trou étant noté ___
 *     options:["prop 1","prop 2","prop 3","prop 4"],
 *     answer: 0 à 3  // index de la bonne réponse (ici toujours la 1re, puis mélangée à l'écran)
 *   }
 *
 * Sous-catégories reconnues par l'application :
 *   conjugaison : Présent, Passé composé, Futur, Imparfait, Impératif, Subjonctif, Conditionnel présent
 *   grammaire   : Nature des mots, Déterminants, Pronoms, Prépositions, Accords, Types de phrases
 *   vocabulaire : Synonymes, Contraires, Homonymes, Familles de mots, Mots du quotidien
 *   orthographe : Homophones, é ou er, Accents, Pluriels, m devant m, b, p
 */
const QUESTIONS = [
  /* ========================== CONJUGAISON ========================== */
  // Présent
  { cat:"conjugaison", sub:"Présent", diff:1, phrase:"En ce moment, je ___ à la maison.", options:["mange","manges","mangent","manger"], answer:0 },
  { cat:"conjugaison", sub:"Présent", diff:1, phrase:"Tu ___ très vite.", options:["cours","court","courent","courir"], answer:0 },
  { cat:"conjugaison", sub:"Présent", diff:2, phrase:"Nous ___ au parc le dimanche.", options:["allons","allez","vont","alle"], answer:0 },
  { cat:"conjugaison", sub:"Présent", diff:2, phrase:"Ils ___ la télévision.", options:["regardent","regarde","regardes","regarder"], answer:0 },
  { cat:"conjugaison", sub:"Présent", diff:3, phrase:"Vous ___ souvent en retard.", options:["êtes","est","sont","être"], answer:0 },
  { cat:"conjugaison", sub:"Présent", diff:3, phrase:"Elle ___ ses devoirs chaque soir.", options:["fait","fais","font","faire"], answer:0 },
  // Passé composé
  { cat:"conjugaison", sub:"Passé composé", diff:2, phrase:"Hier, j'___ un film.", options:["ai regardé","regarde","regarderai","regardais"], answer:0 },
  { cat:"conjugaison", sub:"Passé composé", diff:2, phrase:"Elle ___ à la maison.", options:["est restée","reste","restera","restait"], answer:0 },
  { cat:"conjugaison", sub:"Passé composé", diff:3, phrase:"Nous ___ nos valises.", options:["avons fait","faisons","ferons","faisions"], answer:0 },
  { cat:"conjugaison", sub:"Passé composé", diff:3, phrase:"Ils ___ tôt ce matin.", options:["sont partis","partent","partiront","partaient"], answer:0 },
  { cat:"conjugaison", sub:"Passé composé", diff:5, phrase:"Les fleurs que j'ai ___ sont belles.", options:["achetées","acheté","achetés","acheter"], answer:0 },
  { cat:"conjugaison", sub:"Passé composé", diff:6, phrase:"Elle s'est ___ les mains.", options:["lavé","lavée","lavées","laver"], answer:0 },
  // Futur
  { cat:"conjugaison", sub:"Futur", diff:2, phrase:"Demain, je ___ à la piscine.", options:["irai","vais","allais","irais"], answer:0 },
  { cat:"conjugaison", sub:"Futur", diff:3, phrase:"Nous ___ nos amis samedi.", options:["verrons","voyons","voyions","verrions"], answer:0 },
  { cat:"conjugaison", sub:"Futur", diff:3, phrase:"Tu ___ bientôt la réponse.", options:["sauras","sais","savais","saurais"], answer:0 },
  { cat:"conjugaison", sub:"Futur", diff:4, phrase:"Quand il ___, nous sortirons.", options:["fera beau","fait beau","faisait beau","ferait beau"], answer:0 },
  { cat:"conjugaison", sub:"Futur", diff:5, phrase:"Ils ___ ce projet l'an prochain.", options:["achèveront","achèvent","achevaient","achèveraient"], answer:0 },
  // Imparfait
  { cat:"conjugaison", sub:"Imparfait", diff:2, phrase:"Avant, nous ___ à la campagne.", options:["habitions","habitons","habiterons","avons habité"], answer:0 },
  { cat:"conjugaison", sub:"Imparfait", diff:3, phrase:"Quand j'étais petit, j'___ peur du noir.", options:["avais","ai","aurai","aurais"], answer:0 },
  { cat:"conjugaison", sub:"Imparfait", diff:3, phrase:"Il ___ toujours la même histoire.", options:["racontait","raconte","racontera","raconterait"], answer:0 },
  { cat:"conjugaison", sub:"Imparfait", diff:4, phrase:"Pendant qu'elle ___, le téléphone sonna.", options:["lisait","lit","lira","lirait"], answer:0 },
  // Impératif
  { cat:"conjugaison", sub:"Impératif", diff:2, phrase:"___ la porte, s'il te plaît.", options:["Ferme","Fermes","Fermer","Fermez-toi"], answer:0 },
  { cat:"conjugaison", sub:"Impératif", diff:3, phrase:"___ prudents sur la route !", options:["Soyez","Soyer","Êtes","Serez"], answer:0 },
  { cat:"conjugaison", sub:"Impératif", diff:3, phrase:"___-moi ce livre, veux-tu ?", options:["Donne","Donnes","Donné","Donner"], answer:0 },
  { cat:"conjugaison", sub:"Impératif", diff:4, phrase:"N'___ pas peur !", options:["aie","ai","aies","as"], answer:0 },
  // Subjonctif
  { cat:"conjugaison", sub:"Subjonctif", diff:4, phrase:"Il faut que tu ___ tes devoirs.", options:["fasses","fais","feras","ferais"], answer:0 },
  { cat:"conjugaison", sub:"Subjonctif", diff:4, phrase:"Je veux que vous ___ à l'heure.", options:["soyez","êtes","serez","seriez"], answer:0 },
  { cat:"conjugaison", sub:"Subjonctif", diff:5, phrase:"Bien qu'il ___ fatigué, il continue.", options:["soit","est","sera","serait"], answer:0 },
  { cat:"conjugaison", sub:"Subjonctif", diff:5, phrase:"Il faut qu'elle ___ maintenant.", options:["parte","part","partira","partirait"], answer:0 },
  { cat:"conjugaison", sub:"Subjonctif", diff:6, phrase:"Je doute qu'ils ___ la vérité.", options:["sachent","savent","sauront","sauraient"], answer:0 },
  // Conditionnel présent
  { cat:"conjugaison", sub:"Conditionnel présent", diff:3, phrase:"Si j'avais le temps, je ___ davantage.", options:["lirais","lis","lirai","lisais"], answer:0 },
  { cat:"conjugaison", sub:"Conditionnel présent", diff:4, phrase:"Nous ___ venir si tu voulais.", options:["pourrions","pouvons","pourrons","pouvions"], answer:0 },
  { cat:"conjugaison", sub:"Conditionnel présent", diff:4, phrase:"Elle ___ contente de te voir.", options:["serait","est","sera","était"], answer:0 },
  { cat:"conjugaison", sub:"Conditionnel présent", diff:5, phrase:"___-vous m'aider, s'il vous plaît ?", options:["Pourriez","Pouvez","Pourrez","Pouviez"], answer:0 },

  /* =========================== GRAMMAIRE =========================== */
  // Nature des mots
  { cat:"grammaire", sub:"Nature des mots", diff:2, phrase:"Dans « le chat noir », « noir » est un ___.", options:["adjectif","nom","verbe","adverbe"], answer:0 },
  { cat:"grammaire", sub:"Nature des mots", diff:2, phrase:"Dans « il court vite », « vite » est un ___.", options:["adverbe","adjectif","nom","verbe"], answer:0 },
  { cat:"grammaire", sub:"Nature des mots", diff:3, phrase:"Dans « la maison de Léa », « de » est une ___.", options:["préposition","conjonction","pronom","interjection"], answer:0 },
  { cat:"grammaire", sub:"Nature des mots", diff:3, phrase:"« chien » est un ___.", options:["nom","verbe","adjectif","adverbe"], answer:0 },
  { cat:"grammaire", sub:"Nature des mots", diff:4, phrase:"Dans « qui parle ? », « qui » est un ___.", options:["pronom","déterminant","adverbe","nom"], answer:0 },
  // Déterminants
  { cat:"grammaire", sub:"Déterminants", diff:1, phrase:"___ chat dort sur le canapé.", options:["Le","Les","Des","Aux"], answer:0 },
  { cat:"grammaire", sub:"Déterminants", diff:2, phrase:"J'ai vu ___ oiseaux dans le ciel.", options:["des","de","du","le"], answer:0 },
  { cat:"grammaire", sub:"Déterminants", diff:2, phrase:"___ amie est très gentille.", options:["Mon","Ma","Mes","Me"], answer:0 },
  { cat:"grammaire", sub:"Déterminants", diff:3, phrase:"Il n'a pas ___ argent sur lui.", options:["d'","de","des","du"], answer:0 },
  // Pronoms
  { cat:"grammaire", sub:"Pronoms", diff:2, phrase:"Léa est là ; ___ arrive.", options:["elle","il","ils","elles"], answer:0 },
  { cat:"grammaire", sub:"Pronoms", diff:3, phrase:"Le livre ___ je lis est passionnant.", options:["que","qui","dont","où"], answer:0 },
  { cat:"grammaire", sub:"Pronoms", diff:3, phrase:"La ville ___ j'habite est loin.", options:["où","que","dont","qui"], answer:0 },
  { cat:"grammaire", sub:"Pronoms", diff:4, phrase:"Voici le sac ___ j'ai besoin.", options:["dont","que","qui","où"], answer:0 },
  { cat:"grammaire", sub:"Pronoms", diff:5, phrase:"C'est l'ami ___ je pense souvent.", options:["à qui","que","dont","qui"], answer:0 },
  // Prépositions
  { cat:"grammaire", sub:"Prépositions", diff:2, phrase:"Je vais ___ l'école.", options:["à","au","en","dans"], answer:0 },
  { cat:"grammaire", sub:"Prépositions", diff:2, phrase:"Il revient ___ Paris.", options:["de","à","en","du"], answer:0 },
  { cat:"grammaire", sub:"Prépositions", diff:3, phrase:"Nous partons ___ France demain.", options:["en","à","au","dans"], answer:0 },
  { cat:"grammaire", sub:"Prépositions", diff:3, phrase:"Le livre est ___ la table.", options:["sur","dans","à","en"], answer:0 },
  { cat:"grammaire", sub:"Prépositions", diff:4, phrase:"Il habite ___ Canada.", options:["au","en","à","aux"], answer:0 },
  // Accords
  { cat:"grammaire", sub:"Accords", diff:3, phrase:"Les filles sont ___.", options:["contentes","content","contente","contents"], answer:0 },
  { cat:"grammaire", sub:"Accords", diff:4, phrase:"Elle a de beaux yeux ___.", options:["bleus","bleu","bleue","bleues"], answer:0 },
  { cat:"grammaire", sub:"Accords", diff:4, phrase:"Elles portent des robes ___.", options:["vertes","vert","verte","verts"], answer:0 },
  { cat:"grammaire", sub:"Accords", diff:5, phrase:"Les livres que j'ai ___ étaient bien.", options:["lus","lu","lue","lues"], answer:0 },
  // Types de phrases
  { cat:"grammaire", sub:"Types de phrases", diff:1, phrase:"« Quelle belle journée ! » est une phrase ___.", options:["exclamative","interrogative","déclarative","impérative"], answer:0 },
  { cat:"grammaire", sub:"Types de phrases", diff:2, phrase:"« Viens ici. » est une phrase ___.", options:["impérative","déclarative","interrogative","exclamative"], answer:0 },
  { cat:"grammaire", sub:"Types de phrases", diff:2, phrase:"« Tu viens avec nous ? » est une phrase ___.", options:["interrogative","déclarative","exclamative","impérative"], answer:0 },
  { cat:"grammaire", sub:"Types de phrases", diff:3, phrase:"La forme négative de « Je mange » est ___.", options:["Je ne mange pas","Je mange pas","Ne je mange","Je mange non"], answer:0 },

  /* ========================== VOCABULAIRE ========================= */
  // Synonymes
  { cat:"vocabulaire", sub:"Synonymes", diff:1, phrase:"Un synonyme de « content » est ___.", options:["heureux","triste","fâché","fatigué"], answer:0 },
  { cat:"vocabulaire", sub:"Synonymes", diff:2, phrase:"Un synonyme de « rapide » est ___.", options:["vif","lent","lourd","calme"], answer:0 },
  { cat:"vocabulaire", sub:"Synonymes", diff:2, phrase:"Un synonyme de « débuter » est ___.", options:["commencer","finir","arrêter","cesser"], answer:0 },
  { cat:"vocabulaire", sub:"Synonymes", diff:3, phrase:"Un synonyme de « malin » est ___.", options:["rusé","bête","lent","gentil"], answer:0 },
  { cat:"vocabulaire", sub:"Synonymes", diff:4, phrase:"Un synonyme de « courageux » est ___.", options:["vaillant","peureux","faible","lâche"], answer:0 },
  { cat:"vocabulaire", sub:"Synonymes", diff:5, phrase:"Un synonyme de « éphémère » est ___.", options:["passager","éternel","durable","solide"], answer:0 },
  // Contraires
  { cat:"vocabulaire", sub:"Contraires", diff:1, phrase:"Le contraire de « grand » est ___.", options:["petit","gros","long","haut"], answer:0 },
  { cat:"vocabulaire", sub:"Contraires", diff:1, phrase:"Le contraire de « jour » est ___.", options:["nuit","soir","matin","midi"], answer:0 },
  { cat:"vocabulaire", sub:"Contraires", diff:2, phrase:"Le contraire de « ouvrir » est ___.", options:["fermer","pousser","tirer","casser"], answer:0 },
  { cat:"vocabulaire", sub:"Contraires", diff:3, phrase:"Le contraire de « rapide » est ___.", options:["lent","vif","pressé","agile"], answer:0 },
  { cat:"vocabulaire", sub:"Contraires", diff:4, phrase:"Le contraire de « généreux » est ___.", options:["avare","gentil","riche","aimable"], answer:0 },
  // Homonymes
  { cat:"vocabulaire", sub:"Homonymes", diff:3, phrase:"Je bois de l'eau dans un ___.", options:["verre","ver","vert","vers"], answer:0 },
  { cat:"vocabulaire", sub:"Homonymes", diff:4, phrase:"Le poète écrit de jolis ___.", options:["vers","verre","vert","ver"], answer:0 },
  { cat:"vocabulaire", sub:"Homonymes", diff:4, phrase:"Il pêche avec un ___ de terre.", options:["ver","verre","vert","vers"], answer:0 },
  { cat:"vocabulaire", sub:"Homonymes", diff:4, phrase:"Il compte jusqu'à ___.", options:["cent","sang","sans","s'en"], answer:0 },
  { cat:"vocabulaire", sub:"Homonymes", diff:5, phrase:"Il est parti ___ rien dire.", options:["sans","cent","sang","s'en"], answer:0 },
  // Familles de mots
  { cat:"vocabulaire", sub:"Familles de mots", diff:2, phrase:"De la même famille que « dent » : ___.", options:["dentiste","danser","dormir","donner"], answer:0 },
  { cat:"vocabulaire", sub:"Familles de mots", diff:3, phrase:"De la même famille que « fleur » : ___.", options:["fleuriste","flèche","fluide","flotter"], answer:0 },
  { cat:"vocabulaire", sub:"Familles de mots", diff:4, phrase:"De la même famille que « terre » : ___.", options:["terrestre","terrible","tertre","ternir"], answer:0 },
  { cat:"vocabulaire", sub:"Familles de mots", diff:4, phrase:"De la même famille que « lait » : ___.", options:["laitier","laid","laine","laisse"], answer:0 },
  // Mots du quotidien
  { cat:"vocabulaire", sub:"Mots du quotidien", diff:1, phrase:"Pour écrire, j'utilise un ___.", options:["stylo","verre","balai","oreiller"], answer:0 },
  { cat:"vocabulaire", sub:"Mots du quotidien", diff:1, phrase:"Pour voir la nuit, j'allume une ___.", options:["lampe","fleur","assiette","chaise"], answer:0 },
  { cat:"vocabulaire", sub:"Mots du quotidien", diff:2, phrase:"Un bébé chien s'appelle un ___.", options:["chiot","chaton","poulain","agneau"], answer:0 },
  { cat:"vocabulaire", sub:"Mots du quotidien", diff:2, phrase:"On garde le lait au ___.", options:["réfrigérateur","four","placard","tiroir"], answer:0 },
  { cat:"vocabulaire", sub:"Mots du quotidien", diff:3, phrase:"Le médecin qui soigne les dents est le ___.", options:["dentiste","vétérinaire","pédiatre","chirurgien"], answer:0 },

  /* ========================== ORTHOGRAPHE ======================== */
  // Homophones
  { cat:"orthographe", sub:"Homophones", diff:1, phrase:"Elle ___ partie à l'école.", options:["est","et","es","ait"], answer:0 },
  { cat:"orthographe", sub:"Homophones", diff:1, phrase:"Il joue ___ la balle.", options:["à","a","as","ah"], answer:0 },
  { cat:"orthographe", sub:"Homophones", diff:2, phrase:"Paul ___ Marie sont amis.", options:["et","est","ait","ai"], answer:0 },
  { cat:"orthographe", sub:"Homophones", diff:2, phrase:"Les oiseaux ___ partis.", options:["sont","son","s'ont","sonts"], answer:0 },
  { cat:"orthographe", sub:"Homophones", diff:3, phrase:"Il a mis ___ manteau.", options:["son","sont","sons","s'on"], answer:0 },
  { cat:"orthographe", sub:"Homophones", diff:4, phrase:"Il y a ___ de monde aujourd'hui.", options:["peu","peux","peut","peus"], answer:0 },
  // é ou er
  { cat:"orthographe", sub:"é ou er", diff:2, phrase:"Je vais ___ une pomme.", options:["manger","mangé","mangez","mangés"], answer:0 },
  { cat:"orthographe", sub:"é ou er", diff:2, phrase:"Tu dois ___ tes leçons.", options:["réviser","révisé","révisez","révisés"], answer:0 },
  { cat:"orthographe", sub:"é ou er", diff:3, phrase:"Elle a ___ son travail.", options:["terminé","terminer","terminez","terminés"], answer:0 },
  { cat:"orthographe", sub:"é ou er", diff:3, phrase:"Nous allons ___ un gâteau.", options:["préparer","préparé","préparez","préparés"], answer:0 },
  { cat:"orthographe", sub:"é ou er", diff:5, phrase:"La leçon ___ hier était difficile.", options:["étudiée","étudier","étudiez","étudié"], answer:0 },
  // Accents
  { cat:"orthographe", sub:"Accents", diff:2, phrase:"On écrit correctement : ___.", options:["élève","eleve","élеve","èlève"], answer:0 },
  { cat:"orthographe", sub:"Accents", diff:3, phrase:"On écrit correctement : ___.", options:["fenêtre","fenètre","fenetre","fênetre"], answer:0 },
  { cat:"orthographe", sub:"Accents", diff:3, phrase:"On écrit correctement : ___.", options:["forêt","foret","forét","fôret"], answer:0 },
  { cat:"orthographe", sub:"Accents", diff:4, phrase:"On écrit correctement : ___.", options:["théâtre","theatre","théatre","thèâtre"], answer:0 },
  // Pluriels
  { cat:"orthographe", sub:"Pluriels", diff:2, phrase:"Le pluriel de « chou » est ___.", options:["choux","chous","choues","chouxs"], answer:0 },
  { cat:"orthographe", sub:"Pluriels", diff:3, phrase:"Le pluriel de « cheval » est ___.", options:["chevaux","chevals","cheveaux","chevales"], answer:0 },
  { cat:"orthographe", sub:"Pluriels", diff:3, phrase:"Le pluriel de « journal » est ___.", options:["journaux","journals","journeaux","journales"], answer:0 },
  { cat:"orthographe", sub:"Pluriels", diff:4, phrase:"Le pluriel de « œil » est ___.", options:["yeux","œils","yeuxs","oeils"], answer:0 },
  { cat:"orthographe", sub:"Pluriels", diff:5, phrase:"Le pluriel de « pneu » est ___.", options:["pneus","pneux","pneaux","pneus."], answer:0 },
  // m devant m, b, p
  { cat:"orthographe", sub:"m devant m, b, p", diff:2, phrase:"On écrit correctement : ___.", options:["tomber","tonber","tommber","tombér"], answer:0 },
  { cat:"orthographe", sub:"m devant m, b, p", diff:2, phrase:"On écrit correctement : ___.", options:["important","inportant","immportant","importent"], answer:0 },
  { cat:"orthographe", sub:"m devant m, b, p", diff:3, phrase:"On écrit correctement : ___.", options:["campagne","canpagne","cammpagne","campanie"], answer:0 },
  { cat:"orthographe", sub:"m devant m, b, p", diff:4, phrase:"On écrit correctement : ___.", options:["emmener","enmener","emener","ammener"], answer:0 }
];

/* Export pour un usage éventuel hors navigateur (tests, scripts). */
if (typeof module !== "undefined" && module.exports) { module.exports = QUESTIONS; }
