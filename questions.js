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
    reg1("chanter",["une chanson","juste","en chœur","à voix haute"]),
    reg1("danser",["la salsa","toute la nuit","ensemble","en rythme"]),
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
    reg2("grandir",["vite","beaucoup","en taille","chaque jour"]),
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
    irr("venir",{ etre:true, pp:"venu", comp:["au zoo","avec nous","à la fête","de loin"],
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
      imper:{tu:"pars",nous:"partons",vous:"partez"} })
  ];

  var TENSE_LABEL = { present:"au présent", passe:"au passé composé", imparfait:"à l'imparfait",
    futur:"au futur simple", cond:"au conditionnel présent", subj:"au subjonctif présent", imper:"à l'impératif" };
  var SUB_TO_TENSE = { "Présent":"present","Passé composé":"passe","Futur":"futur","Imparfait":"imparfait",
    "Impératif":"imper","Subjonctif":"subj","Conditionnel présent":"cond" };
  var CONJ_SUBS = Object.keys(SUB_TO_TENSE);

  var TIME = {
    present:["En ce moment","Aujourd'hui","Maintenant","Chaque jour","Souvent"],
    passe:["Hier","Ce matin","La semaine dernière","L'an dernier"],
    imparfait:["Autrefois","Avant","Chaque été","À cette époque"],
    futur:["Demain","Bientôt","L'année prochaine","Plus tard"]
  };
  // Déclencheurs de subjonctif qui forment une phrase COMPLÈTE (pas « bien que… »
  // qui exigerait une proposition principale).
  var SUBJ_TRIG = ["Il faut que","Il faudrait que","Je veux que","J'aimerais que","Il vaut mieux que","Je souhaite que"];
  // élision « que » → « qu' » devant voyelle (qu'il, qu'elle, qu'ils…)
  function subjHead(trig, disp){
    if(/que$/.test(trig) && vowel(disp[0])) return trig.slice(0,-1)+"'"+disp;
    return trig+" "+disp;
  }
  // Amorces de conditionnel valables avec N'IMPORTE QUEL sujet.
  var COND_HEAD = ["Si c'était possible,","Si on le pouvait,","Dans ce cas,","Un jour peut-être,"];

  var VK={present:"pres",imparfait:"imp",futur:"fut",cond:"cond",subj:"subj"};
  function pform(v,tense,pi){ return v[VK[tense]][pi]; }

  // Choisit une liste de sujets selon la difficulté.
  function subjectsFor(diff){
    if(diff<=2) return ["je","tu","il","elle"];
    if(diff<=4) return ["je","tu","il","elle","nous","vous","ils","elles"];
    return ["je","tu","il","elle","nous","vous","ils","elles","on"];
  }
  function verbsFor(diff, tense){
    var pool=VERBS.filter(function(v){
      if(tense==="subj") return v.g!==1;              // au subjonctif, -er = indicatif → exclu
      if(tense==="imper" && v.noImper) return false;  // pas d'impératif pour « pouvoir »
      return true;
    });
    if(diff<=2) return pool.filter(function(v){ return v.g===1; }).concat(pool.filter(function(v){return v.g===2;})).slice(0, 20) ;
    if(diff<=4) return pool;
    return pool.filter(function(v){ return v.g===3 || v.etre || v.g===2; }); // niveaux durs → irréguliers/être
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
    else if(tense==="cond"){ phrase = pick(COND_HEAD)+" "+withSubj(S.d,"___")+(comp?" "+comp:"")+"."; }
    else {
      var tm=TIME[tense]?pick(TIME[tense]):"";
      var body = withSubj(S.d,"___")+(comp?" "+comp:"")+".";
      phrase = tm ? (tm+" "+body) : cap(body);
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
    var phrase = cap("___ "+(comp?comp+" ":"")+"!");
    return { cat:cat, sub:sub, tense:"imper", phrase:phrase,
      hint:"Conjugue « "+v.inf+" » à l'impératif "+whoLabel, options:build(correct,pool), answer:0 };
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
    var tm=pick(TIME.passe);
    var phrase=cap(tm+" "+withSubj(S.d,"___")+(comp?" "+comp:"")+".");
    return { cat:cat, sub:sub, tense:"passe", phrase:phrase, hint:hint, options:build(correct,pool), answer:0 };
  }

  /* ======================================================================= */
  /*                            GRAMMAIRE                                     */
  /* ======================================================================= */
  var NATURE = [
    {w:"noir",n:"adjectif",ph:"Dans « le chat noir », « noir » est un ___."},
    {w:"vite",n:"adverbe",ph:"Dans « il court vite », « vite » est un ___."},
    {w:"chien",n:"nom",ph:"« chien » est un ___."},
    {w:"manger",n:"verbe",ph:"« manger » est un ___."},
    {w:"de",n:"préposition",ph:"Dans « la niche de Léo », « de » est une ___."},
    {w:"grand",n:"adjectif",ph:"Dans « un grand arbre », « grand » est un ___."},
    {w:"lentement",n:"adverbe",ph:"« lentement » est un ___."},
    {w:"elle",n:"pronom",ph:"Dans « elle chante », « elle » est un ___."},
    {w:"le",n:"déterminant",ph:"Dans « le lion », « le » est un ___."},
    {w:"sous",n:"préposition",ph:"Dans « sous la table », « sous » est une ___."},
    {w:"rapide",n:"adjectif",ph:"Dans « un zèbre rapide », « rapide » est un ___."},
    {w:"souvent",n:"adverbe",ph:"« souvent » est un ___."},
    {w:"girafe",n:"nom",ph:"« girafe » est un ___."},
    {w:"nager",n:"verbe",ph:"« nager » est un ___."},
    {w:"mais",n:"conjonction",ph:"Dans « petit mais fort », « mais » est une ___."}
  ];
  var NATURE_OPTS=["nom","verbe","adjectif","adverbe","préposition","pronom","déterminant","conjonction"];
  var DET = [
    {ph:"___ chat dort sur le canapé.",good:"Le",bad:["Les","Des","Aux"]},
    {ph:"J'ai vu ___ oiseaux dans le ciel.",good:"des",bad:["de","du","le"]},
    {ph:"___ amie est très gentille.",good:"Mon",bad:["Ma","Mes","Me"]},
    {ph:"Il n'a pas ___ argent.",good:"d'",bad:["de","des","du"]},
    {ph:"___ enfants jouent dehors.",good:"Les",bad:["Le","La","L'"]},
    {ph:"Je veux ___ eau, s'il te plaît.",good:"de l'",bad:["du","de la","des"]},
    {ph:"___ girafe mange des feuilles.",good:"La",bad:["Le","Les","L'"]},
    {ph:"Regarde ___ étoiles !",good:"ces",bad:["cet","cette","ce"]},
    {ph:"___ éléphant est énorme.",good:"Cet",bad:["Ce","Cette","Ces"]},
    {ph:"Prends ___ crayons.",good:"tes",bad:["ton","ta","te"]}
  ];
  var PRON = [
    {ph:"La personne ___ vient d'arriver est mon oncle.",good:"qui",bad:["que","dont","où"]},
    {ph:"Le livre ___ je t'ai parlé est génial.",good:"dont",bad:["que","qui","où"]},
    {ph:"C'est la ville ___ je suis né.",good:"où",bad:["que","dont","qui"]},
    {ph:"Le gâteau ___ tu as fait est délicieux.",good:"que",bad:["qui","dont","où"]},
    {ph:"Range tes affaires : ___ traînent partout.",good:"elles",bad:["ils","eux","leur"]},
    {ph:"Donne-___ le ballon.",good:"lui",bad:["le","la","leur"]},
    {ph:"Je pense à mes amis, je ___ écris souvent.",good:"leur",bad:["les","leurs","lui"]},
    {ph:"Ce vélo est à moi, c'est le ___.",good:"mien",bad:["mon","mienne","miens"]}
  ];
  var PREP = [
    {ph:"Je vais ___ Paris cet été.",good:"à",bad:["au","en","dans"]},
    {ph:"Il habite ___ Portugal.",good:"au",bad:["en","à","aux"]},
    {ph:"Nous partons ___ vacances.",good:"en",bad:["à","dans","aux"]},
    {ph:"Le chat est ___ la table.",good:"sous",bad:["sur","dans","à"]},
    {ph:"Elle vient ___ Espagne.",good:"d'",bad:["de","du","des"]},
    {ph:"Range le livre ___ ton sac.",good:"dans",bad:["à","en","sur"]},
    {ph:"Je pars ___ train.",good:"en",bad:["à","dans","de"]},
    {ph:"Il joue ___ le jardin.",good:"dans",bad:["à","en","sur"]},
    {ph:"Ce cadeau est ___ toi.",good:"pour",bad:["par","à","de"]},
    {ph:"Nous allons ___ États-Unis.",good:"aux",bad:["au","en","à"]}
  ];
  var ACCORD = [
    {ph:"Les fleurs sont ___.",good:"belles",bad:["belle","beau","beaux"]},
    {ph:"Elle porte une robe ___.",good:"verte",bad:["vert","verts","vertes"]},
    {ph:"Les lions sont ___.",good:"forts",bad:["fort","forte","fortes"]},
    {ph:"Des amies ___ sont venues.",good:"gentilles",bad:["gentil","gentille","gentils"]},
    {ph:"Mes chaussures sont ___.",good:"neuves",bad:["neuf","neuve","neufs"]},
    {ph:"Une histoire ___.",good:"amusante",bad:["amusant","amusants","amusantes"]},
    {ph:"Les garçons sont ___.",good:"contents",bad:["content","contente","contentes"]},
    {ph:"Ces pommes sont ___.",good:"mûres",bad:["mûr","mûre","mûrs"]}
  ];
  var TYPES = [
    {ph:"« Quelle belle journée ! » est une phrase ___.",good:"exclamative",bad:["interrogative","déclarative","impérative"]},
    {ph:"« Où vas-tu ? » est une phrase ___.",good:"interrogative",bad:["exclamative","déclarative","impérative"]},
    {ph:"« Ferme la porte. » est une phrase ___.",good:"impérative",bad:["interrogative","exclamative","déclarative"]},
    {ph:"« Le chat dort. » est une phrase ___.",good:"déclarative",bad:["interrogative","exclamative","impérative"]},
    {ph:"« Ne cours pas. » est une phrase ___.",good:"négative",bad:["affirmative","interrogative","exclamative"]}
  ];
  function fromGood(item, hint, cat, sub){
    return { cat:cat, sub:sub, phrase:item.ph, hint:hint, options:build(item.good, item.bad.slice()), answer:0 };
  }
  function genGram(sub, diff, cat){
    if(sub==="Nature des mots"){ var it=pick(NATURE);
      var bad=shuffle(NATURE_OPTS.filter(function(o){return o!==it.n;})).slice(0,3);
      return { cat:cat, sub:sub, phrase:it.ph, hint:"Donne la nature (classe) du mot", options:build(it.n,bad), answer:0 }; }
    if(sub==="Déterminants") return fromGood(pick(DET),"Choisis le bon déterminant",cat,sub);
    if(sub==="Pronoms") return fromGood(pick(PRON),"Choisis le bon pronom",cat,sub);
    if(sub==="Prépositions") return fromGood(pick(PREP),"Choisis la bonne préposition",cat,sub);
    if(sub==="Accords") return fromGood(pick(ACCORD),"Accorde correctement (genre et nombre)",cat,sub);
    if(sub==="Types de phrases") return fromGood(pick(TYPES),"Quel type de phrase ?",cat,sub);
    return fromGood(pick(DET),"Grammaire",cat,sub);
  }

  /* ======================================================================= */
  /*                            VOCABULAIRE                                   */
  /* ======================================================================= */
  var SYN = [ ["content","heureux","joyeux"],["rapide","vif","preste"],["grand","immense","vaste"],
    ["beau","joli","ravissant"],["débuter","commencer","démarrer"],["parler","discuter","bavarder"],
    ["fatigué","épuisé","las"],["gentil","aimable","sympathique"],["drôle","amusant","comique"],
    ["calme","paisible","tranquille"],["malin","rusé","astucieux"],["peur","frayeur","crainte"],
    ["maison","demeure","logis"],["regarder","observer","contempler"],["manger","dévorer","déguster"] ];
  var SYN_DIST = ["triste","lent","petit","laid","finir","fort","méchant","lourd","bruyant","sombre","facile","vide"];
  var CONTR = [ ["grand","petit"],["jour","nuit"],["chaud","froid"],["vrai","faux"],["ouvrir","fermer"],
    ["monter","descendre"],["rapide","lent"],["content","triste"],["propre","sale"],["plein","vide"],
    ["gagner","perdre"],["devant","derrière"],["clair","sombre"],["dur","mou"],["riche","pauvre"] ];
  // Homonymes : chaque phrase donne un indice de sens ; les distracteurs sont
  // de vrais homophones (mêmes sons, sens différent).
  var HOMO = [
    {ph:"On se baigne dans la ___ (grande étendue d'eau salée).",good:"mer",bad:["mère","maire","mers"]},
    {ph:"Ma ___ me lit une histoire (ma maman).",good:"mère",bad:["mer","maire","mères"]},
    {ph:"Un ___ de terre creuse le sol (petit animal mou).",good:"ver",bad:["verre","vert","vers"]},
    {ph:"Je bois de l'eau dans un ___ (récipient).",good:"verre",bad:["ver","vert","vers"]},
    {ph:"Les élèves jouent dans la ___ de l'école (espace extérieur).",good:"cour",bad:["cours","court","courre"]},
    {ph:"Le boulanger vend du ___ (aliment doré).",good:"pain",bad:["pin","peint","pains"]},
    {ph:"On remplit le ___ d'eau (récipient à anse).",good:"seau",bad:["sceau","sot","saut"]},
    {ph:"Le fermier laboure son ___ (grand terrain).",good:"champ",bad:["chant","champs","chants"]},
    {ph:"Le soir, papa me lit un ___ de fées (histoire).",good:"conte",bad:["compte","comte","contes"]},
    {ph:"Il était une ___, un lion rêvait de liberté (autrefois).",good:"fois",bad:["foi","foie","foies"]}
  ];
  var FAMILLE = [
    {ph:"Un petit jardin est un ___.",good:"jardinet",bad:["jardinier","jardinage","jardiner"]},
    {ph:"Celui qui s'occupe du jardin est le ___.",good:"jardinier",bad:["jardinet","jardinage","jardin"]},
    {ph:"Une petite maison est une ___.",good:"maisonnette",bad:["maisonnée","maçon","manoir"]},
    {ph:"Avec le préfixe « dé- », le verbe « faire » devient ___.",good:"défaire",bad:["refaire","parfaire","forfait"]},
    {ph:"Celui qui joue est un ___.",good:"joueur",bad:["jouet","jouable","jeu"]},
    {ph:"Un petit chat est un ___.",good:"chaton",bad:["chatte","chatière","chatton"]},
    {ph:"Celui qui coiffe les cheveux est le ___.",good:"coiffeur",bad:["coiffe","coiffure","coiffé"]},
    {ph:"L'action de laver s'appelle le ___.",good:"lavage",bad:["laveur","lavable","laver"]}
  ];
  var QUOTIDIEN = [
    {ph:"Pour écrire, j'utilise un ___.",good:"stylo",bad:["balai","verre","oreiller"]},
    {ph:"Pour voir la nuit, j'allume une ___.",good:"lampe",bad:["assiette","chaise","fourchette"]},
    {ph:"On dort dans un ___.",good:"lit",bad:["four","évier","placard"]},
    {ph:"On se lave les mains avec du ___.",good:"savon",bad:["sucre","sable","sel"]},
    {ph:"Le facteur apporte le ___.",good:"courrier",bad:["dîner","ballon","cartable"]},
    {ph:"Un bébé chien est un ___.",good:"chiot",bad:["chaton","poulain","agneau"]},
    {ph:"Un bébé chat est un ___.",good:"chaton",bad:["chiot","veau","poussin"]},
    {ph:"On range les livres dans une ___.",good:"bibliothèque",bad:["baignoire","casserole","brouette"]}
  ];
  function genVoc(sub, diff, cat){
    if(sub==="Synonymes"){
      var g=pick(SYN), word=g[0], good=pick(g.slice(1));
      var bad=shuffle(SYN_DIST.slice()).slice(0,3);
      return { cat:cat, sub:sub, phrase:"Un synonyme de « "+word+" » est ___.", hint:"Trouve un mot de sens PROCHE", options:build(good,bad), answer:0 };
    }
    if(sub==="Contraires"){
      var c=pick(CONTR), fwd=rint(2), w=c[fwd], good=c[1-fwd];
      var bad=shuffle(["pareil","semblable"].concat(SYN_DIST).filter(function(x){return x!==good&&x!==w;})).slice(0,3);
      return { cat:cat, sub:sub, phrase:"Le contraire de « "+w+" » est ___.", hint:"Trouve le mot de sens OPPOSÉ", options:build(good,bad), answer:0 };
    }
    if(sub==="Homonymes") return fromGood(pick(HOMO),"Choisis le bon homonyme",cat,sub);
    if(sub==="Familles de mots") return fromGood(pick(FAMILLE),"Même famille de mots",cat,sub);
    return fromGood(pick(QUOTIDIEN),"Mot du quotidien",cat,sub);
  }

  /* ======================================================================= */
  /*                            ORTHOGRAPHE                                   */
  /* ======================================================================= */
  var HOMOPH = [
    {ph:"Elle ___ partie à l'école.",good:"est",bad:["et","es","ait"],note:"est / et"},
    {ph:"Paul ___ Marie sont amis.",good:"et",bad:["est","ait","ai"],note:"et / est"},
    {ph:"Il joue ___ la balle.",good:"à",bad:["a","as","ah"],note:"à / a"},
    {ph:"Il ___ mangé une pomme.",good:"a",bad:["à","as","ah"],note:"a / à"},
    {ph:"Les oiseaux ___ dans le ciel.",good:"sont",bad:["son","s'ont","sonts"],note:"sont / son"},
    {ph:"Il a mis ___ manteau.",good:"son",bad:["sont","sons","s'on"],note:"son / sont"},
    {ph:"Tu ___ mon meilleur ami.",good:"es",bad:["est","et","ai"],note:"es / est"},
    {ph:"Je ne sais pas ___ il est.",good:"où",bad:["ou","houx","oux"],note:"où / ou"},
    {ph:"Tu veux du thé ___ du café ?",good:"ou",bad:["où","houx","oût"],note:"ou / où"},
    {ph:"___ sont mes clés.",good:"Ce",bad:["Se","Ceux","Ces"],note:"ce / se"},
    {ph:"Il ___ lave les mains.",good:"se",bad:["ce","ceux","ces"],note:"se / ce"},
    {ph:"C'est ___ livre préféré.",good:"mon",bad:["mont","m'ont","mons"],note:"mon"}
  ];
  var ER_E = [
    {ph:"Je vais ___ une pomme.",good:"manger",bad:["mangé","mangez","mangeais"],note:"infinitif après « à/de/vais »"},
    {ph:"Il a ___ son travail.",good:"terminé",bad:["terminer","terminez","terminés"],note:"participe après « a »"},
    {ph:"Nous allons ___ prudents.",good:"être",bad:["été","étai","étais"],note:"infinitif après « allons »"},
    {ph:"Elle a ___ la porte.",good:"fermé",bad:["fermer","fermez","fermée"],note:"participe (avoir, pas d'accord)"},
    {ph:"Il faut ___ pour réussir.",good:"travailler",bad:["travaillé","travaillez","travaillait"],note:"infinitif après « faut »"},
    {ph:"J'ai ___ le film hier.",good:"regardé",bad:["regarder","regardez","regardais"],note:"participe après « ai »"},
    {ph:"Tu dois ___ tes devoirs.",good:"faire",bad:["fait","faites","faisait"],note:"infinitif après « dois »"}
  ];
  var ACCENTS = [
    {ph:"J'ai mangé un ___ au chocolat (dessert).",good:"gâteau",bad:["gateau","gâteaux","gatô"],note:"accent circonflexe"},
    {ph:"L'___ écoute le maître en classe.",good:"élève",bad:["eleve","élêve","èleve"],note:"accents é/è"},
    {ph:"La ___ est ouverte.",good:"fenêtre",bad:["fenetre","fenètre","fênetre"],note:"accent circonflexe"},
    {ph:"On mange à la ___.",good:"cantine",bad:["cantîne","cäntine","cantiné"],note:"pas d'accent"},
    {ph:"Le ___ brille.",good:"soleil",bad:["soléil","sôleil","soleïl"],note:"pas d'accent"},
    {ph:"Il a de la ___.",good:"fièvre",bad:["fievre","fiêvre","fièvré"],note:"accent grave"}
  ];
  var PLUR = [
    {ph:"J'ai vu trois ___.",good:"chevaux",bad:["chevals","chevaus","chevaual"],note:"pluriel de cheval"},
    {ph:"Les ___ sont fermés.",good:"journaux",bad:["journals","journeaux","journaus"],note:"pluriel en -aux"},
    {ph:"Regarde ces beaux ___.",good:"bijoux",bad:["bijous","bijoues","bijeaux"],note:"pluriel en -oux"},
    {ph:"Deux ___ jouent.",good:"hiboux",bad:["hibous","hibouxs","hibeaux"],note:"pluriel en -oux"},
    {ph:"Les ___ du jardin.",good:"cailloux",bad:["caillous","cailloues","caillaux"],note:"pluriel en -oux"},
    {ph:"Plusieurs ___ colorés.",good:"vitraux",bad:["vitrails","vitreaux","vitraus"],note:"pluriel en -aux"},
    {ph:"Trois ___ gris.",good:"animaux",bad:["animals","animeaux","animaus"],note:"pluriel en -aux"}
  ];
  var MBP = [
    {ph:"Une ___ éclaire la nuit.",good:"lampe",bad:["lanpe","lempe","lampé"],note:"m devant p"},
    {ph:"Le blé pousse dans le ___.",good:"champ",bad:["chanp","cham","chemp"],note:"m devant p"},
    {ph:"Il joue de la ___.",good:"trompette",bad:["tronpette","trempette","trompète"],note:"m devant p"},
    {ph:"Le ___ sonne midi.",good:"tambour",bad:["tanbour","tembour","tambourg"],note:"m devant b"},
    {ph:"Un nombre ___.",good:"important",bad:["inportant","emportant","importent"],note:"m devant p"},
    {ph:"La ___ est bleue.",good:"jambe",bad:["janbe","jenbe","jambé"],note:"m devant b"}
  ];
  function genOrt(sub, diff, cat){
    var it, hint;
    if(sub==="Homophones"){ it=pick(HOMOPH); hint="Homophones ("+it.note+")"; }
    else if(sub==="é ou er"){ it=pick(ER_E); hint="é (participe) ou er (infinitif) ?"; }
    else if(sub==="Accents"){ it=pick(ACCENTS); hint="Orthographe : "+it.note; }
    else if(sub==="Pluriels"){ it=pick(PLUR); hint="Écris le bon pluriel"; }
    else if(sub==="m devant m, b, p"){ it=pick(MBP); hint="Règle m devant m, b, p"; }
    else { it=pick(HOMOPH); hint="Orthographe"; }
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
