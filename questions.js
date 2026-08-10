/*
 * La Grande Évasion — Générateur de questions
 * ===========================================
 * Plutôt qu'une liste figée, les questions sont GÉNÉRÉES à la volée à partir
 * de banques de mots et d'un moteur de conjugaison. Chaque combinaison
 * (matière · thème · difficulté) peut produire des centaines de variantes :
 * l'élève ne retombe donc quasiment jamais sur la même question.
 *
 * Points clés (demande enseignante) :
 *  - Les distracteurs sont des ERREURS PLAUSIBLES du même type que la bonne
 *    réponse (ex. passé composé → uniquement des temps composés :
 *    « sont allées / ont allées / ont allé / étaient allées »).
 *  - Le temps/notion attendu est TOUJOURS affiché (champ `hint`), ce qui lève
 *    l'ambiguïté quand plusieurs temps seraient possibles (« Pourriez » vs
 *    « Pouvez ») — indispensable en mode « Tout ».
 *
 * API : window.Questions.generate(cat, sub, diff) → {cat, sub, phrase, hint,
 *       options:[bonne, …], answer:0}.  L'application mélange les options.
 *
 * Pour enrichir : ajoute des verbes dans VERBS ou des entrées dans les banques
 * GRAM / VOC / ORT ci-dessous.
 */
