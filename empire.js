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
  var speed=1;              // ×2 pendant le tour des autres animaux (parties plus rapides)
  var empLang="fr";         // langue des cartes & règles : "fr" | "en" | "zh"
  var _frRulesHTML=null;    // cache du corps FR des règles (pour restaurer)

  /* --------------------- TRADUCTIONS (cartes & règles) -------------------- */
  // Renvoie la table EMP_I18N si une langue étrangère est active, sinon null (=FR d'origine).
  function LZ(){ return (typeof window!=="undefined" && window.EMP_I18N && (empLang==="en"||empLang==="zh")) ? window.EMP_I18N : null; }
  function tUI(key, fr){ var I=LZ(); return (I&&I.ui[empLang]&&I.ui[empLang][key])||fr; }
  function tStatus(key, fr){ var I=LZ(); return (I&&I.status[empLang]&&I.status[empLang][key])||fr; }
  function tType(key, fr){ var I=LZ(); return (I&&I.types[empLang]&&I.types[empLang][key])||fr; }
  function tBuildLbl(idx){ var I=LZ(); return (I&&I.build[empLang]&&I.build[empLang][idx])||BUILD_LABEL[idx]; }
  function tCard(fr){ var I=LZ(); return (I&&I.cards[fr]&&I.cards[fr][empLang])||fr; }
  function setEmpLang(lang){
    empLang=(lang==="en"||lang==="zh")?lang:"fr";
    if(EB&&EB.store){ EB.store.empLang=empLang; EB.persist&&EB.persist(); }
    // Si les règles sont ouvertes, on les recharge dans la nouvelle langue.
    var ov=$("empRulesOv"); if(ov&&ov.classList.contains("show")) fillRules();
    renderPanel();
  }

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
    /* Loyers relevés (×2) pour des parties ~2× plus courtes. */
    rentBase:Math.round(QUARTIERS[q].price*0.2), build:QUARTIERS[q].build, owner:-1, level:0, mortgaged:false}; }
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
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, Math.round(ms/speed)); }); }
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
  // Enregistre une variation de solde pour l'animation flottante (+/−) au-dessus du total.
  function noteDelta(pi, amt){ if(pi<0||!amt) return; (E._deltas=E._deltas||[]).push({pi:pi, amt:amt}); }
  function credit(pi, amount){ E.players[pi].cash+=amount; noteDelta(pi, amount); }
  function transfer(from, to, amount){ // from paie to
    E.players[from].cash-=amount; noteDelta(from, -amount);
    if(to>=0){ E.players[to].cash+=amount; noteDelta(to, amount); }
  }
  function pName(pi){ return EB.animalById(E.players[pi].animalId).name; }
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
    var base;
    if(c.type==="transport"){ var n=countType(c.owner,"transport"); base=[0,100,200,300,400][n]||400; }
    else if(c.type==="service"){ var n2=countType(c.owner,"service"); base=diceTotal*(n2>=2?20:10)||diceTotal*10; }
    else if(c.level>0) base=c.rentBase*RENT_MULT[c.level-1];
    else base=quartierComplete(c.owner,c.q)? c.rentBase*2 : c.rentBase;
    // Inflation : +50 % tous les deux tours (multiplicateur global).
    return Math.round(base*(E.rentMult||1));
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
  // Face de dé dessinée (SVG à points) — reflète la vraie valeur obtenue.
  function diceFaceSVG(n){
    var box='<rect x="6" y="6" width="88" height="88" rx="18" fill="#fff" stroke="#c9ced6" stroke-width="3"/>';
    if(!n){ return '<svg viewBox="0 0 100 100" class="emp-diesvg">'+box+'<text x="50" y="70" text-anchor="middle" font-size="52" font-weight="900" fill="#c2c8d2">?</text></svg>'; }
    var P={1:[[50,50]],2:[[30,30],[70,70]],3:[[30,30],[50,50],[70,70]],
      4:[[30,30],[70,30],[30,70],[70,70]],5:[[30,30],[70,30],[50,50],[30,70],[70,70]],
      6:[[30,28],[70,28],[30,50],[70,50],[30,72],[70,72]]};
    var pips=(P[n]||[]).map(function(p){ return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="9" fill="#26324b"/>'; }).join("");
    return '<svg viewBox="0 0 100 100" class="emp-diesvg">'+box+pips+'</svg>';
  }
  // Décor du centre : skyline corporate animée (gratte-ciels, fenêtres allumées,
  // dirigeable, trafic de rue) — ambiance grande métropole des affaires.
  function buildScene(){
    var towers=[{x:2,w:14,h:40},{x:18,w:11,h:56},{x:31,w:15,h:31},{x:48,w:12,h:63},
      {x:62,w:13,h:46},{x:77,w:15,h:52},{x:90,w:9,h:36}];
    var baseY=92, s='';
    towers.forEach(function(t,ti){
      var top=baseY-t.h;
      s+='<rect x="'+t.x+'" y="'+top+'" width="'+t.w+'" height="'+t.h+'" fill="url(#empTower)" rx="1"/>';
      // antenne + balise clignotante sur une tour sur deux
      if(ti%2===0){ var ax=(t.x+t.w/2);
        s+='<rect x="'+(ax-0.35).toFixed(2)+'" y="'+(top-4)+'" width="0.7" height="4" fill="#61729a"/>'
          +'<circle cx="'+ax.toFixed(2)+'" cy="'+(top-4)+'" r="0.9" fill="#ff6b6b"><animate attributeName="opacity" values="1;.15;1" dur="1.6s" repeatCount="indefinite"/></circle>'; }
      // grille de fenêtres
      var pad=1.6, gw=2.1, gh=2.5, gap=1.1;
      var cols=Math.max(1,Math.floor((t.w-pad*2+gap)/(gw+gap)));
      var rows=Math.max(1,Math.floor((t.h-pad*2+gap)/(gh+gap)));
      for(var r=0;r<rows;r++){ for(var cc=0;cc<cols;cc++){
        var wx=(t.x+pad+cc*(gw+gap)), wy=(top+pad+r*(gh+gap));
        var lit=((r*7+cc*3+ti*5)%4===0);
        var win='<rect x="'+wx.toFixed(2)+'" y="'+wy.toFixed(2)+'" width="'+gw+'" height="'+gh+'" rx="0.4" fill="'+(lit?'#ffe08a':'#3a4a72')+'" opacity="'+(lit?0.95:0.55)+'"';
        if(((r+cc+ti)%9)===0){ win+='><animate attributeName="fill" values="#3a4a72;#ffe08a;#3a4a72" dur="'+(3+((cc+r)%4))+'s" repeatCount="indefinite"/></rect>'; }
        else win+='/>';
        s+=win;
      }}
    });
    return '<svg class="emp-scene" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
      +'<defs>'
      +'<linearGradient id="empSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16233f"/><stop offset=".55" stop-color="#3b4d78"/><stop offset="1" stop-color="#c98a63"/></linearGradient>'
      +'<linearGradient id="empTower" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f4069"/><stop offset="1" stop-color="#182339"/></linearGradient>'
      +'</defs>'
      +'<rect width="100" height="100" fill="url(#empSky)"/>'
      +'<circle cx="80" cy="24" r="9" fill="#ffd9a0" opacity=".92"/><circle cx="80" cy="24" r="14" fill="#ffd9a0" opacity=".22"/>'
      // dirigeable corporate qui traverse le ciel
      +'<g><ellipse cx="0" cy="15" rx="7" ry="3" fill="#e9eef6"/><path d="M-6,15 h13" stroke="#b8c4da" stroke-width="0.6"/><rect x="-1.5" y="17.6" width="3" height="1.8" rx="0.6" fill="#9fb0cc"/>'
      +'<animateTransform attributeName="transform" type="translate" from="-16 0" to="122 7" dur="20s" repeatCount="indefinite"/></g>'
      +s
      // rue + trafic (phares blancs à l'aller, feux rouges au retour)
      +'<rect x="0" y="92" width="100" height="8" fill="#101828"/>'
      +'<rect x="0" y="91.4" width="100" height="0.5" fill="#f4c14e" opacity=".5"/>'
      +'<g fill="#fff3b0"><rect x="0" y="95" width="5" height="1.8" rx="0.9"><animate attributeName="x" values="-8;108" dur="6s" repeatCount="indefinite"/></rect>'
      +'<rect x="0" y="97.6" width="4" height="1.6" rx="0.8"><animate attributeName="x" values="-30;108" dur="8s" repeatCount="indefinite"/></rect></g>'
      +'<g fill="#ff6b6b"><rect x="0" y="93.4" width="4" height="1.6" rx="0.8"><animate attributeName="x" values="108;-8" dur="7.5s" repeatCount="indefinite"/></rect></g>'
      +'</svg>';
  }
  var SCENE_SVG=buildScene();

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
      cellEl.onclick=function(){ inspectCase(i); };
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
  function propCount(pi){ var n=0; E.board.forEach(function(c){ if(isProp(c)&&c.owner===pi) n++; }); return n; }
  function leaderIndex(){ var best=-1,bw=-1; E.players.forEach(function(p,pi){ if(p.bankrupt) return; var w=netWorth(p); if(w>bw){ bw=w; best=pi; } }); return best; }
  /* Menu « portefeuille » d'un joueur : la liste de ses propriétés (clic sur le HUD). */
  function showHoldings(pi){
    var ov=$("empHoldOv"); if(!ov || ov.classList.contains("show")) return;
    var p=E.players[pi]; if(!p) return;
    var a=EB.animalById(p.animalId), lead=leaderIndex();
    $("empHoldEmoji").textContent=EB.EMOJI[p.animalId]||"🦁";
    $("empHoldEmoji").style.background="radial-gradient(circle at 50% 40%, #fff, "+tokenColor(pi)+" 130%)";
    $("empHoldName").textContent=(pi===lead&&!p.bankrupt?"👑 ":"")+a.name+(pi===0?" (toi)":"")+(p.jail>0?" 🔒":"");
    $("empHoldMeta").innerHTML = p.bankrupt
      ? "<span class='emp-hold-ko'>✖ Ruiné</span>"
      : "💰 <b>₵"+p.cash+"</b> en caisse &nbsp;·&nbsp; 📊 Valeur totale <b>₵"+netWorth(p)+"</b> &nbsp;·&nbsp; 🏠 <b>"+propCount(pi)+"</b> terrain(s)";
    // Propriétés possédées, regroupées : quartiers, puis transports, puis services.
    var owned=E.board.filter(function(c){ return (c.type==="prop"||c.type==="transport"||c.type==="service") && c.owner===pi; });
    var body=$("empHoldBody"); body.innerHTML="";
    if(!owned.length){
      body.innerHTML="<div class='emp-hold-empty'>Aucune propriété pour l'instant.<br>Achète des terrains en tombant dessus !</div>";
    } else {
      // regrouper les propriétés par quartier
      var groups={}, order=[];
      owned.forEach(function(c){
        var key = c.type==="prop" ? ("q"+c.q) : c.type;
        if(!groups[key]){ groups[key]=[]; order.push(key); }
        groups[key].push(c);
      });
      order.forEach(function(key){
        var list=groups[key], first=list[0];
        var head=el("div","emp-hold-grp");
        if(key.charAt(0)==="q"){
          var q=first.q, complete=quartierComplete(pi,q);
          var dot=el("span","emp-hold-dot"); dot.style.background=QUARTIERS[q].col;
          head.appendChild(dot);
          head.appendChild(el("span","emp-hold-grpn",QUARTIERS[q].emoji+" "+QUARTIERS[q].name+(complete?" ✅ complet":"")));
        } else {
          head.appendChild(el("span","emp-hold-grpn",(key==="transport"?"🚌 Routes migratoires":"⚙️ Services de la vallée")));
        }
        body.appendChild(head);
        list.forEach(function(c){
          var it=el("div","emp-hold-item"+(c.mortgaged?" mort":""));
          var nm=el("div","emp-hold-iname",c.emoji+" "+c.name);
          var sub;
          if(c.type==="prop"){
            var lvl = c.level>0 ? BUILD_LABEL[c.level-1] : "terrain nu";
            sub="Niveau : "+lvl+" · Loyer dû : ₵"+rentOf(c,7);
          } else if(c.type==="transport"){
            sub="Loyer selon le nombre de routes possédées (₵"+rentOf(c,7)+" actuellement)";
          } else {
            sub="Loyer = "+(countType(pi,"service")>=2?"20":"10")+" × total des dés du visiteur";
          }
          var sb=el("div","emp-hold-isub", (c.mortgaged?"⚠️ Hypothéquée · ":"")+sub);
          it.appendChild(nm); it.appendChild(sb);
          // Clic sur un bien → ouvre sa carte détaillée (comme un clic sur le plateau).
          it.classList.add("clik");
          (function(idx){ it.onclick=function(){ ov.classList.remove("show"); inspectCase(idx); }; })(E.board.indexOf(c));
          body.appendChild(it);
        });
      });
    }
    ov.classList.add("show"); EB.Sound.click&&EB.Sound.click();
    var done=false;
    function close(){ if(done) return; done=true; ov.onclick=null; ov.classList.remove("show"); }
    ov.onclick=function(e){ if(e.target===ov) close(); };
    var xb=$("empHoldClose"); if(xb) xb.onclick=close;
  }
  function renderCenter(){
    var c=$("empCenter"); if(!c) return; c.innerHTML=SCENE_SVG;
    var cover=el("div","emp-cover");
    cover.appendChild(el("div","emp-title","👑 L'Empire des Évadés"));
    if((E.rentMult||1)>1){ cover.appendChild(el("div","emp-inflation","📈 Loyers ×"+E.rentMult)); }
    // Récapitulatif « qui mène » : chaque animal, son nombre de propriétés, son solde.
    var lead=leaderIndex();
    var hud=el("div","emp-hud");
    E.players.forEach(function(p,pi){
      var row=el("div","emp-p"+(pi===0?" me":"")+(p.bankrupt?" ko":"")+(pi===lead&&!p.bankrupt?" lead":"")); row.id="empRow"+pi;
      row.style.setProperty("--pcol",tokenColor(pi));
      var em=el("span","emp-pe",EB.EMOJI[p.animalId]);
      var nm=el("span","emp-pn",(pi===lead&&!p.bankrupt?"👑 ":"")+EB.animalById(p.animalId).name+(p.jail>0?" 🔒":""));
      var props=el("span","emp-pk","🏠"+propCount(pi));
      var cash=el("span","emp-pc"); cash.id="empPC"+pi; cash.textContent=p.bankrupt?"✖ ruiné":("₵"+p.cash);
      row.appendChild(em); row.appendChild(nm); row.appendChild(props); row.appendChild(cash);
      row.classList.add("clik");
      (function(idx){ row.onclick=function(){ showHoldings(idx); }; })(pi);
      hud.appendChild(row);
    });
    cover.appendChild(hud);
    var dice=el("div","emp-dice"); dice.id="empDice";
    dice.innerHTML="<span id='empD1' class='emp-die'>"+diceFaceSVG(E.d1)+"</span><span id='empD2' class='emp-die'>"+diceFaceSVG(E.d2)+"</span>";
    cover.appendChild(dice);
    // Journal d'événements : dernières lignes (« Lion a payé ₵30 de loyer à Éléphant. »)
    var log=el("div","emp-log"); log.id="empMsg";
    (E._log||[]).slice(-3).forEach(function(line){ log.appendChild(el("div","emp-logline",line)); });
    cover.appendChild(log);
    c.appendChild(cover);
    flushDeltas();
  }
  // Journal : say() empile la ligne et réaffiche les 3 dernières.
  function say(t){
    if(!t) return;
    E._log=E._log||[]; E._log.push(t); if(E._log.length>8) E._log.shift();
    var m=$("empMsg"); if(m){ m.innerHTML=""; E._log.slice(-3).forEach(function(line){ m.appendChild(el("div","emp-logline",line)); }); m.scrollTop=m.scrollHeight; }
  }
  // Animations flottantes +₵ (vert) / −₵ (rouge) au-dessus du total de chaque animal.
  function flushDeltas(){
    var ds=E._deltas; E._deltas=[]; if(!ds||!ds.length) return;
    var byPi={}; ds.forEach(function(d){ byPi[d.pi]=(byPi[d.pi]||0)+d.amt; });
    Object.keys(byPi).forEach(function(k){
      var amt=byPi[k]; if(!amt) return;
      var host=$("empPC"+k); if(!host) return;
      var f=el("div","emp-delta "+(amt>0?"up":"down"), (amt>0?"+₵":"−₵")+Math.abs(amt));
      host.appendChild(f);
      setTimeout(function(){ if(f&&f.parentNode) f.parentNode.removeChild(f); }, 1300);
    });
  }
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
    // Sélecteur de langue des cartes & règles (FR / EN / 中).
    var langRow=el("div","emp-langsw");
    [["fr","FR"],["en","EN"],["zh","中"]].forEach(function(pair){
      var b=el("button","emp-langbtn"+(empLang===pair[0]?" on":""),pair[1]);
      b.onclick=function(){ setEmpLang(pair[0]); };
      langRow.appendChild(b);
    });
    pn.appendChild(langRow);
    var ab=el("button","emp-btn ghost","Abandonner"); ab.onclick=quit;
    pn.appendChild(ab);
  }
  // Remplit le corps/le titre/le bouton des règles selon la langue active.
  function fillRules(){
    var ov=$("empRulesOv"); if(!ov) return;
    var body=ov.querySelector(".emp-rules-body");
    var title=ov.querySelector(".emp-rules-t");
    var ok=$("empRulesOk");
    if(body && _frRulesHTML===null) _frRulesHTML=body.innerHTML;   // mémorise le FR d'origine
    var I=LZ();
    if(body) body.innerHTML = I ? I.rulesHTML[empLang] : _frRulesHTML;
    if(title) title.textContent = I ? I.rulesTitle[empLang] : "📜 Règles de l'Empire";
    if(ok) ok.textContent = I ? I.rulesOk[empLang] : "J'ai compris";
  }
  function showRules(){
    var ov=$("empRulesOv"); if(!ov) return;
    fillRules();
    ov.classList.add("show"); EB.Sound.step&&EB.Sound.step();
    var ok=$("empRulesOk"); if(ok) ok.onclick=function(){ ov.classList.remove("show"); };
  }
  function setRoll(on){ var b=$("empRoll"); if(b) b.disabled=!on; }

  /* ============================ TOUR JOUEUR =============================== */
  async function playerTurn(){
    if(busy||E.over) return; busy=true; setRoll(false);
    // Nouveau tour du joueur : inflation des loyers +50 % tous les deux tours.
    E.round=(E.round||0)+1;
    if(E.round>=3 && (E.round%2)===1){
      E.rentMult=Math.round((E.rentMult||1)*1.5*100)/100;
      say("📈 Inflation ! Tous les loyers grimpent de +50 % (×"+E.rentMult+").");
      EB.Sound.special&&EB.Sound.special(); renderCenter();
    }
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
    EB.Sound.diceSpin&&EB.Sound.diceSpin();
    var a=$("empD1"),b=$("empD2");
    if(a)a.classList.add("rolling"); if(b)b.classList.add("rolling");
    for(var n=0;n<8;n++){ if(a)a.innerHTML=diceFaceSVG(1+rint(6)); if(b)b.innerHTML=diceFaceSVG(1+rint(6)); await sleep(70); }
    // mémorise la vraie valeur : renderCenter la réaffichera à l'identique.
    E.d1=d1; E.d2=d2;
    if(a){ a.innerHTML=diceFaceSVG(d1); a.classList.remove("rolling"); a.classList.add("pop"); }
    if(b){ b.innerHTML=diceFaceSVG(d2); b.classList.remove("rolling"); b.classList.add("pop"); }
    EB.Sound.diceStop&&EB.Sound.diceStop();
    E.lastDice=d1+d2;
    await sleep(320);
  }

  /* ------------------- CARTE ILLUSTRÉE DE LA CASE (jeu clair) -------------- */
  function caseInfo(c){
    var big=c.emoji||"•", bg="linear-gradient(160deg,#eef4ff,#fff)", name=c.name, desc="";
    if(c.type==="prop"){
      bg="linear-gradient(160deg,"+QUARTIERS[c.q].col+" 0%, #fff8ec 70%)";
      var status=c.owner<0
        ? "<b>"+tStatus("libre","Propriété LIBRE — à acheter !")+"</b>"
        : (c.owner===0 ? "<b>"+tStatus("mine","C'est ta propriété.")+"</b>"
                       : tStatus("other","Propriété de {owner}").replace("{owner}","<b>"+ownerName(c)+"</b>"));
      var rb=c.rentBase;
      var lvls=RENT_MULT.map(function(m,k){ return tBuildLbl(k)+" <b>₵"+(rb*m)+"</b>"; }).join(" · ");
      desc="<b>"+QUARTIERS[c.q].name+"</b><br>"+status
        +"<div class='emp-caseinfo'>"
        +"<div class='emp-caserow'><span>💵 "+tUI("prixAchat","Prix d'achat")+"</span><b>₵"+c.price+"</b></div>"
        +"<div class='emp-caserow'><span>🏗️ "+tUI("construction","Construction")+"</span><b>₵"+c.build+" "+tUI("parNiveau","/ niveau")+"</b></div>"
        +"<div class='emp-caserow'><span>🏷️ "+tUI("loyerNu","Loyer terrain nu")+"</span><b>₵"+rb+"</b> <span class='emp-casemut'>(₵"+(rb*2)+" "+tUI("quartierComplet","quartier complet")+")</span></div>"
        +"<div class='emp-caserent'>🏠 "+lvls+"</div>"
        +"</div>"
        +(c.level>0?"<div class='emp-casenow'>"+tUI("niveauActuel","Niveau actuel")+" : <b>"+tBuildLbl(c.level-1)+"</b> → "+tUI("loyerDu","loyer dû")+" <b>₵"+(c.owner>=0?rentOf(c,7):Math.round(rb*RENT_MULT[c.level-1]*(E.rentMult||1)))+"</b></div>"
                   :"<div class='emp-casenow'>"+tUI("terrainNu","Terrain nu (aucun bâtiment)")+"</div>");
    } else if(c.type==="transport"){ bg="linear-gradient(160deg,#cfe0ff,#fff)";
      desc=tType("transport","<b>Route migratoire</b> — Transport à acheter (<b>₵200</b>).<br>Le loyer grimpe avec le nombre de lignes possédées (100 → 400 ₵)."); }
    else if(c.type==="service"){ bg="linear-gradient(160deg,#d5f0e0,#fff)";
      desc=tType("service","<b>Service de la vallée</b> — À acheter (<b>₵150</b>).<br>Loyer = <b>10 × le total des dés</b> du visiteur (× 20 avec les deux services)."); }
    else if(c.type==="depart"){ bg="linear-gradient(160deg,#dcf3b6,#fff)";
      desc=tType("depart","<b>Grand Baobab (Départ)</b><br>Touche <b>200 ₵</b> de salaire à chaque passage. Tente la <b>Prime de la Jungle</b> pour le doubler !"); }
    else if(c.type==="impot"){ bg="linear-gradient(160deg,#ffd9d0,#fff)";
      desc=tType("impot","<b>Impôt sur les croquettes</b><br>Paie <b>100 ₵</b> à la banque."); }
    else if(c.type==="patte"){ bg="linear-gradient(160deg,#ffe6b0,#fff)";
      desc=tType("patte","<b>Coup de Patte</b><br>Tire une carte : <b>bonne ou mauvaise</b> surprise !"); }
    else if(c.type==="cagnotte"){ bg="linear-gradient(160deg,#d8e6ff,#fff)";
      desc=tType("cagnotte","<b>Cagnotte de la Meute</b><br>Tire une carte de la caisse commune, <b>plutôt favorable</b>."); }
    else if(c.type==="fourriere"){ bg="linear-gradient(160deg,#e6eaee,#fff)";
      desc=tType("fourriere","<b>Fourrière (visite)</b><br>Simple visite : rien ne se passe… sauf si tu y es enfermé !"); }
    else if(c.type==="gardien"){ bg="linear-gradient(160deg,#ffd0d0,#fff)";
      desc=tType("gardien","<b>Le Gardien !</b><br>Il te repère : direction la <b>Fourrière</b>, sans salaire au passage."); }
    else if(c.type==="repos"){ bg="linear-gradient(160deg,#cdeeff,#fff)";
      desc=tType("repos","<b>Le Point d'Eau</b><br>Case repos : on souffle, rien ne se passe."); }
    return {big:big, bg:bg, name:name, desc:desc};
  }
  // Consultation libre d'une case (clic du joueur) : même belle carte, tap pour fermer.
  function inspectCase(i){
    var ov=$("empCaseOv"); if(!ov || ov.classList.contains("show")) return;
    var c=cell(i), info=caseInfo(c);
    $("empCaseArt").textContent=info.big; $("empCaseArt").style.background=info.bg;
    $("empCaseName").textContent=info.name; $("empCaseDesc").innerHTML=info.desc;
    var hint=$("empCaseHint"); if(hint) hint.textContent="👆 Touche en dehors pour fermer";
    var done=false;
    function close(){ if(done) return; done=true; ov.onclick=null; ov.classList.remove("show"); }
    // Action « Faire une offre d'achat » : uniquement sur un bien détenu par un adversaire,
    // pendant le tour du joueur (hors animation), et si le joueur n'est pas ruiné.
    var act=$("empCaseActions"); if(act) act.innerHTML="";
    if(act && c && (c.type==="prop"||c.type==="transport"||c.type==="service")
       && c.owner>0 && !busy && !E.over && alive(E.players[0])){
      var b=el("button","emp-btn primary","💰 Faire une offre d'achat");
      b.onclick=function(e){ e.stopPropagation(); close(); makeOfferTurn(i); };
      act.appendChild(b);
    }
    ov.classList.add("show"); EB.Sound.click&&EB.Sound.click();
    ov.onclick=function(e){ if(e.target===ov) close(); };
  }
  // Lance le tour « offre d'achat » (verrou de tour comme la construction).
  async function makeOfferTurn(i){
    if(busy||E.over) return; busy=true; setRoll(false);
    await makeOffer(cell(i));
    busy=false; if(!E.over){ renderPanel(); setRoll(true); }
  }
  // Système d'offre : le joueur propose un prix pour racheter le bien d'un adversaire.
  // Plus l'offre est basse (défavorable au vendeur), plus il faut de bonnes réponses.
  // Plancher : la moitié du prix d'origine. Offre haute = négociation plus facile.
  async function makeOffer(c){
    if(!c || !(c.owner>0)) return;
    var owner=c.owner, base=c.price, cash=E.players[0].cash;
    var tiers=[
      {mult:1.5,  q:2, lbl:"Offre généreuse (×1,5)"},
      {mult:1.0,  q:3, lbl:"Prix d'origine"},
      {mult:0.75, q:4, lbl:"Offre basse (¾)"},
      {mult:0.5,  q:5, lbl:"Offre plancher (½)"}
    ];
    var opts=[];
    tiers.forEach(function(t){
      var price=Math.round(base*t.mult);
      if(cash>=price) opts.push({ label:t.lbl+" — ₵"+price+" · "+t.q+" bonne"+(t.q>1?"s":"")+" réponse"+(t.q>1?"s":""), val:{price:price,q:t.q} });
    });
    if(!opts.length){ say("Fonds insuffisants : il faut au moins ₵"+Math.round(base*0.5)+" pour tenter une offre sur « "+c.name+" »."); await sleep(400); return; }
    var choice=await chooseFrom("Offre d'achat sur « "+c.name+" » (à "+ownerName(c)+", prix d'origine ₵"+base+"). Plus l'offre est basse, plus il faut de bonnes réponses :", opts);
    if(!choice) return; // annulé
    say("Offre de ₵"+choice.price+" à "+ownerName(c)+" pour « "+c.name+" » : enchaîne "+choice.q+" bonne"+(choice.q>1?"s":"")+" réponse"+(choice.q>1?"s":"")+" !");
    EB.Sound.duelStart&&EB.Sound.duelStart(); await sleep(400);
    for(var n=0;n<choice.q;n++){
      var ok=await ask("Négociation d'achat "+(n+1)+"/"+choice.q+" — « "+c.name+" » pour ₵"+choice.price);
      if(!ok){ say("Offre refusée : "+ownerName(c)+" garde « "+c.name+" »."); EB.Sound.bad&&EB.Sound.bad(); await sleep(300); return; }
      EB.Sound.lock&&EB.Sound.lock();
    }
    transfer(0, owner, choice.price); c.owner=0; c.level=0;
    say("Affaire conclue ! « "+c.name+" » t'appartient pour ₵"+choice.price+"."); EB.Sound.win&&EB.Sound.win();
    paintBuy(0); renderTokens(); renderCenter(); await sleep(400);
    await checkSolvency(0);
  }
  function showCaseCard(i){
    return new Promise(function(res){
      var ov=$("empCaseOv"); if(!ov){ res(); return; }
      var info=caseInfo(cell(i));
      $("empCaseArt").textContent=info.big; $("empCaseArt").style.background=info.bg;
      $("empCaseName").textContent=info.name; $("empCaseDesc").innerHTML=info.desc;
      var act=$("empCaseActions"); if(act) act.innerHTML="";   // pas d'action à l'arrivée
      var hint=$("empCaseHint"); if(hint) hint.textContent="👆 Touche pour continuer";
      ov.classList.add("show"); EB.Sound.whoosh&&EB.Sound.whoosh();
      // La carte reste affichée tant que le joueur ne touche pas l'écran (pas de fermeture auto).
      var done=false;
      function close(){ if(done) return; done=true; ov.onclick=null; ov.classList.remove("show"); setTimeout(res,160); }
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
    var cash=E.players[pi].cash, canAfford=cash>=c.price;
    var yes=await confirmAction(
      canAfford
        ? "« "+c.name+" » est libre (₵"+c.price+"). Répondre juste pour l'acheter ?"
        : "« "+c.name+" » est libre (₵"+c.price+"), mais tu n'as que ₵"+cash+" : fonds insuffisants pour l'acheter.",
      canAfford ? "Acheter" : "Acheter (₵"+c.price+")",
      "Passer",
      canAfford ? null : { yesDisabled:true, yesHint:"Il te manque ₵"+(c.price-cash) });
    if(!yes){ return; }
    var ok=await ask("Achat de « "+c.name+" » — ₵"+c.price);
    if(ok){ c.owner=pi; transfer(pi,-1,c.price); paintBuy(pi); say(pName(pi)+" a acheté « "+c.name+" » (₵"+c.price+")."); }
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
      "Négocier ÷2 (1 question — raté = loyer ×3)","OPA : rachat forcé (3 réponses — raté = loyer ×5)","Payer ₵"+rent);
    if(choice==="pay"){ transfer(pi,owner,rent); say(pName(pi)+" a payé ₵"+rent+" de loyer à "+ownerName(c)+"."); EB.Sound.bad&&EB.Sound.bad(); }
    else if(choice==="negotiate"){
      // 1 question : réussie → loyer ÷2 ; ratée → loyer ×3.
      say("Négociation : réussis 1 question pour diviser le loyer par 2 (raté = loyer ×3).");
      await sleep(200);
      var ok=await ask("Négociation — loyer ÷2 sur « "+c.name+" » (raté : loyer ×3)");
      var due=ok?Math.round(rent/2):rent*3;
      transfer(pi,owner,due); say(ok?(pName(pi)+" négocie : loyer ÷2, il paie ₵"+due+" à "+ownerName(c)+"."):(pName(pi)+" rate la négociation : loyer ×3, ₵"+due+" à "+ownerName(c)+"."));
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
      if(!ok){ // échec : loyer ×5 (lourde pénalité du rachat forcé raté)
        transfer(pi,owner,rent*5); say("OPA ratée ! Loyer ×5 : −₵"+(rent*5)+".");
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
  // Nombre de « maisons » (niveaux) encore constructibles dans un quartier possédé.
  function maxHousesIn(pi,q){ var s=0; levelsOf(pi,q).forEach(function(l){ s+=(4-l); }); return s; }
  // Compteur : le joueur choisit combien de maisons construire, avec estimation du coût.
  function buildCounter(q, maxN, cost){
    return new Promise(function(resolve){
      var pn=$("empPanel"); pn.innerHTML="";
      var n=1;
      var box=el("div","emp-choice");
      box.appendChild(el("div","emp-ctext","🏗️ Construire dans "+QUARTIERS[q].name+"　·　₵"+cost+" / maison　·　max "+maxN));
      var counter=el("div","emp-counter");
      var minus=el("button","emp-cbtn","−");
      var cnt=el("div","emp-cnum","1");
      var plus=el("button","emp-cbtn","+");
      counter.appendChild(minus); counter.appendChild(cnt); counter.appendChild(plus);
      box.appendChild(counter);
      var est=el("div","emp-cest"); box.appendChild(est);
      function upd(){ cnt.textContent=String(n); est.innerHTML="Coût total estimé : <b>₵"+(n*cost)+"</b>"; }
      upd();
      minus.onclick=function(){ if(n>1){ n--; upd(); EB.Sound.click&&EB.Sound.click(); } };
      plus.onclick=function(){ if(n<maxN){ n++; upd(); EB.Sound.click&&EB.Sound.click(); } };
      var row=el("div","emp-crow");
      var go=el("button","emp-btn primary","Construire"); go.onclick=function(){ renderPanel(); resolve(n); };
      var cancel=el("button","emp-btn ghost","Annuler"); cancel.onclick=function(){ renderPanel(); resolve(0); };
      row.appendChild(go); row.appendChild(cancel); box.appendChild(row);
      pn.appendChild(box);
    });
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
    // choisir un quartier
    var choice=await chooseFrom("Construire dans quel quartier ?", opts.map(function(o){
      return {label:QUARTIERS[o.q].name+" (₵"+QUARTIERS[o.q].build+" / maison, jusqu'à "+maxHousesIn(pi,o.q)+")", val:o.q}; }));
    if(choice==null) return;
    var q=choice, cost=QUARTIERS[q].build, cash=E.players[pi].cash;
    var maxN=Math.min(maxHousesIn(pi,q), Math.floor(cash/cost));
    if(maxN<1){ say("Fonds insuffisants pour construire ici (₵"+cost+" / maison)."); await sleep(200); return; }
    // combien de maisons ?
    var count=await buildCounter(q, maxN, cost);
    if(count<1) return;
    var total=count*cost;
    var ok=await ask("Construction : "+count+" maison"+(count>1?"s":"")+" dans "+QUARTIERS[q].name+" — ₵"+total);
    if(ok){
      transfer(pi,-1,total);
      for(var k=0;k<count;k++){
        var minL=Math.min.apply(null,levelsOf(pi,q));
        var done=false;
        E.board.forEach(function(c){ if(!done&&c.type==="prop"&&c.q===q&&c.owner===pi&&c.level===minL&&c.level<4){ c.level++; done=true; } });
      }
      EB.Sound.special&&EB.Sound.special(); say("Chantier terminé : "+count+" maison"+(count>1?"s":"")+" à "+QUARTIERS[q].name+" !");
    } else { transfer(pi,-1,Math.round(total*0.1)); say("Chantier reporté : les castors gardent 10 % d'acompte."); }
    renderTokens(); renderCenter(); await sleep(400);
  }
  function levelsOf(pi,q){ var a=[]; E.board.forEach(function(c){ if(c.type==="prop"&&c.q===q&&c.owner===pi) a.push(c.level); }); return a; }
  // Le joueur possède-t-il au moins une propriété de quartier ?
  function quartiersOwned(pi){ var n=0; E.board.forEach(function(c){ if(c.type==="prop"&&c.owner===pi) n++; }); return n>0; }

  /* ------------------------------ CARTES ---------------------------------- */
  async function drawCard(pi, deck, title, human){
    var card=deck[rint(deck.length)];
    if(human){ await showCard(title, tCard(card.t)); }
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
    speed=2; // les tours des animaux défilent 2× plus vite
    try{
      for(var i=1;i<E.players.length;i++){ if(E.over) return; var p=E.players[i]; if(p.bankrupt) continue;
        say(EB.animalById(p.animalId).name+" joue…"); await sleep(350);
        if(p.jail>0){ await jailTurn(i); if(p.jail>0){ continue; } }
        await doRoll(i, false);
        if(E.over) return;
        await botBuild(i);
      }
    } finally { speed=1; }
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
    var c=cell(E.players[pi].pos), rent=rentOf(c,diceTotal), owner=c.owner;
    var price150=Math.round(c.price*1.5), name=EB.animalById(E.players[owner].animalId).name;
    if(owner===0){
      // Contre le JOUEUR : peut tenter une OPA (défense 5 questions) ou une
      // négociation de loyer ÷2 (défense 3 questions). Sinon paie plein tarif.
      var canOpa = c.type==="prop" && !c.mortgaged && (E.players[pi].cash-price150)>=100;
      var r=Math.random();
      if(canOpa && r<0.32){ await defenseFlow(pi, c); renderTokens(); renderCenter(); await sleep(300); await checkSolvency(pi); return; }
      if(r<0.60){ await negotiateVsPlayer(pi, c, rent); renderTokens(); renderCenter(); await sleep(300); await checkSolvency(pi); return; }
      transfer(pi,0,rent); botSay(pi,"a payé ₵"+rent+" de loyer à "+pName(0)+".");
      renderTokens(); renderCenter(); await sleep(250); await checkSolvency(pi); return;
    }
    // Contre un autre BOT : peut tenter une OPA (résolution automatique, 5 réponses).
    var canOpaBot = c.type==="prop" && !c.mortgaged && (E.players[pi].cash-price150)>=100 && Math.random()<0.32;
    if(canOpaBot){ await botOpaVsBot(pi, c); renderTokens(); renderCenter(); await sleep(300); await checkSolvency(pi); return; }
    transfer(pi,owner,rent); botSay(pi,"a payé ₵"+rent+" de loyer à "+name+".");
    renderTokens(); renderCenter(); await sleep(250);
    await checkSolvency(pi);
  }
  // OPA d'un bot contre un autre bot : 5 réponses simulées d'affilée.
  async function botOpaVsBot(pi, c){
    var owner=c.owner, price150=Math.round(c.price*1.5), rent=rentOf(c,E.lastDice);
    botSay(pi,"tente une OPA sur « "+c.name+" » de "+EB.animalById(E.players[owner].animalId).name+" !");
    EB.Sound.duelStart&&EB.Sound.duelStart(); await sleep(750);
    var ok=true; for(var n=0;n<5;n++){ if(!botAnswers()){ ok=false; break; } }
    if(ok){
      transfer(pi,owner,price150); c.owner=pi; c.level=0;
      botSay(pi,"réussit son OPA et rafle « "+c.name+" » !"); EB.Sound.win&&EB.Sound.win();
    } else {
      transfer(pi,owner,rent*2); botSay(pi,"rate son OPA : loyer doublé (−₵"+(rent*2)+")."); EB.Sound.bad&&EB.Sound.bad();
    }
    await sleep(600);
  }
  // OPA d'un bot contre le JOUEUR : animation + défense (5 bonnes réponses).
  async function defenseFlow(attacker, c){
    var rent=rentOf(c,E.lastDice), price150=Math.round(c.price*1.5), aname=EB.animalById(E.players[attacker].animalId).name;
    await showChallenge(attacker, c, {
      banner:"⚔️ OPA HOSTILE !",
      html:"<b>"+aname+"</b> lance une <b>OPA hostile</b> pour t'arracher <b>« "+c.name+" »</b> !<br>Défends-toi : <b>3 bonnes réponses</b> et l'attaque échoue.",
      btn:"🛡️ Me défendre" });
    say("Défense OPA : réussis 3 questions pour conserver « "+c.name+" ».");
    EB.Sound.duelStart&&EB.Sound.duelStart(); await sleep(300);
    var defended=true;
    for(var n=0;n<3;n++){
      var ok=await ask("🛡️ Défense OPA "+(n+1)+"/3 — protège « "+c.name+" »");
      if(!ok){ defended=false; break; }
      EB.Sound.lock&&EB.Sound.lock();
    }
    if(defended){
      transfer(attacker,0,rent*2);
      say("OPA repoussée ! "+aname+" te verse ₵"+(rent*2)+" de dédommagement.");
      EB.Sound.win&&EB.Sound.win();
    } else {
      transfer(attacker,0,price150); c.owner=attacker; c.level=0;
      say(aname+" s'empare de « "+c.name+" » (+₵"+price150+" pour toi).");
      EB.Sound.net&&EB.Sound.net();
    }
    await sleep(500);
  }
  // Négociation d'un bot contre le JOUEUR : il veut un loyer ÷2. Le joueur se
  // défend avec 3 bonnes réponses ; s'il réussit, le bot paie plein tarif.
  async function negotiateVsPlayer(attacker, c, rent){
    var aname=EB.animalById(E.players[attacker].animalId).name, half=Math.round(rent/2);
    // Le joueur peut ACCEPTER le rabais tout de suite, ou TENIR BON (1 question) pour le plein tarif.
    var defend=await confirmAction(
      aname+" veut négocier un loyer ÷2 sur « "+c.name+" » (₵"+rent+" → ₵"+half+"). Tenir bon (1 bonne réponse) pour le plein tarif, ou accepter le rabais ?",
      "🛡️ Tenir bon", "🤝 Accepter le ÷2");
    if(!defend){ // le joueur accepte le rabais
      transfer(attacker,0,half); say("Tu acceptes le rabais : "+aname+" te paie ₵"+half+" (loyer ÷2)."); EB.Sound.coin&&EB.Sound.coin();
      await sleep(300); return;
    }
    say("Négociation : réussis 1 question pour lui faire payer le plein tarif.");
    await sleep(200);
    var held=await ask("🤝 Négociation — tiens ton loyer sur « "+c.name+" »");
    if(held){ transfer(attacker,0,rent); say("Négociation refusée ! "+aname+" paie le plein tarif : +₵"+rent+"."); EB.Sound.coin&&EB.Sound.coin(); }
    else { transfer(attacker,0,half); say(aname+" négocie : loyer ÷2, tu ne touches que ₵"+half+"."); EB.Sound.bad&&EB.Sound.bad(); }
    await sleep(400);
  }
  // Superposition de défi (OPA / négociation), animée ; résout au clic du bouton.
  function showChallenge(attacker, c, opts){
    return new Promise(function(resolve){
      var ov=$("empOpaOv"); if(!ov){ resolve(); return; }
      var em=EB.EMOJI[E.players[attacker].animalId]||"🦁";
      var ban=$("empOpaBanner"), art=$("empOpaArt"), txt=$("empOpaText"), go=$("empOpaGo");
      if(ban) ban.textContent=opts.banner;
      if(art) art.textContent=em;
      if(txt) txt.innerHTML=opts.html;
      if(go) go.textContent=opts.btn;
      ov.classList.add("show"); EB.Sound.siren&&EB.Sound.siren();
      if(go) go.onclick=function(){ ov.classList.remove("show"); resolve(); };
    });
  }
  // Les bots améliorent AU MAXIMUM leurs quartiers complets dès qu'ils en ont les
  // moyens (en gardant une petite réserve), pour faire grimper les loyers.
  async function botBuild(pi){
    var p=E.players[pi], built=0, guard=0;
    while(guard++<40){
      var opts=buildableQuartiers(pi);            // quartiers complets encore constructibles (niveau < 4)
      if(!opts.length) break;
      opts.sort(function(a,b){ return QUARTIERS[a.q].build-QUARTIERS[b.q].build; });  // le moins cher d'abord
      var q=opts[0].q, cost=QUARTIERS[q].build;
      if(p.cash-cost < 200) break;                // garde une réserve de sécurité
      transfer(pi,-1,cost);
      var minL=Math.min.apply(null,levelsOf(pi,q)), done=false;
      E.board.forEach(function(c){ if(!done&&c.type==="prop"&&c.q===q&&c.owner===pi&&c.level===minL&&c.level<4){ c.level++; done=true; } });
      built++;
    }
    if(built>0){ botSay(pi,"améliore ses quartiers ("+built+" niveau"+(built>1?"x":"")+")."); EB.Sound.special&&EB.Sound.special(); renderTokens(); renderCenter(); await sleep(300); }
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
  function confirmAction(text, yes, no, opts){
    opts=opts||{};
    return new Promise(function(resolve){
      var pn=$("empPanel"); pn.innerHTML="";
      var box=el("div","emp-choice"); box.appendChild(el("div","emp-ctext",text));
      var row=el("div","emp-crow");
      var y=el("button","emp-btn primary",yes);
      if(opts.yesDisabled){ y.disabled=true; if(opts.yesHint) y.title=opts.yesHint; }
      else { y.onclick=function(){ renderPanel(); resolve(true); }; }
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
    return { cat:E.cat, sub:E.sub, diffVal:E.diffVal, botSuccess:E.botSuccess, lastDice:E.lastDice, d1:E.d1||null, d2:E.d2||null,
      rentMult:E.rentMult||1, round:E.round||0,
      players:E.players.map(function(p){ return {animalId:p.animalId,pos:p.pos,cash:p.cash,jail:p.jail,bot:p.bot,bankrupt:p.bankrupt,dbl:p.dbl||0}; }),
      board:E.board.map(function(c){ return isProp(c)?{owner:c.owner,level:c.level||0,mortgaged:!!c.mortgaged}:null; }) };
  }
  function deserialize(s){
    E={ cat:s.cat, sub:s.sub, diffVal:s.diffVal, botSuccess:s.botSuccess, lastDice:s.lastDice||7, d1:s.d1||null, d2:s.d2||null, over:false, _log:[], _deltas:[],
      rentMult:s.rentMult||1, round:s.round||0,
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
      lastDice:7, d1:null, d2:null, over:false, _log:[], _deltas:[], board:buildBoard(),
      rentMult:1, round:0,   // inflation des loyers : +50 % tous les deux tours
      players:[{animalId:meId,pos:0,cash:1500,jail:0,bot:false,bankrupt:false,dbl:0,opaUsed:false}]
        .concat(bots.map(function(b){ return {animalId:b,pos:0,cash:1500,jail:0,bot:true,bankrupt:false,dbl:0,opaUsed:false}; })) };
  }

  window.Empire={
    init:function(bridge){ EB=bridge; if(EB&&EB.store&&(EB.store.empLang==="en"||EB.store.empLang==="zh")) empLang=EB.store.empLang; },
    start:function(setup){ newGame(setup); mount(); attachManage(); saveState(); },
    resume:function(){ var s=EB.store.empireGame; if(!s) return false; deserialize(s); mount(); attachManage(); return true; },
    hasSave:function(){ return !!EB.store.empireGame; },
    _dbg:{ state:function(){ return E; }, refresh:function(){ renderTokens(); renderCenter(); },
      // Déclenche un défi (OPA/négociation) d'un bot contre le joueur, pour tests.
      challenge:function(kind){ var c=cell(1); c.owner=0; E.players[0].pos=1;
        if(kind==="nego") return negotiateVsPlayer(1,c,rentOf(c,7));
        return defenseFlow(1,c); } }
  };
})();
