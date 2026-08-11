/* ============================================================================
   L'EMPIRE DES ÉVADÉS — jeu 2 (gestion façon Monopoly, piloté par des questions)
   Suite de « La Grande Évasion ». Réutilise la banque de questions (window.Questions),
   le moteur de son, l'historique et les animaux via le pont window.EB (défini dans
   index.html). 100 % statique, hors-ligne.
   ========================================================================== */
(function(){
  "use strict";
  var EB=null;              // pont fourni par index.html
  var E=null;               // état de la partie en cours
  var busy=false;

  /* ----------------------------- DONNÉES ---------------------------------- */
  // 8 quartiers de 2 propriétés. Prix croissants (60 → 400 ₵).
  var QUARTIERS=[
    {name:"Le Terrier d'Entrée", col:"#c9a06b", price:60,  build:50,  emoji:"🏚️"},
    {name:"La Canopée des Singes",col:"#8bbf5a", price:100, build:50,  emoji:"🐒"},
    {name:"La Plage des Flamants",col:"#f28fb1", price:140, build:100, emoji:"🦩"},
    {name:"Le Bosquet des Pandas", col:"#5bbf8a", price:180, build:100, emoji:"🐼"},
    {name:"La Rivière des Crocos", col:"#3fae86", price:220, build:150, emoji:"🐊"},
    {name:"La Plaine des Zèbres",  col:"#7a86f0", price:260, build:150, emoji:"🦓"},
    {name:"La Falaise des Hiboux", col:"#b98ce0", price:320, build:200, emoji:"🦉"},
    {name:"Les Hauteurs du Lion",  col:"#f2c14e", price:400, build:200, emoji:"🦁"}
  ];
  var RENT_MULT=[3,6,10,16];   // Stand, Boutique, Grand Magasin, Palais
  var BUILD_LABEL=["Stand","Boutique","Grand Magasin","Palais"];

  function prop(q,name){ return {type:"prop", q:q, name:name, price:QUARTIERS[q].price, emoji:QUARTIERS[q].emoji,
    rentBase:Math.round(QUARTIERS[q].price*0.1), build:QUARTIERS[q].build, owner:-1, level:0, mortgaged:false}; }
  function transport(name,emoji){ return {type:"transport", name:name, price:200, emoji:emoji||"🚌", owner:-1, mortgaged:false}; }
  function service(name,emoji){ return {type:"service", name:name, price:150, emoji:emoji||"⚙️", owner:-1, mortgaged:false}; }

  // 32 cases (ring 9×9). Coins : 0 Baobab, 8 Fourrière(visite), 16 Point d'Eau, 24 Gardien.
  function buildBoard(){
    return [
      {type:"depart", name:"Grand Baobab", emoji:"🌳"},           // 0
      prop(0,"Cabane du seuil"),                                   // 1
      {type:"cagnotte", name:"Cagnotte de la Meute", emoji:"🐾"},  // 2
      prop(0,"Nid de brindilles"),                                 // 3
      {type:"impot", name:"Impôt sur les croquettes", emoji:"🧾", amount:100}, // 4
      transport("Le Bus de la Jungle","🚌"),                            // 5
      prop(1,"Cabane suspendue"),                                  // 6
      {type:"patte", name:"Coup de Patte", emoji:"🐆"},            // 7
      {type:"fourriere", name:"Fourrière (visite)", emoji:"🔒"},   // 8 (coin)
      prop(1,"Stand de bananes"),                                  // 9
      service("Le Château d'Eau","🚿"),                                 // 10
      prop(2,"Parasol rose"),                                      // 11
      transport("La Rivière Express","🚤"),                             // 12
      prop(2,"Boutique de mode"),                                  // 13
      prop(3,"Spa de bambou"),                                     // 14
      {type:"patte", name:"Coup de Patte", emoji:"🐆"},            // 15
      {type:"repos", name:"Le Point d'Eau", emoji:"💧"},           // 16 (coin)
      prop(3,"Bar à bambou"),                                      // 17
      prop(4,"Guinguette flottante"),                              // 18
      transport("Le Téléphérique","🚡"),                                // 19
      prop(4,"Restaurant des lucioles"),                           // 20
      {type:"cagnotte", name:"Cagnotte de la Meute", emoji:"🐾"},  // 21
      prop(5,"Piste de course"),                                   // 22
      service("La Centrale à Bananes","🍌"),                            // 23
      {type:"gardien", name:"Le Gardien !", emoji:"🚓"},           // 24 (coin)
      prop(5,"Station rapide"),                                    // 25
      prop(6,"Bibliothèque perchée"),                              // 26
      transport("La Montgolfière","🎈"),                                // 27
      prop(6,"Observatoire étoilé"),                               // 28
      {type:"patte", name:"Coup de Patte", emoji:"🐆"},            // 29
      prop(7,"Palais doré"),                                       // 30
      prop(7,"Tour du Lion")                                       // 31
    ];
  }

  // Cartes (bonnes/mauvaises surprises). fn(reçoit playerIndex) applique l'effet.
  var PATTE=[
    {t:"Un car de touristes photographie ton stand : encaisse 75 ₵.", d:75},
    {t:"Braquage de cacahuètes : le plus riche te verse 100 ₵.", rich:100},
    {t:"Vent porteur : avance jusqu'au Grand Baobab et touche ton salaire.", goto:0},
    {t:"Tempête de sable : recule de 3 cases.", move:-3},
    {t:"Le gardien te reconnaît sur une affiche : file à la Fourrière !", jail:true},
    {t:"Travaux : paie 25 ₵ par bâtiment construit.", perBuilding:-25},
    {t:"Bonne affaire de la jungle : reçois 120 ₵.", d:120},
    {t:"Pluie tropicale : tout le monde te donne 30 ₵.", each:30},
    {t:"Amende de stationnement de brouette : paie 40 ₵.", d:-40},
    {t:"Coup de chance au marché : reçois 60 ₵.", d:60},
    {t:"Glissade sur une peau de banane : recule de 2 cases.", move:-2},
    {t:"Publicité réussie : avance de 3 cases.", move:3}
  ];
  var CAGNOTTE=[
    {t:"La meute finance ton projet : reçois 200 ₵.", d:200},
    {t:"Remboursement de la nourriture du zoo : 20 ₵ par animal libéré au jeu 1.", perFreed:20},
    {t:"Anniversaire de l'Évasion : chaque joueur te verse 50 ₵.", each:50},
    {t:"Amende pour sieste sur la voie publique : paie 50 ₵.", d:-50},
    {t:"Solidarité de la vallée : reçois 90 ₵.", d:90},
    {t:"Partage du butin : reçois 130 ₵.", d:130},
    {t:"Cotisation de la meute : paie 30 ₵.", d:-30},
    {t:"Prime de bravoure : reçois 75 ₵.", d:75}
  ];

  /* ----------------------------- HELPERS ---------------------------------- */
  function $(id){ return document.getElementById(id); }
  function el(tag,cls,txt){ var e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e; }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
  function rint(n){ return Math.floor(Math.random()*n); }
  function me(){ return E.players[0]; }
  function alive(p){ return !p.bankrupt; }
  function cell(i){ return E.board[i]; }
  function isProp(c){ return c.type==="prop"||c.type==="transport"||c.type==="service"; }
  function ownerName(c){ return c.owner<0?"la banque":EB.animalById(E.players[c.owner].animalId).name; }

  function ask(context){
    // question réelle pour le joueur ; renvoie Promise<bool>
    return EB.presentQuestion(E.cat, E.sub, E.diffVal, context);
  }
  function botAnswers(){ return Math.random()<E.botSuccess; }

  /* --------------------------- ARGENT ------------------------------------- */
  function pay(pi, amount){  // pi paie `amount` à la banque (montant>0). Renvoie true si réglé.
    var p=E.players[pi];
    p.cash-=amount;
    return true;
  }
  function credit(pi, amount){ E.players[pi].cash+=amount; }
  function transfer(from, to, amount){ // from paie to
    E.players[from].cash-=amount;
    if(to>=0) E.players[to].cash+=amount;
  }
  function netWorth(p){
    var w=p.cash;
    E.board.forEach(function(c){ if(isProp(c)&&c.owner===E.players.indexOf(p)){
      w+= c.mortgaged?Math.round(c.price*0.5):c.price;
      if(c.type==="prop") w+= c.level*c.build;
    }});
    return w;
  }

  /* ------------------------ LOYERS / VALEURS ------------------------------ */
  function quartierComplete(pi, q){
    var owned=0, tot=0;
    E.board.forEach(function(c){ if(c.type==="prop"&&c.q===q){ tot++; if(c.owner===pi) owned++; } });
    return owned===tot;
  }
  function countType(pi, type){ var n=0; E.board.forEach(function(c){ if(c.type===type&&c.owner===pi&&!c.mortgaged) n++; }); return n; }
  function rentOf(c, diceTotal){
    if(c.owner<0||c.mortgaged) return 0;
    if(c.type==="transport"){ var n=countType(c.owner,"transport"); return [0,50,100,150,200][n]||200; }
    if(c.type==="service"){ var n2=countType(c.owner,"service"); return diceTotal*(n2>=2?10:5)||diceTotal*5; }
    // prop
    if(c.level>0) return c.rentBase*RENT_MULT[c.level-1];
    return quartierComplete(c.owner,c.q)? c.rentBase*2 : c.rentBase;
  }

  /* ============================ RENDER ==================================== */
  function gridPos(i){ // renvoie [row,col] 1..9 pour la case i (ring 9×9)
    if(i<=8) return [1, i+1];
    if(i<=15) return [i-7, 9];         // 9..15 -> rows 2..8
    if(i<=24) return [9, 9-(i-16)];    // 16..24 -> col 9..1
    return [9-(i-24), 1];              // 25..31 -> rows 8..2
  }
  function sideOf(i){
    if(i===0||i===8||i===16||i===24) return "corner";
    if(i<8) return "top"; if(i<16) return "right"; if(i<24) return "bottom"; return "left";
  }
  // Petit immeuble dessiné (SVG) : maison verte (niv. 1-3) puis palais doré (niv. 4).
  function houseSVG(){ return '<svg viewBox="0 0 22 20" class="emp-bld"><polygon points="11,2 21,10 1,10" fill="#2e9e6f"/><rect x="3.5" y="10" width="15" height="9" rx="1" fill="#fff8ec" stroke="#a9793f" stroke-width="1"/><rect x="9" y="13" width="4" height="6" fill="#8b5a24"/></svg>'; }
  function palaceSVG(){ return '<svg viewBox="0 0 30 22" class="emp-bld emp-pal"><polygon points="15,1 8,8 22,8" fill="#e0a824"/><polygon points="5,8 1,8 3,4" fill="#e0a824"/><polygon points="25,8 29,8 27,4" fill="#e0a824"/><rect x="2" y="8" width="26" height="12" rx="1.5" fill="#f4c657" stroke="#c99a2e"/><rect x="13" y="13" width="4" height="7" fill="#8b5a24"/><rect x="6" y="11" width="3" height="3" fill="#fff8ec"/><rect x="21" y="11" width="3" height="3" fill="#fff8ec"/></svg>'; }
  function buildingsHTML(level){ if(level<=0) return ""; if(level>=4) return palaceSVG(); var s=""; for(var i=0;i<Math.min(level,3);i++) s+=houseSVG(); return s; }
  // Décor illustré du centre : ciel, soleil, collines de la Vallée Sauvage + le portail du zoo à l'horizon.
  var SCENE_SVG='<svg class="emp-scene" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
    +'<defs><linearGradient id="empSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3e8ff"/><stop offset="1" stop-color="#eaf7ff"/></linearGradient></defs>'
    +'<rect width="100" height="100" fill="url(#empSky)"/>'
    +'<circle cx="82" cy="16" r="8" fill="#ffe08a"/><circle cx="82" cy="16" r="12" fill="#ffe08a" opacity=".3"/>'
    +'<ellipse cx="22" cy="20" rx="11" ry="5" fill="#ffffff" opacity=".85"/><ellipse cx="30" cy="18" rx="8" ry="5" fill="#ffffff" opacity=".85"/>'
    +'<path d="M0,66 Q26,54 50,64 T100,60 L100,100 L0,100 Z" fill="#d7ecac"/>'
    // acacias de la savane (silhouettes discrètes sur la colline)
    +'<g opacity=".65" fill="#6a9a48"><g><rect x="17.4" y="58" width="1.1" height="6" fill="#8a6a3a"/><ellipse cx="18" cy="57.4" rx="5" ry="1.7"/></g>'
    +'<g><rect x="77" y="60" width="1" height="5" fill="#8a6a3a"/><ellipse cx="77.5" cy="59.6" rx="4" ry="1.4"/></g></g>'
    +'<path d="M0,80 Q30,68 60,78 T100,76 L100,100 L0,100 Z" fill="#a9d47a"/>'
    +'</svg>';

  function mount(){
    var root=$("empireScreen"); root.innerHTML="";
    var scroll=el("div","emp-scroll");
    var boardWrap=el("div","emp-board"); boardWrap.id="empBoard";
    E.board.forEach(function(c,i){
      var gp=gridPos(i), side=sideOf(i);
      var cellEl=el("div","emp-cell "+side+(isProp(c)?" isprop":"")+(c.type==="prop"?" q"+c.q:""));
      cellEl.id="empCell"+i;
      cellEl.style.gridRow=gp[0]; cellEl.style.gridColumn=gp[1];
      if(c.type==="prop") cellEl.style.setProperty("--qcol",QUARTIERS[c.q].col);
      cellEl.appendChild(renderCellContent(c,i));
      cellEl.onclick=function(){ showPropInfo(i); };
      boardWrap.appendChild(cellEl);
    });
    var center=el("div","emp-center"); center.style.gridRow="2 / 9"; center.style.gridColumn="2 / 9"; center.id="empCenter";
    boardWrap.appendChild(center);
    scroll.appendChild(boardWrap);
    root.appendChild(scroll);
    var panel=el("div","emp-panel"); panel.id="empPanel";
    root.appendChild(panel);
    renderCenter(); renderTokens(); renderPanel();
  }
  function renderCellContent(c,i){
    var w=el("div","emp-cc");
    if(c.type==="prop"){
      var band=el("div","emp-band"); var blds=el("div","emp-blds"); blds.innerHTML=buildingsHTML(c.level);
      band.appendChild(blds); w.appendChild(band);
      w.appendChild(el("div","emp-nm",c.name));
      w.appendChild(el("div","emp-pr","₵"+c.price));
    } else if(["depart","fourriere","repos","gardien"].indexOf(c.type)>=0){
      w.classList.add("emp-cornerc");
      w.appendChild(el("div","emp-cico",c.emoji||"•"));
      w.appendChild(el("div","emp-cnm",c.name));
    } else {
      w.appendChild(el("div","emp-ico", c.emoji|| (c.type==="transport"?"🚌":c.type==="service"?"⚙️":"•")));
      w.appendChild(el("div","emp-nm",c.name));
      if(c.price) w.appendChild(el("div","emp-pr","₵"+c.price));
    }
    return w;
  }
  function tokenColor(pi){ return ["#ffd94a","#7ad0ff","#ff9bb0","#9be59b"][pi]||"#fff"; }
  function renderTokens(){
    Array.prototype.forEach.call(document.querySelectorAll(".emp-token"),function(t){ t.remove(); });
    // regroupe les pions par case pour les décaler s'ils se superposent
    var byCell={};
    E.players.forEach(function(p,pi){ if(p.bankrupt) return; (byCell[p.pos]=byCell[p.pos]||[]).push(pi); });
    Object.keys(byCell).forEach(function(pos){
      var host=$("empCell"+pos); if(!host) return;
      byCell[pos].forEach(function(pi,k){
        var t=el("div","emp-token"+(pi===0?" me":""), EB.EMOJI[E.players[pi].animalId]||"🦁");
        t.style.borderColor=tokenColor(pi);
        t.style.left=(2+k*9)+"px";
        host.appendChild(t);
      });
    });
    E.board.forEach(function(c,i){ var host=$("empCell"+i); if(!host||!isProp(c)) return;
      host.classList.toggle("owned", c.owner>=0);
      host.style.setProperty("--own", c.owner>=0?tokenColor(c.owner):"transparent");
      host.classList.toggle("mortg", !!c.mortgaged);
      if(c.type==="prop"){ var blds=host.querySelector(".emp-blds"); if(blds) blds.innerHTML=buildingsHTML(c.level); }
    });
  }
  function renderCenter(){
    var c=$("empCenter"); if(!c) return; c.innerHTML=SCENE_SVG;
    var cover=el("div","emp-cover");
    cover.appendChild(el("div","emp-title","👑 L'Empire des Évadés"));
    var hud=el("div","emp-hud");
    E.players.forEach(function(p,pi){
      var row=el("div","emp-p"+(pi===0?" me":"")+(p.bankrupt?" ko":""));
      row.style.setProperty("--pcol",tokenColor(pi));
      var em=el("span","emp-pe",EB.EMOJI[p.animalId]);
      var nm=el("span","emp-pn",EB.animalById(p.animalId).name+(p.jail>0?" 🔒":""));
      var cash=el("span","emp-pc", p.bankrupt?"✖ ruiné":("₵"+p.cash));
      row.appendChild(em); row.appendChild(nm); row.appendChild(cash);
      hud.appendChild(row);
    });
    cover.appendChild(hud);
    var dice=el("div","emp-dice"); dice.id="empDice"; dice.innerHTML="<span id='empD1'>🎲</span><span id='empD2'>🎲</span>";
    cover.appendChild(dice);
    var msg=el("div","emp-msg"); msg.id="empMsg"; cover.appendChild(msg);
    c.appendChild(cover);
  }
  function say(t){ var m=$("empMsg"); if(m) m.textContent=t; }
  function renderPanel(){
    var pn=$("empPanel"); if(!pn) return; pn.innerHTML="";
    if(E.over){ return; }
    // boutons contextuels ajoutés dynamiquement pendant le tour ; par défaut : lancer/abandonner
    var roll=el("button","emp-btn primary","🎲 Lancer les dés"); roll.id="empRoll";
    roll.onclick=function(){ if(!busy) playerTurn(); };
    pn.appendChild(roll);
    // « Construire » : affiché dès le départ. Ne propose un chantier que si un
    // quartier complet (toutes les cases d'une même couleur) est possédé.
    var build=el("button","emp-btn","🏗️ Construire"); build.id="empManage";
    build.title="Disponible uniquement si tu possèdes tout un quartier (même couleur)";
    build.onclick=async function(){ if(busy)return; busy=true; setRoll(false); await buildFlow(0); busy=false; if(!E.over){ renderPanel(); setRoll(true);} };
    pn.appendChild(build);
    // « ? » : rappel des règles.
    var help=el("button","emp-btn ghost","❓ Règles"); help.id="empHelp";
    help.onclick=function(){ showRules(); };
    pn.appendChild(help);
    var ab=el("button","emp-btn ghost","Abandonner"); ab.onclick=quit;
    pn.appendChild(ab);
  }
  function showRules(){
    var ov=$("empRulesOv"); if(!ov) return;
    ov.classList.add("show"); EB.Sound.step&&EB.Sound.step();
    var ok=$("empRulesOk"); if(ok) ok.onclick=function(){ ov.classList.remove("show"); };
  }
  function setRoll(on){ var b=$("empRoll"); if(b) b.disabled=!on; }

  /* ============================ TOUR JOUEUR =============================== */
  async function playerTurn(){
    if(busy||E.over) return; busy=true; setRoll(false);
    var p=me();
    // Fourrière ?
    if(p.jail>0){ await jailTurn(0); if(E.over){busy=false;return;} await botsPhase(); busy=false; setRoll(true); return; }
    await doRoll(0, true);
    if(E.over){ busy=false; return; }
    await botsPhase();
    busy=false; if(!E.over) setRoll(true);
  }

  async function doRoll(pi, human){
    var d1=1+rint(6), d2=1+rint(6), dbl=(d1===d2);
    await animDice(d1,d2);
    var p=E.players[pi];
    if(dbl) p.dbl=(p.dbl||0)+1; else p.dbl=0;
    if(p.dbl>=2){ // deux doubles → Fourrière
      say(EB.animalById(p.animalId).name+" a fait deux doubles : le gardien l'envoie à la Fourrière !");
      EB.Sound.net&&EB.Sound.net(); await sleep(700);
      sendToJail(pi); renderTokens(); renderCenter(); return;
    }
    await movePlayer(pi, d1+d2, true);
    if(E.over) return;
    await landOn(pi, d1+d2, human);
    if(E.over) return;
    if(dbl && !E.players[pi].bankrupt && E.players[pi].jail===0){
      if(human){ say("Double ! Tu rejoues."); await sleep(500); await doRoll(pi, true); }
      else { await doRoll(pi, false); }
    }
  }

  async function movePlayer(pi, steps, salary){
    var p=E.players[pi];
    for(var s=0;s<steps;s++){
      p.pos=(p.pos+1)%32;
      if(p.pos===0 && salary){ credit(pi,200); EB.Sound.coin&&EB.Sound.coin(); }
      renderTokens(); renderCenter();
      EB.Sound.hop&&EB.Sound.hop();
      await sleep(150);
    }
  }

  async function animDice(d1,d2){
    var F=["⚀","⚁","⚂","⚃","⚄","⚅"];
    EB.Sound.diceSpin&&EB.Sound.diceSpin();
    for(var n=0;n<8;n++){ var a=$("empD1"),b=$("empD2"); if(a)a.textContent=F[rint(6)]; if(b)b.textContent=F[rint(6)]; await sleep(70); }
    var e1=$("empD1"),e2=$("empD2"); if(e1)e1.textContent=F[d1-1]; if(e2)e2.textContent=F[d2-1];
    EB.Sound.diceStop&&EB.Sound.diceStop();
    E.lastDice=d1+d2;
    await sleep(250);
  }

  /* ------------------- CARTE ILLUSTRÉE DE LA CASE (jeu clair) -------------- */
  function caseInfo(c){
    var big=c.emoji||"•", bg="linear-gradient(160deg,#eef4ff,#fff)", name=c.name, desc="";
    if(c.type==="prop"){
      bg="linear-gradient(160deg,"+QUARTIERS[c.q].col+" 0%, #fff8ec 70%)";
      var status=c.owner<0?"<b>Propriété LIBRE</b> — à acheter !":(c.owner===0?"C'est <b>ta</b> propriété.":"Propriété de <b>"+ownerName(c)+"</b>.");
      desc="<b>"+QUARTIERS[c.q].name+"</b><br>Prix : <b>₵"+c.price+"</b> · Loyer de base : ₵"+c.rentBase+" (×2 si quartier complet)<br>"+status
        +(c.level>0?"<br>🏠 Niveau : <b>"+BUILD_LABEL[c.level-1]+"</b>":"");
    } else if(c.type==="transport"){ bg="linear-gradient(160deg,#cfe0ff,#fff)";
      desc="<b>Route migratoire</b> — Transport à acheter (<b>₵200</b>).<br>Le loyer grimpe avec le nombre de lignes possédées (50 → 200 ₵)."; }
    else if(c.type==="service"){ bg="linear-gradient(160deg,#d5f0e0,#fff)";
      desc="<b>Service de la vallée</b> — À acheter (<b>₵150</b>).<br>Loyer = <b>10 × le total des dés</b> du visiteur."; }
    else if(c.type==="depart"){ bg="linear-gradient(160deg,#dcf3b6,#fff)";
      desc="<b>Grand Baobab (Départ)</b><br>Touche <b>200 ₵</b> de salaire à chaque passage. Tente la <b>Prime de la Jungle</b> pour le doubler !"; }
    else if(c.type==="impot"){ bg="linear-gradient(160deg,#ffd9d0,#fff)";
      desc="<b>Impôt sur les croquettes</b><br>Paie <b>100 ₵</b> à la banque."; }
    else if(c.type==="patte"){ bg="linear-gradient(160deg,#ffe6b0,#fff)";
      desc="<b>Coup de Patte</b><br>Tire une carte : <b>bonne ou mauvaise</b> surprise !"; }
    else if(c.type==="cagnotte"){ bg="linear-gradient(160deg,#d8e6ff,#fff)";
      desc="<b>Cagnotte de la Meute</b><br>Tire une carte de la caisse commune, <b>plutôt favorable</b>."; }
    else if(c.type==="fourriere"){ bg="linear-gradient(160deg,#e6eaee,#fff)";
      desc="<b>Fourrière (visite)</b><br>Simple visite : rien ne se passe… sauf si tu y es enfermé !"; }
    else if(c.type==="gardien"){ bg="linear-gradient(160deg,#ffd0d0,#fff)";
      desc="<b>Le Gardien !</b><br>Il te repère : direction la <b>Fourrière</b>, sans salaire au passage."; }
    else if(c.type==="repos"){ bg="linear-gradient(160deg,#cdeeff,#fff)";
      desc="<b>Le Point d'Eau</b><br>Case repos : on souffle, rien ne se passe."; }
    return {big:big, bg:bg, name:name, desc:desc};
  }
  function showCaseCard(i){
    return new Promise(function(res){
      var ov=$("empCaseOv"); if(!ov){ res(); return; }
      var info=caseInfo(cell(i));
      $("empCaseArt").textContent=info.big; $("empCaseArt").style.background=info.bg;
      $("empCaseName").textContent=info.name; $("empCaseDesc").innerHTML=info.desc;
      ov.classList.add("show"); EB.Sound.whoosh&&EB.Sound.whoosh();
      var done=false, t=setTimeout(close,2600);
      function close(){ if(done) return; done=true; clearTimeout(t); ov.onclick=null; ov.classList.remove("show"); setTimeout(res,160); }
      ov.onclick=close;
    });
  }
  // Annonce ce qu'un bot vient de faire (message central + petite bulle toast).
  function botSay(pi, action){
    var a=EB.animalById(E.players[pi].animalId), em=EB.EMOJI[E.players[pi].animalId]||"";
    say(em+" "+a.name+" "+action); EB.toast(em+" "+a.name+" "+action, 1500);
  }

  /* ---------------------------- ATTERRISSAGE ------------------------------ */
  async function landOn(pi, diceTotal, human){
    var p=E.players[pi], c=cell(p.pos);
    if(human){ await showCaseCard(p.pos); }
    else { say(EB.animalById(p.animalId).name+" arrive sur « "+c.name+" »."); await sleep(250); }
    if(c.type==="depart"){ if(human) await primeFlow(pi); }
    else if(c.type==="impot"){ transfer(pi,-1,c.amount); renderCenter(); say("Impôt : −"+c.amount+" ₵."); EB.Sound.bad&&EB.Sound.bad(); await sleep(500); await checkSolvency(pi); }
    else if(c.type==="gardien"){ say("Le gardien te repère : direction la Fourrière !"); EB.Sound.net&&EB.Sound.net(); await sleep(600); sendToJail(pi); renderTokens(); renderCenter(); }
    else if(c.type==="patte"){ await drawCard(pi, PATTE, "Coup de Patte", human); }
    else if(c.type==="cagnotte"){ await drawCard(pi, CAGNOTTE, "Cagnotte de la Meute", human); }
    else if(c.type==="repos"||c.type==="fourriere"){ say("Petite pause au "+c.name+"."); await sleep(400); }
    else if(isProp(c)){
      if(c.owner<0){ if(human) await buyFlow(pi); else await botBuy(pi); }
      else if(c.owner===pi){ say("Te voilà chez toi."); await sleep(300); }
      else { if(human) await rentFlow(pi, diceTotal); else await botRent(pi, diceTotal); }
    }
  }

  /* ------------------------------ SALAIRE / PRIME ------------------------- */
  async function primeFlow(pi){
    var yes=await confirmAction("Grand Baobab : salaire +200 ₵ encaissé. Tenter la Prime de la Jungle (question → salaire doublé, aucun risque) ?","Tenter la Prime","Garder 200 ₵");
    if(!yes){ return; }
    var ok=await ask("Prime de la Jungle — salaire ×2 si tu réussis");
    if(ok){ credit(pi,200); EB.Sound.coin&&EB.Sound.coin(); say("Prime réussie : +200 ₵ (salaire doublé) !"); }
    else say("Prime manquée, mais tu gardes ton salaire.");
    renderCenter(); await sleep(500);
  }

  /* ------------------------------ ACHAT ----------------------------------- */
  async function buyFlow(pi){
    var c=cell(E.players[pi].pos);
    var canAfford=E.players[pi].cash>=c.price;
    var yes=await confirmAction("« "+c.name+" » est libre (₵"+c.price+"). Répondre juste pour l'acheter ?", canAfford?"Acheter":"Acheter (fonds justes)", "Passer");
    if(!yes){ return; }
    var ok=await ask("Achat de « "+c.name+" » — ₵"+c.price);
    if(ok && canAfford){ c.owner=pi; transfer(pi,-1,c.price); paintBuy(pi); say("Acheté ! "+c.name+" est à toi."); }
    else if(ok && !canAfford){ say("Réponse juste, mais fonds insuffisants."); }
    else { say("Le vendeur doute… l'affaire part en enchère éclair !"); await sleep(700); await auctionFlow(pi); }
    renderTokens(); renderCenter(); await sleep(500);
  }
  function paintBuy(pi){ EB.Sound.special&&EB.Sound.special(); renderTokens(); }

  async function auctionFlow(pi){
    var c=cell(E.players[pi].pos), price80=Math.round(c.price*0.8);
    var ok=await ask("Enchère éclair — rafle « "+c.name+" » à 80 % (₵"+price80+")");
    if(ok && E.players[pi].cash>=price80){ c.owner=pi; transfer(pi,-1,price80); say("Enchère gagnée : "+c.name+" à ₵"+price80+" !"); paintBuy(pi); }
    else {
      // le bot le plus riche l'achète au prix fort (s'il peut)
      var rich=richestBot();
      if(rich>=0 && E.players[rich].cash>=c.price){ c.owner=rich; transfer(rich,-1,c.price); say(EB.animalById(E.players[rich].animalId).name+" rafle "+c.name+" au prix fort."); }
      else say("Personne ne surenchérit : "+c.name+" reste à la banque.");
    }
    renderTokens(); renderCenter();
  }
  function richestBot(){ var best=-1,bc=-1; for(var i=1;i<E.players.length;i++){ if(alive(E.players[i])&&E.players[i].cash>bc){ bc=E.players[i].cash; best=i; } } return best; }

  /* ------------------------------ LOYER ----------------------------------- */
  async function rentFlow(pi, diceTotal){
    var c=cell(E.players[pi].pos), rent=rentOf(c, diceTotal), owner=c.owner;
    var choice=await threeWay("« "+c.name+" » appartient à "+ownerName(c)+". Loyer à payer : ₵"+rent+".",
      "Négocier (loyer ÷2 si juste)","OPA : racheter de force (3 bonnes réponses)","Payer ₵"+rent);
    if(choice==="pay"){ transfer(pi,owner,rent); say("Loyer payé : −₵"+rent+"."); EB.Sound.bad&&EB.Sound.bad(); }
    else if(choice==="negotiate"){
      var ok=await ask("Négociation de loyer — loyer ÷2 si tu réussis");
      var due=ok?Math.round(rent/2):rent;
      transfer(pi,owner,due); say(ok?("Négocié ! Loyer réduit : −₵"+due+"."):("Négociation ratée : −₵"+due+"."));
    } else { // OPA
      await opaFlow(pi);
    }
    renderTokens(); renderCenter(); await sleep(500);
    await checkSolvency(pi);
  }
  async function opaFlow(pi){
    var c=cell(E.players[pi].pos), owner=c.owner, price150=Math.round(c.price*1.5), rent=rentOf(c,E.lastDice);
    say("OPA sauvage (rachat forcé) sur « "+c.name+" » : réussis 3 questions d'affilée !");
    EB.Sound.duelStart&&EB.Sound.duelStart(); await sleep(500);
    for(var n=0;n<3;n++){
      var ok=await ask("OPA "+(n+1)+"/3 — rachat forcé de « "+c.name+" »");
      if(!ok){ // échec : loyer ×2
        transfer(pi,owner,rent*2); say("OPA ratée ! Loyer doublé : −₵"+(rent*2)+".");
        E.players[pi].opaUsed=true; return;
      }
      EB.Sound.lock&&EB.Sound.lock();
    }
    if(E.players[pi].cash>=price150){ transfer(pi,owner,price150); c.owner=pi; c.level=0;
      say("RACHETÉ ! « "+c.name+" » est à toi (₵"+price150+" au propriétaire)."); EB.Sound.win&&EB.Sound.win(); }
    else say("OPA réussie mais fonds insuffisants pour payer ₵"+price150+".");
    E.players[pi].opaUsed=true;
    await checkSolvency(pi);
  }

  /* ---------------------------- CONSTRUCTION ------------------------------ */
  function buildableQuartiers(pi){
    var qs=[];
    for(var q=0;q<8;q++){ if(quartierComplete(pi,q)){
      // niveau minimum du quartier (on construit uniformément : niveau le plus bas)
      var levels=[]; E.board.forEach(function(c){ if(c.type==="prop"&&c.q===q&&c.owner===pi) levels.push(c.level); });
      var minL=Math.min.apply(null,levels);
      if(minL<4) qs.push({q:q, level:minL});
    }}
    return qs;
  }
  async function buildFlow(pi){
    var opts=buildableQuartiers(pi);
    if(!opts.length){
      // Explique clairement la règle plutôt qu'un simple refus.
      var owned=quartiersOwned(pi);
      if(owned) say("Pour construire, il faut posséder TOUT un quartier (les 2 cases de la même couleur). Il te manque encore des cases pour compléter un quartier.");
      else say("Tu ne peux construire que si tu possèdes tout un quartier : les 2 cases de la même couleur. Achète-les d'abord !");
      await sleep(200); return;
    }
    // choisir un quartier (menu simple)
    var choice=await chooseFrom("Construire dans quel quartier ?", opts.map(function(o){
      return {label:QUARTIERS[o.q].name+" → "+BUILD_LABEL[o.level]+" (₵"+QUARTIERS[o.q].build+")", val:o.q, cost:QUARTIERS[o.q].build}; }));
    if(choice==null) return;
    var q=choice, cost=QUARTIERS[q].build;
    if(E.players[pi].cash<cost){ say("Fonds insuffisants pour construire."); return; }
    var ok=await ask("Construction dans "+QUARTIERS[q].name+" — ₵"+cost);
    if(ok){ transfer(pi,-1,cost);
      E.board.forEach(function(c){ if(c.type==="prop"&&c.q===q&&c.owner===pi){ var lv=Math.min.apply(null,levelsOf(pi,q)); } });
      // monte d'un niveau la (les) propriété(s) au niveau minimum
      var minL=Math.min.apply(null,levelsOf(pi,q));
      var done=false;
      E.board.forEach(function(c){ if(!done&&c.type==="prop"&&c.q===q&&c.owner===pi&&c.level===minL){ c.level++; done=true; } });
      EB.Sound.special&&EB.Sound.special(); say("Chantier terminé : "+QUARTIERS[q].name+" monte en gamme !");
    } else { transfer(pi,-1,Math.round(cost*0.1)); say("Chantier reporté : les castors gardent 10 % d'acompte."); }
    renderTokens(); renderCenter(); await sleep(400);
  }
  function levelsOf(pi,q){ var a=[]; E.board.forEach(function(c){ if(c.type==="prop"&&c.q===q&&c.owner===pi) a.push(c.level); }); return a; }
  // Le joueur possède-t-il au moins une propriété de quartier ?
  function quartiersOwned(pi){ var n=0; E.board.forEach(function(c){ if(c.type==="prop"&&c.owner===pi) n++; }); return n>0; }

  /* ------------------------------ CARTES ---------------------------------- */
  async function drawCard(pi, deck, title, human){
    var card=deck[rint(deck.length)];
    if(human){ await showCard(title, card.t); }
    else botSay(pi,"— "+title+" : "+card.t);
    // effets
    if(card.d) transfer(pi,-1,-card.d);                 // gain (+) ou perte (−)
    if(card.each){ E.players.forEach(function(pp,j){ if(j!==pi&&alive(pp)){ transfer(j,pi,card.each); } }); }
    if(card.rich){ var r=richestOther(pi); if(r>=0) transfer(r,pi,card.rich); }
    if(card.perBuilding){ var b=totalBuildings(pi); transfer(pi,-1,-card.perBuilding*b); }
    if(card.perFreed){ credit(pi, card.perFreed*EB.freedCount()); }
    if(typeof card.move==="number"){ var st=card.move; if(st>0) await movePlayer(pi,st,true); else { for(var k=0;k<-st;k++){ E.players[pi].pos=(E.players[pi].pos+31)%32; renderTokens(); await sleep(120);} } await landOn(pi,E.lastDice,human); }
    if(card.goto!=null){ // avance jusqu'au baobab, salaire
      while(E.players[pi].pos!==card.goto){ E.players[pi].pos=(E.players[pi].pos+1)%32; if(E.players[pi].pos===0) credit(pi,200); renderTokens(); await sleep(90); }
      renderCenter();
    }
    if(card.jail){ sendToJail(pi); }
    renderTokens(); renderCenter(); await sleep(400);
    await checkSolvency(pi);
  }
  function richestOther(pi){ var b=-1,bc=-1; E.players.forEach(function(p,j){ if(j!==pi&&alive(p)&&p.cash>bc){bc=p.cash;b=j;} }); return b; }
  function totalBuildings(pi){ var n=0; E.board.forEach(function(c){ if(c.type==="prop"&&c.owner===pi) n+=c.level; }); return n; }

  /* ------------------------------ FOURRIÈRE ------------------------------- */
  function sendToJail(pi){ var p=E.players[pi]; p.pos=8; p.jail=3; p.dbl=0; }
  async function jailTurn(pi){
    var p=E.players[pi];
    if(pi===0){
      var mustPay=(p.jail<=1);
      var yes=await confirmAction("Tu es à la Fourrière ("+p.jail+" tour(s) restant(s)). "+(mustPay?"Caution obligatoire (50 ₵).":"Répondre juste pour crocheter la serrure, ou payer 50 ₵ de caution ?"),
        mustPay?"Payer 50 ₵":"Tenter de crocheter", mustPay?"Payer 50 ₵":"Payer 50 ₵ (caution)");
      if(!yes || mustPay){ // payer caution
        if(p.cash>=50){ transfer(0,-1,50); p.jail=0; say("Caution payée : tu sors de la Fourrière."); }
        else { await checkSolvency(0); }
        renderCenter(); return;
      }
      var ok=await ask("Évasion de la Fourrière — réponds juste pour crocheter");
      if(ok){ p.jail=0; EB.Sound.win&&EB.Sound.win(); say("Serrure crochetée : tu t'évades !"); await doRoll(0,true); }
      else { p.jail--; say("Raté… tu attends encore."); }
    } else {
      // bot : paie caution s'il a des sous, sinon tente (55 %)
      if(p.cash>=50 && (p.jail<=1 || Math.random()<0.5)){ transfer(pi,-1,50); p.jail=0; }
      else if(botAnswers()){ p.jail=0; } else p.jail--;
    }
    renderCenter();
  }

  /* ------------------------------- BOTS ----------------------------------- */
  async function botsPhase(){
    for(var i=1;i<E.players.length;i++){ if(E.over) return; var p=E.players[i]; if(p.bankrupt) continue;
      say(EB.animalById(p.animalId).name+" joue…"); await sleep(350);
      if(p.jail>0){ await jailTurn(i); if(p.jail>0){ continue; } }
      await doRoll(i, false);
      if(E.over) return;
      await botBuild(i);
    }
    // tour terminé : reset OPA
    E.players.forEach(function(p){ p.opaUsed=false; });
    checkVictory();
    EB.persist&&saveState();
  }
  async function botBuy(pi){
    var c=cell(E.players[pi].pos), p=E.players[pi];
    if(c.owner>=0) return;
    if(p.cash - c.price >= 150 && botAnswers()){ c.owner=pi; transfer(pi,-1,c.price); botSay(pi,"a acheté « "+c.name+" » (₵"+c.price+")."); }
    renderTokens(); renderCenter(); await sleep(250);
  }
  async function botRent(pi, diceTotal){
    var c=cell(E.players[pi].pos), rent=rentOf(c,diceTotal);
    transfer(pi,c.owner,rent); botSay(pi,"a payé ₵"+rent+" de loyer à "+EB.animalById(E.players[c.owner].animalId).name+".");
    renderTokens(); renderCenter(); await sleep(250);
    await checkSolvency(pi);
  }
  async function botBuild(pi){
    var opts=buildableQuartiers(pi), p=E.players[pi];
    for(var k=0;k<opts.length;k++){ var q=opts[k].q, cost=QUARTIERS[q].build;
      if(p.cash-cost>=250 && botAnswers()){ transfer(pi,-1,cost);
        var minL=Math.min.apply(null,levelsOf(pi,q)); var done=false;
        E.board.forEach(function(c){ if(!done&&c.type==="prop"&&c.q===q&&c.owner===pi&&c.level===minL){ c.level++; done=true; } });
        botSay(pi,"a construit dans "+QUARTIERS[q].name+"."); renderTokens(); renderCenter(); await sleep(300);
      }
    }
  }

  /* ------------------------ SOLVABILITÉ / FAILLITE ------------------------ */
  async function checkSolvency(pi){
    var p=E.players[pi];
    if(p.cash>=0) return;
    // vendre bâtiments (50 %) puis hypothéquer (50 %) jusqu'à cash>=0
    var props=[]; E.board.forEach(function(c,i){ if(isProp(c)&&c.owner===pi) props.push(c); });
    // 1) revendre bâtiments
    var changed=true;
    while(p.cash<0 && changed){ changed=false;
      props.forEach(function(c){ if(p.cash<0 && c.type==="prop" && c.level>0){ c.level--; credit(pi, Math.round(c.build*0.5)); changed=true; } });
    }
    // 2) hypothéquer
    props.forEach(function(c){ if(p.cash<0 && !c.mortgaged){ c.mortgaged=true; credit(pi, Math.round(c.price*0.5)); } });
    renderTokens(); renderCenter();
    if(p.cash<0){ await bankrupt(pi); }
  }
  async function bankrupt(pi){
    var p=E.players[pi]; p.bankrupt=true;
    // biens retournent à la banque
    E.board.forEach(function(c){ if(isProp(c)&&c.owner===pi){ c.owner=-1; c.level=0; c.mortgaged=false; } });
    var a=EB.animalById(p.animalId);
    EB.Sound.lose&&EB.Sound.lose();
    if(pi===0){ renderTokens(); renderCenter(); return endGame(false); }
    var rep=(a.faillite&&a.faillite.length)?a.faillite[rint(a.faillite.length)]:"Partie terminée pour moi.";
    say("💼 "+a.name+" fait faillite ! « "+rep+" »");
    renderTokens(); renderCenter(); await sleep(1400);
    checkVictory();
  }
  function checkVictory(){
    if(E.over) return;
    var botsAlive=0; for(var i=1;i<E.players.length;i++){ if(alive(E.players[i])) botsAlive++; }
    if(botsAlive===0 && alive(me())) endGame(true);
  }

  /* ------------------------------- FIN ------------------------------------ */
  function endGame(won){
    E.over=true; busy=false; setRoll(false);
    var a=EB.animalById(me().animalId);
    if(won){
      // couronne permanente
      EB.store.empires=EB.store.empires||{}; EB.store.empires[me().animalId]=true; EB.persist();
    }
    EB.showEmpireEnd(won, me().animalId);
    saveState();
  }
  function quit(){
    if(!confirm("Abandonner l'empire en cours ?")) return;
    E.over=true; EB.store.empireGame=null; EB.persist();
    EB.exitEmpire();
  }

  /* --------------------------- UI QUESTIONS ------------------------------- */
  // Confirmation OUI/NON (renvoie Promise<bool>)
  function confirmAction(text, yes, no){
    return new Promise(function(resolve){
      var pn=$("empPanel"); pn.innerHTML="";
      var box=el("div","emp-choice"); box.appendChild(el("div","emp-ctext",text));
      var row=el("div","emp-crow");
      var y=el("button","emp-btn primary",yes); y.onclick=function(){ renderPanel(); resolve(true); };
      var n=el("button","emp-btn ghost",no); n.onclick=function(){ renderPanel(); resolve(false); };
      row.appendChild(y); row.appendChild(n); box.appendChild(row); pn.appendChild(box);
    });
  }
  // 3 choix (négocier / OPA / payer). Renvoie "negotiate" | "opa" | "pay".
  function threeWay(text, a, b, c){
    return new Promise(function(resolve){
      var pn=$("empPanel"); pn.innerHTML="";
      var box=el("div","emp-choice"); box.appendChild(el("div","emp-ctext",text));
      var row=el("div","emp-crow");
      var ba=el("button","emp-btn",a); ba.onclick=function(){ renderPanel(); resolve("negotiate"); };
      var bb=el("button","emp-btn warn",b); if(me().opaUsed){ bb.disabled=true; bb.title="OPA déjà tentée ce tour"; } bb.onclick=function(){ renderPanel(); resolve("opa"); };
      var bc=el("button","emp-btn primary",c); bc.onclick=function(){ renderPanel(); resolve("pay"); };
      row.appendChild(bc); row.appendChild(ba); row.appendChild(bb); box.appendChild(row); pn.appendChild(box);
    });
  }
  function chooseFrom(text, options){
    return new Promise(function(resolve){
      var pn=$("empPanel"); pn.innerHTML="";
      var box=el("div","emp-choice"); box.appendChild(el("div","emp-ctext",text));
      options.forEach(function(o){ var b=el("button","emp-btn",o.label); b.onclick=function(){ renderPanel(); resolve(o.val); }; box.appendChild(b); });
      var cancel=el("button","emp-btn ghost","Annuler"); cancel.onclick=function(){ renderPanel(); resolve(null); }; box.appendChild(cancel);
      pn.appendChild(box);
    });
  }
  function showCard(title, text){
    return new Promise(function(resolve){
      var ov=$("empCardOv"); $("empCardTitle").textContent=title; $("empCardText").textContent=text;
      ov.classList.add("show"); EB.Sound.special&&EB.Sound.special();
      $("empCardOk").onclick=function(){ ov.classList.remove("show"); resolve(); };
    });
  }
  function showPropInfo(i){
    var c=cell(i); if(!isProp(c)) return;
    var lines=[c.name, "Prix : ₵"+c.price, "Propriétaire : "+ownerName(c)];
    if(c.type==="prop"){ lines.push("Loyer de base : ₵"+c.rentBase+" (×2 si quartier complet)");
      lines.push("Niveaux : Stand ×3, Boutique ×6, Grand Magasin ×10, Palais ×16");
      lines.push("Niveau actuel : "+(c.level?BUILD_LABEL[c.level-1]:"terrain nu")); }
    if(c.mortgaged) lines.push("⚠️ Sous cloche (hypothéquée)");
    EB.toast(lines.join(" · "), 2600);
  }

  /* --------------------- BOUTONS D'ACTION SUP. (mon tour) ----------------- */
  // Un bouton « Gérer » toujours dispo hors tour pour construire.
  function attachManage(){
    var pn=$("empPanel"); if(!pn||E.over) return;
    if($("empManage")) return;
    var m=el("button","emp-btn","🏗️ Construire"); m.id="empManage";
    m.onclick=async function(){ if(busy)return; busy=true; setRoll(false); await buildFlow(0); busy=false; if(!E.over){ renderPanel(); setRoll(true);} };
    pn.appendChild(m);
  }

  /* ------------------------------ SAUVEGARDE ------------------------------ */
  function saveState(){
    EB.store.empireGame = E.over?null:serialize();
    EB.persist();
  }
  function serialize(){
    return { cat:E.cat, sub:E.sub, diffVal:E.diffVal, botSuccess:E.botSuccess, lastDice:E.lastDice,
      players:E.players.map(function(p){ return {animalId:p.animalId,pos:p.pos,cash:p.cash,jail:p.jail,bot:p.bot,bankrupt:p.bankrupt,dbl:p.dbl||0}; }),
      board:E.board.map(function(c){ return isProp(c)?{owner:c.owner,level:c.level||0,mortgaged:!!c.mortgaged}:null; }) };
  }
  function deserialize(s){
    E={ cat:s.cat, sub:s.sub, diffVal:s.diffVal, botSuccess:s.botSuccess, lastDice:s.lastDice||7, over:false,
      board:buildBoard(),
      players:s.players.map(function(p){ return {animalId:p.animalId,pos:p.pos,cash:p.cash,jail:p.jail||0,bot:p.bot,bankrupt:!!p.bankrupt,dbl:p.dbl||0,opaUsed:false}; }) };
    s.board.forEach(function(sc,i){ if(sc&&isProp(E.board[i])){ E.board[i].owner=sc.owner; E.board[i].level=sc.level; E.board[i].mortgaged=sc.mortgaged; } });
  }

  /* ------------------------------ DÉMARRAGE ------------------------------- */
  function newGame(setup){
    var meId=setup.animalId;
    var others=EB.ANIMAUX.filter(function(a){ return a.id!==meId; }).map(function(a){return a.id;});
    for(var i=others.length-1;i>0;i--){ var j=rint(i+1); var t=others[i]; others[i]=others[j]; others[j]=t; }
    var bots=others.slice(0,3);
    E={ cat:setup.cat, sub:setup.sub||"Tout", diffVal:setup.diffVal, botSuccess:setup.botSuccess||0.55,
      lastDice:7, over:false, board:buildBoard(),
      players:[{animalId:meId,pos:0,cash:1500,jail:0,bot:false,bankrupt:false,dbl:0,opaUsed:false}]
        .concat(bots.map(function(b){ return {animalId:b,pos:0,cash:1500,jail:0,bot:true,bankrupt:false,dbl:0,opaUsed:false}; })) };
  }

  window.Empire={
    init:function(bridge){ EB=bridge; },
    start:function(setup){ newGame(setup); mount(); attachManage(); saveState(); },
    resume:function(){ var s=EB.store.empireGame; if(!s) return false; deserialize(s); mount(); attachManage(); return true; },
    hasSave:function(){ return !!EB.store.empireGame; },
    _dbg:{ state:function(){ return E; }, refresh:function(){ renderTokens(); renderCenter(); } }
  };
})();