(function (global) {
  "use strict";

  /* ------------------------------ utilitaires ------------------------------ */
  function rint(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rint(a.length)]; }
  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=rint(i+1),t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function norm(s){ return String(s).toLowerCase().replace(/\s+/g," ").trim(); }
  function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
  function vowel(ch){ return "aeiouyàâäéèêëîïôöûü".indexOf((ch||"").toLowerCase())>=0; }
  // je + voyelle → j'
  function withSubj(disp, form){
    if(disp==="je"){ return (vowel(form[0])||form[0]==="h") ? "j'"+form : "je "+form; }
    return disp+" "+form;
  }
  // Sujet + trou, avec élision « je → j' » décidée d'après la BONNE réponse
  // (le trou n'affiche jamais qu'elle ; toutes les options d'un verbe commencent
  // par la même lettre). Ex. « j'___ » pour « j'allais », « je ___ » pour « je mange ».
  function subjBlank(S, refForm){
    if(S.d==="je") return (vowel(refForm[0])||refForm[0]==="h") ? "j'___" : "je ___";
    return S.d+" ___";
  }
  // construit 4 options : la bonne (index 0) + 3 distracteurs distincts
  function build(correct, pool){
    var out=[correct], seen={}; seen[norm(correct)]=1;
    shuffle(pool);
    for(var i=0;i<pool.length && out.length<4;i++){
      var v=pool[i]; if(v==null) continue; v=String(v);
      if(!seen[norm(v)]){ seen[norm(v)]=1; out.push(v); }
    }
    return out;
  }

  /* ======================================================================= */
  /*                           CONJUGAISON                                   */
  /* ======================================================================= */
  // Sujets : disp, pi (index de personne 0..5), genre, nombre.
  var SUBJ = {
    je:{d:"je",pi:0}, tu:{d:"tu",pi:1}, il:{d:"il",pi:2,g:"m",n:"s"},
    elle:{d:"elle",pi:2,g:"f",n:"s"}, on:{d:"on",pi:2,g:"m",n:"s"},
    nous:{d:"nous",pi:3}, vous:{d:"vous",pi:4},
    ils:{d:"ils",pi:5,g:"m",n:"p"}, elles:{d:"elles",pi:5,g:"f",n:"p"}
  };
  var AUX = {
    avoir:{ pres:["ai","as","a","avons","avez","ont"], imp:["avais","avais","avait","avions","aviez","avaient"] },
    etre: { pres:["suis","es","est","sommes","êtes","sont"], imp:["étais","étais","était","étions","étiez","étaient"] }
  };
  // accord du participe (verbes en être) selon le sujet
  function agree(pp, subj){
    if(subj.n==="p") return pp + (subj.g==="f" ? "es" : "s");
    return pp + (subj.g==="f" ? "e" : "");
  }

  // Construit un verbe régulier (-er 1er groupe, ou -ir 2e groupe).
  function reg1(inf, comp, etre){
    var s=inf.slice(0,-2); // sans "er"
    var nous = /ger$/.test(inf) ? s+"e" : (/cer$/.test(inf) ? s.slice(0,-1)+"ç" : s);
    return {
      inf:inf, etre:!!etre, pp:s+"é", comp:comp,
      pres:[s+"e", s+"es", s+"e", nous+"ons", s+"ez", s+"ent"],
      imp:[nous+"ais", nous+"ais", nous+"ait", s+"ions", s+"iez", nous+"aient"],
      fut:[inf+"ai", inf+"as", inf+"a", inf+"ons", inf+"ez", inf+"ont"],
      cond:[inf+"ais", inf+"ais", inf+"ait", inf+"ions", inf+"iez", inf+"aient"],
      subj:[s+"e", s+"es", s+"e", s+"ions", s+"iez", s+"ent"],
      imper:{tu:s+"e", nous:nous+"ons", vous:s+"ez"}, g:1
    };
  }
  function reg2(inf, comp){
    var s=inf.slice(0,-2); // sans "ir"
    return {
      inf:inf, etre:false, pp:s+"i", comp:comp,
      pres:[s+"is", s+"is", s+"it", s+"issons", s+"issez", s+"issent"],
      imp:[s+"issais", s+"issais", s+"issait", s+"issions", s+"issiez", s+"issaient"],
      fut:[inf+"ai", inf+"as", inf+"a", inf+"ons", inf+"ez", inf+"ont"],
      cond:[inf+"ais", inf+"ais", inf+"ait", inf+"ions", inf+"iez", inf+"aient"],
      subj:[s+"isse", s+"isses", s+"isse", s+"issions", s+"issiez", s+"issent"],
      imper:{tu:s+"is", nous:s+"issons", vous:s+"issez"}, g:2
    };
  }
  // Verbe irrégulier : toutes les formes fournies explicitement.
  function irr(inf, o){ o.inf=inf; o.g=3; return o; }

  // Compléments choisis pour rester corrects avec TOUTES les personnes et TOUS
  // les temps : pas de possessif (mon/ses…) ni d'adjectif à accorder, pas de
  // mot de temps qui entrerait en conflit avec « Hier », « Demain », etc.
  var VERBS = [
    /* -------- 1er groupe (-er) -------- */
    reg1("parler",["fort","doucement","beaucoup","trop vite"]),
    reg1("aimer",["les animaux","le chocolat","lire","la musique"]),
    reg1("jouer",["au ballon","dans le jardin","aux cartes","de la flûte"]),
    reg1("chanter",["une chanson","juste","faux","à voix haute"]),
    reg1("danser",["la salsa","toute la nuit","le rock","en rythme"]),
    reg1("regarder",["la télévision","les étoiles","un film","le paysage"]),
    reg1("écouter",["de la musique","le maître","la radio","une histoire"]),
    reg1("donner",["un cadeau","la main","à manger","un coup de main"]),
    reg1("trouver",["la solution","un trésor","le chemin","une idée"]),
    reg1("marcher",["vite","dans la forêt","sur le sable","longtemps"]),
    reg1("sauter",["haut","dans l'eau","à la corde","de joie"]),
    reg1("dessiner",["un lion","une fleur","des maisons","un paysage"]),
    reg1("gagner",["la partie","une médaille","du temps","le concours"]),
    reg1("pousser",["le portail","un cri","la brouette","la porte"]),
    reg1("attraper",["le ballon","un rhume","le bus","un poisson"]),
    reg1("montrer",["le chemin","du doigt","la sortie","le tableau"]),
    reg1("manger",["une pomme","du bambou","des cacahuètes","une carotte"]),
    reg1("nager",["dans le bassin","vite","le crawl","sous l'eau"]),
    reg1("ranger",["les jouets","les cahiers","la salle","le matériel"]),
    reg1("plonger",["dans l'eau","du plongeoir","tête la première","dans le grand bain"]),
    reg1("commencer",["le travail","une histoire","à courir","la partie"]),
    reg1("lancer",["le dé","la balle","un défi","le ballon"]),
    reg1("rester",["à la maison","dehors","au lit","à l'intérieur"], true),
    reg1("arriver",["en retard","au portail","à l'heure","enfin"], true),
    reg1("tomber",["par terre","de vélo","dans le piège","dans l'eau"], true),
    reg1("monter",["sur le toboggan","à l'échelle","les escaliers","dans le bus"], true),
    /* -------- 2e groupe (-ir) -------- */
    reg2("finir",["le repas","la course","le travail","à temps"]),
    reg2("choisir",["un animal","une carte","la bonne réponse","un livre"]),
    reg2("grandir",["vite","beaucoup","chaque jour"]),
    reg2("réfléchir",["bien","à la question","avant de répondre","longtemps"]),
    reg2("remplir",["le seau","la fiche","le verre","le panier"]),
    reg2("réussir",["l'exercice","le défi","la course","l'évasion"]),
    reg2("obéir",["au gardien","aux règles","sans discuter","au maître"]),
    reg2("applaudir",["les artistes","très fort","le vainqueur","le spectacle"]),
    /* -------- irréguliers (3e groupe) -------- */
    irr("être",{ etre:false, pp:"été", comp:["à l'heure","en retard","dehors","de retour"],
      pres:["suis","es","est","sommes","êtes","sont"],
      imp:["étais","étais","était","étions","étiez","étaient"],
      fut:["serai","seras","sera","serons","serez","seront"],
      cond:["serais","serais","serait","serions","seriez","seraient"],
      subj:["sois","sois","soit","soyons","soyez","soient"],
      imper:{tu:"sois",nous:"soyons",vous:"soyez"} }),
    irr("avoir",{ etre:false, pp:"eu", comp:["un cadeau","de la chance","raison","peur"], noImper:true,
      pres:["ai","as","a","avons","avez","ont"],
      imp:["avais","avais","avait","avions","aviez","avaient"],
      fut:["aurai","auras","aura","aurons","aurez","auront"],
      cond:["aurais","aurais","aurait","aurions","auriez","auraient"],
      subj:["aie","aies","ait","ayons","ayez","aient"],
      imper:{tu:"aie",nous:"ayons",vous:"ayez"} }),
    irr("aller",{ etre:true, pp:"allé", comp:["au zoo","à l'école","à la piscine","en ville"],
      pres:["vais","vas","va","allons","allez","vont"],
      imp:["allais","allais","allait","allions","alliez","allaient"],
      fut:["irai","iras","ira","irons","irez","iront"],
      cond:["irais","irais","irait","irions","iriez","iraient"],
      subj:["aille","ailles","aille","allions","alliez","aillent"],
      imper:{tu:"va",nous:"allons",vous:"allez"} }),
    irr("faire",{ etre:false, pp:"fait", comp:["du sport","un gâteau","attention","le ménage"],
      pres:["fais","fais","fait","faisons","faites","font"],
      imp:["faisais","faisais","faisait","faisions","faisiez","faisaient"],
      fut:["ferai","feras","fera","ferons","ferez","feront"],
      cond:["ferais","ferais","ferait","ferions","feriez","feraient"],
      subj:["fasse","fasses","fasse","fassions","fassiez","fassent"],
      imper:{tu:"fais",nous:"faisons",vous:"faites"} }),
    irr("dire",{ etre:false, pp:"dit", comp:["la vérité","bonjour","oui","un poème"],
      pres:["dis","dis","dit","disons","dites","disent"],
      imp:["disais","disais","disait","disions","disiez","disaient"],
      fut:["dirai","diras","dira","dirons","direz","diront"],
      cond:["dirais","dirais","dirait","dirions","diriez","diraient"],
      subj:["dise","dises","dise","disions","disiez","disent"],
      imper:{tu:"dis",nous:"disons",vous:"dites"} }),
    irr("prendre",{ etre:false, pp:"pris", comp:["le bus","une photo","un livre","le train"],
      pres:["prends","prends","prend","prenons","prenez","prennent"],
      imp:["prenais","prenais","prenait","prenions","preniez","prenaient"],
      fut:["prendrai","prendras","prendra","prendrons","prendrez","prendront"],
      cond:["prendrais","prendrais","prendrait","prendrions","prendriez","prendraient"],
      subj:["prenne","prennes","prenne","prenions","preniez","prennent"],
      imper:{tu:"prends",nous:"prenons",vous:"prenez"} }),
    irr("voir",{ etre:false, pp:"vu", comp:["un film","la mer","le portail","au loin"],
      pres:["vois","vois","voit","voyons","voyez","voient"],
      imp:["voyais","voyais","voyait","voyions","voyiez","voyaient"],
      fut:["verrai","verras","verra","verrons","verrez","verront"],
      cond:["verrais","verrais","verrait","verrions","verriez","verraient"],
      subj:["voie","voies","voie","voyions","voyiez","voient"],
      imper:{tu:"vois",nous:"voyons",vous:"voyez"} }),
    irr("pouvoir",{ etre:false, pp:"pu", comp:["venir","aider","partir","gagner"], noImper:true,
      pres:["peux","peux","peut","pouvons","pouvez","peuvent"],
      imp:["pouvais","pouvais","pouvait","pouvions","pouviez","pouvaient"],
      fut:["pourrai","pourras","pourra","pourrons","pourrez","pourront"],
      cond:["pourrais","pourrais","pourrait","pourrions","pourriez","pourraient"],
      subj:["puisse","puisses","puisse","puissions","puissiez","puissent"] }),
    irr("vouloir",{ etre:false, pp:"voulu", comp:["partir","un bonbon","gagner","de l'eau"], noImper:true,
      pres:["veux","veux","veut","voulons","voulez","veulent"],
      imp:["voulais","voulais","voulait","voulions","vouliez","voulaient"],
      fut:["voudrai","voudras","voudra","voudrons","voudrez","voudront"],
      cond:["voudrais","voudrais","voudrait","voudrions","voudriez","voudraient"],
      subj:["veuille","veuilles","veuille","voulions","vouliez","veuillent"] }),
    irr("savoir",{ etre:false, pp:"su", comp:["nager","compter","la réponse","la leçon"],
      pres:["sais","sais","sait","savons","savez","savent"],
      imp:["savais","savais","savait","savions","saviez","savaient"],
      fut:["saurai","sauras","saura","saurons","saurez","sauront"],
      cond:["saurais","saurais","saurait","saurions","sauriez","sauraient"],
      subj:["sache","saches","sache","sachions","sachiez","sachent"],
      imper:{tu:"sache",nous:"sachons",vous:"sachez"} }),
    irr("venir",{ etre:true, pp:"venu", comp:["au zoo","à la fête","de loin","très vite"],
      pres:["viens","viens","vient","venons","venez","viennent"],
      imp:["venais","venais","venait","venions","veniez","venaient"],
      fut:["viendrai","viendras","viendra","viendrons","viendrez","viendront"],
      cond:["viendrais","viendrais","viendrait","viendrions","viendriez","viendraient"],
      subj:["vienne","viennes","vienne","venions","veniez","viennent"],
      imper:{tu:"viens",nous:"venons",vous:"venez"} }),
    irr("partir",{ etre:true, pp:"parti", comp:["en vacances","très tôt","en courant","au loin"],
      pres:["pars","pars","part","partons","partez","partent"],
      imp:["partais","partais","partait","partions","partiez","partaient"],
      fut:["partirai","partiras","partira","partirons","partirez","partiront"],
      cond:["partirais","partirais","partirait","partirions","partiriez","partiraient"],
      subj:["parte","partes","parte","partions","partiez","partent"],
      imper:{tu:"pars",nous:"partons",vous:"partez"} }),
    irr("sortir",{ etre:true, pp:"sorti", comp:["dehors","du zoo","en ville","de la cage"],
      pres:["sors","sors","sort","sortons","sortez","sortent"],
      imp:["sortais","sortais","sortait","sortions","sortiez","sortaient"],
      fut:["sortirai","sortiras","sortira","sortirons","sortirez","sortiront"],
      cond:["sortirais","sortirais","sortirait","sortirions","sortiriez","sortiraient"],
      subj:["sorte","sortes","sorte","sortions","sortiez","sortent"],
      imper:{tu:"sors",nous:"sortons",vous:"sortez"} }),

    /* -------- 1er groupe (-er) — nouveaux -------- */
    reg1("aider",["un ami","le maître","à ranger","les autres"]),
    reg1("chercher",["un trésor","la sortie","des indices","le chemin"]),
    reg1("fermer",["la porte","les yeux","le portail","la fenêtre"]),
    reg1("garder",["le silence","un secret","la maison","le calme"]),
    reg1("porter",["un sac","un chapeau","des lunettes","une valise"]),
    reg1("poser",["une question","un livre","le sac","un problème"]),
    reg1("raconter",["une histoire","une blague","un conte","la fin"]),
    reg1("tourner",["à droite","la page","à gauche","en rond"]),
    reg1("travailler",["dur","en silence","à deux","le français"]),
    reg1("visiter",["le zoo","un musée","la ville","un château"]),
    reg1("observer",["les étoiles","un oiseau","la scène","les animaux"]),
    reg1("penser",["à demain","aux vacances","très fort","à toi"]),
    reg1("ramasser",["les feuilles","un caillou","les jouets","des champignons"]),
    reg1("crier",["de joie","très fort","au secours","de peur"]),
    reg1("compter",["jusqu'à dix","les points","sur toi","les étoiles"]),
    reg1("couper",["le pain","du papier","la corde","le gâteau"]),
    reg1("expliquer",["la règle","le chemin","la leçon","un problème"]),
    reg1("glisser",["sur la glace","dans l'eau","sur le sol","très loin"]),
    reg1("goûter",["le gâteau","la soupe","un fruit","le plat"]),
    reg1("habiter",["à la campagne","en ville","ici","près du zoo"]),
    reg1("soigner",["un animal","un bobo","un blessé","la girafe"]),
    reg1("terminer",["le travail","le repas","la course","le dessin"]),
    reg1("verser",["de l'eau","le jus","du lait","la soupe"]),
    reg1("arroser",["les fleurs","le jardin","les plantes","la pelouse"]),
    reg1("attacher",["les lacets","la corde","le sac","le vélo"]),
    reg1("casser",["une branche","le vase","la glace","un œuf"]),
    reg1("siffler",["une chanson","très fort","un air","gaiement"]),
    reg1("dévorer",["une pomme","un livre","le repas","la viande"]),
    reg1("féliciter",["le vainqueur","les joueurs","un ami","l'équipe"]),
    reg1("partager",["le gâteau","un secret","les bonbons","la pizza"]),
    reg1("mélanger",["les couleurs","la pâte","les cartes","le jus"]),
    reg1("voyager",["en train","très loin","en avion","de nuit"]),
    /* -------- 2e groupe (-ir) — nouveaux -------- */
    reg2("grossir",["un peu","beaucoup","vite","légèrement"]),
    reg2("ralentir",["dans le virage","un peu","à l'entrée","avant le stop"]),
    reg2("rougir",["de honte","un peu","de plaisir","facilement"]),
    reg2("bâtir",["une cabane","un mur","un nid","une tour"]),
    reg2("guérir",["vite","d'un rhume","doucement","peu à peu"]),
    reg2("saisir",["la balle","une occasion","le ballon","la corde"]),
    reg2("franchir",["la ligne","le pont","l'obstacle","la rivière"]),
    reg2("avertir",["le gardien","les autres","un camarade","la classe"]),
    /* -------- irréguliers — nouveaux -------- */
    irr("mettre",{ etre:false, pp:"mis", comp:["la table","un manteau","le couvert","de la musique"],
      pres:["mets","mets","met","mettons","mettez","mettent"],
      imp:["mettais","mettais","mettait","mettions","mettiez","mettaient"],
      fut:["mettrai","mettras","mettra","mettrons","mettrez","mettront"],
      cond:["mettrais","mettrais","mettrait","mettrions","mettriez","mettraient"],
      subj:["mette","mettes","mette","mettions","mettiez","mettent"],
      imper:{tu:"mets",nous:"mettons",vous:"mettez"} }),
    irr("lire",{ etre:false, pp:"lu", comp:["un livre","une histoire","le journal","une BD"],
      pres:["lis","lis","lit","lisons","lisez","lisent"],
      imp:["lisais","lisais","lisait","lisions","lisiez","lisaient"],
      fut:["lirai","liras","lira","lirons","lirez","liront"],
      cond:["lirais","lirais","lirait","lirions","liriez","liraient"],
      subj:["lise","lises","lise","lisions","lisiez","lisent"],
      imper:{tu:"lis",nous:"lisons",vous:"lisez"} }),
    irr("écrire",{ etre:false, pp:"écrit", comp:["une lettre","un poème","le titre","une carte"],
      pres:["écris","écris","écrit","écrivons","écrivez","écrivent"],
      imp:["écrivais","écrivais","écrivait","écrivions","écriviez","écrivaient"],
      fut:["écrirai","écriras","écrira","écrirons","écrirez","écriront"],
      cond:["écrirais","écrirais","écrirait","écririons","écririez","écriraient"],
      subj:["écrive","écrives","écrive","écrivions","écriviez","écrivent"],
      imper:{tu:"écris",nous:"écrivons",vous:"écrivez"} }),
    irr("boire",{ etre:false, pp:"bu", comp:["de l'eau","un jus","du lait","une limonade"],
      pres:["bois","bois","boit","buvons","buvez","boivent"],
      imp:["buvais","buvais","buvait","buvions","buviez","buvaient"],
      fut:["boirai","boiras","boira","boirons","boirez","boiront"],
      cond:["boirais","boirais","boirait","boirions","boiriez","boiraient"],
      subj:["boive","boives","boive","buvions","buviez","boivent"],
      imper:{tu:"bois",nous:"buvons",vous:"buvez"} }),
    irr("devoir",{ etre:false, pp:"dû", comp:["partir","travailler","réviser","obéir"], noImper:true,
      pres:["dois","dois","doit","devons","devez","doivent"],
      imp:["devais","devais","devait","devions","deviez","devaient"],
      fut:["devrai","devras","devra","devrons","devrez","devront"],
      cond:["devrais","devrais","devrait","devrions","devriez","devraient"],
      subj:["doive","doives","doive","devions","deviez","doivent"] }),
    irr("ouvrir",{ etre:false, pp:"ouvert", comp:["la porte","le portail","un cadeau","la fenêtre"], noSubj:true,
      pres:["ouvre","ouvres","ouvre","ouvrons","ouvrez","ouvrent"],
      imp:["ouvrais","ouvrais","ouvrait","ouvrions","ouvriez","ouvraient"],
      fut:["ouvrirai","ouvriras","ouvrira","ouvrirons","ouvrirez","ouvriront"],
      cond:["ouvrirais","ouvrirais","ouvrirait","ouvririons","ouvririez","ouvriraient"],
      subj:["ouvre","ouvres","ouvre","ouvrions","ouvriez","ouvrent"],
      imper:{tu:"ouvre",nous:"ouvrons",vous:"ouvrez"} }),
    irr("courir",{ etre:false, pp:"couru", comp:["vite","dans le parc","un marathon","très loin"],
      pres:["cours","cours","court","courons","courez","courent"],
      imp:["courais","courais","courait","courions","couriez","couraient"],
      fut:["courrai","courras","courra","courrons","courrez","courront"],
      cond:["courrais","courrais","courrait","courrions","courriez","courraient"],
      subj:["coure","coures","coure","courions","couriez","courent"],
      imper:{tu:"cours",nous:"courons",vous:"courez"} }),
    irr("dormir",{ etre:false, pp:"dormi", comp:["profondément","toute la nuit","au chaud","paisiblement"],
      pres:["dors","dors","dort","dormons","dormez","dorment"],
      imp:["dormais","dormais","dormait","dormions","dormiez","dormaient"],
      fut:["dormirai","dormiras","dormira","dormirons","dormirez","dormiront"],
      cond:["dormirais","dormirais","dormirait","dormirions","dormiriez","dormiraient"],
      subj:["dorme","dormes","dorme","dormions","dormiez","dorment"],
      imper:{tu:"dors",nous:"dormons",vous:"dormez"} }),
    irr("attendre",{ etre:false, pp:"attendu", comp:["le bus","un moment","la fin","le train"],
      pres:["attends","attends","attend","attendons","attendez","attendent"],
      imp:["attendais","attendais","attendait","attendions","attendiez","attendaient"],
      fut:["attendrai","attendras","attendra","attendrons","attendrez","attendront"],
      cond:["attendrais","attendrais","attendrait","attendrions","attendriez","attendraient"],
      subj:["attende","attendes","attende","attendions","attendiez","attendent"],
      imper:{tu:"attends",nous:"attendons",vous:"attendez"} }),
    irr("répondre",{ etre:false, pp:"répondu", comp:["à la question","au maître","vite","correctement"],
      pres:["réponds","réponds","répond","répondons","répondez","répondent"],
      imp:["répondais","répondais","répondait","répondions","répondiez","répondaient"],
      fut:["répondrai","répondras","répondra","répondrons","répondrez","répondront"],
      cond:["répondrais","répondrais","répondrait","répondrions","répondriez","répondraient"],
      subj:["réponde","répondes","réponde","répondions","répondiez","répondent"],
      imper:{tu:"réponds",nous:"répondons",vous:"répondez"} }),
    irr("tenir",{ etre:false, pp:"tenu", comp:["la corde","un ballon","la main","une promesse"],
      pres:["tiens","tiens","tient","tenons","tenez","tiennent"],
      imp:["tenais","tenais","tenait","tenions","teniez","tenaient"],
      fut:["tiendrai","tiendras","tiendra","tiendrons","tiendrez","tiendront"],
      cond:["tiendrais","tiendrais","tiendrait","tiendrions","tiendriez","tiendraient"],
      subj:["tienne","tiennes","tienne","tenions","teniez","tiennent"],
      imper:{tu:"tiens",nous:"tenons",vous:"tenez"} })
  ];

  var TENSE_LABEL = { present:"au présent", passe:"au passé composé", imparfait:"à l'imparfait",
    futur:"au futur simple", cond:"au conditionnel présent", subj:"au subjonctif présent", imper:"à l'impératif" };
  var SUB_TO_TENSE = { "Présent":"present","Passé composé":"passe","Futur":"futur","Imparfait":"imparfait",
    "Impératif":"imper","Subjonctif":"subj","Conditionnel présent":"cond" };
  var CONJ_SUBS = Object.keys(SUB_TO_TENSE);

  var TIME = {
    present:["En ce moment","Aujourd'hui","Maintenant","Chaque jour","Souvent","D'habitude","Tous les jours","En général"],
    passe:["Hier","Ce matin","La semaine dernière","L'an dernier","Hier soir","Avant-hier","Lundi dernier","Tout à l'heure"],
    imparfait:["Autrefois","Avant","Chaque été","À cette époque","Quand il faisait beau,","Le dimanche,","À l'époque","D'ordinaire"],
    futur:["Demain","Bientôt","L'année prochaine","Plus tard","Un jour","La semaine prochaine","Dès demain","Après-demain"]
  };
  // Déclencheurs de subjonctif qui forment une phrase COMPLÈTE (pas « bien que… »
  // qui exigerait une proposition principale).
  var SUBJ_TRIG = ["Il faut que","Il faudrait que","Je veux que","J'aimerais que","Il vaut mieux que",
    "Je souhaite que","Il est important que","J'attends que","Je propose que","Il est temps que"];
  // élision « que » → « qu' » devant voyelle (qu'il, qu'elle, qu'ils…)
  function subjHead(trig, disp){
    if(/que$/.test(trig) && vowel(disp[0])) return trig.slice(0,-1)+"'"+disp;
    return trig+" "+disp;
  }
  // Amorces de conditionnel valables avec N'IMPORTE QUEL sujet.
  var COND_HEAD = ["Si c'était possible,","Si on le pouvait,","Dans ce cas,","Un jour peut-être,",
    "Avec un peu de chance,","En rêve,","Si tout allait bien,","Idéalement,"];

  // Adverbes qui, au passé composé, se placent ENTRE l'auxiliaire et le participe
  // (« a beaucoup mangé »). Comme la réponse doit tenir en un seul trou, on ne les
  // utilise PAS au passé composé (on garde alors les compléments d'objet/de lieu).
  var PRE_ADV = ["beaucoup","bien","vite","trop vite","souvent","mal","trop","déjà","encore","toujours","chaque jour","enfin"];
  function pcComp(v){
    var ok=(v.comp||[]).filter(function(c){ return PRE_ADV.indexOf(c)<0; });
    return ok.length ? pick(ok) : "";   // sinon : phrase sans complément (« Hier, il a grandi. »)
  }

  var VK={present:"pres",imparfait:"imp",futur:"fut",cond:"cond",subj:"subj"};
  function pform(v,tense,pi){ return v[VK[tense]][pi]; }

  // Difficulté propre à un verbe : réguliers plus faciles, irréguliers plus durs,
  // + un cran pour les verbes en « être » (accord du participe au passé composé).
  function verbDiff(v){
    var d = (v.g===1) ? 2 : (v.g===2 ? 3 : 4);
    if(v.etre) d += 1;
    return d;
  }
  // Sujets proposés selon la difficulté (les personnes du pluriel arrivent plus tard).
  function subjectsFor(diff){
    if(diff<=1) return ["je","tu","il","elle"];
    if(diff<=2) return ["je","tu","il","elle","nous"];
    if(diff<=4) return ["je","tu","il","elle","nous","vous","ils","elles"];
    return ["je","tu","il","elle","on","nous","vous","ils","elles"];
  }
  function verbsFor(diff, tense){
    var pool=VERBS.filter(function(v){
      if(tense==="subj" && (v.g===1 || v.noSubj)) return false; // subj identique à l'indicatif → exclu
      if(tense==="imper" && v.noImper) return false;
      return true;
    });
    // bande de difficulté autour de la cible (élargie jusqu'à trouver assez de verbes)
    for(var w=1;w<=5;w++){
      var band=pool.filter(function(v){ return Math.abs(verbDiff(v)-diff)<=w; });
      if(band.length>=8) return band;
    }
    return pool;
  }

  function genConj(sub, diff, cat){
    var tense = SUB_TO_TENSE[sub] || pick(["present","passe","imparfait","futur","cond","subj","imper"]);
    if(!SUB_TO_TENSE[sub]){ // mode « Tout » : tense choisi au hasard, on pondère un peu par difficulté
      var poolT=["present","imparfait","futur","passe"];
      if(diff>=3) poolT=poolT.concat(["passe","cond","imper"]);
      if(diff>=4) poolT=poolT.concat(["subj","cond","passe"]);
      tense=pick(poolT);
    }
    var verbs=verbsFor(diff,tense); if(!verbs.length) verbs=VERBS;
    var v=pick(verbs);
    var comp = v.comp ? pick(v.comp) : "";
    var hint = "Conjugue « "+v.inf+" » "+TENSE_LABEL[tense];

    if(tense==="passe") return genPasse(v,diff,cat,sub,comp,hint);
    if(tense==="imper") return genImper(v,diff,cat,sub,comp);

    // temps simples : present / imparfait / futur / cond / subj
    var subjPool = subjectsFor(diff);
    if(tense==="subj") subjPool = subjPool.filter(function(k){ return k!=="je"; }); // évite « Je veux que je… »
    var sk = pick(subjPool), S=SUBJ[sk], pi=S.pi;
    var correct = pform(v,tense,pi);

    // distracteurs = erreurs plausibles DU MÊME registre
    var pool=[];
    // autres personnes du même temps
    for(var p=0;p<6;p++){ if(p!==pi) pool.push(v[VK[tense]][p]); }
    // confusions inter-temps proches (même personne)
    if(tense==="futur"){ pool.unshift(v.cond[pi]); pool.push(v.pres[pi]); }
    else if(tense==="cond"){ pool.unshift(v.fut[pi]); pool.push(v.imp[pi]); }
    else if(tense==="imparfait"){ pool.unshift(v.cond[pi]); pool.push(v.pres[pi]); }
    else if(tense==="subj"){ pool.unshift(v.pres[pi]); pool.push(v.fut[pi]); }
    else if(tense==="present"){ pool.push(v.inf); pool.push(v.imp[pi]); }

    var phrase;
    if(tense==="subj"){ phrase = subjHead(pick(SUBJ_TRIG), S.d)+" ___"+ (comp?" "+comp:"")+"."; }
    else if(tense==="cond"){ phrase = pick(COND_HEAD)+" "+subjBlank(S,correct)+(comp?" "+comp:"")+"."; }
    else {
      var tm=TIME[tense]?pick(TIME[tense]):"";
      var body = subjBlank(S,correct)+(comp?" "+comp:"")+".";
      phrase = tm ? (tm+", "+body) : cap(body);
    }
    phrase=cap(phrase);
    return { cat:cat, sub:sub, tense:tense, phrase:phrase, hint:hint, options:build(correct,pool), answer:0 };
  }

  function genImper(v,diff,cat,sub,comp){
    var who=pick(diff<=2?["tu"]:["tu","tu","vous","nous"]);
    var correct=v.imper[who];
    var pool=[];
    if(who==="tu"){
      pool.push(v.pres[2]);                     // il forme (mange)
      if(v.g===1) pool.push(v.imper.tu+"s");    // erreur -s (Fermes)
      pool.push(v.inf);                          // infinitif (Fermer)
      pool.push(v.imper.vous); pool.push(v.imper.nous);
    } else {
      pool.push(v.inf);
      pool.push(v.imper.tu);
      pool.push(who==="vous"?v.imper.nous:v.imper.vous);
      pool.push(v.pres[ who==="vous"?4:3 ]);    // forme du présent (avec pronom sous-entendu)
    }
    var whoLabel = who==="tu"?"(tu)":(who==="vous"?"(vous)":"(nous)");
    var phrase = "___ "+(comp?comp+" ":"")+"!";   // le trou ouvre la phrase → réponse en majuscule
    var opts = build(cap(correct), pool.map(cap));
    return { cat:cat, sub:sub, tense:"imper", phrase:phrase,
      hint:"Conjugue « "+v.inf+" » à l'impératif "+whoLabel, options:opts, answer:0 };
  }

  // Passé composé : options 100 % « temps composés » (auxiliaire + participe).
  function genPasse(v,diff,cat,sub,comp,hint){
    var subjPool = v.etre ? ["il","elle","ils","elles"] : subjectsFor(diff);
    var sk=pick(subjPool), S=SUBJ[sk], pi=S.pi;
    var correct, pool=[];
    if(v.etre){
      var pp=agree(v.pp,S);
      correct = AUX.etre.pres[pi]+" "+pp;
      pool.push(AUX.avoir.pres[pi]+" "+pp);            // mauvais auxiliaire (ont allées)
      pool.push(AUX.avoir.pres[pi]+" "+v.pp);          // aux avoir + pas d'accord (ont allé)
      pool.push(AUX.etre.imp[pi]+" "+pp);              // plus-que-parfait (étaient allées)
      pool.push(AUX.etre.pres[pi]+" "+v.pp);           // être sans accord (sont allé)
      var other = agree(v.pp, S.g==="f"?{n:S.n,g:"m"}:{n:S.n,g:"f"});
      pool.push(AUX.etre.pres[pi]+" "+other);          // accord inversé
      if(v.pp!==v.inf) pool.push(AUX.etre.pres[pi]+" "+v.inf); // participe = infinitif (é/er)
    } else {
      correct = AUX.avoir.pres[pi]+" "+v.pp;
      pool.push(AUX.etre.pres[pi]+" "+v.pp);           // mauvais auxiliaire (est mangé)
      pool.push(AUX.avoir.imp[pi]+" "+v.pp);           // plus-que-parfait (avait mangé)
      pool.push(AUX.avoir.pres[pi]+" "+v.pp+(S.n==="p"?"s":"e")); // faux accord
      if(v.pp!==v.inf) pool.push(AUX.avoir.pres[pi]+" "+v.inf);   // é/er (a manger)
      pool.push(AUX.etre.pres[pi]+" "+agree(v.pp,S)); // être + accord (sont mangés)
    }
    var tm=pick(TIME.passe), pcc=pcComp(v);
    var phrase=cap(tm+", "+subjBlank(S,correct)+(pcc?" "+pcc:"")+".");
    return { cat:cat, sub:sub, tense:"passe", phrase:phrase, hint:hint, options:build(correct,pool), answer:0 };
  }

  // Choisit un item d'une banque en visant la difficulté (bande élargie au besoin).
  function pickByDiff(list, target){
    target=target||3;
    for(var w=0;w<=5;w++){
      var band=list.filter(function(it){ return Math.abs((it.d||3)-target)<=w; });
      if(band.length>=3) return pick(band);
    }
    return pick(list);
  }
  function fromGood(item, hint, cat, sub){
    return { cat:cat, sub:sub, phrase:item.ph, hint:hint, options:build(item.good, item.bad.slice()), answer:0 };
  }

  /* ======================================================================= */
  /*                            GRAMMAIRE                                     */
  /* ======================================================================= */
  var NATURE = [
    {w:"chien",n:"nom",d:1,ph:"« chien » est un ___."},
    {w:"girafe",n:"nom",d:1,ph:"« girafe » est un ___."},
    {w:"table",n:"nom",d:2,ph:"« table » est un ___."},
    {w:"manger",n:"verbe",d:1,ph:"« manger » est un ___."},
    {w:"nager",n:"verbe",d:1,ph:"« nager » est un ___."},
    {w:"courir",n:"verbe",d:2,ph:"« courir » est un ___."},
    {w:"noir",n:"adjectif",d:2,ph:"Dans « le chat noir », « noir » est un ___."},
    {w:"grand",n:"adjectif",d:2,ph:"Dans « un grand arbre », « grand » est un ___."},
    {w:"rapide",n:"adjectif",d:2,ph:"Dans « un zèbre rapide », « rapide » est un ___."},
    {w:"joyeux",n:"adjectif",d:3,ph:"Dans « un enfant joyeux », « joyeux » est un ___."},
    {w:"vite",n:"adverbe",d:3,ph:"Dans « il court vite », « vite » est un ___."},
    {w:"lentement",n:"adverbe",d:3,ph:"« lentement » est un ___."},
    {w:"souvent",n:"adverbe",d:3,ph:"« souvent » est un ___."},
    {w:"le",n:"déterminant",d:2,ph:"Dans « le lion », « le » est un ___."},
    {w:"mon",n:"déterminant",d:3,ph:"Dans « mon sac », « mon » est un ___."},
    {w:"ces",n:"déterminant",d:3,ph:"Dans « ces fleurs », « ces » est un ___."},
    {w:"elle",n:"pronom",d:3,ph:"Dans « elle chante », « elle » est un ___."},
    {w:"nous",n:"pronom",d:3,ph:"Dans « nous jouons », « nous » est un ___."},
    {w:"qui",n:"pronom",d:4,ph:"Dans « le chien qui aboie », « qui » est un ___."},
    {w:"de",n:"préposition",d:4,ph:"Dans « la niche de Léo », « de » est une ___."},
    {w:"sous",n:"préposition",d:3,ph:"Dans « sous la table », « sous » est une ___."},
    {w:"avec",n:"préposition",d:4,ph:"Dans « avec un ami », « avec » est une ___."},
    {w:"mais",n:"conjonction",d:4,ph:"Dans « petit mais fort », « mais » est une ___."},
    {w:"et",n:"conjonction",d:3,ph:"Dans « toi et moi », « et » est une ___."},
    {w:"car",n:"conjonction",d:5,ph:"Dans « il pleure car il est triste », « car » est une ___."}
  ];
  var NATURE_OPTS=["nom","verbe","adjectif","adverbe","préposition","pronom","déterminant","conjonction"];
  var DET = [
    {d:1,ph:"___ chat dort sur le canapé.",good:"Le",bad:["Les","Des","Aux"]},
    {d:1,ph:"___ girafe mange des feuilles.",good:"La",bad:["Le","Les","L'"]},
    {d:2,ph:"J'ai vu ___ oiseaux dans le ciel.",good:"des",bad:["de","du","le"]},
    {d:2,ph:"___ enfants jouent dehors.",good:"Les",bad:["Le","La","L'"]},
    {d:2,ph:"Prends ___ crayons.",good:"tes",bad:["ton","ta","te"]},
    {d:3,ph:"___ amie est très gentille.",good:"Mon",bad:["Ma","Mes","Me"]},
    {d:3,ph:"Regarde ___ étoiles !",good:"ces",bad:["cet","cette","ce"]},
    {d:3,ph:"___ éléphant est énorme.",good:"Cet",bad:["Ce","Cette","Ces"]},
    {d:4,ph:"Je veux ___ eau, s'il te plaît.",good:"de l'",bad:["du","de la","des"]},
    {d:4,ph:"Il n'a pas ___ argent.",good:"d'",bad:["de","des","du"]},
    {d:2,ph:"Il boit ___ lait le matin.",good:"du",bad:["de la","des","le"]},
    {d:3,ph:"___ arbre perd ses feuilles.",good:"L'",bad:["Le","La","Les"]},
    {d:4,ph:"Elle mange ___ confiture.",good:"de la",bad:["du","de l'","des"]},
    {d:3,ph:"Range ___ affaires.",good:"tes",bad:["ta","ton","te"]}
  ];
  var PRON = [
    {d:2,ph:"La personne ___ vient d'arriver est mon oncle.",good:"qui",bad:["que","dont","où"]},
    {d:3,ph:"Le gâteau ___ tu as fait est délicieux.",good:"que",bad:["qui","dont","où"]},
    {d:3,ph:"C'est la ville ___ je suis né.",good:"où",bad:["que","dont","qui"]},
    {d:4,ph:"Le livre ___ je t'ai parlé est génial.",good:"dont",bad:["que","qui","où"]},
    {d:3,ph:"Range tes affaires : ___ traînent partout.",good:"elles",bad:["ils","eux","leur"]},
    {d:3,ph:"Donne-___ le ballon (à lui).",good:"lui",bad:["le","la","leur"]},
    {d:4,ph:"Je pense à mes amis, je ___ écris souvent.",good:"leur",bad:["les","leurs","lui"]},
    {d:5,ph:"Ce vélo est à moi, c'est le ___.",good:"mien",bad:["mon","mienne","miens"]},
    {d:2,ph:"Où est le chat ? ___ dort.",good:"Il",bad:["Elle","Ils","On"]},
    {d:4,ph:"Ces bonbons sont à nous, ce sont les ___.",good:"nôtres",bad:["notres","nôtre","nos"]},
    {d:3,ph:"Tu vois ce film ? Je ___ ai déjà vu.",good:"l'",bad:["le","lui","les"]},
    {d:4,ph:"Voici le chemin par ___ il faut passer.",good:"lequel",bad:["laquelle","lesquels","dont"]}
  ];
  var PREP = [
    {d:2,ph:"Le chat est ___ la table.",good:"sous",bad:["sur","dans","à"]},
    {d:2,ph:"Range le livre ___ ton sac.",good:"dans",bad:["à","en","sur"]},
    {d:2,ph:"Ce cadeau est ___ toi.",good:"pour",bad:["par","à","de"]},
    {d:3,ph:"Je vais ___ Paris cet été.",good:"à",bad:["au","en","dans"]},
    {d:3,ph:"Je pars ___ train.",good:"en",bad:["à","dans","de"]},
    {d:3,ph:"Nous partons ___ vacances.",good:"en",bad:["à","dans","aux"]},
    {d:4,ph:"Il habite ___ Portugal.",good:"au",bad:["en","à","aux"]},
    {d:4,ph:"Nous allons ___ États-Unis.",good:"aux",bad:["au","en","à"]},
    {d:4,ph:"Elle vient ___ Espagne.",good:"d'",bad:["de","du","des"]},
    {d:3,ph:"Elle joue ___ la corde.",good:"à",bad:["de","en","sur"]},
    {d:3,ph:"Il joue ___ violon.",good:"du",bad:["au","de","à"]},
    {d:2,ph:"Le nid est ___ l'arbre.",good:"dans",bad:["sur","sous","à"]},
    {d:4,ph:"Elle rentre ___ l'école à pied.",good:"de",bad:["à","en","du"]},
    {d:3,ph:"Pose le vase ___ la table.",good:"sur",bad:["sous","dans","à"]}
  ];
  var ACCORD = [
    {d:2,ph:"Les fleurs sont ___.",good:"belles",bad:["belle","beau","beaux"]},
    {d:2,ph:"Elle porte une robe ___.",good:"verte",bad:["vert","verts","vertes"]},
    {d:3,ph:"Les lions sont ___.",good:"forts",bad:["fort","forte","fortes"]},
    {d:3,ph:"Les garçons sont ___.",good:"contents",bad:["content","contente","contentes"]},
    {d:2,ph:"Une histoire ___.",good:"amusante",bad:["amusant","amusants","amusantes"]},
    {d:4,ph:"Des amies ___ sont venues.",good:"gentilles",bad:["gentil","gentille","gentils"]},
    {d:4,ph:"Mes chaussures sont ___.",good:"neuves",bad:["neuf","neuve","neufs"]},
    {d:5,ph:"Ces pommes sont ___.",good:"mûres",bad:["mûr","mûre","mûrs"]},
    {d:3,ph:"La petite fille est ___.",good:"heureuse",bad:["heureux","heureuses","heureu"]},
    {d:2,ph:"Un chien ___ aboie.",good:"noir",bad:["noire","noirs","noires"]},
    {d:4,ph:"Les feuilles ___ tombent.",good:"mortes",bad:["mort","morte","morts"]},
    {d:5,ph:"Une vieille dame et un vieux monsieur sont ___.",good:"âgés",bad:["âgé","âgées","âgée"]}
  ];
  var TYPES = [
    {d:2,ph:"« Quelle belle journée ! » est une phrase ___.",good:"exclamative",bad:["interrogative","déclarative","impérative"]},
    {d:2,ph:"« Où vas-tu ? » est une phrase ___.",good:"interrogative",bad:["exclamative","déclarative","impérative"]},
    {d:3,ph:"« Ferme la porte. » est une phrase ___.",good:"impérative",bad:["interrogative","exclamative","déclarative"]},
    {d:2,ph:"« Le chat dort. » est une phrase ___.",good:"déclarative",bad:["interrogative","exclamative","impérative"]},
    {d:4,ph:"« Ne cours pas. » est une phrase ___.",good:"négative",bad:["affirmative","interrogative","exclamative"]},
    {d:3,ph:"« Range ta chambre. » est une phrase ___.",good:"impérative",bad:["déclarative","interrogative","exclamative"]},
    {d:4,ph:"« Comme il fait beau ! » est une phrase ___.",good:"exclamative",bad:["déclarative","interrogative","impérative"]},
    {d:3,ph:"« Est-ce que tu viens ? » est une phrase ___.",good:"interrogative",bad:["exclamative","impérative","déclarative"]}
  ];
  function genGram(sub, diff, cat){
    if(sub==="Nature des mots"){ var it=pickByDiff(NATURE,diff);
      var bad=shuffle(NATURE_OPTS.filter(function(o){return o!==it.n;})).slice(0,3);
      return { cat:cat, sub:sub, phrase:it.ph, hint:"Donne la nature (classe) du mot", options:build(it.n,bad), answer:0 }; }
    if(sub==="Déterminants") return fromGood(pickByDiff(DET,diff),"Choisis le bon déterminant",cat,sub);
    if(sub==="Pronoms") return fromGood(pickByDiff(PRON,diff),"Choisis le bon pronom",cat,sub);
    if(sub==="Prépositions") return fromGood(pickByDiff(PREP,diff),"Choisis la bonne préposition",cat,sub);
    if(sub==="Accords") return fromGood(pickByDiff(ACCORD,diff),"Accorde correctement (genre et nombre)",cat,sub);
    if(sub==="Types de phrases") return fromGood(pickByDiff(TYPES,diff),"Quel type de phrase ?",cat,sub);
    return fromGood(pickByDiff(DET,diff),"Grammaire",cat,sub);
  }

  /* ======================================================================= */
  /*                            VOCABULAIRE                                   */
  /* ======================================================================= */
  var SYN = [
    {d:1,w:["content","heureux","joyeux"]}, {d:2,w:["rapide","vif","véloce"]},
    {d:2,w:["grand","immense","gigantesque"]}, {d:2,w:["beau","joli","superbe"]},
    {d:2,w:["débuter","commencer","démarrer"]}, {d:2,w:["parler","discuter","bavarder"]},
    {d:3,w:["fatigué","épuisé","exténué"]}, {d:2,w:["gentil","aimable","sympathique"]},
    {d:2,w:["drôle","amusant","comique"]}, {d:2,w:["calme","paisible","tranquille"]},
    {d:3,w:["malin","rusé","astucieux"]}, {d:3,w:["peur","frayeur","crainte"]},
    {d:4,w:["maison","demeure","logis"]}, {d:3,w:["regarder","observer","contempler"]},
    {d:3,w:["manger","dévorer","déguster"]}, {d:2,w:["content","ravi","enchanté"]},
    {d:4,w:["triste","malheureux","chagriné"]}, {d:3,w:["dire","déclarer","annoncer"]},
    {d:4,w:["courageux","brave","vaillant"]}, {d:5,w:["riche","fortuné","aisé"]}
  ];
  var SYN_DIST = ["triste","lent","petit","laid","finir","fort","méchant","lourd","bruyant","sombre","facile","vide","froid","sale"];
  var CONTR = [
    {d:1,a:"grand",b:"petit"}, {d:1,a:"jour",b:"nuit"}, {d:1,a:"chaud",b:"froid"},
    {d:2,a:"vrai",b:"faux"}, {d:2,a:"ouvrir",b:"fermer"}, {d:2,a:"monter",b:"descendre"},
    {d:1,a:"rapide",b:"lent"}, {d:2,a:"content",b:"triste"}, {d:2,a:"propre",b:"sale"},
    {d:2,a:"plein",b:"vide"}, {d:2,a:"gagner",b:"perdre"}, {d:3,a:"devant",b:"derrière"},
    {d:3,a:"clair",b:"sombre"}, {d:3,a:"dur",b:"mou"}, {d:3,a:"riche",b:"pauvre"},
    {d:2,a:"haut",b:"bas"}, {d:3,a:"lourd",b:"léger"}, {d:4,a:"aimable",b:"désagréable"},
    {d:4,a:"autoriser",b:"interdire"}, {d:3,a:"début",b:"fin"}
  ];
  var HOMO = [
    {d:3,ph:"On se baigne dans la ___ (grande étendue d'eau salée).",good:"mer",bad:["mère","maire","mers"]},
    {d:3,ph:"Ma ___ me lit une histoire (ma maman).",good:"mère",bad:["mer","maire","mères"]},
    {d:3,ph:"Un ___ de terre creuse le sol (petit animal mou).",good:"ver",bad:["verre","vert","vers"]},
    {d:3,ph:"Je bois de l'eau dans un ___ (récipient).",good:"verre",bad:["ver","vert","vers"]},
    {d:3,ph:"Les élèves jouent dans la ___ de l'école (espace extérieur).",good:"cour",bad:["cours","court","courre"]},
    {d:2,ph:"Le boulanger vend du ___ (aliment doré).",good:"pain",bad:["pin","peint","pains"]},
    {d:4,ph:"On remplit le ___ d'eau (récipient à anse).",good:"seau",bad:["sceau","sot","saut"]},
    {d:4,ph:"Le fermier laboure son ___ (grand terrain).",good:"champ",bad:["chant","champs","chants"]},
    {d:4,ph:"Le soir, papa me lit un ___ de fées (histoire).",good:"conte",bad:["compte","comte","contes"]},
    {d:3,ph:"Il était une ___, un lion rêvait de liberté (autrefois).",good:"fois",bad:["foi","foie","foies"]},
    {d:2,ph:"La grenouille saute dans l'___ (liquide).",good:"eau",bad:["au","haut","oh"]},
    {d:5,ph:"Le roi vit dans un ___ (grande demeure).",good:"palais",bad:["palet","palée","palaix"]},
    {d:4,ph:"Il y a ___ élèves dans l'école (nombre 100).",good:"cent",bad:["sang","sans","s'en"]},
    {d:3,ph:"L'oiseau bat des ___ (pour voler).",good:"ailes",bad:["elles","aile","ails"]}
  ];
  var FAMILLE = [
    {d:2,ph:"Un petit jardin est un ___.",good:"jardinet",bad:["jardinier","jardinage","jardiner"]},
    {d:3,ph:"Celui qui s'occupe du jardin est le ___.",good:"jardinier",bad:["jardinet","jardinage","jardin"]},
    {d:3,ph:"Une petite maison est une ___.",good:"maisonnette",bad:["maisonnée","maçon","manoir"]},
    {d:4,ph:"Avec le préfixe « dé- », le verbe « faire » devient ___.",good:"défaire",bad:["refaire","parfaire","forfait"]},
    {d:2,ph:"Celui qui joue est un ___.",good:"joueur",bad:["jouet","jouable","jeu"]},
    {d:2,ph:"Un petit chat est un ___.",good:"chaton",bad:["chatte","chatière","chatton"]},
    {d:3,ph:"Celui qui coiffe les cheveux est le ___.",good:"coiffeur",bad:["coiffe","coiffure","coiffé"]},
    {d:4,ph:"L'action de laver s'appelle le ___.",good:"lavage",bad:["laveur","lavable","laver"]},
    {d:3,ph:"Un petit livre est un ___.",good:"livret",bad:["libraire","librairie","livreur"]},
    {d:4,ph:"Celui qui vend du pain est le ___.",good:"boulanger",bad:["boulangerie","boulange","pain"]},
    {d:5,ph:"Avec le préfixe « re- », « lire » devient ___.",good:"relire",bad:["délire","élire","lecteur"]},
    {d:3,ph:"Un arbre couvert de pommes est un ___.",good:"pommier",bad:["pomme","pommade","pommeau"]}
  ];
  var QUOTIDIEN = [
    {d:1,ph:"Pour écrire, j'utilise un ___.",good:"stylo",bad:["balai","verre","oreiller"]},
    {d:1,ph:"Pour voir la nuit, j'allume une ___.",good:"lampe",bad:["assiette","chaise","fourchette"]},
    {d:1,ph:"On dort dans un ___.",good:"lit",bad:["four","évier","placard"]},
    {d:2,ph:"On se lave les mains avec du ___.",good:"savon",bad:["sucre","sable","sel"]},
    {d:2,ph:"Le facteur apporte le ___.",good:"courrier",bad:["dîner","ballon","cartable"]},
    {d:2,ph:"Un bébé chien est un ___.",good:"chiot",bad:["chaton","poulain","agneau"]},
    {d:2,ph:"Un bébé chat est un ___.",good:"chaton",bad:["chiot","veau","poussin"]},
    {d:3,ph:"On range les livres dans une ___.",good:"bibliothèque",bad:["baignoire","casserole","brouette"]},
    {d:1,ph:"On mange la soupe avec une ___.",good:"cuillère",bad:["fourchette","assiette","tasse"]},
    {d:2,ph:"Pour couper le pain, j'utilise un ___.",good:"couteau",bad:["crayon","peigne","marteau"]},
    {d:2,ph:"Quand il pleut, je prends mon ___.",good:"parapluie",bad:["chapeau","ballon","cartable"]},
    {d:3,ph:"Le médecin travaille à l'___.",good:"hôpital",bad:["école","usine","garage"]},
    {d:2,ph:"On achète le pain à la ___.",good:"boulangerie",bad:["pharmacie","librairie","boucherie"]},
    {d:3,ph:"Un bébé de la vache est un ___.",good:"veau",bad:["poulain","agneau","chevreau"]}
  ];
  function genVoc(sub, diff, cat){
    if(sub==="Synonymes"){
      var g=pickByDiff(SYN,diff), word=g.w[0], good=pick(g.w.slice(1));
      var bad=shuffle(SYN_DIST.filter(function(x){return x!==word && g.w.indexOf(x)<0;})).slice(0,3);
      return { cat:cat, sub:sub, phrase:"Un synonyme de « "+word+" » est ___.", hint:"Trouve un mot de sens PROCHE", options:build(good,bad), answer:0 };
    }
    if(sub==="Contraires"){
      var c=pickByDiff(CONTR,diff), fwd=rint(2), w=fwd?c.a:c.b, good=fwd?c.b:c.a;
      var bad=shuffle(["pareil","semblable","identique"].concat(SYN_DIST).filter(function(x){return x!==good&&x!==w;})).slice(0,3);
      return { cat:cat, sub:sub, phrase:"Le contraire de « "+w+" » est ___.", hint:"Trouve le mot de sens OPPOSÉ", options:build(good,bad), answer:0 };
    }
    if(sub==="Homonymes") return fromGood(pickByDiff(HOMO,diff),"Choisis le bon homonyme",cat,sub);
    if(sub==="Familles de mots") return fromGood(pickByDiff(FAMILLE,diff),"Même famille de mots",cat,sub);
    return fromGood(pickByDiff(QUOTIDIEN,diff),"Mot du quotidien",cat,sub);
  }

  /* ======================================================================= */
  /*                            ORTHOGRAPHE                                   */
  /* ======================================================================= */
  var HOMOPH = [
    {d:2,ph:"Elle ___ partie à l'école.",good:"est",bad:["et","es","ait"],note:"est / et"},
    {d:2,ph:"Paul ___ Marie sont amis.",good:"et",bad:["est","ait","ai"],note:"et / est"},
    {d:2,ph:"Il joue ___ la balle.",good:"à",bad:["a","as","ah"],note:"à / a"},
    {d:2,ph:"Il ___ mangé une pomme.",good:"a",bad:["à","as","ah"],note:"a / à"},
    {d:3,ph:"Les oiseaux ___ dans le ciel.",good:"sont",bad:["son","s'ont","sonts"],note:"sont / son"},
    {d:3,ph:"Il a mis ___ manteau.",good:"son",bad:["sont","sons","s'on"],note:"son / sont"},
    {d:2,ph:"Tu ___ mon meilleur ami.",good:"es",bad:["est","et","ai"],note:"es / est"},
    {d:4,ph:"Je ne sais pas ___ il est.",good:"où",bad:["ou","houx","oux"],note:"où / ou"},
    {d:4,ph:"Tu veux du thé ___ du café ?",good:"ou",bad:["où","houx","oût"],note:"ou / où"},
    {d:3,ph:"___ sont mes clés.",good:"Ce",bad:["Se","Ceux","Ces"],note:"ce / se"},
    {d:3,ph:"Il ___ lave les mains.",good:"se",bad:["ce","ceux","ces"],note:"se / ce"},
    {d:4,ph:"C'est ___ livre préféré.",good:"mon",bad:["mont","m'ont","mons"],note:"mon / m'ont"},
    {d:5,ph:"Ils ___ fini leurs devoirs.",good:"ont",bad:["on","onts","hont"],note:"ont / on"},
    {d:5,ph:"___ part en vacances demain.",good:"On",bad:["Ont","Ons","Hont"],note:"on / ont"},
    {d:4,ph:"Je mets ___ chaussures.",good:"mes",bad:["mais","met","mets"],note:"mes / mais"},
    {d:5,ph:"Il pleure ___ il est tombé.",good:"car",bad:["quart","carre","quarts"],note:"car"},
    {d:4,ph:"La poule pond dans ___ nid.",good:"son",bad:["sont","sons","s'ont"],note:"son / sont"},
    {d:3,ph:"Le chat ___ caché sous le lit.",good:"est",bad:["et","es","ait"],note:"est / et"}
  ];
  var ER_E = [
    {d:3,ph:"Je vais ___ une pomme.",good:"manger",bad:["mangé","mangez","mangeais"],note:"infinitif après « vais »"},
    {d:3,ph:"Il a ___ son travail.",good:"terminé",bad:["terminer","terminez","terminés"],note:"participe après « a »"},
    {d:4,ph:"Nous allons ___ prudents.",good:"être",bad:["été","étai","étais"],note:"infinitif après « allons »"},
    {d:4,ph:"Elle a ___ la porte.",good:"fermé",bad:["fermer","fermez","fermée"],note:"participe (avoir, pas d'accord)"},
    {d:3,ph:"Il faut ___ pour réussir.",good:"travailler",bad:["travaillé","travaillez","travaillait"],note:"infinitif après « faut »"},
    {d:3,ph:"J'ai ___ le film hier.",good:"regardé",bad:["regarder","regardez","regardais"],note:"participe après « ai »"},
    {d:4,ph:"Tu dois ___ tes devoirs.",good:"faire",bad:["fait","faites","faisait"],note:"infinitif après « dois »"},
    {d:5,ph:"Le chien vient de ___ un os.",good:"manger",bad:["mangé","mangeait","mangez"],note:"infinitif après « de »"},
    {d:5,ph:"Elle est ___ à l'école.",good:"allée",bad:["aller","allé","allez"],note:"participe (être, accord)"},
    {d:4,ph:"Il commence à ___.",good:"pleurer",bad:["pleuré","pleurez","pleurait"],note:"infinitif après « à »"},
    {d:5,ph:"Les enfants ont ___ toute la journée.",good:"joué",bad:["jouer","jouez","jouaient"],note:"participe après « ont »"}
  ];
  var ACCENTS = [
    {d:3,ph:"J'ai mangé un ___ au chocolat (dessert).",good:"gâteau",bad:["gateau","gâteaux","gatô"],note:"accent circonflexe"},
    {d:3,ph:"L'___ écoute le maître en classe.",good:"élève",bad:["eleve","élêve","èleve"],note:"accents é/è"},
    {d:4,ph:"La ___ est ouverte.",good:"fenêtre",bad:["fenetre","fenètre","fênetre"],note:"accent circonflexe"},
    {d:2,ph:"On mange à la ___.",good:"cantine",bad:["cantîne","cäntine","cantiné"],note:"pas d'accent"},
    {d:2,ph:"Le ___ brille.",good:"soleil",bad:["soléil","sôleil","soleïl"],note:"pas d'accent"},
    {d:4,ph:"Il a de la ___.",good:"fièvre",bad:["fievre","fiêvre","fièvré"],note:"accent grave"},
    {d:3,ph:"Le ___ est un félin rayé.",good:"tigre",bad:["tîgre","tigré","tigrè"],note:"pas d'accent"},
    {d:4,ph:"Il fait ses devoirs le ___.",good:"mercredi",bad:["mércredi","mercrédi","mèrcredi"],note:"un seul accent"},
    {d:5,ph:"La ___ tombe en hiver.",good:"neige",bad:["nêige","néige","nèige"],note:"pas d'accent sur e+i"},
    {d:5,ph:"On boit une ___ chaude.",good:"crème",bad:["créme","crëme","creme"],note:"accent grave"}
  ];
  var PLUR = [
    {d:3,ph:"J'ai vu trois ___.",good:"chevaux",bad:["chevals","chevaus","chevaual"],note:"pluriel de cheval"},
    {d:3,ph:"Les ___ sont fermés.",good:"journaux",bad:["journals","journeaux","journaus"],note:"pluriel en -aux"},
    {d:4,ph:"Regarde ces beaux ___.",good:"bijoux",bad:["bijous","bijoues","bijeaux"],note:"pluriel en -oux"},
    {d:3,ph:"Deux ___ jouent.",good:"hiboux",bad:["hibous","hibouxs","hibeaux"],note:"pluriel en -oux"},
    {d:4,ph:"Les ___ du jardin.",good:"cailloux",bad:["caillous","cailloues","caillaux"],note:"pluriel en -oux"},
    {d:5,ph:"Plusieurs ___ colorés.",good:"vitraux",bad:["vitrails","vitreaux","vitraus"],note:"pluriel en -aux"},
    {d:2,ph:"Trois ___ gris.",good:"animaux",bad:["animals","animeaux","animaus"],note:"pluriel en -aux"},
    {d:3,ph:"Les ___ de la fête.",good:"jeux",bad:["jeus","jeux'","jouets"],note:"pluriel en -eux"},
    {d:4,ph:"Deux ___ sur le toit.",good:"tuyaux",bad:["tuyeaux","tuyaus","tuyauxs"],note:"pluriel en -aux"},
    {d:2,ph:"Les ___ sont dans le pré.",good:"vaches",bad:["vache","vachs","vaces"],note:"pluriel simple en -s"},
    {d:4,ph:"Les ___ picorent des graines.",good:"oiseaux",bad:["oiseaus","oizeaux","oiseauxs"],note:"pluriel en -eaux"},
    {d:5,ph:"Les ___ du château.",good:"travaux",bad:["travails","traveaux","travaus"],note:"pluriel de travail"}
  ];
  var MBP = [
    {d:2,ph:"Une ___ éclaire la nuit.",good:"lampe",bad:["lanpe","lempe","lampé"],note:"m devant p"},
    {d:3,ph:"Le blé pousse dans le ___.",good:"champ",bad:["chanp","cham","chemp"],note:"m devant p"},
    {d:3,ph:"Il joue de la ___.",good:"trompette",bad:["tronpette","trempette","trompète"],note:"m devant p"},
    {d:3,ph:"Le ___ sonne midi.",good:"tambour",bad:["tanbour","tembour","tambourg"],note:"m devant b"},
    {d:4,ph:"Un nombre ___.",good:"important",bad:["inportant","emportant","importent"],note:"m devant p"},
    {d:2,ph:"La ___ est bleue.",good:"jambe",bad:["janbe","jenbe","jambé"],note:"m devant b"},
    {d:3,ph:"Je colle un ___ sur l'enveloppe.",good:"timbre",bad:["tinbre","timbré","timbe"],note:"m devant b"},
    {d:4,ph:"Le fruit ___ par terre.",good:"tombe",bad:["tonbe","tumbe","tombé"],note:"m devant b"},
    {d:4,ph:"Le ___ éteint le feu.",good:"pompier",bad:["ponpier","pompié","pumpier"],note:"m devant p"},
    {d:4,ph:"On change l'___ grillée.",good:"ampoule",bad:["anpoule","empoule","ampoulle"],note:"m devant p"},
    {d:5,ph:"Nous partons à la ___.",good:"campagne",bad:["canpagne","campane","cempagne"],note:"m devant p"},
    {d:4,ph:"Elle range sa ___.",good:"chambre",bad:["chanbre","chambr","chembre"],note:"m devant b"}
  ];
  function genOrt(sub, diff, cat){
    var it, hint;
    if(sub==="Homophones"){ it=pickByDiff(HOMOPH,diff); hint="Homophones ("+it.note+")"; }
    else if(sub==="é ou er"){ it=pickByDiff(ER_E,diff); hint="é (participe) ou er (infinitif) ?"; }
    else if(sub==="Accents"){ it=pickByDiff(ACCENTS,diff); hint="Orthographe : "+it.note; }
    else if(sub==="Pluriels"){ it=pickByDiff(PLUR,diff); hint="Écris le bon pluriel"; }
    else if(sub==="m devant m, b, p"){ it=pickByDiff(MBP,diff); hint="Règle m devant m, b, p"; }
    else { it=pickByDiff(HOMOPH,diff); hint="Orthographe"; }
    return { cat:cat, sub:sub, phrase:it.ph, hint:hint, options:build(it.good, it.bad.slice()), answer:0 };
  }

  /* ======================================================================= */
  /*                            DISPATCH                                      */
  /* ======================================================================= */
  var CATS=["conjugaison","grammaire","vocabulaire","orthographe"];
  var SUBS_BY_CAT={
    conjugaison:CONJ_SUBS,
    grammaire:["Nature des mots","Déterminants","Pronoms","Prépositions","Accords","Types de phrases"],
    vocabulaire:["Synonymes","Contraires","Homonymes","Familles de mots","Mots du quotidien"],
    orthographe:["Homophones","é ou er","Accents","Pluriels","m devant m, b, p"]
  };
  function generate(cat, sub, diff){
    diff = diff||3;
    var c = (!cat || cat==="tout") ? pick(CATS) : cat;
    var subs = SUBS_BY_CAT[c] || [];
    var s = (!sub || sub==="Tout") ? pick(subs) : sub;
    if(subs.indexOf(s)<0) s = pick(subs);
    var q;
    if(c==="conjugaison") q=genConj(s,diff,c);
    else if(c==="grammaire") q=genGram(s,diff,c);
    else if(c==="vocabulaire") q=genVoc(s,diff,c);
    else q=genOrt(s,diff,c);
    // filet de sécurité : toujours 4 options distinctes
    if(!q || !q.options || q.options.length<4){
      q=q||{cat:c,sub:s,phrase:"2 + 2 = ___.",hint:"Calcul",options:[],answer:0};
      var fill=["4","3","5","22"]; var seen={}; var out=[];
      (q.options||[]).concat(fill).forEach(function(o){ if(o!=null && !seen[norm(o)]){seen[norm(o)]=1; out.push(String(o));} });
      q.options=out.slice(0,4); q.answer=0;
    }
    return q;
  }

  global.Questions = { generate:generate, SUBS_BY_CAT:SUBS_BY_CAT, CATS:CATS };
  if (typeof module !== "undefined" && module.exports) { module.exports = global.Questions; }
})(typeof window !== "undefined" ? window : this);
