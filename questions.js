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
    avoir:{ pres:["ai","as","a","avons","avez","ont"], imp:["avais","avais","avait","avions","aviez","avaient"],
      fut:["aurai","auras","aura","aurons","aurez","auront"], cond:["aurais","aurais","aurait","aurions","auriez","auraient"],
      subj:["aie","aies","ait","ayons","ayez","aient"] },
    etre: { pres:["suis","es","est","sommes","êtes","sont"], imp:["étais","étais","était","étions","étiez","étaient"],
      fut:["serai","seras","sera","serons","serez","seront"], cond:["serais","serais","serait","serions","seriez","seraient"],
      subj:["sois","sois","soit","soyons","soyez","soient"] }
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
    futur:"au futur simple", cond:"au conditionnel présent", subj:"au subjonctif présent", imper:"à l'impératif",
    pqp:"au plus-que-parfait", condp:"au conditionnel passé", subjp:"au subjonctif passé", futa:"au futur antérieur" };
  var SUB_TO_TENSE = { "Présent":"present","Passé composé":"passe","Futur":"futur","Imparfait":"imparfait",
    "Impératif":"imper","Subjonctif":"subj","Conditionnel présent":"cond",
    "Plus-que-parfait":"pqp","Conditionnel passé":"condp","Subjonctif passé":"subjp","Futur antérieur":"futa" };
  var CONJ_SUBS = Object.keys(SUB_TO_TENSE);
  // Temps COMPOSÉS (auxiliaire conjugué + participe passé) : générés à partir des
  // mêmes tables → toujours corrects, avec accord du participe pour les verbes en être.
  var COMPOSED = { passe:"pres", pqp:"imp", condp:"cond", futa:"fut", subjp:"subj" };
  // Amorces propres à chaque temps composé (phrases complètes et naturelles).
  var HEAD_PQP  = ["La veille,","Ce jour-là,","Quelques heures plus tôt,","Avant notre arrivée,","La semaine d'avant,","Peu avant,"];
  var HEAD_CONDP= ["Avec un peu de chance,","À ta place,","Sans cette erreur,","Dans d'autres circonstances,","Autrement,","Avec plus de temps,"];
  var HEAD_FUTA = ["Demain à midi,","D'ici ce soir,","Dans une heure,","Bientôt,","Avant la fin du mois,","D'ici là,"];
  var TRIG_SUBJP= ["Il est possible que","Je doute que","Il se peut que","J'ai peur que","Je ne crois pas que","Il est dommage que","Je regrette que"];

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

  // Sujets « nommés » (3e personne) : prénoms et groupes nominaux. Ils multiplient
  // la variété des phrases tout en restant naturels avec N'IMPORTE QUEL verbe
  // (mêmes contraintes que « il/elle/ils/elles »). Les noms communs sont écrits en
  // minuscule (« le chat ») : cap() met la majuscule seulement en début de phrase ;
  // les prénoms gardent leur majuscule partout (« Hier, Paul a mangé »). g/n servent
  // à l'accord du participe (passé composé avec « être »).
  var NAMED_S = [ // 3e personne du SINGULIER (pi = 2)
    {d:"Paul",pi:2,g:"m",n:"s"},{d:"Léo",pi:2,g:"m",n:"s"},{d:"Lucas",pi:2,g:"m",n:"s"},
    {d:"Théo",pi:2,g:"m",n:"s"},{d:"Hugo",pi:2,g:"m",n:"s"},{d:"Nathan",pi:2,g:"m",n:"s"},
    {d:"Léa",pi:2,g:"f",n:"s"},{d:"Emma",pi:2,g:"f",n:"s"},{d:"Chloé",pi:2,g:"f",n:"s"},
    {d:"Marie",pi:2,g:"f",n:"s"},{d:"Jade",pi:2,g:"f",n:"s"},{d:"Alice",pi:2,g:"f",n:"s"},
    {d:"le maître",pi:2,g:"m",n:"s"},{d:"la maîtresse",pi:2,g:"f",n:"s"},
    {d:"mon frère",pi:2,g:"m",n:"s"},{d:"ma sœur",pi:2,g:"f",n:"s"},
    {d:"le voisin",pi:2,g:"m",n:"s"},{d:"le chat",pi:2,g:"m",n:"s"},{d:"le chien",pi:2,g:"m",n:"s"}
  ];
  var NAMED_P = [ // 3e personne du PLURIEL (pi = 5)
    {d:"les enfants",pi:5,g:"m",n:"p"},{d:"les élèves",pi:5,g:"m",n:"p"},
    {d:"Paul et Léa",pi:5,g:"m",n:"p"},{d:"mes amis",pi:5,g:"m",n:"p"},
    {d:"les joueurs",pi:5,g:"m",n:"p"},{d:"mes parents",pi:5,g:"m",n:"p"},
    {d:"les filles",pi:5,g:"f",n:"p"},{d:"Emma et Jade",pi:5,g:"f",n:"p"},
    {d:"les oiseaux",pi:5,g:"m",n:"p"},{d:"les voisins",pi:5,g:"m",n:"p"}
  ];
  // Choisit un sujet : pronom classique OU sujet nommé (≈ 45 % du temps, un peu
  // plus en montée de difficulté). o.etre → uniquement des sujets à genre défini.
  function pickSubject(diff, o){
    o=o||{};
    var pron = o.etre ? ["il","elle","ils","elles"] : subjectsFor(diff);
    if(o.tense==="subj") pron = pron.filter(function(k){ return k!=="je"; });
    var named = NAMED_S.slice();
    if(diff>=2) named = named.concat(NAMED_P);
    var pNamed = Math.min(60, 35 + diff*5);   // proba (%) d'un sujet nommé
    if(named.length && rint(100) < pNamed) return pick(named);
    return SUBJ[pick(pron)];
  }
  // Partition STRICTE des verbes par difficulté (1..6). Chaque niveau reçoit une
  // part de CHAQUE groupe (g1/g2/g3), triée par difficulté → il reste valide à
  // tous les temps (le subjonctif exige des verbes hors 1er groupe). Comme la
  // forme conjuguée figure dans la phrase et que les ensembles sont disjoints,
  // les questions d'un niveau n'apparaissent jamais à un autre niveau.
  (function assignVD(){
    function blocks(list){
      list.sort(function(a,b){ return verbDiff(a)-verbDiff(b); });
      for(var i=0;i<list.length;i++){ list[i].vd=Math.min(6, Math.floor(i*6/list.length)+1); }
    }
    blocks(VERBS.filter(function(v){ return v.g===1; }));
    blocks(VERBS.filter(function(v){ return v.g===2; }));
    blocks(VERBS.filter(function(v){ return v.g===3; }));
  })();
  function verbsFor(diff, tense){
    function valid(v){
      if(tense==="subj" && (v.g===1 || v.noSubj)) return false; // subj = indicatif au 1er groupe → exclu
      if(tense==="imper" && v.noImper) return false;
      return true;
    }
    var pool=VERBS.filter(function(v){ return v.vd===diff && valid(v); });
    if(pool.length>=4) return pool;
    // filet de sécurité (ne devrait pas se déclencher) : élargit d'un cran
    for(var w=1;w<=5;w++){ var band=VERBS.filter(function(v){ return Math.abs(v.vd-diff)<=w && valid(v); }); if(band.length>=4) return band; }
    return VERBS.filter(valid);
  }

  function genConj(sub, diff, cat){
    var tense = SUB_TO_TENSE[sub] || pick(["present","passe","imparfait","futur","cond","subj","imper"]);
    if(!SUB_TO_TENSE[sub]){ // mode « Tout » : tense choisi au hasard, on pondère un peu par difficulté
      var poolT=["present","imparfait","futur","passe"];
      if(diff>=3) poolT=poolT.concat(["passe","cond","imper"]);
      if(diff>=4) poolT=poolT.concat(["subj","cond","passe"]);
      if(diff>=5) poolT=poolT.concat(["pqp","condp","futa","subjp"]);   // temps composés (C1)
      tense=pick(poolT);
    }
    var verbs=verbsFor(diff,tense); if(!verbs.length) verbs=VERBS;
    var v=pick(verbs);
    var comp = v.comp ? pick(v.comp) : "";

    // Temps composés (plus-que-parfait, conditionnel/subjonctif passé, futur antérieur)
    if(COMPOSED[tense] && tense!=="passe"){
      return genComposed(v, diff, cat, sub, tense, comp, "Conjugue « "+v.inf+" » "+TENSE_LABEL[tense]);
    }
    var hint = "Conjugue « "+v.inf+" » "+TENSE_LABEL[tense];

    if(tense==="passe") return genPasse(v,diff,cat,sub,comp,hint);
    if(tense==="imper") return genImper(v,diff,cat,sub,comp);

    // temps simples : present / imparfait / futur / cond / subj
    var S = pickSubject(diff, {tense:tense});   // pronom OU sujet nommé (variété)
    var pi = S.pi;
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
      // marqueur de temps facultatif (~70 %) : sinon la phrase commence par le sujet
      var tm=(TIME[tense] && rint(100)<70) ? pick(TIME[tense]) : "";
      var body = subjBlank(S,correct)+(comp?" "+comp:"")+".";
      var sep = /[,]$/.test(tm) ? " " : ", ";   // certains marqueurs finissent déjà par une virgule
      phrase = tm ? (tm+sep+body) : cap(body);
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
    // sujet pronom OU nommé ; pour les verbes en « être », genre/nombre définis
    // (indispensable à l'accord du participe) → assuré par pickSubject(etre).
    var S = pickSubject(diff, {etre:v.etre}), pi=S.pi;
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

  // Temps composés « avancés » (C1) : plus-que-parfait, conditionnel passé,
  // futur antérieur, subjonctif passé. Forme = auxiliaire (avoir/être) au temps
  // voulu + participe passé (accordé avec le sujet pour les verbes en être).
  // Les distracteurs sont d'AUTRES temps composés à la même personne + erreurs
  // d'auxiliaire / d'accord → 100 % « du même registre ».
  function genComposed(v, diff, cat, sub, tense, comp, hint){
    var ak = COMPOSED[tense];                       // clé de temps de l'auxiliaire
    var S = pickSubject(diff, {etre:v.etre, tense:(tense==="subjp"?"subj":null)}), pi=S.pi;
    var aux = v.etre ? AUX.etre : AUX.avoir;
    var pp = v.etre ? agree(v.pp,S) : v.pp;
    var correct = aux[ak][pi]+" "+pp;
    var pool=[];
    // autres temps composés (même personne, même auxiliaire, participe correct)
    ["pres","imp","fut","cond","subj"].forEach(function(x){ if(x!==ak) pool.push(aux[x][pi]+" "+pp); });
    if(v.etre){
      // mauvais auxiliaire (avoir au lieu d'être) + défauts d'accord classiques
      pool.push(AUX.avoir[ak][pi]+" "+pp);
      pool.push(aux[ak][pi]+" "+v.pp);                                  // pas d'accord
      pool.push(aux[ak][pi]+" "+agree(v.pp, S.g==="f"?{n:S.n,g:"m"}:{n:S.n,g:"f"})); // accord inversé
    } else {
      pool.push(AUX.etre[ak][pi]+" "+v.pp);                             // mauvais auxiliaire (être)
      pool.push(aux[ak][pi]+" "+v.pp+(S.n==="p"?"s":"e"));              // faux accord avec avoir
      if(v.pp!==v.inf) pool.push(aux[ak][pi]+" "+v.inf);               // participe = infinitif (é/er)
    }
    var phrase;
    if(tense==="subjp"){
      phrase = subjHead(pick(TRIG_SUBJP), S.d)+" ___"+(comp?" "+comp:"")+".";
    } else {
      var head = tense==="pqp" ? pick(HEAD_PQP) : (tense==="condp" ? pick(HEAD_CONDP) : pick(HEAD_FUTA));
      phrase = head+" "+subjBlank(S,correct)+(comp?" "+comp:"")+".";
    }
    phrase=cap(phrase);
    return { cat:cat, sub:sub, tense:tense, phrase:phrase, hint:hint, options:build(correct,pool), answer:0 };
  }

  // Choisit un item d'une banque en visant la difficulté. On élargit la bande
  // autour de la cible jusqu'à disposer d'un CHOIX SUFFISANT (≥ 7 items) : cela
  // évite qu'aux difficultés extrêmes (très facile / extrême), où peu d'items ont
  // exactement ce niveau, on ne tourne qu'entre 2-3 questions. La difficulté reste
  // respectée (items voisins), mais la variété est bien plus grande.
  function pickByDiff(list, target){
    target=target||3;
    var want=Math.min(7, list.length);
    for(var w=0;w<=5;w++){
      var band=list.filter(function(it){ return Math.abs((it.d||3)-target)<=w; });
      if(band.length>=want) return pick(band);
    }
    return pick(list);
  }
  function fromGood(item, hint, cat, sub){
    return { cat:cat, sub:sub, phrase:item.ph, hint:hint, note:item.note||item.rule||"",
      options:build(item.good, item.bad.slice()), answer:0 };
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
    {w:"car",n:"conjonction",d:5,ph:"Dans « il pleure car il est triste », « car » est une ___."},
    {w:"maison",n:"nom",d:1,ph:"« maison » est un ___."},
    {w:"soleil",n:"nom",d:1,ph:"« soleil » est un ___."},
    {w:"chanter",n:"verbe",d:1,ph:"« chanter » est un ___."},
    {w:"dormir",n:"verbe",d:2,ph:"« dormir » est un ___."},
    {w:"petit",n:"adjectif",d:2,ph:"Dans « un petit chien », « petit » est un ___."},
    {w:"bleu",n:"adjectif",d:2,ph:"Dans « le ciel bleu », « bleu » est un ___."},
    {w:"bien",n:"adverbe",d:3,ph:"Dans « il travaille bien », « bien » est un ___."},
    {w:"hier",n:"adverbe",d:4,ph:"Dans « il est parti hier », « hier » est un ___."},
    {w:"une",n:"déterminant",d:2,ph:"Dans « une pomme », « une » est un ___."},
    {w:"tu",n:"pronom",d:2,ph:"Dans « tu manges », « tu » est un ___."},
    {w:"pour",n:"préposition",d:4,ph:"Dans « un cadeau pour toi », « pour » est une ___."},
    {w:"sur",n:"préposition",d:3,ph:"Dans « sur le mur », « sur » est une ___."},
    {w:"ou",n:"conjonction",d:4,ph:"Dans « du thé ou du café », « ou » est une ___."},
    {w:"donc",n:"conjonction",d:5,ph:"Dans « je pense donc je suis », « donc » est une ___."}
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
    {d:3,ph:"Range ___ affaires.",good:"tes",bad:["ta","ton","te"]},
    {d:1,ph:"___ soleil brille aujourd'hui.",good:"Le",bad:["La","Les","L'"]},
    {d:2,ph:"J'ai mangé ___ pomme ce matin.",good:"une",bad:["un","des","de"]},
    {d:2,ph:"Nous avons ___ jouets neufs.",good:"des",bad:["du","de la","le"]},
    {d:3,ph:"___ histoire fait peur.",good:"Cette",bad:["Ce","Cet","Ces"]},
    {d:3,ph:"C'est ___ maison, pas la tienne.",good:"ma",bad:["mon","mes","me"]},
    {d:2,ph:"___ hibou vit dans l'arbre.",good:"Un",bad:["Une","Des","Le"]},
    {d:4,ph:"Elle ne mange jamais ___ viande.",good:"de",bad:["de la","du","des"]},
    {d:4,ph:"Il reste encore ___ soupe.",good:"de la",bad:["du","de l'","des"]},
    {d:3,ph:"___ hommes travaillent dans le champ.",good:"Les",bad:["Le","Des","L'"]},
    {d:5,ph:"Je n'ai plus ___ idées.",good:"d'",bad:["des","de","les"]}
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
    {d:4,ph:"Voici le chemin par ___ il faut passer.",good:"lequel",bad:["laquelle","lesquels","dont"]},
    {d:2,ph:"Tu as fini ? ___ ai presque terminé.",good:"J'",bad:["Je","Tu","Il"]},
    {d:3,ph:"Ce sont mes parents ___ m'ont appelé.",good:"qui",bad:["que","dont","où"]},
    {d:3,ph:"Regarde ce dessin : c'est moi ___ l'ai fait.",good:"qui",bad:["que","dont","qu'"]},
    {d:4,ph:"L'histoire ___ tu m'as racontée était drôle.",good:"que",bad:["qui","dont","où"]},
    {d:3,ph:"Les élèves sont prêts ; ___ attendent la maîtresse.",good:"ils",bad:["elles","eux","on"]},
    {d:4,ph:"Mes amis me manquent, je pense souvent à ___.",good:"eux",bad:["leur","les","ils"]},
    {d:5,ph:"Cette voiture est à eux, c'est la ___.",good:"leur",bad:["leurs","nôtre","sienne"]},
    {d:3,ph:"Tu vois la tour ? Monte ___ !",good:"dessus",bad:["dessous","dedans","dehors"]}
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
    {d:3,ph:"Pose le vase ___ la table.",good:"sur",bad:["sous","dans","à"]},
    {d:2,ph:"Le chien dort ___ le lit.",good:"sous",bad:["sur","à","en"]},
    {d:3,ph:"Je reviens ___ deux minutes.",good:"dans",bad:["en","à","depuis"]},
    {d:4,ph:"J'ai fait ce dessin ___ dix minutes.",good:"en",bad:["dans","à","depuis"]},
    {d:3,ph:"Nous partons ___ Italie cet été.",good:"en",bad:["au","à","aux"]},
    {d:4,ph:"Il vient ___ Canada.",good:"du",bad:["de","au","des"]},
    {d:2,ph:"Le cadeau est ___ ma sœur.",good:"pour",bad:["par","de","à"]},
    {d:3,ph:"Le livre est posé ___ l'étagère.",good:"sur",bad:["sous","dans","de"]},
    {d:4,ph:"Elle parle ___ ses vacances.",good:"de",bad:["à","en","par"]},
    {d:3,ph:"Il marche ___ la maison à l'école.",good:"de",bad:["à","en","dans"]},
    {d:5,ph:"Ce train part ___ Lyon à Marseille.",good:"de",bad:["à","en","depuis"]}
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
    {d:5,ph:"Une vieille dame et un vieux monsieur sont ___.",good:"âgés",bad:["âgé","âgées","âgée"]},
    {d:2,ph:"Une voiture ___ passe dans la rue.",good:"rouge",bad:["rouges","rouje","rougé"]},
    {d:3,ph:"Les chats sont ___ sur le canapé.",good:"assis",bad:["assit","assises","assise"]},
    {d:3,ph:"Ma cousine est ___ de son cadeau.",good:"contente",bad:["content","contents","contentes"]},
    {d:4,ph:"Les élèves sont ___ en classe.",good:"attentifs",bad:["attentif","attentive","attentives"]},
    {d:2,ph:"Des chiens ___ courent dans le pré.",good:"blancs",bad:["blanc","blanche","blanches"]},
    {d:4,ph:"Cette tarte est ___.",good:"délicieuse",bad:["délicieux","délicieuses","délicieu"]},
    {d:5,ph:"Les fenêtres restent ___ toute la nuit.",good:"ouvertes",bad:["ouvert","ouverts","ouverte"]},
    {d:3,ph:"Ces exercices sont ___.",good:"faciles",bad:["facile","facil","faciless"]},
    {d:4,ph:"Mes grands-mères sont ___.",good:"gentilles",bad:["gentil","gentils","gentille"]}
  ];
  var TYPES = [
    {d:2,ph:"« Quelle belle journée ! » est une phrase ___.",good:"exclamative",bad:["interrogative","déclarative","impérative"]},
    {d:2,ph:"« Où vas-tu ? » est une phrase ___.",good:"interrogative",bad:["exclamative","déclarative","impérative"]},
    {d:3,ph:"« Ferme la porte. » est une phrase ___.",good:"impérative",bad:["interrogative","exclamative","déclarative"]},
    {d:2,ph:"« Le chat dort. » est une phrase ___.",good:"déclarative",bad:["interrogative","exclamative","impérative"]},
    {d:4,ph:"« Ne cours pas. » est une phrase ___.",good:"négative",bad:["affirmative","interrogative","exclamative"]},
    {d:3,ph:"« Range ta chambre. » est une phrase ___.",good:"impérative",bad:["déclarative","interrogative","exclamative"]},
    {d:4,ph:"« Comme il fait beau ! » est une phrase ___.",good:"exclamative",bad:["déclarative","interrogative","impérative"]},
    {d:3,ph:"« Est-ce que tu viens ? » est une phrase ___.",good:"interrogative",bad:["exclamative","impérative","déclarative"]},
    {d:2,ph:"« J'aime les vacances. » est une phrase ___.",good:"déclarative",bad:["interrogative","exclamative","impérative"]},
    {d:4,ph:"« Je ne veux pas de dessert. » est une phrase ___.",good:"négative",bad:["affirmative","interrogative","impérative"]},
    {d:3,ph:"« Viens ici tout de suite ! » est une phrase ___.",good:"impérative",bad:["déclarative","interrogative","exclamative"]},
    {d:5,ph:"« N'est-il pas trop tard ? » est une phrase ___.",good:"interrogative",bad:["déclarative","exclamative","impérative"]},
    {d:2,ph:"« Quel beau match ! » est une phrase ___.",good:"exclamative",bad:["déclarative","interrogative","impérative"]},
    {d:4,ph:"« Elle chante bien. » est une phrase ___.",good:"affirmative",bad:["négative","interrogative","impérative"]}
  ];
  /* ---- Grammaire de niveau avancé (vers le C1) ---- */
  var PP_ACC = [ // accord du participe passé (être / avoir / COD antéposé / pronominaux)
    {d:3,ph:"Elle est ___ à la maison.",good:"restée",bad:["resté","restés","restées"],note:"Avec « être », le participe s'accorde avec le sujet (ici féminin singulier)."},
    {d:4,ph:"Les filles sont ___ très tôt.",good:"parties",bad:["parti","partis","partie"],note:"Avec « être » : accord avec le sujet (féminin pluriel)."},
    {d:3,ph:"Mon frère est ___ hier soir.",good:"arrivé",bad:["arrivée","arrivés","arriver"],note:"Avec « être » : accord avec le sujet (masculin singulier)."},
    {d:4,ph:"Nous sommes ___ au cinéma.",good:"allés",bad:["allé","allée","allées"],note:"Avec « être » : accord avec le sujet (nous, masculin pluriel)."},
    {d:5,ph:"La lettre que j'ai ___ est partie.",good:"écrite",bad:["écrit","écrits","écrites"],note:"Avec « avoir », accord avec le COD placé AVANT le verbe (la lettre = f.s.)."},
    {d:5,ph:"Les fleurs que tu as ___ sont belles.",good:"cueillies",bad:["cueilli","cueillie","cueillis"],note:"« Avoir » + COD antéposé (les fleurs = f.p.) → accord."},
    {d:5,ph:"Les gâteaux que nous avons ___ étaient bons.",good:"mangés",bad:["mangé","mangée","mangées"],note:"« Avoir » + COD antéposé (les gâteaux = m.p.) → accord."},
    {d:4,ph:"Elles ont ___ toute la journée.",good:"couru",bad:["courue","courus","courues"],note:"Avec « avoir » sans COD antéposé, le participe reste invariable."},
    {d:4,ph:"Ils ont ___ leurs devoirs.",good:"fini",bad:["finis","finie","finies"],note:"« Avoir », COD placé APRÈS (leurs devoirs) → pas d'accord."},
    {d:5,ph:"Les livres qu'il a ___ sont rares.",good:"lus",bad:["lu","lue","lues"],note:"« Avoir » + COD antéposé (les livres = m.p.) → accord."},
    {d:6,ph:"Les mains, elle se les est ___.",good:"lavées",bad:["lavé","lavés","lavée"],note:"Verbe pronominal : accord avec le COD placé avant (les mains = f.p.)."},
    {d:6,ph:"Combien de fautes as-tu ___ ?",good:"faites",bad:["fait","faits","faite"],note:"« Avoir » + COD antéposé (combien de fautes = f.p.) → accord."},
    {d:6,ph:"La décision qu'ils ont ___ est sage.",good:"prise",bad:["pris","prises","prisé"],note:"« Avoir » + COD antéposé (la décision = f.s.) → accord."},
    {d:3,ph:"Elles sont ___ de bonne heure.",good:"revenues",bad:["revenu","revenue","revenus"],note:"Avec « être » : accord avec le sujet (féminin pluriel)."},
    {d:4,ph:"La pomme est ___ de l'arbre.",good:"tombée",bad:["tombé","tombés","tombées"],note:"Avec « être » : accord avec le sujet (féminin singulier)."},
    {d:5,ph:"Les chansons que j'ai ___ me plaisent.",good:"entendues",bad:["entendu","entendue","entendus"],note:"« Avoir » + COD antéposé (les chansons = f.p.) → accord."}
  ];
  var CONNECT = [ // connecteurs logiques
    {d:4,ph:"Il pleuvait ; ___, nous sommes sortis.",good:"cependant",bad:["donc","car","ainsi"],note:"« cependant » exprime l'opposition (≈ pourtant, néanmoins)."},
    {d:4,ph:"Il a beaucoup travaillé ; ___, il a réussi.",good:"par conséquent",bad:["cependant","en revanche","au contraire"],note:"« par conséquent » exprime la conséquence."},
    {d:5,ph:"J'aime le thé ; ___, je déteste le café.",good:"en revanche",bad:["donc","par conséquent","ainsi"],note:"« en revanche » oppose deux faits."},
    {d:5,ph:"Il est parti tôt ___ éviter les embouteillages.",good:"afin d'",bad:["parce qu'","bien qu'","tandis qu'"],note:"« afin de » exprime le but."},
    {d:4,ph:"Nous resterons ___ il pleut.",good:"parce qu'",bad:["afin qu'","pour qu'","bien qu'"],note:"« parce que » exprime la cause."},
    {d:6,ph:"___ il soit riche, il vit simplement.",good:"Bien qu'",bad:["Parce qu'","Puisqu'","Ainsi qu'"],note:"« bien que » (+ subjonctif) exprime la concession."},
    {d:5,ph:"Prends un manteau, ___ il fait froid.",good:"car",bad:["afin que","pour que","bien que"],note:"« car » introduit une explication (cause)."},
    {d:4,ph:"D'abord on mélange ; ___, on fait cuire.",good:"ensuite",bad:["car","donc","pourtant"],note:"« ensuite » marque la succession dans le temps."},
    {d:6,ph:"Il pleut, ___ nous partons quand même.",good:"mais",bad:["donc","car","puisque"],note:"« mais » marque l'opposition."},
    {d:5,ph:"Tu peux venir ___ tu préviennes à l'avance.",good:"à condition que",bad:["bien que","avant que","sans que"],note:"« à condition que » (+ subjonctif) exprime la condition."},
    {d:5,ph:"___ nous manquons de temps, finissons vite.",good:"Puisque",bad:["Afin que","Pour que","Bien que"],note:"« puisque » exprime une cause évidente, déjà connue."},
    {d:6,ph:"Il travaille ___ que son frère se repose.",good:"tandis",bad:["afin","bien","pour"],note:"« tandis que » marque l'opposition ou la simultanéité."},
    {d:4,ph:"___, le projet est une réussite.",good:"En somme",bad:["En effet","D'ailleurs","Or"],note:"« en somme » introduit une conclusion, une synthèse."},
    {d:5,ph:"Il n'a pas révisé ; ___, il a échoué.",good:"c'est pourquoi",bad:["pourtant","néanmoins","or"],note:"« c'est pourquoi » exprime la conséquence."}
  ];
  var PASSIVE = [ // voix passive : être + participe accordé avec le sujet
    {d:4,ph:"La souris est ___ par le chat.",good:"mangée",bad:["mange","mangé","manger"],note:"Voix passive : « être » + participe accordé avec le sujet (la souris = f.s.)."},
    {d:5,ph:"Les voleurs ont été ___ par la police.",good:"arrêtés",bad:["arrêté","arrêtée","arrêter"],note:"Passif au passé composé : « ont été » + participe accordé (m.p.)."},
    {d:4,ph:"La maison a été ___ en un an.",good:"construite",bad:["construit","construits","construire"],note:"Passif : accord du participe avec le sujet (f.s.)."},
    {d:5,ph:"Ce roman sera ___ par des millions de gens.",good:"lu",bad:["lue","lus","lire"],note:"Passif au futur : « sera » + participe (m.s.)."},
    {d:6,ph:"Les décisions seront ___ demain.",good:"prises",bad:["pris","prise","prendre"],note:"Passif au futur : accord (les décisions = f.p.)."},
    {d:4,ph:"Le gâteau est ___ par la boulangère.",good:"préparé",bad:["préparée","préparés","préparer"],note:"Passif : accord avec le sujet (le gâteau = m.s.)."},
    {d:5,ph:"La fenêtre a été ___ par le vent.",good:"cassée",bad:["cassé","cassés","casser"],note:"Passif passé composé : accord (f.s.)."},
    {d:5,ph:"Les élèves sont ___ par le directeur.",good:"félicités",bad:["félicité","félicitées","féliciter"],note:"Passif : accord (m.p.)."},
    {d:6,ph:"Cette loi a été ___ par le Parlement.",good:"votée",bad:["voté","votés","voter"],note:"Passif : accord (la loi = f.s.)."},
    {d:4,ph:"Les jardins sont ___ chaque matin.",good:"arrosés",bad:["arrosé","arrosée","arroser"],note:"Passif : accord (m.p.)."},
    {d:5,ph:"La vérité sera ___ un jour.",good:"connue",bad:["connu","connus","connaître"],note:"Passif au futur : accord (f.s.)."},
    {d:6,ph:"Ces tableaux ont été ___ au XVIIᵉ siècle.",good:"peints",bad:["peint","peinte","peindre"],note:"Passif : accord (m.p.)."},
    {d:4,ph:"La leçon est ___ par le professeur.",good:"expliquée",bad:["expliqué","expliqués","expliquer"],note:"Passif : accord (f.s.)."},
    {d:5,ph:"Les fruits sont ___ au marché.",good:"vendus",bad:["vendu","vendue","vendre"],note:"Passif : accord (m.p.)."}
  ];
  /* --- Déterminants : générateur PARTITIONNÉ par difficulté ---
     Chaque nom appartient à UNE seule difficulté ; comme la phrase contient le
     nom, les questions d'un niveau ne peuvent pas apparaître dans un autre.
     12 noms × 5 tournures = 60 phrases uniques par difficulté (≥ 50), disjointes. */
  var NOUNS_DET=[
    // d1 (très facile)
    {w:"chat",g:"m",d:1},{w:"table",g:"f",d:1},{w:"chien",g:"m",d:1},{w:"pomme",g:"f",d:1},
    {w:"livre",g:"m",d:1},{w:"balle",g:"f",d:1},{w:"lit",g:"m",d:1},{w:"porte",g:"f",d:1},
    {w:"vélo",g:"m",d:1},{w:"fleur",g:"f",d:1},{w:"sac",g:"m",d:1},{w:"souris",g:"f",d:1},
    // d2 (facile)
    {w:"maison",g:"f",d:2},{w:"jardin",g:"m",d:2},{w:"oiseau",g:"m",v:1,d:2},{w:"voiture",g:"f",d:2},
    {w:"gâteau",g:"m",d:2},{w:"chaise",g:"f",d:2},{w:"ballon",g:"m",d:2},{w:"tasse",g:"f",d:2},
    {w:"crayon",g:"m",d:2},{w:"bateau",g:"m",d:2},{w:"robe",g:"f",d:2},{w:"cartable",g:"m",d:2},
    // d3 (normal)
    {w:"montagne",g:"f",d:3},{w:"village",g:"m",d:3},{w:"rivière",g:"f",d:3},{w:"château",g:"m",d:3},
    {w:"forêt",g:"f",d:3},{w:"tigre",g:"m",d:3},{w:"fenêtre",g:"f",d:3},{w:"bureau",g:"m",d:3},
    {w:"nuage",g:"m",d:3},{w:"épée",g:"f",v:1,d:3},{w:"avion",g:"m",v:1,d:3},{w:"orage",g:"m",v:1,d:3},
    // d4 (difficile)
    {w:"horloge",g:"f",v:1,d:4},{w:"éléphant",g:"m",v:1,d:4},{w:"ordinateur",g:"m",v:1,d:4},{w:"aventure",g:"f",v:1,d:4},
    {w:"hôpital",g:"m",v:1,d:4},{w:"escalier",g:"m",v:1,d:4},{w:"araignée",g:"f",v:1,d:4},{w:"image",g:"f",v:1,d:4},
    {w:"étoile",g:"f",v:1,d:4},{w:"histoire",g:"f",v:1,d:4},{w:"arbre",g:"m",v:1,d:4},{w:"ourson",g:"m",v:1,d:4},
    // d5 (très difficile)
    {w:"armoire",g:"f",v:1,d:5},{w:"échelle",g:"f",v:1,d:5},{w:"éclair",g:"m",v:1,d:5},{w:"ampoule",g:"f",v:1,d:5},
    {w:"oreille",g:"f",v:1,d:5},{w:"automne",g:"m",v:1,d:5},{w:"aiguille",g:"f",v:1,d:5},{w:"encre",g:"f",v:1,d:5},
    {w:"orchestre",g:"m",v:1,d:5},{w:"univers",g:"m",v:1,d:5},{w:"ancre",g:"f",v:1,d:5},{w:"ustensile",g:"m",v:1,d:5},
    // d6 (extrême)
    {w:"hippopotame",g:"m",v:1,d:6},{w:"encyclopédie",g:"f",v:1,d:6},{w:"interrupteur",g:"m",v:1,d:6},{w:"orchidée",g:"f",v:1,d:6},
    {w:"obstacle",g:"m",v:1,d:6},{w:"aquarium",g:"m",v:1,d:6},{w:"itinéraire",g:"m",v:1,d:6},{w:"hémisphère",g:"m",v:1,d:6},
    {w:"échafaudage",g:"m",v:1,d:6},{w:"ambassade",g:"f",v:1,d:6},{w:"engrenage",g:"m",v:1,d:6},{w:"hélicoptère",g:"m",v:1,d:6}
  ];
  var DET_FRAMES=[
    {ph:"___ {N} est ici.",k:"def"},
    {ph:"J'ai vu ___ {N}.",k:"indef"},
    {ph:"Regarde ___ {N} !",k:"dem"},
    {ph:"C'est ___ {N}.",k:"poss"},
    {ph:"Je cherche ___ {N}.",k:"def"}
  ];
  function detOptions(kind,n){
    var good, pool;
    if(kind==="def"){ good=n.v?"l'":(n.g==="m"?"le":"la"); pool=["le","la","l'","les"]; }
    else if(kind==="indef"){ good=n.g==="m"?"un":"une"; pool=["un","une","des","de"]; }
    else if(kind==="dem"){ good=n.v?(n.g==="m"?"cet":"cette"):(n.g==="m"?"ce":"cette"); pool=["ce","cet","cette","ces"]; }
    else { good=n.v?"mon":(n.g==="m"?"mon":"ma"); pool=["mon","ma","mes","ton"]; }
    return { good:good, bad:pool.filter(function(x){return x!==good;}) };
  }
  function genDeterminants(diff,cat,sub){
    var pool=NOUNS_DET.filter(function(n){return n.d===diff;});   // STRICT → niveaux disjoints
    if(pool.length<3){ for(var w=1;w<=5 && pool.length<3;w++) pool=NOUNS_DET.filter(function(n){return Math.abs(n.d-diff)<=w;}); }
    var n=pick(pool), fr=pick(DET_FRAMES), o=detOptions(fr.k,n);
    return { cat:cat, sub:sub, phrase:fr.ph.replace("{N}",n.w), hint:"Choisis le bon déterminant",
      note:"Le déterminant s'accorde en genre et en nombre avec le nom (le/la/l', un/une, ce/cet/cette, mon/ma…).",
      options:build(o.good,o.bad.slice()), answer:0 };
  }

  /* --- Nature des mots : générateur PARTITIONNÉ par difficulté --- */
  var NATURE_WORDS=[
    // d1
    {w:"chien",n:"nom",d:1},{w:"chat",n:"nom",d:1},{w:"manger",n:"verbe",d:1},{w:"sauter",n:"verbe",d:1},
    {w:"rouge",n:"adjectif",d:1},{w:"petit",n:"adjectif",d:1},{w:"vite",n:"adverbe",d:1},{w:"le",n:"déterminant",d:1},
    {w:"il",n:"pronom",d:1},{w:"et",n:"conjonction",d:1},{w:"dans",n:"préposition",d:1},{w:"sur",n:"préposition",d:1},
    // d2
    {w:"maison",n:"nom",d:2},{w:"chanter",n:"verbe",d:2},{w:"courir",n:"verbe",d:2},{w:"joli",n:"adjectif",d:2},
    {w:"grand",n:"adjectif",d:2},{w:"souvent",n:"adverbe",d:2},{w:"un",n:"déterminant",d:2},{w:"elle",n:"pronom",d:2},
    {w:"nous",n:"pronom",d:2},{w:"mais",n:"conjonction",d:2},{w:"avec",n:"préposition",d:2},{w:"sous",n:"préposition",d:2},
    // d3
    {w:"montagne",n:"nom",d:3},{w:"grandir",n:"verbe",d:3},{w:"finir",n:"verbe",d:3},{w:"rapide",n:"adjectif",d:3},
    {w:"joyeux",n:"adjectif",d:3},{w:"lentement",n:"adverbe",d:3},{w:"bien",n:"adverbe",d:3},{w:"mon",n:"déterminant",d:3},
    {w:"ces",n:"déterminant",d:3},{w:"qui",n:"pronom",d:3},{w:"ou",n:"conjonction",d:3},{w:"pour",n:"préposition",d:3},
    // d4
    {w:"courage",n:"nom",d:4},{w:"obéir",n:"verbe",d:4},{w:"réfléchir",n:"verbe",d:4},{w:"curieux",n:"adjectif",d:4},
    {w:"aimable",n:"adjectif",d:4},{w:"prudemment",n:"adverbe",d:4},{w:"déjà",n:"adverbe",d:4},{w:"cette",n:"déterminant",d:4},
    {w:"dont",n:"pronom",d:4},{w:"toi",n:"pronom",d:4},{w:"donc",n:"conjonction",d:4},{w:"pendant",n:"préposition",d:4},
    // d5
    {w:"liberté",n:"nom",d:5},{w:"éblouir",n:"verbe",d:5},{w:"franchir",n:"verbe",d:5},{w:"courageux",n:"adjectif",d:5},
    {w:"honnête",n:"adjectif",d:5},{w:"rarement",n:"adverbe",d:5},{w:"ailleurs",n:"adverbe",d:5},{w:"plusieurs",n:"déterminant",d:5},
    {w:"lequel",n:"pronom",d:5},{w:"celui",n:"pronom",d:5},{w:"car",n:"conjonction",d:5},{w:"malgré",n:"préposition",d:5},
    // d6
    {w:"patience",n:"nom",d:6},{w:"accomplir",n:"verbe",d:6},{w:"resplendir",n:"verbe",d:6},{w:"audacieux",n:"adjectif",d:6},
    {w:"généreux",n:"adjectif",d:6},{w:"habilement",n:"adverbe",d:6},{w:"chaque",n:"déterminant",d:6},{w:"quelque",n:"déterminant",d:6},
    {w:"quiconque",n:"pronom",d:6},{w:"auquel",n:"pronom",d:6},{w:"or",n:"conjonction",d:6},{w:"dès",n:"préposition",d:6}
  ];
  var NAT_FRAMES=[
    "« {W} » est {A} ___.",
    "Dans une phrase, « {W} » est {A} ___.",
    "Le mot « {W} » est {A} ___.",
    "Grammaticalement, « {W} » est {A} ___.",
    "Nature de « {W} » : c'est {A} ___."
  ];
  function genNature(diff,cat,sub){
    var pool=NATURE_WORDS.filter(function(x){return x.d===diff;});
    if(pool.length<3){ for(var w=1;w<=5 && pool.length<3;w++) pool=NATURE_WORDS.filter(function(x){return Math.abs(x.d-diff)<=w;}); }
    var it=pick(pool), art=(it.n==="préposition"||it.n==="conjonction")?"une":"un";
    var bad=shuffle(NATURE_OPTS.filter(function(o){return o!==it.n;})).slice(0,3);
    return { cat:cat, sub:sub, phrase:pick(NAT_FRAMES).replace("{W}",it.w).replace("{A}",art),
      hint:"Donne la nature (classe) du mot",
      note:"La nature d'un mot : nom, verbe, adjectif, adverbe, déterminant, pronom, préposition ou conjonction.",
      options:build(it.n,bad), answer:0 };
  }

  /* --- Accords : générateur PARTITIONNÉ par difficulté (noms partitionnés) --- */
  var ACC_NOUNS=[
    {w:"la pomme",g:"f",nb:"s",d:1},{w:"le chat",g:"m",nb:"s",d:1},{w:"les fleurs",g:"f",nb:"p",d:1},{w:"le ballon",g:"m",nb:"s",d:1},
    {w:"la voiture",g:"f",nb:"s",d:1},{w:"les livres",g:"m",nb:"p",d:1},{w:"le chien",g:"m",nb:"s",d:1},{w:"la table",g:"f",nb:"s",d:1},{w:"les pommes",g:"f",nb:"p",d:1},
    {w:"le gâteau",g:"m",nb:"s",d:2},{w:"la maison",g:"f",nb:"s",d:2},{w:"les oiseaux",g:"m",nb:"p",d:2},{w:"la robe",g:"f",nb:"s",d:2},
    {w:"le vélo",g:"m",nb:"s",d:2},{w:"les chaises",g:"f",nb:"p",d:2},{w:"le chapeau",g:"m",nb:"s",d:2},{w:"la tasse",g:"f",nb:"s",d:2},{w:"les ballons",g:"m",nb:"p",d:2},
    {w:"la montagne",g:"f",nb:"s",d:3},{w:"le château",g:"m",nb:"s",d:3},{w:"les rivières",g:"f",nb:"p",d:3},{w:"le tigre",g:"m",nb:"s",d:3},
    {w:"la forêt",g:"f",nb:"s",d:3},{w:"les nuages",g:"m",nb:"p",d:3},{w:"le fauteuil",g:"m",nb:"s",d:3},{w:"la fenêtre",g:"f",nb:"s",d:3},{w:"les étoiles",g:"f",nb:"p",d:3},
    {w:"l'éléphant",g:"m",nb:"s",d:4},{w:"l'horloge",g:"f",nb:"s",d:4},{w:"les ordinateurs",g:"m",nb:"p",d:4},{w:"l'armoire",g:"f",nb:"s",d:4},
    {w:"le tableau",g:"m",nb:"s",d:4},{w:"les images",g:"f",nb:"p",d:4},{w:"le manteau",g:"m",nb:"s",d:4},{w:"la lampe",g:"f",nb:"s",d:4},{w:"les arbres",g:"m",nb:"p",d:4},
    {w:"l'aquarium",g:"m",nb:"s",d:5},{w:"l'échelle",g:"f",nb:"s",d:5},{w:"les éclairs",g:"m",nb:"p",d:5},{w:"l'ampoule",g:"f",nb:"s",d:5},
    {w:"le miroir",g:"m",nb:"s",d:5},{w:"les oreilles",g:"f",nb:"p",d:5},{w:"le tapis",g:"m",nb:"s",d:5},{w:"la cloche",g:"f",nb:"s",d:5},{w:"les bougies",g:"f",nb:"p",d:5},
    {w:"l'hippopotame",g:"m",nb:"s",d:6},{w:"l'orchidée",g:"f",nb:"s",d:6},{w:"les hélicoptères",g:"m",nb:"p",d:6},{w:"l'enclume",g:"f",nb:"s",d:6},
    {w:"le lampadaire",g:"m",nb:"s",d:6},{w:"les obstacles",g:"m",nb:"p",d:6},{w:"le candélabre",g:"m",nb:"s",d:6},{w:"la mappemonde",g:"f",nb:"s",d:6},{w:"les engrenages",g:"m",nb:"p",d:6}
  ];
  var ADJ_ACC=[
    {ms:"grand",fs:"grande",mp:"grands",fp:"grandes"},{ms:"petit",fs:"petite",mp:"petits",fp:"petites"},
    {ms:"gros",fs:"grosse",mp:"gros",fp:"grosses"},{ms:"joli",fs:"jolie",mp:"jolis",fp:"jolies"},
    {ms:"beau",fs:"belle",mp:"beaux",fp:"belles"},{ms:"vert",fs:"verte",mp:"verts",fp:"vertes"},
    {ms:"noir",fs:"noire",mp:"noirs",fp:"noires"},{ms:"blanc",fs:"blanche",mp:"blancs",fp:"blanches"},
    {ms:"rond",fs:"ronde",mp:"ronds",fp:"rondes"},{ms:"lourd",fs:"lourde",mp:"lourds",fp:"lourdes"},
    {ms:"léger",fs:"légère",mp:"légers",fp:"légères"},{ms:"neuf",fs:"neuve",mp:"neufs",fp:"neuves"},
    {ms:"vieux",fs:"vieille",mp:"vieux",fp:"vieilles"},{ms:"doux",fs:"douce",mp:"doux",fp:"douces"},
    {ms:"brillant",fs:"brillante",mp:"brillants",fp:"brillantes"}
  ];
  var ACC_FRAMES=["{W} {V} ___.","{W} {V} très ___.","On dirait que {W} {V} ___.","{W} {V} vraiment ___."];
  function genAccords(diff,cat,sub){
    var pool=ACC_NOUNS.filter(function(x){return x.d===diff;});
    if(pool.length<3){ for(var w=1;w<=5 && pool.length<3;w++) pool=ACC_NOUNS.filter(function(x){return Math.abs(x.d-diff)<=w;}); }
    var nn=pick(pool), adj=pick(ADJ_ACC), V=(nn.nb==="s")?"est":"sont";
    var good=(nn.nb==="s")?(nn.g==="m"?adj.ms:adj.fs):(nn.g==="m"?adj.mp:adj.fp);
    var bad=[adj.ms,adj.fs,adj.mp,adj.fp].filter(function(x){return x!==good;});
    var phrase=cap(pick(ACC_FRAMES).replace("{W}",nn.w).replace("{V}",V));
    return { cat:cat, sub:sub, phrase:phrase, hint:"Accorde l'adjectif (genre et nombre)",
      note:"L'adjectif s'accorde en genre (masculin/féminin) et en nombre (singulier/pluriel) avec le nom.",
      options:build(good,bad), answer:0 };
  }

  /* --- Accord du participe passé (formes accordées calculées par règle) --- */
  function ppForms(pp){ return { ms:pp, fs:pp+"e", mp:/s$/.test(pp)?pp:pp+"s", fp:pp+"es" }; }
  function ppAgree(pp,g,n){ var F=ppForms(pp); return (n==="s")?(g==="m"?F.ms:F.fs):(g==="m"?F.mp:F.fp); }

  /* --- Voix passive : générateur PARTITIONNÉ par difficulté --- */
  var PASSIVE_ITEMS=[
    {s:"la souris",g:"f",n:"s",pp:"mangé",inf:"manger",ag:"le chat",d:1},{s:"le ballon",g:"m",n:"s",pp:"lancé",inf:"lancer",ag:"l'enfant",d:1},
    {s:"les fleurs",g:"f",n:"p",pp:"arrosé",inf:"arroser",ag:"le jardinier",d:1},{s:"la voiture",g:"f",n:"s",pp:"lavé",inf:"laver",ag:"mon père",d:1},
    {s:"le gâteau",g:"m",n:"s",pp:"préparé",inf:"préparer",ag:"la cuisinière",d:1},{s:"les jouets",g:"m",n:"p",pp:"rangé",inf:"ranger",ag:"les enfants",d:1},
    {s:"le dessin",g:"m",n:"s",pp:"colorié",inf:"colorier",ag:"Tom",d:1},{s:"la chanson",g:"f",n:"s",pp:"chanté",inf:"chanter",ag:"la chorale",d:1},
    {s:"les carottes",g:"f",n:"p",pp:"coupé",inf:"couper",ag:"le cuisinier",d:1},{s:"le chien",g:"m",n:"s",pp:"promené",inf:"promener",ag:"la voisine",d:1},
    {s:"la table",g:"f",n:"s",pp:"nettoyé",inf:"nettoyer",ag:"maman",d:1},{s:"les cadeaux",g:"m",n:"p",pp:"emballé",inf:"emballer",ag:"le vendeur",d:1},{s:"le jardin",g:"m",n:"s",pp:"planté",inf:"planter",ag:"le grand-père",d:1},
    {s:"la maison",g:"f",n:"s",pp:"construit",inf:"construire",ag:"les ouvriers",d:2},{s:"la fenêtre",g:"f",n:"s",pp:"cassé",inf:"casser",ag:"le vent",d:2},
    {s:"les élèves",g:"m",n:"p",pp:"félicité",inf:"féliciter",ag:"le directeur",d:2},{s:"le voleur",g:"m",n:"s",pp:"arrêté",inf:"arrêter",ag:"la police",d:2},
    {s:"la lettre",g:"f",n:"s",pp:"écrit",inf:"écrire",ag:"Léa",d:2},{s:"le mur",g:"m",n:"s",pp:"peint",inf:"peindre",ag:"le peintre",d:2},
    {s:"les livres",g:"m",n:"p",pp:"lu",inf:"lire",ag:"les enfants",d:2},{s:"la porte",g:"f",n:"s",pp:"ouvert",inf:"ouvrir",ag:"le concierge",d:2},
    {s:"le repas",g:"m",n:"s",pp:"servi",inf:"servir",ag:"le serveur",d:2},{s:"les photos",g:"f",n:"p",pp:"pris",inf:"prendre",ag:"le photographe",d:2},
    {s:"la leçon",g:"f",n:"s",pp:"appris",inf:"apprendre",ag:"les élèves",d:2},{s:"le pont",g:"m",n:"s",pp:"détruit",inf:"détruire",ag:"la tempête",d:2},{s:"les champs",g:"m",n:"p",pp:"labouré",inf:"labourer",ag:"le fermier",d:2},
    {s:"la forêt",g:"f",n:"s",pp:"traversé",inf:"traverser",ag:"les randonneurs",d:3},{s:"le château",g:"m",n:"s",pp:"visité",inf:"visiter",ag:"les touristes",d:3},
    {s:"les fenêtres",g:"f",n:"p",pp:"ouvert",inf:"ouvrir",ag:"le vent",d:3},{s:"la pièce",g:"f",n:"s",pp:"éclairé",inf:"éclairer",ag:"une lampe",d:3},
    {s:"le message",g:"m",n:"s",pp:"envoyé",inf:"envoyer",ag:"le facteur",d:3},{s:"les bagages",g:"m",n:"p",pp:"transporté",inf:"transporter",ag:"le porteur",d:3},
    {s:"la vérité",g:"f",n:"s",pp:"révélé",inf:"révéler",ag:"le témoin",d:3},{s:"le trésor",g:"m",n:"s",pp:"caché",inf:"cacher",ag:"les pirates",d:3},
    {s:"les fautes",g:"f",n:"p",pp:"corrigé",inf:"corriger",ag:"le professeur",d:3},{s:"la statue",g:"f",n:"s",pp:"sculpté",inf:"sculpter",ag:"l'artiste",d:3},
    {s:"le film",g:"m",n:"s",pp:"tourné",inf:"tourner",ag:"le réalisateur",d:3},{s:"les invités",g:"m",n:"p",pp:"accueilli",inf:"accueillir",ag:"les hôtes",d:3},{s:"la mélodie",g:"f",n:"s",pp:"composé",inf:"composer",ag:"le musicien",d:3},
    {s:"la loi",g:"f",n:"s",pp:"voté",inf:"voter",ag:"le Parlement",d:4},{s:"les décisions",g:"f",n:"p",pp:"pris",inf:"prendre",ag:"le conseil",d:4},
    {s:"le tableau",g:"m",n:"s",pp:"peint",inf:"peindre",ag:"un grand maître",d:4},{s:"la ville",g:"f",n:"s",pp:"détruit",inf:"détruire",ag:"le séisme",d:4},
    {s:"les documents",g:"m",n:"p",pp:"signé",inf:"signer",ag:"le directeur",d:4},{s:"la découverte",g:"f",n:"s",pp:"annoncé",inf:"annoncer",ag:"les chercheurs",d:4},
    {s:"le projet",g:"m",n:"s",pp:"approuvé",inf:"approuver",ag:"le jury",d:4},{s:"les récoltes",g:"f",n:"p",pp:"détruit",inf:"détruire",ag:"la grêle",d:4},
    {s:"la salle",g:"f",n:"s",pp:"rempli",inf:"remplir",ag:"la foule",d:4},{s:"le coupable",g:"m",n:"s",pp:"condamné",inf:"condamner",ag:"le juge",d:4},
    {s:"les patients",g:"m",n:"p",pp:"soigné",inf:"soigner",ag:"les infirmières",d:4},{s:"la propriété",g:"f",n:"s",pp:"vendu",inf:"vendre",ag:"l'agence",d:4},{s:"le record",g:"m",n:"s",pp:"battu",inf:"battre",ag:"l'athlète",d:4},
    {s:"la cité",g:"f",n:"s",pp:"assiégé",inf:"assiéger",ag:"l'ennemi",d:5},{s:"les manuscrits",g:"m",n:"p",pp:"conservé",inf:"conserver",ag:"le musée",d:5},
    {s:"la sentence",g:"f",n:"s",pp:"prononcé",inf:"prononcer",ag:"le tribunal",d:5},{s:"le domaine",g:"m",n:"s",pp:"légué",inf:"léguer",ag:"le comte",d:5},
    {s:"les négociations",g:"f",n:"p",pp:"mené",inf:"mener",ag:"les diplomates",d:5},{s:"la fresque",g:"f",n:"s",pp:"restauré",inf:"restaurer",ag:"les experts",d:5},
    {s:"le traité",g:"m",n:"s",pp:"ratifié",inf:"ratifier",ag:"les nations",d:5},{s:"les terres",g:"f",n:"p",pp:"cultivé",inf:"cultiver",ag:"les paysans",d:5},
    {s:"la révolte",g:"f",n:"s",pp:"réprimé",inf:"réprimer",ag:"la garde",d:5},{s:"le monument",g:"m",n:"s",pp:"admiré",inf:"admirer",ag:"les visiteurs",d:5},
    {s:"les frontières",g:"f",n:"p",pp:"franchi",inf:"franchir",ag:"les explorateurs",d:5},{s:"la théorie",g:"f",n:"s",pp:"réfuté",inf:"réfuter",ag:"le savant",d:5},{s:"le palais",g:"m",n:"s",pp:"édifié",inf:"édifier",ag:"le roi",d:5},
    {s:"la constitution",g:"f",n:"s",pp:"promulgué",inf:"promulguer",ag:"l'assemblée",d:6},{s:"les vestiges",g:"m",n:"p",pp:"exhumé",inf:"exhumer",ag:"les archéologues",d:6},
    {s:"la doctrine",g:"f",n:"s",pp:"prôné",inf:"prôner",ag:"le philosophe",d:6},{s:"le monarque",g:"m",n:"s",pp:"destitué",inf:"destituer",ag:"le peuple",d:6},
    {s:"les hérésies",g:"f",n:"p",pp:"condamné",inf:"condamner",ag:"le concile",d:6},{s:"la contrée",g:"f",n:"s",pp:"anéanti",inf:"anéantir",ag:"le cataclysme",d:6},
    {s:"le manuscrit",g:"m",n:"s",pp:"enluminé",inf:"enluminer",ag:"le moine",d:6},{s:"les remparts",g:"m",n:"p",pp:"érigé",inf:"ériger",ag:"les bâtisseurs",d:6},
    {s:"la relique",g:"f",n:"s",pp:"vénéré",inf:"vénérer",ag:"les fidèles",d:6},{s:"le complot",g:"m",n:"s",pp:"déjoué",inf:"déjouer",ag:"les gardes",d:6},
    {s:"les privilèges",g:"m",n:"p",pp:"aboli",inf:"abolir",ag:"la révolution",d:6},{s:"la province",g:"f",n:"s",pp:"colonisé",inf:"coloniser",ag:"l'empire",d:6},{s:"le souverain",g:"m",n:"s",pp:"couronné",inf:"couronner",ag:"l'archevêque",d:6}
  ];
  var PASS_FRAMES=[{s:"est",p:"sont"},{s:"a été",p:"ont été"},{s:"sera",p:"seront"},{s:"était",p:"étaient"}];
  function genVoixPassive(diff,cat,sub){
    var it=pick(bandFilter(PASSIVE_ITEMS,diff,"d")), F=ppForms(it.pp);
    var good=ppAgree(it.pp,it.g,it.n), fr=pick(PASS_FRAMES), aux=(it.n==="s"?fr.s:fr.p);
    var bad=[F.ms,F.fs,F.mp,F.fp,it.inf].filter(function(x){return x!==good;});
    return { cat:cat, sub:sub, phrase:cap(it.s+" "+aux+" ___ par "+it.ag+"."), hint:"Accorde le participe (voix passive)",
      note:"Voix passive : « être » (au temps voulu) + participe passé accordé avec le SUJET (Le chat mange la souris → La souris est mangée par le chat).",
      options:build(good,bad), answer:0 };
  }

  /* --- Accord du participe passé : générateur PARTITIONNÉ (être = accord sujet ; avoir = invariable si COD après) --- */
  var PPA_ITEMS=[
    // d1
    {k:"e",s:"Léa",g:"f",n:"s",pp:"parti",inf:"partir",d:1},{k:"e",s:"Paul",g:"m",n:"s",pp:"tombé",inf:"tomber",d:1},
    {k:"e",s:"les filles",g:"f",n:"p",pp:"arrivé",inf:"arriver",d:1},{k:"e",s:"les garçons",g:"m",n:"p",pp:"resté",inf:"rester",d:1},
    {k:"e",s:"ma sœur",g:"f",n:"s",pp:"monté",inf:"monter",d:1},{k:"e",s:"mon frère",g:"m",n:"s",pp:"venu",inf:"venir",d:1},{k:"e",s:"Emma",g:"f",n:"s",pp:"entré",inf:"entrer",d:1},
    {k:"a",s:"le chien",n:"s",pp:"mangé",inf:"manger",cod:"un os",d:1},{k:"a",s:"les enfants",n:"p",pp:"chanté",inf:"chanter",cod:"une chanson",d:1},
    {k:"a",s:"Tom",n:"s",pp:"fermé",inf:"fermer",cod:"la porte",d:1},{k:"a",s:"maman",n:"s",pp:"préparé",inf:"préparer",cod:"le repas",d:1},
    {k:"a",s:"les élèves",n:"p",pp:"écouté",inf:"écouter",cod:"la maîtresse",d:1},{k:"a",s:"le chat",n:"s",pp:"attrapé",inf:"attraper",cod:"la souris",d:1},
    // d2
    {k:"e",s:"Chloé",g:"f",n:"s",pp:"sorti",inf:"sortir",d:2},{k:"e",s:"les touristes",g:"m",n:"p",pp:"descendu",inf:"descendre",d:2},
    {k:"e",s:"le facteur",g:"m",n:"s",pp:"passé",inf:"passer",d:2},{k:"e",s:"mes cousines",g:"f",n:"p",pp:"reparti",inf:"repartir",d:2},
    {k:"e",s:"les feuilles",g:"f",n:"p",pp:"tombé",inf:"tomber",d:2},{k:"e",s:"Marie",g:"f",n:"s",pp:"rentré",inf:"rentrer",d:2},{k:"e",s:"le voisin",g:"m",n:"s",pp:"revenu",inf:"revenir",d:2},
    {k:"a",s:"le boulanger",n:"s",pp:"vendu",inf:"vendre",cod:"tout le pain",d:2},{k:"a",s:"les joueurs",n:"p",pp:"gagné",inf:"gagner",cod:"le match",d:2},
    {k:"a",s:"la classe",n:"s",pp:"visité",inf:"visiter",cod:"le musée",d:2},{k:"a",s:"les ouvriers",n:"p",pp:"terminé",inf:"terminer",cod:"le travail",d:2},
    {k:"a",s:"le peintre",n:"s",pp:"repeint",inf:"repeindre",cod:"le mur",d:2},{k:"a",s:"les jardiniers",n:"p",pp:"ramassé",inf:"ramasser",cod:"les feuilles",d:2},
    // d3
    {k:"e",s:"les alpinistes",g:"m",n:"p",pp:"parvenu",inf:"parvenir",d:3},{k:"e",s:"la rivière",g:"f",n:"s",pp:"débordé",inf:"déborder",d:3},
    {k:"e",s:"mes grands-parents",g:"m",n:"p",pp:"revenu",inf:"revenir",d:3},{k:"e",s:"la lune",g:"f",n:"s",pp:"apparu",inf:"apparaître",d:3},
    {k:"e",s:"le héros",g:"m",n:"s",pp:"devenu",inf:"devenir",d:3},{k:"e",s:"les jumelles",g:"f",n:"p",pp:"né",inf:"naître",d:3},{k:"e",s:"le train",g:"m",n:"s",pp:"reparti",inf:"repartir",d:3},
    {k:"a",s:"les savants",n:"p",pp:"découvert",inf:"découvrir",cod:"un fossile",d:3},{k:"a",s:"le jury",n:"s",pp:"choisi",inf:"choisir",cod:"le gagnant",d:3},
    {k:"a",s:"les pompiers",n:"p",pp:"éteint",inf:"éteindre",cod:"l'incendie",d:3},{k:"a",s:"la cuisinière",n:"s",pp:"réussi",inf:"réussir",cod:"le plat",d:3},
    {k:"a",s:"les élèves",n:"p",pp:"résolu",inf:"résoudre",cod:"le problème",d:3},{k:"a",s:"le guide",n:"s",pp:"conduit",inf:"conduire",cod:"les visiteurs",d:3},
    // d4
    {k:"e",s:"les explorateurs",g:"m",n:"p",pp:"parvenu",inf:"parvenir",d:4},{k:"e",s:"la délégation",g:"f",n:"s",pp:"reparti",inf:"repartir",d:4},
    {k:"e",s:"les survivantes",g:"f",n:"p",pp:"réchappé",inf:"réchapper",d:4},{k:"e",s:"le patient",g:"m",n:"s",pp:"décédé",inf:"décéder",d:4},
    {k:"e",s:"les naufragés",g:"m",n:"p",pp:"disparu",inf:"disparaître",d:4},{k:"e",s:"la championne",g:"f",n:"s",pp:"monté",inf:"monter",d:4},{k:"e",s:"les feuilles mortes",g:"f",n:"p",pp:"retombé",inf:"retomber",d:4},
    {k:"a",s:"le tribunal",n:"s",pp:"acquitté",inf:"acquitter",cod:"l'accusé",d:4},{k:"a",s:"les chercheurs",n:"p",pp:"publié",inf:"publier",cod:"leurs résultats",d:4},
    {k:"a",s:"la commission",n:"s",pp:"approuvé",inf:"approuver",cod:"le budget",d:4},{k:"a",s:"les jurés",n:"p",pp:"rendu",inf:"rendre",cod:"leur verdict",d:4},
    {k:"a",s:"l'architecte",n:"s",pp:"conçu",inf:"concevoir",cod:"le plan",d:4},{k:"a",s:"les bénévoles",n:"p",pp:"distribué",inf:"distribuer",cod:"les repas",d:4},
    // d5
    {k:"e",s:"les ambassadeurs",g:"m",n:"p",pp:"convenu",inf:"convenir",d:5},{k:"e",s:"la souveraine",g:"f",n:"s",pp:"intervenu",inf:"intervenir",d:5},
    {k:"e",s:"les délégués",g:"m",n:"p",pp:"parvenu",inf:"parvenir",d:5},{k:"e",s:"la comète",g:"f",n:"s",pp:"réapparu",inf:"réapparaître",d:5},
    {k:"e",s:"le vieux chêne",g:"m",n:"s",pp:"tombé",inf:"tomber",d:5},{k:"e",s:"les héroïnes",g:"f",n:"p",pp:"devenu",inf:"devenir",d:5},{k:"e",s:"la troupe",g:"f",n:"s",pp:"reparti",inf:"repartir",d:5},
    {k:"a",s:"le monarque",n:"s",pp:"gracié",inf:"gracier",cod:"les prisonniers",d:5},{k:"a",s:"les historiens",n:"p",pp:"établi",inf:"établir",cod:"la chronologie",d:5},
    {k:"a",s:"la cour",n:"s",pp:"prononcé",inf:"prononcer",cod:"la sentence",d:5},{k:"a",s:"les diplomates",n:"p",pp:"conclu",inf:"conclure",cod:"un accord",d:5},
    {k:"a",s:"le chirurgien",n:"s",pp:"pratiqué",inf:"pratiquer",cod:"l'opération",d:5},{k:"a",s:"les experts",n:"p",pp:"restauré",inf:"restaurer",cod:"la toile",d:5},
    // d6
    {k:"e",s:"la crise",g:"f",n:"s",pp:"survenu",inf:"survenir",d:6},{k:"e",s:"les délégations",g:"f",n:"p",pp:"reparti",inf:"repartir",d:6},
    {k:"e",s:"le souverain",g:"m",n:"s",pp:"parvenu",inf:"parvenir",d:6},{k:"e",s:"les colonies",g:"f",n:"p",pp:"devenu",inf:"devenir",d:6},
    {k:"e",s:"l'expédition",g:"f",n:"s",pp:"parti",inf:"partir",d:6},{k:"e",s:"les pionniers",g:"m",n:"p",pp:"revenu",inf:"revenir",d:6},{k:"e",s:"la reine",g:"f",n:"s",pp:"intervenu",inf:"intervenir",d:6},
    {k:"a",s:"le concile",n:"s",pp:"proscrit",inf:"proscrire",cod:"l'hérésie",d:6},{k:"a",s:"les monarques",n:"p",pp:"aboli",inf:"abolir",cod:"les privilèges",d:6},
    {k:"a",s:"l'assemblée",n:"s",pp:"promulgué",inf:"promulguer",cod:"la loi",d:6},{k:"a",s:"les érudits",n:"p",pp:"traduit",inf:"traduire",cod:"le traité",d:6},
    {k:"a",s:"le régime",n:"s",pp:"instauré",inf:"instaurer",cod:"le couvre-feu",d:6},{k:"a",s:"les bâtisseurs",n:"p",pp:"érigé",inf:"ériger",cod:"la cathédrale",d:6}
  ];
  var PPA_ETRE_FR=["{S} {X} ___.","Hier, {S} {X} ___.","{S} {X} déjà ___.","Ce matin, {S} {X} ___."];
  var PPA_AVOIR_FR=["{S} {X} ___ {C}.","Hier, {S} {X} ___ {C}.","{S} {X} bien ___ {C}.","Ce matin, {S} {X} ___ {C}."];
  function genAccordPP(diff,cat,sub){
    var it=pick(bandFilter(PPA_ITEMS,diff,"d")), F=ppForms(it.pp);
    if(it.k==="e"){
      var good=ppAgree(it.pp,it.g,it.n), aux=(it.n==="s"?"est":"sont");
      var bad=[F.ms,F.fs,F.mp,F.fp,it.inf].filter(function(x){return x!==good;});
      return { cat:cat, sub:sub, phrase:cap(pick(PPA_ETRE_FR).replace("{S}",it.s).replace("{X}",aux)),
        hint:"Accorde le participe passé (auxiliaire être)",
        note:"Avec l'auxiliaire ÊTRE, le participe passé s'accorde en genre et en nombre avec le SUJET.",
        options:build(good,bad), answer:0 };
    }
    var g2=it.pp, aux2=(it.n==="s"?"a":"ont");
    var bad2=[F.fs,F.mp,F.fp,it.inf].filter(function(x){return x!==g2;});
    return { cat:cat, sub:sub, phrase:cap(pick(PPA_AVOIR_FR).replace("{S}",it.s).replace("{X}",aux2).replace("{C}",it.cod)),
      hint:"Accorde le participe passé (auxiliaire avoir)",
      note:"Avec l'auxiliaire AVOIR, si le COD est placé APRÈS le verbe, le participe reste INVARIABLE.",
      options:build(g2,bad2), answer:0 };
  }

  /* --- Types de phrases : générateur PARTITIONNÉ (exemple = contenu unique) --- */
  var TYPE_ITEMS=[
    {ex:"Le chat dort.",t:"déclarative",d:1},{ex:"Où vas-tu ?",t:"interrogative",d:1},{ex:"Quelle belle journée !",t:"exclamative",d:1},
    {ex:"Ferme la porte.",t:"impérative",d:1},{ex:"J'aime les glaces.",t:"déclarative",d:1},{ex:"Tu viens avec nous ?",t:"interrogative",d:1},
    {ex:"Comme c'est beau !",t:"exclamative",d:1},{ex:"Range ta chambre.",t:"impérative",d:1},{ex:"Il fait beau aujourd'hui.",t:"déclarative",d:1},
    {ex:"Est-ce que tu joues ?",t:"interrogative",d:1},{ex:"Quel dommage !",t:"exclamative",d:1},{ex:"Écoute-moi bien.",t:"impérative",d:1},{ex:"Nous jouons dehors.",t:"déclarative",d:1},
    {ex:"Nous partons en vacances.",t:"déclarative",d:2},{ex:"As-tu fini tes devoirs ?",t:"interrogative",d:2},{ex:"Quelle chance nous avons !",t:"exclamative",d:2},
    {ex:"Prends ton manteau.",t:"impérative",d:2},{ex:"Le train arrive à huit heures.",t:"déclarative",d:2},{ex:"Veux-tu jouer avec moi ?",t:"interrogative",d:2},
    {ex:"Comme il court vite !",t:"exclamative",d:2},{ex:"Ferme la fenêtre, s'il te plaît.",t:"impérative",d:2},{ex:"Les oiseaux chantent le matin.",t:"déclarative",d:2},
    {ex:"Où as-tu rangé mes clés ?",t:"interrogative",d:2},{ex:"Quel beau spectacle !",t:"exclamative",d:2},{ex:"Range tes affaires.",t:"impérative",d:2},{ex:"Ma sœur adore lire.",t:"déclarative",d:2},
    {ex:"Le soleil se couche à l'horizon.",t:"déclarative",d:3},{ex:"Pourquoi es-tu en retard ?",t:"interrogative",d:3},{ex:"Que cette musique est douce !",t:"exclamative",d:3},
    {ex:"N'oublie pas ton parapluie.",t:"impérative",d:3},{ex:"Les enfants bâtissent un château de sable.",t:"déclarative",d:3},{ex:"Combien coûte ce livre ?",t:"interrogative",d:3},
    {ex:"Comme la mer est calme aujourd'hui !",t:"exclamative",d:3},{ex:"Réfléchis avant de répondre.",t:"impérative",d:3},{ex:"Le film commence dans dix minutes.",t:"déclarative",d:3},
    {ex:"Connais-tu la réponse ?",t:"interrogative",d:3},{ex:"Quelle histoire incroyable !",t:"exclamative",d:3},{ex:"Choisis une carte au hasard.",t:"impérative",d:3},{ex:"Mon voisin répare sa voiture.",t:"déclarative",d:3},
    {ex:"La bibliothèque ouvre à neuf heures.",t:"déclarative",d:4},{ex:"Sais-tu à quelle heure il arrive ?",t:"interrogative",d:4},{ex:"Quel courage tu as montré !",t:"exclamative",d:4},
    {ex:"Veuillez patienter un instant.",t:"impérative",d:4},{ex:"Les scientifiques étudient les océans.",t:"déclarative",d:4},{ex:"Depuis quand habites-tu ici ?",t:"interrogative",d:4},
    {ex:"Comme ce paysage est majestueux !",t:"exclamative",d:4},{ex:"Souviens-toi de fermer à clé.",t:"impérative",d:4},{ex:"Le musée expose des tableaux anciens.",t:"déclarative",d:4},
    {ex:"Qu'as-tu répondu à sa question ?",t:"interrogative",d:4},{ex:"Quelle aventure extraordinaire !",t:"exclamative",d:4},{ex:"Complétez le formulaire lisiblement.",t:"impérative",d:4},{ex:"La rivière serpente dans la vallée.",t:"déclarative",d:4},
    {ex:"Les hirondelles migrent vers le sud.",t:"déclarative",d:5},{ex:"Ne penses-tu pas qu'il faudrait partir ?",t:"interrogative",d:5},{ex:"Combien cette nouvelle me réjouit !",t:"exclamative",d:5},
    {ex:"Veuillez éteindre vos téléphones.",t:"impérative",d:5},{ex:"Le conseil se réunit chaque mardi.",t:"déclarative",d:5},{ex:"En quoi puis-je vous être utile ?",t:"interrogative",d:5},
    {ex:"Que de chemin parcouru depuis hier !",t:"exclamative",d:5},{ex:"Prenez garde à la marche.",t:"impérative",d:5},{ex:"La lumière traverse le vitrail coloré.",t:"déclarative",d:5},
    {ex:"N'est-il pas trop tard pour agir ?",t:"interrogative",d:5},{ex:"Quelle surprise vous nous faites !",t:"exclamative",d:5},{ex:"Songez aux conséquences de vos actes.",t:"impérative",d:5},{ex:"Le philosophe médite en silence.",t:"déclarative",d:5},
    {ex:"La sagesse s'acquiert avec le temps.",t:"déclarative",d:6},{ex:"Ne serait-il pas plus sage de renoncer ?",t:"interrogative",d:6},{ex:"Ô combien cette victoire est méritée !",t:"exclamative",d:6},
    {ex:"Gardez-vous de tout jugement hâtif.",t:"impérative",d:6},{ex:"L'orateur captive l'auditoire par son éloquence.",t:"déclarative",d:6},{ex:"Qu'adviendrait-il si nous échouions ?",t:"interrogative",d:6},
    {ex:"Comme les étoiles scintillent ce soir !",t:"exclamative",d:6},{ex:"Veuillez agréer mes salutations distinguées.",t:"impérative",d:6},{ex:"Le manuscrit révèle des secrets oubliés.",t:"déclarative",d:6},
    {ex:"Pourquoi faudrait-il céder à la panique ?",t:"interrogative",d:6},{ex:"Quelle prouesse admirable il a accomplie !",t:"exclamative",d:6},{ex:"Méditez cette maxime attentivement.",t:"impérative",d:6},{ex:"La civilisation prospère grâce au savoir.",t:"déclarative",d:6}
  ];
  var TYPE_ALL=["déclarative","interrogative","exclamative","impérative"];
  var TYPE_FRAMES=["« {EX} » est une phrase ___.","La phrase « {EX} » est ___.","« {EX} » — c'est une phrase ___.","Quel type ? « {EX} » → phrase ___."];
  function genTypes(diff,cat,sub){
    var it=pick(bandFilter(TYPE_ITEMS,diff,"d"));
    return { cat:cat, sub:sub, phrase:pick(TYPE_FRAMES).replace("{EX}",it.ex), hint:"Quel type de phrase ?",
      note:"Types : déclarative (elle affirme .), interrogative (elle questionne ?), exclamative (elle s'exclame !), impérative (elle ordonne).",
      options:build(it.t, TYPE_ALL.filter(function(x){return x!==it.t;})), answer:0 };
  }

  /* --- Prépositions (de lieu) : générateur PARTITIONNÉ --- */
  var PREP_PLACES=[
    {place:"Paris",prep:"à",d:1},{place:"Lyon",prep:"à",d:1},{place:"Rome",prep:"à",d:1},{place:"cinéma",prep:"au",d:1},
    {place:"parc",prep:"au",d:1},{place:"marché",prep:"au",d:1},{place:"jardin",prep:"au",d:1},{place:"piscine",prep:"à la",d:1},
    {place:"maison",prep:"à la",d:1},{place:"plage",prep:"à la",d:1},{place:"gare",prep:"à la",d:1},{place:"école",prep:"à l'",d:1},{place:"hôpital",prep:"à l'",d:1},
    {place:"France",prep:"en",d:2},{place:"Italie",prep:"en",d:2},{place:"Espagne",prep:"en",d:2},{place:"Belgique",prep:"en",d:2},
    {place:"Portugal",prep:"au",d:2},{place:"Canada",prep:"au",d:2},{place:"Japon",prep:"au",d:2},{place:"bureau",prep:"au",d:2},
    {place:"théâtre",prep:"au",d:2},{place:"boulangerie",prep:"à la",d:2},{place:"montagne",prep:"à la",d:2},{place:"aéroport",prep:"à l'",d:2},{place:"université",prep:"à l'",d:2},
    {place:"restaurant",prep:"au",d:3},{place:"stade",prep:"au",d:3},{place:"zoo",prep:"au",d:3},{place:"musée",prep:"au",d:3},
    {place:"pharmacie",prep:"à la",d:3},{place:"bibliothèque",prep:"à la",d:3},{place:"banque",prep:"à la",d:3},{place:"caserne",prep:"à la",d:3},
    {place:"opéra",prep:"à l'",d:3},{place:"hôtel",prep:"à l'",d:3},{place:"le médecin",prep:"chez",d:3},{place:"le coiffeur",prep:"chez",d:3},{place:"mes grands-parents",prep:"chez",d:3},
    {place:"Allemagne",prep:"en",d:4},{place:"Suisse",prep:"en",d:4},{place:"Grèce",prep:"en",d:4},{place:"Maroc",prep:"au",d:4},
    {place:"Brésil",prep:"au",d:4},{place:"Mexique",prep:"au",d:4},{place:"États-Unis",prep:"aux",d:4},{place:"Pays-Bas",prep:"aux",d:4},
    {place:"commissariat",prep:"au",d:4},{place:"préfecture",prep:"à la",d:4},{place:"le dentiste",prep:"chez",d:4},{place:"atelier",prep:"à l'",d:4},{place:"chantier",prep:"au",d:4},
    {place:"planétarium",prep:"au",d:5},{place:"observatoire",prep:"à l'",d:5},{place:"ambassade",prep:"à l'",d:5},{place:"le notaire",prep:"chez",d:5},
    {place:"clinique",prep:"à la",d:5},{place:"tribunal",prep:"au",d:5},{place:"usine",prep:"à l'",d:5},{place:"monastère",prep:"au",d:5},
    {place:"cathédrale",prep:"à la",d:5},{place:"sanctuaire",prep:"au",d:5},{place:"aquarium",prep:"à l'",d:5},{place:"médiathèque",prep:"à la",d:5},{place:"conservatoire",prep:"au",d:5},
    {place:"amphithéâtre",prep:"à l'",d:6},{place:"hémicycle",prep:"à l'",d:6},{place:"chancellerie",prep:"à la",d:6},{place:"échoppe",prep:"à l'",d:6},
    {place:"belvédère",prep:"au",d:6},{place:"manufacture",prep:"à la",d:6},{place:"promontoire",prep:"au",d:6},{place:"auditorium",prep:"à l'",d:6},
    {place:"réfectoire",prep:"au",d:6},{place:"dispensaire",prep:"au",d:6},{place:"l'apothicaire",prep:"chez",d:6},{place:"vigie",prep:"à la",d:6},{place:"préau",prep:"au",d:6}
  ];
  var PREP_POOL=["à","à la","à l'","au","aux","en","chez","dans"];
  var PREP_FRAMES=["Je vais ___ {P}.","Nous allons ___ {P}.","Elle se rend ___ {P}.","On part ___ {P}."];
  function genPrep(diff,cat,sub){
    var it=pick(bandFilter(PREP_PLACES,diff,"d"));
    var bad=shuffle(PREP_POOL.filter(function(x){return x!==it.prep;})).slice(0,3);
    return { cat:cat, sub:sub, phrase:cap(pick(PREP_FRAMES).replace("{P}",it.place)), hint:"Choisis la bonne préposition (lieu)",
      note:"Lieu : ville → à (à Paris) ; pays féminin → en (en France) ; pays masculin → au (au Portugal) ; pays pluriel → aux (aux États-Unis) ; personne → chez ; sinon à la / à l' / au selon le nom.",
      options:build(it.prep,bad), answer:0 };
  }

  /* --- Pronoms relatifs : générateur PARTITIONNÉ --- */
  var PRON_ITEMS=[
    {ant:"le chien",good:"qui",rest:"aboie fort",d:1},{ant:"la fille",good:"qui",rest:"chante bien",d:1},
    {ant:"le gâteau",good:"que",rest:"j'ai fait",d:1},{ant:"le livre",good:"que",rest:"tu lis",d:1},
    {ant:"l'oiseau",good:"qui",rest:"vole haut",d:1},{ant:"la pomme",good:"que",rest:"je mange",d:1},
    {ant:"le garçon",good:"qui",rest:"court vite",d:1},{ant:"le dessin",good:"que",rest:"tu as fait",d:1},
    {ant:"le chat",good:"qui",rest:"dort là",d:1},{ant:"la chanson",good:"que",rest:"nous aimons",d:1},
    {ant:"le ballon",good:"qui",rest:"roule",d:1},{ant:"la fleur",good:"que",rest:"j'ai cueillie",d:1},{ant:"le film",good:"qui",rest:"passe ce soir",d:1},
    {ant:"la maison",good:"où",rest:"je vis",d:2},{ant:"la ville",good:"où",rest:"il est né",d:2},
    {ant:"le jour",good:"où",rest:"tu es arrivé",d:2},{ant:"le pays",good:"que",rest:"je visite",d:2},
    {ant:"l'école",good:"où",rest:"j'apprends",d:2},{ant:"le vélo",good:"que",rest:"j'ai réparé",d:2},
    {ant:"la dame",good:"qui",rest:"habite ici",d:2},{ant:"le moment",good:"où",rest:"il est parti",d:2},
    {ant:"le repas",good:"que",rest:"nous préparons",d:2},{ant:"le voisin",good:"qui",rest:"m'a salué",d:2},
    {ant:"la route",good:"que",rest:"nous suivons",d:2},{ant:"le parc",good:"où",rest:"nous jouons",d:2},{ant:"l'histoire",good:"que",rest:"tu racontes",d:2},
    {ant:"le film",good:"dont",rest:"je t'ai parlé",d:3},{ant:"le livre",good:"dont",rest:"tout le monde parle",d:3},
    {ant:"l'outil",good:"dont",rest:"j'ai besoin",d:3},{ant:"le gâteau",good:"qu'",rest:"il a mangé",d:3},
    {ant:"la robe",good:"qu'",rest:"elle a choisie",d:3},{ant:"l'ami",good:"dont",rest:"je me souviens",d:3},
    {ant:"la région",good:"où",rest:"il travaille",d:3},{ant:"le sujet",good:"dont",rest:"nous discutons",d:3},
    {ant:"le cadeau",good:"qu'",rest:"on a offert",d:3},{ant:"la personne",good:"qui",rest:"nous accueille",d:3},
    {ant:"le chemin",good:"que",rest:"vous prenez",d:3},{ant:"l'année",good:"où",rest:"je suis né",d:3},{ant:"le problème",good:"dont",rest:"il s'occupe",d:3},
    {ant:"le projet",good:"dont",rest:"il est fier",d:4},{ant:"la décision",good:"qu'",rest:"ils ont prise",d:4},
    {ant:"la façon",good:"dont",rest:"tu parles",d:4},{ant:"l'endroit",good:"où",rest:"nous nous sommes rencontrés",d:4},
    {ant:"le témoin",good:"qui",rest:"a tout vu",d:4},{ant:"la lettre",good:"qu'",rest:"elle a écrite",d:4},
    {ant:"le moment",good:"où",rest:"tout a basculé",d:4},{ant:"l'auteur",good:"dont",rest:"j'admire le style",d:4},
    {ant:"le pays",good:"d'où",rest:"il vient",bad:["dont","où","que"],d:4},{ant:"la raison",good:"pour laquelle",rest:"il est parti",bad:["dont","que","laquelle"],d:4},
    {ant:"le collègue",good:"avec qui",rest:"je travaille",bad:["dont","qui","que"],d:4},{ant:"le stylo",good:"avec lequel",rest:"j'écris",bad:["dont","lequel","que"],d:4},{ant:"la personne",good:"à qui",rest:"je pense",bad:["dont","que","qui"],d:4},
    {ant:"le fauteuil",good:"sur lequel",rest:"tu es assis",bad:["dont","lequel","auquel"],d:5},{ant:"la réunion",good:"à laquelle",rest:"j'ai assisté",bad:["dont","laquelle","auquel"],d:5},
    {ant:"les amis",good:"parmi lesquels",rest:"il se trouve",bad:["dont","lesquels","auxquels"],d:5},{ant:"le sujet",good:"auquel",rest:"je m'intéresse",bad:["dont","lequel","à qui"],d:5},
    {ant:"la boîte",good:"dans laquelle",rest:"il range ses outils",bad:["dont","laquelle","où"],d:5},{ant:"l'ami",good:"grâce à qui",rest:"j'ai réussi",bad:["dont","à qui","que"],d:5},
    {ant:"le film",good:"dont",rest:"la fin m'a surpris",bad:["que","qui","où"],d:5},{ant:"la ville",good:"vers laquelle",rest:"nous roulons",bad:["où","laquelle","dont"],d:5},
    {ant:"le problème",good:"auquel",rest:"il réfléchit",bad:["dont","lequel","que"],d:5},{ant:"la table",good:"sous laquelle",rest:"le chat dort",bad:["dont","laquelle","où"],d:5},
    {ant:"l'époque",good:"à laquelle",rest:"il vivait",bad:["où","laquelle","dont"],d:5},{ant:"les outils",good:"avec lesquels",rest:"il travaille",bad:["dont","lesquels","auxquels"],d:5},{ant:"le moyen",good:"par lequel",rest:"il réussit",bad:["dont","lequel","auquel"],d:5},
    {ant:"l'idéal",good:"vers lequel",rest:"il tend",bad:["auquel","lequel","dont"],d:6},{ant:"la cause",good:"pour laquelle",rest:"ils luttent",bad:["dont","laquelle","à laquelle"],d:6},
    {ant:"les principes",good:"selon lesquels",rest:"il vit",bad:["dont","lesquels","auxquels"],d:6},{ant:"le contrat",good:"aux termes duquel",rest:"il s'engage",bad:["dont","duquel","auquel"],d:6},
    {ant:"l'assemblée",good:"au sein de laquelle",rest:"il siège",bad:["dont","laquelle","où"],d:6},{ant:"les valeurs",good:"auxquelles",rest:"il tient",bad:["dont","lesquelles","à qui"],d:6},
    {ant:"le procédé",good:"par lequel",rest:"il y parvient",bad:["dont","lequel","auquel"],d:6},{ant:"la manière",good:"dont",rest:"il procède",bad:["que","laquelle","où"],d:6},
    {ant:"l'autorité",good:"à laquelle",rest:"il se soumet",bad:["dont","laquelle","auquel"],d:6},{ant:"les circonstances",good:"dans lesquelles",rest:"cela s'est produit",bad:["dont","lesquelles","où"],d:6},
    {ant:"le fondement",good:"sur lequel",rest:"repose la théorie",bad:["duquel","lequel","auquel"],d:6},{ant:"l'objectif",good:"en vue duquel",rest:"il œuvre",bad:["dont","duquel","auquel"],d:6},{ant:"les gens",good:"parmi lesquels",rest:"je vis",bad:["dont","lesquels","auxquels"],d:6}
  ];
  var PRON_POOL=["qui","que","qu'","où","dont"];
  var PRON_FRAMES=["Voici {ANT} ___ {R}.","C'est {ANT} ___ {R}.","Je te montre {ANT} ___ {R}.","Connais-tu {ANT} ___ {R} ?"];
  function genPronoms(diff,cat,sub){
    var it=pick(bandFilter(PRON_ITEMS,diff,"d"));
    var bad=it.bad?it.bad.slice():shuffle(PRON_POOL.filter(function(x){return x!==it.good;})).slice(0,3);
    return { cat:cat, sub:sub, phrase:cap(pick(PRON_FRAMES).replace("{ANT}",it.ant).replace("{R}",it.rest)),
      hint:"Choisis le bon pronom relatif",
      note:"Pronoms relatifs : qui (sujet), que/qu' (COD), où (lieu/temps), dont (complément avec « de »), lequel/auquel/duquel… après une préposition.",
      options:build(it.good,bad), answer:0 };
  }

  /* --- Connecteurs logiques : générateur PARTITIONNÉ --- */
  var CONN_ITEMS=[
    {c1:"Il fait froid",good:"donc",c2:"je mets un manteau",bad:["car","mais","ou"],d:1},{c1:"J'aime le chocolat",good:"mais",c2:"pas les bonbons",bad:["donc","car","ou"],d:1},
    {c1:"Veux-tu du thé",good:"ou",c2:"du café ?",bad:["et","car","donc"],d:1},{c1:"Il pleure",good:"car",c2:"il est tombé",bad:["donc","mais","ou"],d:1},
    {c1:"Elle prend son sac",good:"et",c2:"elle part",bad:["mais","car","ou"],d:1},{c1:"Je suis fatigué",good:"donc",c2:"je vais dormir",bad:["mais","ou","car"],d:1},
    {c1:"Il court vite",good:"mais",c2:"il perd la course",bad:["donc","car","et"],d:1},{c1:"Il a faim",good:"donc",c2:"il mange",bad:["mais","ou","car"],d:1},
    {c1:"Elle rit",good:"car",c2:"c'est drôle",bad:["donc","mais","ou"],d:1},{c1:"J'ouvre la fenêtre",good:"car",c2:"il fait chaud",bad:["mais","ou","donc"],d:1},
    {c1:"Il est petit",good:"mais",c2:"il est fort",bad:["donc","car","ou"],d:1},{c1:"Prends ton parapluie",good:"car",c2:"il va pleuvoir",bad:["mais","ou","donc"],d:1},{c1:"Tu ranges",good:"ou",c2:"tu es puni",bad:["car","donc","et"],d:1},
    {c1:"Il a mangé",good:"puis",c2:"il a dormi",bad:["mais","car","ou"],d:2},{c1:"Il pleut",good:"pourtant",c2:"il sort sans manteau",bad:["donc","car","puis"],d:2},
    {c1:"Fais tes devoirs",good:"alors",c2:"tu pourras jouer",bad:["car","pourtant","ou"],d:2},{c1:"Il est absent",good:"car",c2:"il est malade",bad:["donc","pourtant","puis"],d:2},
    {c1:"Elle chante",good:"pendant que",c2:"il joue",bad:["car","donc","mais"],d:2},{c1:"Nous partirons",good:"dès que",c2:"tu seras prêt",bad:["car","mais","donc"],d:2},
    {c1:"Il travaille",good:"tandis que",c2:"son frère se repose",bad:["car","donc","puis"],d:2},{c1:"Je t'aiderai",good:"si",c2:"tu me le demandes",bad:["car","donc","mais"],d:2},
    {c1:"Range ta chambre",good:"avant de",c2:"sortir",bad:["car","donc","mais"],d:2},{c1:"Les étoiles brillent",good:"quand",c2:"il fait nuit",bad:["car","donc","mais"],d:2},
    {c1:"Prends une veste",good:"au cas où",c2:"il ferait froid",bad:["car","donc","mais"],d:2},{c1:"Il sourit",good:"parce qu'",c2:"il est heureux",bad:["donc","pourtant","puis"],d:2},{c1:"Il lit",good:"puis",c2:"il écrit",bad:["mais","car","pourtant"],d:2},
    {c1:"Il a beaucoup travaillé",good:"par conséquent",c2:"il a réussi",bad:["cependant","car","ou"],d:3},{c1:"J'aime l'été",good:"en revanche",c2:"je déteste l'hiver",bad:["donc","car","puis"],d:3},
    {c1:"Il pleuvait",good:"cependant",c2:"nous sommes sortis",bad:["donc","car","ainsi"],d:3},{c1:"Il est absent",good:"en effet",c2:"il est souffrant",bad:["pourtant","mais","ou"],d:3},
    {c1:"Il pleut",good:"c'est pourquoi",c2:"je reste chez moi",bad:["cependant","car","ou"],d:3},{c1:"Il est riche",good:"néanmoins",c2:"il reste modeste",bad:["donc","car","ainsi"],d:3},
    {c1:"Il a menti",good:"or",c2:"personne ne le croit plus",bad:["car","donc","puis"],d:3},{c1:"Chauffe le beurre",good:"puis",c2:"ajoute la farine",bad:["car","mais","or"],d:3},
    {c1:"Il s'entraîne dur",good:"afin de",c2:"gagner",bad:["car","donc","mais"],d:3},{c1:"Il réussit",good:"grâce à",c2:"ses efforts",bad:["malgré","car","donc"],d:3},
    {c1:"Il sort",good:"malgré",c2:"la pluie",bad:["grâce à","car","donc"],d:3},{c1:"Reste ici",good:"jusqu'à ce que",c2:"je revienne",bad:["car","donc","mais"],d:3},{c1:"Il agit vite",good:"de peur de",c2:"perdre",bad:["afin de","car","donc"],d:3},
    {c1:"Il a tout révisé",good:"si bien qu'",c2:"il a eu la meilleure note",bad:["bien qu'","car","ou"],d:4},{c1:"Il est riche",good:"bien qu'",c2:"il vive simplement",bad:["parce qu'","donc","car"],d:4},
    {c1:"Tu peux entrer",good:"à condition que",c2:"tu enlèves tes chaussures",bad:["bien que","avant que","sans que"],d:4},{c1:"Il parle bas",good:"de sorte que",c2:"personne n'entende",bad:["parce que","donc","car"],d:4},
    {c1:"Nous manquons de temps",good:"c'est pourquoi",c2:"nous devons nous hâter",bad:["cependant","or","puis"],d:4},{c1:"Il a échoué",good:"faute d'",c2:"avoir révisé",bad:["grâce à","afin d'","car"],d:4},
    {c1:"Il pleuvait des cordes",good:"aussi",c2:"avons-nous annulé la sortie",bad:["car","mais","ou"],d:4},{c1:"Il s'est tu",good:"de crainte de",c2:"la vexer",bad:["afin de","grâce à","malgré"],d:4},
    {c1:"Elle a insisté",good:"tant et si bien qu'",c2:"il a cédé",bad:["bien qu'","car","ou"],d:4},{c1:"Il viendra",good:"pourvu qu'",c2:"il soit invité",bad:["bien qu'","avant qu'","sans qu'"],d:4},
    {c1:"Il agit ainsi",good:"non parce qu'",c2:"il le veut, mais par devoir",bad:["afin qu'","bien qu'","dès qu'"],d:4},{c1:"Il travaille dur",good:"en vue de",c2:"sa réussite",bad:["malgré","faute de","car"],d:4},{c1:"Il a plu",good:"si bien que",c2:"la rivière a débordé",bad:["bien que","car","ou"],d:4},
    {c1:"Il persévère",good:"nonobstant",c2:"les obstacles",bad:["grâce à","afin de","car"],d:5},{c1:"Il a renoncé",good:"faute de",c2:"moyens suffisants",bad:["grâce à","en vue de","malgré"],d:5},
    {c1:"Il resta calme",good:"quand bien même",c2:"tout s'effondrait",bad:["parce que","dès que","afin que"],d:5},{c1:"Il agit",good:"de manière que",c2:"chacun soit satisfait",bad:["parce que","car","donc"],d:5},
    {c1:"Il a été puni",good:"pour avoir",c2:"désobéi",bad:["afin d'","grâce à","malgré"],d:5},{c1:"Il parlait",good:"à mesure que",c2:"les idées lui venaient",bad:["bien que","afin que","sans que"],d:5},
    {c1:"Il réussit toujours",good:"quoi qu'",c2:"il entreprenne",bad:["bien qu'","dès qu'","parce qu'"],d:5},{c1:"Il se tut",good:"de sorte à",c2:"ne froisser personne",bad:["parce que","car","donc"],d:5},
    {c1:"Il accepta",good:"non sans",c2:"une certaine hésitation",bad:["grâce à","afin de","malgré"],d:5},{c1:"Il avança",good:"au fur et à mesure que",c2:"le sentier montait",bad:["bien que","afin que","sans que"],d:5},
    {c1:"Il obéit",good:"sous prétexte qu'",c2:"il n'avait pas le choix",bad:["bien qu'","afin qu'","dès qu'"],d:5},{c1:"Il triompha",good:"en dépit de",c2:"tous les pronostics",bad:["grâce à","au moyen de","car"],d:5},{c1:"Il renonça",good:"dès lors qu'",c2:"il comprit l'inutilité de la lutte",bad:["bien qu'","afin qu'","sans qu'"],d:5},
    {c1:"Il persista dans l'erreur",good:"partant",c2:"il en subit les conséquences",bad:["cependant","néanmoins","or"],d:6},{c1:"Il agit avec prudence",good:"eu égard à",c2:"la gravité de la situation",bad:["en dépit de","faute de","malgré"],d:6},
    {c1:"Il fut acquitté",good:"attendu qu'",c2:"aucune preuve ne l'accablait",bad:["bien qu'","afin qu'","dès qu'"],d:6},{c1:"Il céda",good:"non que",c2:"la peur l'emportât, mais par lassitude",bad:["parce que","bien que","dès que"],d:6},
    {c1:"Il œuvra sans relâche",good:"si tant est qu'",c2:"on puisse le croire",bad:["bien qu'","afin qu'","parce qu'"],d:6},{c1:"Il demeura serein",good:"quelque",c2:"redoutables que fussent les menaces",bad:["bien que","afin que","dès que"],d:6},
    {c1:"Il fut blâmé",good:"pour autant qu'",c2:"on pût en juger",bad:["bien qu'","afin qu'","dès qu'"],d:6},{c1:"Il avança ses arguments",good:"de telle sorte que",c2:"nul ne put le contredire",bad:["parce que","car","donc"],d:6},
    {c1:"Il fut épargné",good:"moyennant qu'",c2:"il livrât ses complices",bad:["bien qu'","afin qu'","dès qu'"],d:6},{c1:"Il resta ferme",good:"encore que",c2:"la tentation fût grande",bad:["parce que","dès que","afin que"],d:6},
    {c1:"Il conclut la paix",good:"à seule fin de",c2:"préserver son peuple",bad:["faute de","en dépit de","malgré"],d:6},{c1:"Il gouverna sagement",good:"en sorte que",c2:"le royaume prospérât",bad:["parce que","car","donc"],d:6},{c1:"Il fut réhabilité",good:"d'autant qu'",c2:"son innocence éclatait",bad:["bien qu'","afin qu'","dès qu'"],d:6}
  ];
  var CONN_FRAMES=["{C1} ___ {C2}.","Complète : {C1} ___ {C2}.","Choisis le connecteur : {C1} ___ {C2}.","Quel lien logique ? {C1} ___ {C2}."];
  function genConnecteurs(diff,cat,sub){
    var it=pick(bandFilter(CONN_ITEMS,diff,"d"));
    return { cat:cat, sub:sub, phrase:pick(CONN_FRAMES).replace("{C1}",it.c1).replace("{C2}",it.c2),
      hint:"Choisis le bon connecteur logique",
      note:"Connecteurs : cause (car, parce que), conséquence (donc, par conséquent, c'est pourquoi), opposition (mais, cependant, pourtant), but (afin de, pour que), condition (si, à condition que), concession (bien que, malgré).",
      options:build(it.good,it.bad.slice()), answer:0 };
  }

  function genGram(sub, diff, cat){
    if(sub==="Nature des mots") return genNature(diff,cat,sub);
    if(sub==="Déterminants") return genDeterminants(diff,cat,sub);
    if(sub==="Pronoms") return genPronoms(diff,cat,sub);
    if(sub==="Prépositions") return genPrep(diff,cat,sub);
    if(sub==="Accords") return genAccords(diff,cat,sub);
    if(sub==="Types de phrases") return genTypes(diff,cat,sub);
    if(sub==="Accord du participe passé") return genAccordPP(diff,cat,sub);
    if(sub==="Connecteurs logiques") return genConnecteurs(diff,cat,sub);
    if(sub==="Voix passive") return genVoixPassive(diff,cat,sub);
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
    {d:4,w:["courageux","brave","vaillant"]}, {d:5,w:["riche","fortuné","aisé"]},
    {d:2,w:["joli","mignon","charmant"]}, {d:3,w:["méchant","cruel","vil"]},
    {d:3,w:["froid","glacé","frais"]}, {d:2,w:["finir","terminer","achever"]},
    {d:3,w:["difficile","dur","ardu"]}, {d:4,w:["étrange","bizarre","curieux"]},
    {d:3,w:["montrer","présenter","exposer"]}, {d:4,w:["cacher","dissimuler","masquer"]},
    {d:2,w:["crier","hurler","brailler"]}, {d:5,w:["important","essentiel","capital"]},
    {d:3,w:["fabriquer","construire","bâtir"]}, {d:4,w:["ancien","vieux","antique"]}
  ];
  var SYN_DIST = ["triste","lent","petit","laid","finir","fort","méchant","lourd","bruyant","sombre","facile","vide","froid","sale","mou","pauvre","court","dur","faible","clair"];
  var CONTR = [
    {d:1,a:"grand",b:"petit"}, {d:1,a:"jour",b:"nuit"}, {d:1,a:"chaud",b:"froid"},
    {d:2,a:"vrai",b:"faux"}, {d:2,a:"ouvrir",b:"fermer"}, {d:2,a:"monter",b:"descendre"},
    {d:1,a:"rapide",b:"lent"}, {d:2,a:"content",b:"triste"}, {d:2,a:"propre",b:"sale"},
    {d:2,a:"plein",b:"vide"}, {d:2,a:"gagner",b:"perdre"}, {d:3,a:"devant",b:"derrière"},
    {d:3,a:"clair",b:"sombre"}, {d:3,a:"dur",b:"mou"}, {d:3,a:"riche",b:"pauvre"},
    {d:2,a:"haut",b:"bas"}, {d:3,a:"lourd",b:"léger"}, {d:4,a:"aimable",b:"désagréable"},
    {d:4,a:"autoriser",b:"interdire"}, {d:3,a:"début",b:"fin"},
    {d:1,a:"entrer",b:"sortir"}, {d:2,a:"acheter",b:"vendre"},
    {d:2,a:"dur",b:"mou"}, {d:1,a:"grand",b:"petit"},
    {d:3,a:"large",b:"étroit"}, {d:2,a:"aimer",b:"détester"},
    {d:3,a:"premier",b:"dernier"}, {d:4,a:"souvent",b:"rarement"},
    {d:2,a:"avancer",b:"reculer"}, {d:3,a:"mouillé",b:"sec"},
    {d:4,a:"courageux",b:"peureux"}, {d:2,a:"jeune",b:"vieux"},
    {d:3,a:"tôt",b:"tard"}, {d:5,a:"généreux",b:"avare"}
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
    {d:3,ph:"L'oiseau bat des ___ (pour voler).",good:"ailes",bad:["elles","aile","ails"]},
    {d:3,ph:"Le chat a mal à la ___ après le saut (partie du corps).",good:"patte",bad:["pâte","pate","pattes"]},
    {d:4,ph:"On fait des crêpes avec de la ___ (mélange à cuire).",good:"pâte",bad:["patte","pate","pâtes"]},
    {d:2,ph:"Le garçon lance le ___ à son chien (objet rond).",good:"ballon",bad:["balai","bâillon","ballons"]},
    {d:3,ph:"Le chat guette la petite ___ grise (rongeur).",good:"souris",bad:["sourit","sourie","souri"]},
    {d:4,ph:"Le prince épouse la belle ___ (fille du roi).",good:"reine",bad:["rêne","renne","reines"]},
    {d:5,ph:"Le renne tire le traîneau grâce à sa ___ (lanière de cuir).",good:"rêne",bad:["reine","renne","rênes"]},
    {d:4,ph:"Le chevalier porte une lourde ___ (protection de métal).",good:"armure",bad:["ramure","armurer","armures"]}
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
    {d:2,ph:"Un petit garçon est un ___.",good:"garçonnet",bad:["garçonne","garagiste","gaminet"]},
    {d:3,ph:"Une petite fille est une ___.",good:"fillette",bad:["filleul","filière","filet"]},
    {d:3,ph:"Celui qui chante est un ___.",good:"chanteur",bad:["chanson","chantier","chanteuse"]},
    {d:4,ph:"L'endroit où l'on vend des fleurs est la ___.",good:"fleuriste",bad:["fleurette","floraison","fleurir"]},
    {d:5,ph:"Avec le préfixe « in- », « utile » devient ___.",good:"inutile",bad:["réutile","utilité","utiliser"]},
    {d:3,ph:"Celui qui garde les buts est le ___.",good:"gardien",bad:["garderie","garage","gardienne"]},
    {d:2,ph:"Un petit ours est un ___.",good:"ourson",bad:["oursin","oursonne","ourage"]},
    {d:4,ph:"L'action de nager s'appelle la ___.",good:"natation",bad:["nageur","nageoire","nager"]},
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
    {d:3,ph:"Un bébé de la vache est un ___.",good:"veau",bad:["poulain","agneau","chevreau"]},
    {d:1,ph:"Pour dessiner, j'utilise un ___.",good:"crayon",bad:["couteau","marteau","balai"]},
    {d:1,ph:"Je lis un ___ passionnant.",good:"livre",bad:["verre","banc","seau"]},
    {d:2,ph:"On regarde un film à la ___.",good:"télévision",bad:["casserole","brouette","valise"]},
    {d:2,ph:"Pour se brosser les dents, j'utilise une ___.",good:"brosse",bad:["fourchette","assiette","cuillère"]},
    {d:3,ph:"Le boulanger fait cuire le pain dans le ___.",good:"four",bad:["frigo","lavabo","placard"]},
    {d:2,ph:"Un bébé de la poule est un ___.",good:"poussin",bad:["chaton","chiot","veau"]},
    {d:3,ph:"On achète des médicaments à la ___.",good:"pharmacie",bad:["boulangerie","librairie","boucherie"]},
    {d:2,ph:"Pour manger la soupe, je m'assois à ___.",good:"table",bad:["chaise","lampe","porte"]},
    {d:3,ph:"On garde le lait au ___.",good:"réfrigérateur",bad:["radiateur","grenier","garage"]},
    {d:4,ph:"L'élève écrit au tableau avec une ___.",good:"craie",bad:["gomme","règle","trousse"]}
  ];
  /* ---- Vocabulaire de niveau avancé (vers le C1) ---- */
  var IDIOM = [ // expressions idiomatiques
    {d:3,ph:"Il pleut des ___ (il pleut très fort).",good:"cordes",bad:["chats","gouttes","seaux"],note:"« Il pleut des cordes » = il pleut très fort."},
    {d:4,ph:"Avoir le ___ (être déprimé, triste).",good:"cafard",bad:["moral","spleen","bourdon"],note:"« Avoir le cafard » = être déprimé."},
    {d:4,ph:"Poser un ___ à quelqu'un (ne pas venir au rendez-vous).",good:"lapin",bad:["lièvre","chat","pigeon"],note:"« Poser un lapin » = ne pas venir à un rendez-vous."},
    {d:5,ph:"Donner sa langue au ___ (renoncer à deviner).",good:"chat",bad:["chien","loup","renard"],note:"« Donner sa langue au chat » = renoncer à trouver la réponse."},
    {d:3,ph:"Casser les ___ à quelqu'un (l'ennuyer).",good:"pieds",bad:["mains","bras","oreilles"],note:"« Casser les pieds » = ennuyer, importuner."},
    {d:5,ph:"Avoir un chat dans la ___ (être enroué).",good:"gorge",bad:["bouche","voix","tête"],note:"« Avoir un chat dans la gorge » = être enroué."},
    {d:4,ph:"Mettre la ___ à l'oreille (éveiller les soupçons).",good:"puce",bad:["mouche","abeille","fourmi"],note:"« Mettre la puce à l'oreille » = éveiller les soupçons."},
    {d:5,ph:"Il n'y a pas un ___ (il n'y a personne).",good:"chat",bad:["chien","rat","bruit"],note:"« Il n'y a pas un chat » = il n'y a personne."},
    {d:4,ph:"Tomber dans les ___ (s'évanouir).",good:"pommes",bad:["choux","poires","fraises"],note:"« Tomber dans les pommes » = s'évanouir."},
    {d:5,ph:"Couper les ___ en quatre (compliquer inutilement).",good:"cheveux",bad:["fils","poils","brins"],note:"« Couper les cheveux en quatre » = chercher des complications inutiles."},
    {d:6,ph:"En faire tout un ___ (exagérer un problème).",good:"fromage",bad:["gâteau","dessert","repas"],note:"« En faire tout un fromage » = exagérer l'importance d'une chose."},
    {d:4,ph:"Avoir la ___ verte (être doué pour le jardinage).",good:"main",bad:["patte","paume","poigne"],note:"« Avoir la main verte » = savoir s'occuper des plantes."},
    {d:5,ph:"Prendre ses ___ à son cou (s'enfuir vite).",good:"jambes",bad:["pieds","bras","talons"],note:"« Prendre ses jambes à son cou » = s'enfuir en courant."},
    {d:6,ph:"Appeler un chat un ___ (parler franchement).",good:"chat",bad:["félin","animal","matou"],note:"« Appeler un chat un chat » = nommer les choses franchement."}
  ];
  var REGISTRE = [ // registres de langue (familier / courant / soutenu)
    {d:5,ph:"En registre soutenu, « manger » se dit ___.",good:"se restaurer",bad:["bouffer","grailler","boulotter"],note:"« se restaurer » (soutenu) vs « bouffer » (familier)."},
    {d:5,ph:"En registre soutenu, « avoir peur » se dit ___.",good:"être effrayé",bad:["flipper","avoir les jetons","avoir la trouille"],note:"« être effrayé » (soutenu) vs « flipper » (familier)."},
    {d:4,ph:"En registre familier, « une voiture » se dit ___.",good:"une bagnole",bad:["un véhicule","une automobile","une berline"],note:"« bagnole » = familier ; « véhicule / automobile » = courant ou soutenu."},
    {d:6,ph:"En registre soutenu, « travailler » se dit ___.",good:"œuvrer",bad:["bosser","trimer","turbiner"],note:"« œuvrer » (soutenu) vs « bosser » (familier)."},
    {d:5,ph:"En registre soutenu, « se dépêcher » se dit ___.",good:"se hâter",bad:["se grouiller","se magner","se bouger"],note:"« se hâter » (soutenu) vs « se grouiller » (familier)."},
    {d:4,ph:"En registre familier, « de l'argent » se dit ___.",good:"du fric",bad:["des fonds","des espèces","des capitaux"],note:"« fric » = familier ; les autres relèvent du courant ou du soutenu."},
    {d:6,ph:"En registre soutenu, « content » se dit ___.",good:"ravi",bad:["aux anges","hyper content","trop bien"],note:"« ravi » (soutenu) ; « aux anges » (courant/familier)."},
    {d:5,ph:"En registre soutenu, « une maison » se dit ___.",good:"une demeure",bad:["une baraque","une piaule","une cabane"],note:"« demeure » (soutenu) vs « baraque » (familier)."},
    {d:5,ph:"En registre familier, « la tête » se dit ___.",good:"la caboche",bad:["le crâne","le visage","le front"],note:"« caboche » = familier."},
    {d:6,ph:"En registre soutenu, « comprendre » se dit ___.",good:"saisir",bad:["piger","capter","entraver"],note:"« saisir » (soutenu) ; « piger » (familier)."},
    {d:5,ph:"En registre soutenu, « fatigué » se dit ___.",good:"harassé",bad:["crevé","claqué","lessivé"],note:"« harassé » (soutenu) ; « crevé » (familier)."},
    {d:4,ph:"En registre familier, « un enfant » se dit ___.",good:"un gosse",bad:["un élève","un adolescent","un nourrisson"],note:"« gosse » = familier."},
    {d:6,ph:"En registre soutenu, « parler » se dit ___.",good:"s'exprimer",bad:["jacter","causer","baratiner"],note:"« s'exprimer » (soutenu) ; « jacter » (familier)."},
    {d:5,ph:"En registre soutenu, « beaucoup » se dit ___.",good:"considérablement",bad:["vachement","carrément","hyper"],note:"« considérablement » (soutenu) ; « vachement » (familier)."}
  ];
  var PARONYM = [ // paronymes (mots proches souvent confondus)
    {d:5,ph:"Un danger ___ nous menace (tout proche).",good:"imminent",bad:["éminent","immanent","imminant"],note:"« imminent » = tout proche ; « éminent » = remarquable."},
    {d:5,ph:"C'est un ___ professeur (remarquable).",good:"éminent",bad:["imminent","immanent","éminant"],note:"« éminent » = remarquable ; « imminent » = tout proche."},
    {d:6,ph:"La ___ économique est difficile (situation du moment).",good:"conjoncture",bad:["conjecture","conjointure","conjecure"],note:"« conjoncture » = situation ; « conjecture » = supposition."},
    {d:6,ph:"Ce n'est qu'une simple ___ (supposition).",good:"conjecture",bad:["conjoncture","conjointure","conjecure"],note:"« conjecture » = hypothèse ; « conjoncture » = contexte."},
    {d:6,ph:"Les cambrioleurs sont entrés par ___.",good:"effraction",bad:["infraction","réfraction","fraction"],note:"« effraction » = entrée par la force ; « infraction » = violation d'une règle."},
    {d:5,ph:"Il a commis une ___ au code de la route.",good:"infraction",bad:["effraction","réfraction","fraction"],note:"« infraction » = violation d'une règle ; « effraction » = entrée forcée."},
    {d:5,ph:"Le maire a prononcé une ___ (bref discours).",good:"allocution",bad:["allocation","élocution","allitération"],note:"« allocution » = discours ; « allocation » = somme d'argent versée."},
    {d:5,ph:"La famille reçoit une ___ familiale (aide financière).",good:"allocation",bad:["allocution","élocution","allitération"],note:"« allocation » = aide financière ; « allocution » = discours."},
    {d:5,ph:"L'acteur va ___ un poème (réciter avec emphase).",good:"déclamer",bad:["déclarer","proclamer","réclamer"],note:"« déclamer » = réciter avec emphase ; « déclarer » = affirmer."},
    {d:5,ph:"Le témoin doit ___ ce qu'il a vu (dire officiellement).",good:"déclarer",bad:["déclamer","proclamer","réclamer"],note:"« déclarer » = affirmer officiellement ; « déclamer » = réciter."},
    {d:6,ph:"Ce mot a une autre ___ (sens particulier).",good:"acception",bad:["acceptation","exception","acceptance"],note:"« acception » = sens d'un mot ; « acceptation » = fait d'accepter."},
    {d:6,ph:"J'attends ton ___ du contrat (fait d'accepter).",good:"acceptation",bad:["acception","exception","acceptance"],note:"« acceptation » = fait d'accepter ; « acception » = sens d'un mot."},
    {d:5,ph:"La ___ des deux voitures a fait du bruit (choc).",good:"collision",bad:["collusion","collation","colision"],note:"« collision » = choc ; « collusion » = entente secrète."},
    {d:6,ph:"On soupçonne une ___ entre les deux sociétés (entente secrète).",good:"collusion",bad:["collision","collation","colusion"],note:"« collusion » = entente frauduleuse ; « collision » = choc."}
  ];
  /* --- Synonymes & Contraires : générateurs PARTITIONNÉS par difficulté --- */
  var SYN_SETS=[
    // d1
    {d:1,w:["content","heureux","joyeux"]},{d:1,w:["grand","immense","géant"]},{d:1,w:["petit","minuscule","riquiqui"]},
    {d:1,w:["beau","joli","mignon"]},{d:1,w:["gentil","aimable","sympathique"]},{d:1,w:["rapide","vif","pressé"]},
    {d:1,w:["manger","dévorer","avaler"]},{d:1,w:["parler","discuter","bavarder"]},{d:1,w:["regarder","observer","fixer"]},
    {d:1,w:["drôle","amusant","rigolo"]},{d:1,w:["calme","tranquille","paisible"]},{d:1,w:["triste","malheureux","chagriné"]},{d:1,w:["fatigué","épuisé","las"]},
    // d2
    {d:2,w:["finir","terminer","achever"]},{d:2,w:["commencer","débuter","démarrer"]},{d:2,w:["crier","hurler","brailler"]},
    {d:2,w:["tomber","chuter","dégringoler"]},{d:2,w:["joli","ravissant","charmant"]},{d:2,w:["méchant","cruel","vilain"]},
    {d:2,w:["fort","puissant","robuste"]},{d:2,w:["facile","simple","aisé"]},{d:2,w:["aimer","adorer","apprécier"]},
    {d:2,w:["garder","conserver","préserver"]},{d:2,w:["montrer","présenter","exhiber"]},{d:2,w:["cacher","dissimuler","masquer"]},{d:2,w:["laid","moche","affreux"]},
    // d3
    {d:3,w:["peur","frayeur","crainte"]},{d:3,w:["maison","demeure","logis"]},{d:3,w:["dire","déclarer","affirmer"]},
    {d:3,w:["riche","fortuné","aisé"]},{d:3,w:["pauvre","démuni","miséreux"]},{d:3,w:["bête","stupide","idiot"]},
    {d:3,w:["malin","rusé","astucieux"]},{d:3,w:["courageux","brave","vaillant"]},{d:3,w:["bizarre","étrange","curieux"]},
    {d:3,w:["fabriquer","construire","bâtir"]},{d:3,w:["briller","luire","scintiller"]},{d:3,w:["vieux","âgé","ancien"]},{d:3,w:["chaud","brûlant","bouillant"]},
    // d4
    {d:4,w:["important","essentiel","crucial"]},{d:4,w:["difficile","ardu","compliqué"]},{d:4,w:["sombre","lugubre","morne"]},
    {d:4,w:["faible","fragile","chétif"]},{d:4,w:["rapidement","vite","promptement"]},{d:4,w:["comprendre","saisir","assimiler"]},
    {d:4,w:["énerver","agacer","irriter"]},{d:4,w:["détruire","démolir","anéantir"]},{d:4,w:["augmenter","accroître","intensifier"]},
    {d:4,w:["diminuer","réduire","baisser"]},{d:4,w:["célèbre","connu","renommé"]},{d:4,w:["étrange","insolite","singulier"]},{d:4,w:["gros","corpulent","volumineux"]},
    // d5
    {d:5,w:["audacieux","téméraire","intrépide"]},{d:5,w:["généreux","charitable","magnanime"]},{d:5,w:["avare","radin","pingre"]},
    {d:5,w:["paresseux","fainéant","indolent"]},{d:5,w:["travailleur","assidu","laborieux"]},{d:5,w:["honnête","intègre","probe"]},
    {d:5,w:["menteur","trompeur","fourbe"]},{d:5,w:["mélancolique","nostalgique","morose"]},{d:5,w:["abondant","copieux","foisonnant"]},
    {d:5,w:["rare","inhabituel","exceptionnel"]},{d:5,w:["ancien","antique","vétuste"]},{d:5,w:["brillant","éclatant","étincelant"]},{d:5,w:["puissant","fort","dominant"]},
    // d6
    {d:6,w:["éphémère","fugace","passager"]},{d:6,w:["sournois","hypocrite","perfide"]},{d:6,w:["loquace","bavard","volubile"]},
    {d:6,w:["taciturne","silencieux","renfermé"]},{d:6,w:["opulent","luxueux","fastueux"]},{d:6,w:["indigent","nécessiteux","besogneux"]},
    {d:6,w:["véloce","rapide","prompt"]},{d:6,w:["placide","serein","imperturbable"]},{d:6,w:["irascible","coléreux","irritable"]},
    {d:6,w:["sagace","perspicace","avisé"]},{d:6,w:["prodigue","dépensier","dispendieux"]},{d:6,w:["tenace","persévérant","opiniâtre"]},{d:6,w:["fallacieux","mensonger","trompeur"]}
  ];
  var CONTR_PAIRS=[
    {d:1,a:"grand",b:"petit"},{d:1,a:"jour",b:"nuit"},{d:1,a:"chaud",b:"froid"},{d:1,a:"rapide",b:"lent"},{d:1,a:"content",b:"triste"},
    {d:1,a:"propre",b:"sale"},{d:1,a:"plein",b:"vide"},{d:1,a:"ouvrir",b:"fermer"},{d:1,a:"monter",b:"descendre"},
    {d:2,a:"vrai",b:"faux"},{d:2,a:"gagner",b:"perdre"},{d:2,a:"entrer",b:"sortir"},{d:2,a:"acheter",b:"vendre"},{d:2,a:"aimer",b:"détester"},
    {d:2,a:"jeune",b:"vieux"},{d:2,a:"haut",b:"bas"},{d:2,a:"dur",b:"mou"},{d:2,a:"riche",b:"pauvre"},
    {d:3,a:"clair",b:"sombre"},{d:3,a:"lourd",b:"léger"},{d:3,a:"devant",b:"derrière"},{d:3,a:"début",b:"fin"},{d:3,a:"premier",b:"dernier"},
    {d:3,a:"large",b:"étroit"},{d:3,a:"mouillé",b:"sec"},{d:3,a:"tôt",b:"tard"},{d:3,a:"avancer",b:"reculer"},
    {d:4,a:"autoriser",b:"interdire"},{d:4,a:"aimable",b:"désagréable"},{d:4,a:"courageux",b:"peureux"},{d:4,a:"généreux",b:"avare"},{d:4,a:"accepter",b:"refuser"},
    {d:4,a:"réussir",b:"échouer"},{d:4,a:"construire",b:"détruire"},{d:4,a:"apparaître",b:"disparaître"},{d:4,a:"augmenter",b:"diminuer"},
    {d:5,a:"optimiste",b:"pessimiste"},{d:5,a:"sincère",b:"hypocrite"},{d:5,a:"prudent",b:"imprudent"},{d:5,a:"patient",b:"impatient"},{d:5,a:"actif",b:"passif"},
    {d:5,a:"souple",b:"rigide"},{d:5,a:"présent",b:"absent"},{d:5,a:"ancien",b:"récent"},{d:5,a:"visible",b:"invisible"},
    {d:6,a:"prolixe",b:"laconique"},{d:6,a:"docile",b:"rebelle"},{d:6,a:"épargner",b:"dilapider"},{d:6,a:"éphémère",b:"éternel"},{d:6,a:"humble",b:"orgueilleux"},
    {d:6,a:"licite",b:"illicite"},{d:6,a:"vénérer",b:"mépriser"},{d:6,a:"abonder",b:"manquer"},{d:6,a:"limpide",b:"opaque"}
  ];
  var SYN_FRAMES=["Un synonyme de « {W} » est ___.","« {W} » veut dire à peu près ___.","Trouve un mot proche de « {W} » : ___.","Quel mot ressemble le plus à « {W} » ? ___."];
  var CONTR_FRAMES=["Le contraire de « {W} » est ___.","« {W} », c'est l'inverse de ___.","Trouve le contraire de « {W} » : ___.","L'opposé de « {W} » est ___."];
  var _synAll=null, _contrAll=null;
  function synAll(){ if(!_synAll){ _synAll=[]; SYN_SETS.forEach(function(s){ s.w.forEach(function(x){ _synAll.push(x); }); }); } return _synAll; }
  function contrAll(){ if(!_contrAll){ _contrAll=[]; CONTR_PAIRS.forEach(function(p){ _contrAll.push(p.a,p.b); }); } return _contrAll; }
  function sampleAway(pool, exclude, k){
    var out=[], seen={}; exclude.forEach(function(x){ seen[norm(x)]=1; });
    for(var t=0;t<300 && out.length<k;t++){ var x=pick(pool); if(!seen[norm(x)]){ seen[norm(x)]=1; out.push(x); } }
    return out;
  }
  function bandFilter(list, diff, key){
    var pool=list.filter(function(x){return x[key]===diff;});
    for(var w=1;w<=5 && pool.length<3;w++) pool=list.filter(function(x){return Math.abs(x[key]-diff)<=w;});
    return pool;
  }
  function genSynonymes(diff,cat,sub){
    var g=pick(bandFilter(SYN_SETS,diff,"d")), word=g.w[0], good=pick(g.w.slice(1));
    return { cat:cat, sub:sub, phrase:pick(SYN_FRAMES).replace("{W}",word), hint:"Trouve un mot de sens PROCHE",
      note:"Un synonyme est un mot de sens PROCHE : « "+g.w.slice(1).join(" », « ")+" » ≈ « "+word+" ».",
      options:build(good, sampleAway(synAll(), g.w, 3)), answer:0 };
  }
  function genContraires(diff,cat,sub){
    var c=pick(bandFilter(CONTR_PAIRS,diff,"d")), fwd=rint(2), w=fwd?c.a:c.b, good=fwd?c.b:c.a;
    var bad=sampleAway(contrAll().concat(["pareil","identique","semblable"]), [c.a,c.b], 3);
    return { cat:cat, sub:sub, phrase:pick(CONTR_FRAMES).replace("{W}",w), hint:"Trouve le mot de sens OPPOSÉ",
      note:"Un antonyme a le sens OPPOSÉ : « "+c.a+" » ↔ « "+c.b+" ».", options:build(good,bad), answer:0 };
  }

  function genVoc(sub, diff, cat){
    if(sub==="Synonymes") return genSynonymes(diff,cat,sub);
    if(sub==="Contraires") return genContraires(diff,cat,sub);
    if(sub==="Homonymes") return fromGood(pickByDiff(HOMO,diff),"Choisis le bon homonyme",cat,sub);
    if(sub==="Familles de mots") return fromGood(pickByDiff(FAMILLE,diff),"Même famille de mots",cat,sub);
    if(sub==="Expressions idiomatiques") return fromGood(pickByDiff(IDIOM,diff),"Complète l'expression imagée",cat,sub);
    if(sub==="Registres de langue") return fromGood(pickByDiff(REGISTRE,diff),"Registre de langue",cat,sub);
    if(sub==="Paronymes") return fromGood(pickByDiff(PARONYM,diff),"Paronymes (mots proches à ne pas confondre)",cat,sub);
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
    {d:3,ph:"Le chat ___ caché sous le lit.",good:"est",bad:["et","es","ait"],note:"est / et"},
    {d:4,ph:"Des bonbons ? Il ___ a beaucoup.",good:"en",bad:["an","ent","end"],note:"en / an"},
    {d:5,ph:"Range tes jouets ___ de partir.",good:"avant",bad:["avent","avan","avans"],note:"avant / avent"},
    {d:4,ph:"Je ne sais pas ___ elle habite.",good:"où",bad:["ou","houx","oût"],note:"où / ou"},
    {d:3,ph:"___ chien aboie toute la nuit.",good:"Ce",bad:["Se","Ces","Ceux"],note:"ce / se"},
    {d:5,ph:"Elles ___ promènent au parc.",good:"se",bad:["ce","ses","c'est"],note:"se / ce"},
    {d:4,ph:"C'___ une très belle histoire.",good:"est",bad:["es","ait","et"],note:"c'est"},
    {d:5,ph:"Il range ___ jouets dans la boîte.",good:"ses",bad:["ces","c'est","s'est"],note:"ses / ces"},
    {d:5,ph:"Le chat ___ blessé en tombant.",good:"s'est",bad:["c'est","ses","ces"],note:"s'est / c'est"},
    {d:3,ph:"Tu joues ___ moi aujourd'hui.",good:"avec",bad:["avek","avéc","avecque"],note:"avec"}
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
    {d:5,ph:"Les enfants ont ___ toute la journée.",good:"joué",bad:["jouer","jouez","jouaient"],note:"participe après « ont »"},
    {d:3,ph:"Je viens de ___ mes devoirs.",good:"finir",bad:["fini","finis","finit"],note:"infinitif après « de »"},
    {d:4,ph:"Elle a ___ une belle chanson.",good:"chanté",bad:["chanter","chantez","chantée"],note:"participe (avoir, pas d'accord)"},
    {d:3,ph:"Il ne faut pas ___ dans le couloir.",good:"courir",bad:["couru","courez","courrai"],note:"infinitif après « pas »"},
    {d:5,ph:"Les fleurs ont ___ au printemps.",good:"poussé",bad:["pousser","poussez","poussaient"],note:"participe après « ont »"},
    {d:4,ph:"Nous voulons ___ à ce jeu.",good:"jouer",bad:["joué","jouez","jouons"],note:"infinitif après « voulons »"},
    {d:3,ph:"Tu vas ___ un dessin magnifique.",good:"dessiner",bad:["dessiné","dessinez","dessinais"],note:"infinitif après « vas »"},
    {d:5,ph:"Elle est ___ très tôt ce matin.",good:"arrivée",bad:["arriver","arrivé","arrivez"],note:"participe (être, accord au féminin)"},
    {d:4,ph:"J'ai ___ mon parapluie à la maison.",good:"oublié",bad:["oublier","oubliez","oubliée"],note:"participe après « ai »"}
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
    {d:5,ph:"On boit une ___ chaude.",good:"crème",bad:["créme","crëme","creme"],note:"accent grave"},
    {d:3,ph:"La ___ coule dans la vallée (cours d'eau).",good:"rivière",bad:["riviere","rivierre","riviére"],note:"accent grave"},
    {d:2,ph:"Le ___ garde les moutons.",good:"berger",bad:["bérger","bergér","bèrger"],note:"un seul accent"},
    {d:4,ph:"Il traverse la ___ pour aller à l'école.",good:"forêt",bad:["foret","forét","fôret"],note:"accent circonflexe"},
    {d:3,ph:"Le ___ apporte le courrier.",good:"facteur",bad:["fàcteur","factèur","facteùr"],note:"pas d'accent"},
    {d:4,ph:"Ma ___ prépare le dîner (maman de mon père).",good:"mère",bad:["mere","mére","mèrre"],note:"accent grave"},
    {d:5,ph:"On écrit avec un ___ électronique aujourd'hui.",good:"écran",bad:["ecran","écrân","écrant"],note:"accent aigu au début"},
    {d:2,ph:"Le ___ est très haut dans le ciel.",good:"nuage",bad:["nüage","nuagé","nuàge"],note:"pas d'accent"},
    {d:3,ph:"J'aime beaucoup ce ___ salé (nourriture).",good:"repas",bad:["répas","repàs","repâs"],note:"pas d'accent"}
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
    {d:5,ph:"Les ___ du château.",good:"travaux",bad:["travails","traveaux","travaus"],note:"pluriel de travail"},
    {d:2,ph:"Trois ___ jouent dans le jardin.",good:"chiens",bad:["chien","chiennes","chimens"],note:"pluriel simple en -s"},
    {d:3,ph:"Les ___ de la classe sont neufs.",good:"cartables",bad:["cartable","cartaux","cartablons"],note:"pluriel simple en -s"},
    {d:4,ph:"Deux ___ traversent la rivière.",good:"bateaux",bad:["bateau","batteaux","bateaus"],note:"pluriel en -eaux"},
    {d:3,ph:"Les ___ chantent au printemps.",good:"oiseaux",bad:["oiseau","oizeaux","oiseaus"],note:"pluriel en -eaux"},
    {d:4,ph:"Papa répare les ___ de la voiture.",good:"pneus",bad:["pneux","pneaux","pneus'"],note:"pluriel en -s (pas -x)"},
    {d:5,ph:"Le berger garde ses ___.",good:"agneaux",bad:["agneau","agneaus","agnaux"],note:"pluriel en -eaux"},
    {d:3,ph:"Les ___ portent une carapace.",good:"escargots",bad:["escargot","escargaux","escargotes"],note:"pluriel simple en -s"},
    {d:4,ph:"On visite deux ___ magnifiques.",good:"châteaux",bad:["château","chateaux","châteaus"],note:"pluriel en -eaux"},
    {d:5,ph:"Les ___ de mer sont salés.",good:"coraux",bad:["corails","coreaux","coraus"],note:"pluriel en -aux"}
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
    {d:4,ph:"Elle range sa ___.",good:"chambre",bad:["chanbre","chambr","chembre"],note:"m devant b"},
    {d:2,ph:"Le ___ pousse dans le jardin (long légume vert).",good:"concombre",bad:["conconbre","conconbré","concombr"],note:"m devant b"},
    {d:3,ph:"Le vent fait ___ les feuilles.",good:"trembler",bad:["trenbler","tremblér","trambler"],note:"m devant b"},
    {d:4,ph:"Le ___ souffle très fort aujourd'hui.",good:"tempête",bad:["tenpête","tempéte","tampête"],note:"m devant p"},
    {d:3,ph:"L'arbre projette son ___ sur le sol.",good:"ombre",bad:["onbre","ombré","ambre"],note:"m devant b"},
    {d:4,ph:"Écris le ___ vingt en chiffres.",good:"nombre",bad:["nonbre","nombré","nanbre"],note:"m devant b"},
    {d:2,ph:"Il faut ___ à la corde à la récré.",good:"grimper",bad:["grinper","grimpér","grimpper"],note:"m devant p"},
    {d:3,ph:"L'école recommence en ___.",good:"septembre",bad:["septenbre","septembré","septambre"],note:"m devant b"},
    {d:4,ph:"Je cueille une ___ bien mûre (petit fruit rouge).",good:"framboise",bad:["franboise","framboisé","framboize"],note:"m devant b"}
  ];
  /* ---- Orthographe de niveau avancé (vers le C1) ---- */
  var HOMOG = [ // homophones GRAMMATICAUX avancés
    {d:4,ph:"Je me demande ___ heure il est.",good:"quelle",bad:["qu'elle","quel","quels"],note:"« quelle » = déterminant interrogatif (féminin) ; « qu'elle » = que + elle."},
    {d:5,ph:"Je crois ___ viendra demain.",good:"qu'elle",bad:["quelle","quel","quels"],note:"« qu'elle » = que + elle ; « quelle » = déterminant."},
    {d:4,ph:"___ tu seras grand, tu comprendras.",good:"Quand",bad:["Quant","Qu'en","Camp"],note:"« quand » = lorsque ; « quant à » = en ce qui concerne ; « qu'en » = que + en."},
    {d:5,ph:"___ à moi, je préfère rester.",good:"Quant",bad:["Quand","Qu'en","Camp"],note:"« quant à » = en ce qui concerne."},
    {d:6,ph:"___ penses-tu ? (= que + en)",good:"Qu'en",bad:["Quand","Quant","Camp"],note:"« qu'en » = que + en (Qu'en penses-tu ?)."},
    {d:4,ph:"Les enfants rangent ___ jouets.",good:"leurs",bad:["leur","leures","l'heure"],note:"« leurs » (déterminant pluriel : plusieurs jouets) ; « leur » (singulier ou pronom)."},
    {d:5,ph:"Je ___ ai donné un cadeau.",good:"leur",bad:["leurs","l'heure","leures"],note:"« leur » pronom personnel (= à eux) est INVARIABLE."},
    {d:4,ph:"Il ___ a pris sans permission.",good:"l'a",bad:["la","là","las"],note:"« l'a » = le/la + a (avoir) ; « la » = déterminant ; « là » = lieu."},
    {d:4,ph:"Pose le livre ___, sur l'étagère.",good:"là",bad:["la","l'a","las"],note:"« là » indique le lieu ; « la » = déterminant."},
    {d:5,ph:"Elle ___ venir si elle veut.",good:"peut",bad:["peux","peu","peus"],note:"« peut » (il/elle) ; « peux » (je/tu) ; « peu » = petite quantité."},
    {d:4,ph:"Il mange très ___.",good:"peu",bad:["peut","peux","peus"],note:"« peu » = petite quantité ; « peut/peux » = verbe pouvoir."},
    {d:5,ph:"Le train est ___ à partir.",good:"prêt",bad:["près","prés","prêts"],note:"« prêt » = préparé ; « près » = à côté."},
    {d:4,ph:"Assieds-toi ___ de moi.",good:"près",bad:["prêt","prés","prêts"],note:"« près de » = à côté ; « prêt » = préparé."},
    {d:5,ph:"___ ne me dérange pas du tout.",good:"Ça",bad:["Sa","Çà","Sà"],note:"« ça » = cela ; « sa » = déterminant possessif."},
    {d:4,ph:"Il prend ___ veste et s'en va.",good:"sa",bad:["ça","çà","sà"],note:"« sa » = possessif (sa veste) ; « ça » = cela."},
    {d:6,ph:"Il est ___ malade qu'il reste couché.",good:"si",bad:["s'y","ci","scie"],note:"« si » = tellement ; « s'y » = se + y."}
  ];
  var ADVMENT = [ // formation des adverbes en -ment
    {d:3,ph:"lent → il avance ___.",good:"lentement",bad:["lentment","lenteument","lengtement"],note:"Adjectif au féminin (lente) + -ment."},
    {d:3,ph:"rapide → il court ___.",good:"rapidement",bad:["rapidment","rapidemant","rapiddement"],note:"Adjectif terminé par -e : on ajoute simplement -ment."},
    {d:3,ph:"doux → elle parle ___.",good:"doucement",bad:["douxment","doucemant","douçement"],note:"On part du féminin (douce) + -ment."},
    {d:4,ph:"heureux → ils vivent ___.",good:"heureusement",bad:["heureuxment","heureusment","heureusemant"],note:"Féminin (heureuse) + -ment."},
    {d:4,ph:"franc → réponds ___.",good:"franchement",bad:["francment","franchemant","frankement"],note:"Féminin (franche) + -ment."},
    {d:5,ph:"vrai → il est ___ gentil.",good:"vraiment",bad:["vraiement","vraîment","vraimant"],note:"Adjectif terminé par une voyelle : -ment sans « e » (vrai → vraiment)."},
    {d:5,ph:"poli → il salue ___.",good:"poliment",bad:["poliement","polîment","polimment"],note:"Adjectif en voyelle (poli) → + -ment, sans « e »."},
    {d:4,ph:"prudent → il conduit ___.",good:"prudemment",bad:["prudamment","prudentment","prudement"],note:"Adjectif en -ent → adverbe en -emment (se prononce « aman »)."},
    {d:5,ph:"évident → c'est ___ faux.",good:"évidemment",bad:["évidamment","évidentment","évidement"],note:"Adjectif en -ent → -emment."},
    {d:4,ph:"courant → cela arrive ___.",good:"couramment",bad:["courrament","couramant","courantment"],note:"Adjectif en -ant → adverbe en -amment."},
    {d:5,ph:"suffisant → il gagne ___.",good:"suffisamment",bad:["suffisament","suffisemment","suffisantment"],note:"Adjectif en -ant → -amment."},
    {d:5,ph:"précis → il vise ___.",good:"précisément",bad:["précisement","précisètment","precisément"],note:"Féminin (précise) + -ment, avec accent : précisément."},
    {d:4,ph:"gentil → il répond ___.",good:"gentiment",bad:["gentillement","gentimment","gentiement"],note:"« gentil » donne exceptionnellement « gentiment »."},
    {d:6,ph:"absolu → c'est ___ interdit.",good:"absolument",bad:["absoluement","absolumment","absolüment"],note:"Adjectif en -u : + -ment (absolument)."}
  ];
  /* --- Pluriels : générateur PARTITIONNÉ par difficulté --- */
  var PLUR_WORDS=[
    // d1 : pluriel simple en -s
    {s:"chat",p:"chats",d:1},{s:"chien",p:"chiens",d:1},{s:"table",p:"tables",d:1},{s:"livre",p:"livres",d:1},
    {s:"fleur",p:"fleurs",d:1},{s:"vélo",p:"vélos",d:1},{s:"ami",p:"amis",d:1},{s:"jouet",p:"jouets",d:1},
    {s:"école",p:"écoles",d:1},{s:"stylo",p:"stylos",d:1},{s:"porte",p:"portes",d:1},{s:"sac",p:"sacs",d:1},{s:"lit",p:"lits",d:1},
    // d2 : -eau/-eu → -x
    {s:"gâteau",p:"gâteaux",d:2},{s:"bateau",p:"bateaux",d:2},{s:"chapeau",p:"chapeaux",d:2},{s:"oiseau",p:"oiseaux",d:2},
    {s:"jeu",p:"jeux",d:2},{s:"feu",p:"feux",d:2},{s:"cheveu",p:"cheveux",d:2},{s:"tableau",p:"tableaux",d:2},
    {s:"manteau",p:"manteaux",d:2},{s:"cadeau",p:"cadeaux",d:2},{s:"drapeau",p:"drapeaux",d:2},{s:"rideau",p:"rideaux",d:2},{s:"noyau",p:"noyaux",d:2},
    // d3 : -al → -aux
    {s:"cheval",p:"chevaux",d:3},{s:"journal",p:"journaux",d:3},{s:"animal",p:"animaux",d:3},{s:"hôpital",p:"hôpitaux",d:3},
    {s:"bocal",p:"bocaux",d:3},{s:"signal",p:"signaux",d:3},{s:"canal",p:"canaux",d:3},{s:"général",p:"généraux",d:3},
    {s:"local",p:"locaux",d:3},{s:"métal",p:"métaux",d:3},{s:"rival",p:"rivaux",d:3},{s:"végétal",p:"végétaux",d:3},{s:"minéral",p:"minéraux",d:3},
    // d4 : -ou (surtout -ous, exceptions -oux)
    {s:"trou",p:"trous",d:4},{s:"clou",p:"clous",d:4},{s:"sou",p:"sous",d:4},{s:"fou",p:"fous",d:4},
    {s:"verrou",p:"verrous",d:4},{s:"bijou",p:"bijoux",d:4},{s:"caillou",p:"cailloux",d:4},{s:"chou",p:"choux",d:4},
    {s:"genou",p:"genoux",d:4},{s:"hibou",p:"hiboux",d:4},{s:"joujou",p:"joujoux",d:4},{s:"pou",p:"poux",d:4},{s:"matou",p:"matous",d:4},
    // d5 : -ail (-ails vs -aux)
    {s:"détail",p:"détails",d:5},{s:"chandail",p:"chandails",d:5},{s:"rail",p:"rails",d:5},{s:"éventail",p:"éventails",d:5},
    {s:"portail",p:"portails",d:5},{s:"travail",p:"travaux",d:5},{s:"vitrail",p:"vitraux",d:5},{s:"corail",p:"coraux",d:5},
    {s:"émail",p:"émaux",d:5},{s:"bail",p:"baux",d:5},{s:"soupirail",p:"soupiraux",d:5},{s:"gouvernail",p:"gouvernails",d:5},{s:"épouvantail",p:"épouvantails",d:5},
    // d6 : exceptions et invariables (distracteurs explicites)
    {s:"œil",p:"yeux",d:6,bad:["œils","yeus","oeils"]},{s:"monsieur",p:"messieurs",d:6,bad:["monsieurs","messieur","monsieux"]},
    {s:"madame",p:"mesdames",d:6,bad:["madames","mesdame","medames"]},{s:"pneu",p:"pneus",d:6,bad:["pneux","pneaux","pnaus"]},
    {s:"bleu",p:"bleus",d:6,bad:["bleux","bleaux","blues"]},{s:"landau",p:"landaus",d:6,bad:["landaux","landeaux","landeaus"]},
    {s:"festival",p:"festivals",d:6,bad:["festivaux","festivales","festivaus"]},{s:"carnaval",p:"carnavals",d:6,bad:["carnavaux","carnavales","carnavaus"]},
    {s:"récital",p:"récitals",d:6,bad:["récitaux","récitales","récitaus"]},{s:"nez",p:"nez",d:6,bad:["nezs","nés","néz"]},
    {s:"prix",p:"prix",d:6,bad:["prixs","pris","prixes"]},{s:"croix",p:"croix",d:6,bad:["croixs","crois","croies"]},{s:"gaz",p:"gaz",d:6,bad:["gazs","gazes","gas"]}
  ];
  var PLUR_FRAMES=["Le pluriel de « {S} » est ___.","Au pluriel, « {S} » devient ___.","Plusieurs « {S} » → des ___.","Écris « {S} » au pluriel : ___."];
  function plurBad(sing, plur){
    var c=[sing, sing+"s", sing+"x", sing+"es",
      sing.replace(/al$/,"als"), sing.replace(/al$/,"aux"),
      sing.replace(/(eau|au|eu)$/,"$1s"), sing.replace(/(eu|au)$/,"$1x"),
      sing.replace(/ou$/,"ous"), sing.replace(/ou$/,"oux"),
      sing.replace(/ail$/,"ails"), sing.replace(/ail$/,"aux")];
    var out=[], seen={}; seen[norm(plur)]=1;
    shuffle(c);
    for(var i=0;i<c.length && out.length<3;i++){ if(!seen[norm(c[i])]){ seen[norm(c[i])]=1; out.push(c[i]); } }
    return out;
  }
  function genPluriels(diff,cat,sub){
    var it=pick(bandFilter(PLUR_WORDS,diff,"d"));
    var bad=it.bad?it.bad.slice():plurBad(it.s,it.p);
    return { cat:cat, sub:sub, phrase:pick(PLUR_FRAMES).replace("{S}",it.s), hint:"Écris le bon pluriel",
      note:"Pluriels : -al→-aux, -eau/-eu→-x, -ou→-s (sauf bijou, caillou, chou, genou, hibou, joujou, pou → -x), -ail→-ails (sauf travail, vitrail, corail… → -aux).",
      options:build(it.p, bad), answer:0 };
  }

  /* --- Adverbes en -ment : générateur PARTITIONNÉ par difficulté --- */
  var ADV_WORDS=[
    // d1 : féminin + -ment (+ cas courants)
    {a:"lent",v:"lentement",d:1},{a:"rapide",v:"rapidement",d:1},{a:"doux",v:"doucement",d:1},
    {a:"poli",v:"poliment",d:1,bad:["poliement","polîment","polimment"]},{a:"joli",v:"joliment",d:1,bad:["joliement","joliment","jolimment"]},
    {a:"calme",v:"calmement",d:1},{a:"triste",v:"tristement",d:1},{a:"grand",v:"grandement",d:1},
    {a:"fort",v:"fortement",d:1},{a:"gentil",v:"gentiment",d:1,bad:["gentillement","gentimment","gentiement"]},
    {a:"sage",v:"sagement",d:1},{a:"timide",v:"timidement",d:1},{a:"vrai",v:"vraiment",d:1,bad:["vraiement","vraîment","vraimment"]},
    // d2
    {a:"heureux",v:"heureusement",d:2},{a:"franc",v:"franchement",d:2},{a:"sérieux",v:"sérieusement",d:2},
    {a:"courageux",v:"courageusement",d:2},{a:"joyeux",v:"joyeusement",d:2},{a:"léger",v:"légèrement",d:2},
    {a:"complet",v:"complètement",d:2},{a:"premier",v:"premièrement",d:2},{a:"dernier",v:"dernièrement",d:2},
    {a:"entier",v:"entièrement",d:2},{a:"régulier",v:"régulièrement",d:2},{a:"naturel",v:"naturellement",d:2},{a:"réel",v:"réellement",d:2},
    // d3
    {a:"précis",v:"précisément",d:3},{a:"énorme",v:"énormément",d:3},{a:"profond",v:"profondément",d:3},
    {a:"commun",v:"communément",d:3},{a:"immense",v:"immensément",d:3},{a:"aveugle",v:"aveuglément",d:3},
    {a:"obscur",v:"obscurément",d:3},{a:"vif",v:"vivement",d:3,bad:["vifment","vivment","viveument"]},{a:"long",v:"longuement",d:3,bad:["longment","longuemment","longeument"]},
    {a:"bref",v:"brièvement",d:3,bad:["brefment","brièfement","brievemment"]},{a:"gai",v:"gaiement",d:3,bad:["gaiment","gaîement","gaiemment"]},{a:"mou",v:"mollement",d:3,bad:["moument","molement","moument"]},{a:"fou",v:"follement",d:3,bad:["fouement","folement","foulement"]},
    // d4 : -ant → -amment, -ent → -emment
    {a:"prudent",v:"prudemment",d:4},{a:"courant",v:"couramment",d:4},{a:"évident",v:"évidemment",d:4},
    {a:"suffisant",v:"suffisamment",d:4},{a:"patient",v:"patiemment",d:4},{a:"violent",v:"violemment",d:4},
    {a:"fréquent",v:"fréquemment",d:4},{a:"apparent",v:"apparemment",d:4},{a:"constant",v:"constamment",d:4},
    {a:"savant",v:"savamment",d:4},{a:"méchant",v:"méchamment",d:4},{a:"brillant",v:"brillamment",d:4},{a:"élégant",v:"élégamment",d:4},
    // d5 : -u → -ûment (exceptions) + soutenu
    {a:"absolu",v:"absolument",d:5,bad:["absoluement","absolumment","absolûment"]},{a:"résolu",v:"résolument",d:5,bad:["résoluement","résolumment","résolûment"]},
    {a:"assidu",v:"assidûment",d:5,bad:["assidument","assiduement","assidumment"]},{a:"goulu",v:"goulûment",d:5,bad:["goulument","gouluement","goulumment"]},
    {a:"continu",v:"continûment",d:5,bad:["continument","continuement","continumment"]},{a:"cru",v:"crûment",d:5,bad:["crument","cruement","crumment"]},
    {a:"éperdu",v:"éperdument",d:5,bad:["éperduement","éperdûment","éperdumment"]},{a:"ingénu",v:"ingénument",d:5,bad:["ingénuement","ingénûment","ingénumment"]},
    {a:"hardi",v:"hardiment",d:5,bad:["hardiement","hardîment","hardimment"]},{a:"aisé",v:"aisément",d:5},{a:"spontané",v:"spontanément",d:5},
    {a:"sincère",v:"sincèrement",d:5},{a:"énergique",v:"énergiquement",d:5},
    // d6 : -ent → -emment (soutenu)
    {a:"décent",v:"décemment",d:6},{a:"récent",v:"récemment",d:6},{a:"négligent",v:"négligemment",d:6},
    {a:"diligent",v:"diligemment",d:6},{a:"éloquent",v:"éloquemment",d:6},{a:"conscient",v:"consciemment",d:6},
    {a:"innocent",v:"innocemment",d:6},{a:"excellent",v:"excellemment",d:6},{a:"pertinent",v:"pertinemment",d:6},
    {a:"différent",v:"différemment",d:6},{a:"insolent",v:"insolemment",d:6},{a:"ardent",v:"ardemment",d:6},{a:"impertinent",v:"impertinemment",d:6}
  ];
  var ADV_FRAMES=["« {A} » → il agit ___.","L'adverbe formé sur « {A} » est ___.","« {A} » donne l'adverbe ___.","Il le fait ___ (adjectif : {A})."];
  function advBad(a, v){
    var c=[a+"ment", a+"ement", v.replace(/emment$/,"ament"), v.replace(/amment$/,"emment"),
      v.replace(/ément$/,"ement"), v.replace(/ment$/,"mment"), v.replace(/é/g,"e")];
    var out=[], seen={}; seen[norm(v)]=1; shuffle(c);
    for(var i=0;i<c.length && out.length<3;i++){ if(c[i] && norm(c[i])!==norm(v) && !seen[norm(c[i])]){ seen[norm(c[i])]=1; out.push(c[i]); } }
    var extra=[a+"emment", a+"amment", v+"e"];
    for(var j=0;j<extra.length && out.length<3;j++){ if(!seen[norm(extra[j])]){ seen[norm(extra[j])]=1; out.push(extra[j]); } }
    return out;
  }
  function genAdverbes(diff,cat,sub){
    var it=pick(bandFilter(ADV_WORDS,diff,"d"));
    var bad=it.bad?it.bad.slice():advBad(it.a,it.v);
    return { cat:cat, sub:sub, phrase:pick(ADV_FRAMES).replace("{A}",it.a), hint:"Forme l'adverbe en -ment",
      note:"Adverbe en -ment : adjectif au féminin + -ment (lente→lentement). En -ant → -amment, en -ent → -emment, terminé par une voyelle → + -ment (vrai→vraiment).",
      options:build(it.v, bad), answer:0 };
  }

  /* --- « é ou er » : générateur PARTITIONNÉ (verbe + complément par difficulté) --- */
  var ER_ITEMS=[
    {inf:"manger",o:"une pomme",d:1},{inf:"chanter",o:"une chanson",d:1},{inf:"dessiner",o:"un soleil",d:1},
    {inf:"jouer",o:"du piano",d:1},{inf:"écouter",o:"la radio",d:1},{inf:"fermer",o:"la fenêtre",d:1},
    {inf:"laver",o:"les mains",d:1},{inf:"donner",o:"un cadeau",d:1},{inf:"montrer",o:"le dessin",d:1},
    {inf:"arroser",o:"les plantes",d:1},{inf:"coller",o:"une image",d:1},{inf:"ranger",o:"les jouets",d:1},{inf:"porter",o:"un sac",d:1},
    {inf:"préparer",o:"le dîner",d:2},{inf:"décorer",o:"la salle",d:2},{inf:"raconter",o:"une blague",d:2},
    {inf:"attraper",o:"le ballon",d:2},{inf:"chercher",o:"la clé",d:2},{inf:"gagner",o:"la partie",d:2},
    {inf:"garder",o:"le secret",d:2},{inf:"réparer",o:"le vélo",d:2},{inf:"planter",o:"un arbre",d:2},
    {inf:"saluer",o:"le voisin",d:2},{inf:"inviter",o:"un ami",d:2},{inf:"terminer",o:"le travail",d:2},{inf:"pousser",o:"la brouette",d:2},
    {inf:"expliquer",o:"la règle",d:3},{inf:"oublier",o:"le rendez-vous",d:3},{inf:"comparer",o:"les prix",d:3},
    {inf:"imaginer",o:"une suite",d:3},{inf:"mélanger",o:"les couleurs",d:3},{inf:"calculer",o:"la somme",d:3},
    {inf:"séparer",o:"les équipes",d:3},{inf:"photographier",o:"le paysage",d:3},{inf:"organiser",o:"la fête",d:3},
    {inf:"transporter",o:"les caisses",d:3},{inf:"observer",o:"les étoiles",d:3},{inf:"deviner",o:"la réponse",d:3},{inf:"recopier",o:"le texte",d:3},
    {inf:"bricoler",o:"une étagère",d:4},{inf:"envelopper",o:"le colis",d:4},{inf:"gaspiller",o:"l'eau",d:4},
    {inf:"esquisser",o:"un plan",d:4},{inf:"naviguer",o:"sur le lac",d:4},{inf:"respirer",o:"l'air pur",d:4},
    {inf:"épingler",o:"la note",d:4},{inf:"feuilleter",o:"le livre",d:4},{inf:"griffonner",o:"un mot",d:4},
    {inf:"savourer",o:"le repas",d:4},{inf:"contempler",o:"l'horizon",d:4},{inf:"dévorer",o:"le gâteau",d:4},{inf:"effleurer",o:"la surface",d:4},
    {inf:"accélérer",o:"l'allure",d:5},{inf:"apprécier",o:"le geste",d:5},{inf:"chuchoter",o:"un secret",d:5},
    {inf:"éparpiller",o:"les feuilles",d:5},{inf:"gesticuler",o:"sans cesse",d:5},{inf:"gribouiller",o:"un croquis",d:5},
    {inf:"trébucher",o:"sur la marche",d:5},{inf:"virevolter",o:"dans l'air",d:5},{inf:"ricaner",o:"bêtement",d:5},
    {inf:"scruter",o:"le lointain",d:5},{inf:"esquiver",o:"le coup",d:5},{inf:"consoler",o:"un camarade",d:5},{inf:"colporter",o:"une rumeur",d:5},
    {inf:"amadouer",o:"le gardien",d:6},{inf:"déambuler",o:"dans la rue",d:6},{inf:"enjôler",o:"l'auditoire",d:6},
    {inf:"fanfaronner",o:"devant tous",d:6},{inf:"jubiler",o:"en secret",d:6},{inf:"magnifier",o:"l'instant",d:6},
    {inf:"pérorer",o:"à la tribune",d:6},{inf:"saccager",o:"le jardin",d:6},{inf:"tergiverser",o:"sans fin",d:6},
    {inf:"vociférer",o:"des injures",d:6},{inf:"gambader",o:"dans le pré",d:6},{inf:"louvoyer",o:"habilement",d:6},{inf:"préconiser",o:"la prudence",d:6}
  ];
  var ERE_PART=["{S} a ___ {O}.","Hier, {S} a ___ {O}.","{S} a bien ___ {O}."];
  var ERE_INF=["{S} va ___ {O}.","{S} doit ___ {O}.","{S} veut ___ {O}."];
  var ERE_SUBJ=["il","elle","on","Léa","Paul","Tom"];
  function genErE(diff,cat,sub){
    var it=pick(bandFilter(ER_ITEMS,diff,"d")), base=it.inf.slice(0,-2);
    var forms={er:it.inf, part:base+"é", ez:base+"ez", ait:base+"ait"};
    var infMode=(rint(2)===0), S=pick(ERE_SUBJ);
    var frame=pick(infMode?ERE_INF:ERE_PART).replace("{S}",S).replace("{O}",it.o);
    var good=infMode?forms.er:forms.part;
    var bad=[forms.er,forms.part,forms.ez,forms.ait].filter(function(x){return x!==good;});
    return { cat:cat, sub:sub, phrase:cap(frame), hint:"« -er » (infinitif) ou « -é » (participe) ?",
      note:"Après un auxiliaire (a, est…) → participe en -é ; après un autre verbe (va, doit, veut) → infinitif en -er. Test : remplace par « vendu » (-é) ou « vendre » (-er).",
      options:build(good,bad), answer:0 };
  }

  function genOrt(sub, diff, cat){
    var it, hint;
    if(sub==="Pluriels") return genPluriels(diff,cat,sub);
    if(sub==="Adverbes en -ment") return genAdverbes(diff,cat,sub);
    if(sub==="é ou er") return genErE(diff,cat,sub);
    if(sub==="Homophones"){ it=pickByDiff(HOMOPH,diff); hint="Homophones ("+it.note+")"; }
    else if(sub==="é ou er"){ it=pickByDiff(ER_E,diff); hint="é (participe) ou er (infinitif) ?"; }
    else if(sub==="Accents"){ it=pickByDiff(ACCENTS,diff); hint="Orthographe : "+it.note; }
    else if(sub==="Pluriels"){ it=pickByDiff(PLUR,diff); hint="Écris le bon pluriel"; }
    else if(sub==="m devant m, b, p"){ it=pickByDiff(MBP,diff); hint="Règle m devant m, b, p"; }
    else if(sub==="Homophones grammaticaux"){ it=pickByDiff(HOMOG,diff); hint="Homophones grammaticaux"; }
    else if(sub==="Adverbes en -ment"){ it=pickByDiff(ADVMENT,diff); hint="Forme l'adverbe en -ment"; }
    else { it=pickByDiff(HOMOPH,diff); hint="Orthographe"; }
    return { cat:cat, sub:sub, phrase:it.ph, hint:hint, note:it.note||"", options:build(it.good, it.bad.slice()), answer:0 };
  }

  /* ======================================================================= */
  /*                            DISPATCH                                      */
  /* ======================================================================= */
  var CATS=["conjugaison","grammaire","vocabulaire","orthographe"];
  var SUBS_BY_CAT={
    conjugaison:CONJ_SUBS,
    grammaire:["Nature des mots","Déterminants","Pronoms","Prépositions","Accords","Types de phrases",
      "Accord du participe passé","Connecteurs logiques","Voix passive"],
    vocabulaire:["Synonymes","Contraires","Homonymes","Familles de mots","Mots du quotidien",
      "Expressions idiomatiques","Registres de langue","Paronymes"],
    orthographe:["Homophones","é ou er","Accents","Pluriels","m devant m, b, p",
      "Homophones grammaticaux","Adverbes en -ment"]
  };

  /* ======================================================================= */
  /*            EXPLICATIONS (rappel de la règle, cf. Historique)            */
  /* ======================================================================= */
  var RULES_TENSE = {
    present:"Présent de l'indicatif : action actuelle ou habituelle. 1er groupe : -e, -es, -e, -ons, -ez, -ent.",
    imparfait:"Imparfait : description ou habitude dans le passé. Terminaisons : -ais, -ais, -ait, -ions, -iez, -aient.",
    futur:"Futur simple : action à venir. Terminaisons ajoutées à l'infinitif : -ai, -as, -a, -ons, -ez, -ont.",
    passe:"Passé composé : auxiliaire « avoir » ou « être » au présent + participe passé. Avec « être », le participe s'accorde avec le sujet.",
    cond:"Conditionnel présent : souhait, politesse ou hypothèse. Radical du futur + terminaisons de l'imparfait (-ais, -ait…).",
    subj:"Subjonctif présent : après « que » (volonté, doute, nécessité). Ex. « que je parle, que nous parlions ».",
    imper:"Impératif : ordre ou conseil, sans sujet. Au 1er groupe, « tu » ne prend pas de -s (Mange !).",
    pqp:"Plus-que-parfait : action passée ANTÉRIEURE à une autre. Auxiliaire à l'imparfait (avais/étais…) + participe passé.",
    condp:"Conditionnel passé : action qui aurait pu se produire. Auxiliaire au conditionnel (aurais/serais…) + participe passé.",
    subjp:"Subjonctif passé : après « que », pour une action accomplie. Auxiliaire au subjonctif (aie/sois…) + participe passé.",
    futa:"Futur antérieur : action future ACHEVÉE avant une autre. Auxiliaire au futur (aurai/serai…) + participe passé."
  };
  var RULES_SUB = {
    "Nature des mots":"La nature (classe) d'un mot : nom, verbe, adjectif, adverbe, déterminant, pronom, préposition ou conjonction.",
    "Déterminants":"Le déterminant précède le nom et s'accorde avec lui en genre et en nombre (le, la, un, des, mon, ce…).",
    "Pronoms":"Le pronom remplace un nom ou un groupe nominal (il, lui, leur, qui, que, dont, où…).",
    "Prépositions":"La préposition relie des mots (à, de, en, dans, sur, pour, par…) ; le bon choix dépend du contexte.",
    "Accords":"L'adjectif s'accorde en genre et en nombre avec le nom qu'il qualifie.",
    "Types de phrases":"Types : déclarative, interrogative, exclamative, impérative ; formes : affirmative ou négative.",
    "Accord du participe passé":"Avec « être » → accord avec le sujet. Avec « avoir » → accord avec le COD placé AVANT le verbe, sinon invariable.",
    "Connecteurs logiques":"Les connecteurs relient les idées : cause (car, parce que), conséquence (donc, par conséquent), opposition (mais, cependant), but (afin que), concession (bien que)…",
    "Voix passive":"Voix passive : « être » (au temps voulu) + participe passé accordé avec le sujet (Le chat mange la souris → La souris est mangée par le chat).",
    "Synonymes":"Un synonyme est un mot de sens PROCHE.",
    "Contraires":"Un antonyme (contraire) a le sens OPPOSÉ.",
    "Homonymes":"Les homonymes se prononcent pareil mais s'écrivent différemment ; le sens dépend du contexte.",
    "Familles de mots":"Les mots d'une même famille partagent un radical commun (jardin, jardinier, jardinet…).",
    "Mots du quotidien":"Vocabulaire courant : choisis le mot qui correspond exactement à la définition.",
    "Expressions idiomatiques":"Une expression idiomatique a un sens imagé, différent du sens littéral des mots.",
    "Registres de langue":"On distingue les registres familier, courant et soutenu selon la situation de communication.",
    "Paronymes":"Les paronymes se ressemblent mais ont des sens différents (éminent / imminent, collision / collusion…).",
    "Homophones":"Homophones : mêmes sons, orthographes différentes ; le choix dépend de la fonction dans la phrase.",
    "é ou er":"Après un auxiliaire (a, est…) → participe en -é ; après une préposition ou « il faut » → infinitif en -er. Test : remplace par « vendu » (é) ou « vendre » (er).",
    "Accents":"Attention aux accents (é, è, ê) : leur présence ou leur absence change l'orthographe du mot.",
    "Pluriels":"Pluriels particuliers : -al → -aux, -eau/-eu → -x, -ou → -s (sauf bijou, caillou, chou, genou, hibou, joujou, pou → -x).",
    "m devant m, b, p":"Devant m, b ou p, on écrit « m » au lieu de « n » (tomber, chambre, emporter). Exceptions : bonbon, embonpoint, néanmoins.",
    "Homophones grammaticaux":"Le choix dépend de la nature du mot : quel/qu'elle, quand/quant/qu'en, leur/leurs, la/l'a/là, peu/peut/peux, près/prêt…",
    "Adverbes en -ment":"Adjectif au féminin + -ment (lente→lentement). En -ant → -amment, en -ent → -emment, terminé par une voyelle → +ment (vrai→vraiment)."
  };
  function ruleFor(cat, sub, tense){
    if(cat==="conjugaison"){ var t = tense || SUB_TO_TENSE[sub]; return RULES_TENSE[t] || RULES_SUB[sub] || ""; }
    return RULES_SUB[sub] || "";
  }
  function composeExplain(q){
    var base = ruleFor(q.cat, q.sub, q.tense);
    var extra = (q.note && norm(q.note)!==norm(base)) ? q.note : "";
    var s = base || "";
    if(extra) s += (s? "  ➜ " : "") + extra;
    return s;
  }

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
    q.explain = composeExplain(q);   // rappel de la règle pour l'Historique
    return q;
  }

  global.Questions = { generate:generate, SUBS_BY_CAT:SUBS_BY_CAT, CATS:CATS, ruleFor:ruleFor };
  if (typeof module !== "undefined" && module.exports) { module.exports = global.Questions; }
})(typeof window !== "undefined" ? window : this);
