/* ============================================================================
   VOCAB — Module d'apprentissage du vocabulaire français façon 百词斩
   Deux onglets : « 词汇 » (apprentissage SRS) et « 词典 » (dictionnaire).
   Interface 100 % en chinois ; le contenu appris est le français.
   100 % statique / hors-ligne : images = emoji, audio = TTS fr-FR du navigateur.
   ========================================================================== */
(function(){
  "use strict";
  var B=null;                 // pont (store, persist, Sound)
  var DATA=null;              // window.VOCAB_DATA
  var S=null;                 // état persistant (store.vocab)
  var SESS=null;              // session en cours (mémoire)

  var INTERVALS=[0,1,2,4,7,15,30];         // jours par palier SRS (1..6)
  var MAXSTAGE=6;
  var MODE=["","image","fr2zh","zh2fr","audio","spell","spell"]; // par palier

  /* ---------------------------- i18n (fr / en / zh) ---------------------- */
  var vkLang="fr";
  var I18N=(typeof window!=="undefined" && window.VOCAB_I18N)||{};
  function setVkLang(l){ vkLang=(l==="en"||l==="zh")?l:"fr"; }
  function T(key, p){
    var e=I18N[key], s=e?(e[vkLang]||e.fr):key;
    if(p){ for(var k in p){ s=s.split("{"+k+"}").join(p[k]); } }
    return s;
  }
  function weekdayNames(){ return T("weekdays").split(","); }
  function statusT(st){ return T(st==="mastered"?"st_mastered":((st==="review"||st==="learning")?"st_learning":"st_new")); }
  function posOf(wd){ return (vkLang==="zh") ? (wd.pos_zh||wd.pos||"") : (wd.pos||wd.pos_zh||""); }

  /* ------------------------------ Utilitaires ---------------------------- */
  function $(id){ return document.getElementById(id); }
  function el(tag,cls,txt){ var e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e; }
  function pad(n){ return n<10?("0"+n):(""+n); }
  function ymd(d){ d=d||new Date(); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function now(){ return new Date().getTime(); }
  function dayMs(){ return 86400000; }
  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function deacc(s){ return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z' ]/g,"").trim(); }
  function persist(){ B.persist(); if(B.refreshBadges){ try{ B.refreshBadges(); }catch(e){} } }
  function beep(ok){ try{ if(B.Sound){ ok?B.Sound.good():B.Sound.bad(); } }catch(e){} if(navigator.vibrate){ try{ navigator.vibrate(ok?20:[15,40,15]); }catch(e){} } }

  /* ------------------------------ Audio (TTS) ---------------------------- */
  var _voices=[];
  function loadVoices(){ try{ _voices=window.speechSynthesis?speechSynthesis.getVoices():[]; }catch(e){ _voices=[]; } }
  if(window.speechSynthesis){ loadVoices(); try{ speechSynthesis.onvoiceschanged=loadVoices; }catch(e){} }
  function frVoice(){ if(!_voices.length) loadVoices(); for(var i=0;i<_voices.length;i++){ if(/^fr/i.test(_voices[i].lang)) return _voices[i]; } return null; }
  function speak(text){
    try{
      if(!window.speechSynthesis||!text) return;
      speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance(text);
      u.lang="fr-FR"; u.rate=(S.settings.rate||1);
      var v=frVoice(); if(v) u.voice=v;
      speechSynthesis.speak(u);
    }catch(e){}
  }

  /* ------------------------------ Données -------------------------------- */
  function wordsOf(level){ return DATA.words.filter(function(x){return x.level===level;}); }
  function byId(id){ for(var i=0;i<DATA.words.length;i++){ if(DATA.words[i].id===id) return DATA.words[i]; } return null; }
  function prog(id){ return S.prog[id]||null; }
  function ensureProg(id){ if(!S.prog[id]) S.prog[id]={st:"new",stage:0,next:0,succ:0,fail:0,fav:false,added:false}; return S.prog[id]; }
  function statusZh(st){ return statusT(st); }
  // L'utilisateur déclare qu'il maîtrise déjà le mot : il part direct en « 已掌握 ».
  function markMastered(id){
    var p=ensureProg(id); p.st="mastered"; p.stage=MAXSTAGE; p.added=true;
    p.next = S.settings.recycle ? now()+60*dayMs() : 0;
    persist();
    // bruitage satisfaisant (fonctionne aussi hors de l'onglet Jeu)
    try{ if(B.Sound&&B.Sound.mastered) B.Sound.mastered(); }catch(e){}
    if(navigator.vibrate){ try{ navigator.vibrate([12,30,12]); }catch(e){} }
  }
  function article(wd){ if(!wd.gender) return wd.word; return (wd.gender==="m"?"un ":"une ")+wd.word; }
  function displayWord(wd){ return article(wd); }

  /* ------------------------------ SRS ------------------------------------ */
  function isDue(id){ var p=prog(id); if(!p) return false;
    if(p.st==="mastered"){ return S.settings.recycle && p.next && p.next<=now(); }
    return (p.st==="learning"||p.st==="review") && p.next<=now(); }
  function applyResult(wd, correct, isNew){
    var p=ensureProg(wd.id);
    p.last=correct; p.ts=now();   // dernier résultat + horodatage (historique des mots)
    if(isNew){ // introduction
      p.st="review"; p.stage=1;
      if(correct){ p.succ++; p.next=now()+INTERVALS[1]*dayMs(); }
      else{ p.fail++; p.next=now(); }
      return;
    }
    if(correct){
      p.succ++; p.stage=Math.min(MAXSTAGE, p.stage+1);
      if(p.stage>=MAXSTAGE){ p.st="mastered"; p.next= S.settings.recycle? now()+60*dayMs() : 0; }
      else { p.st="review"; p.next=now()+INTERVALS[p.stage]*dayMs(); }
    } else {
      p.fail++; p.stage=Math.max(1,p.stage-1); p.st="review"; p.next=now(); // à revoir vite, mode plus facile
    }
  }
  function toggleFav(id){ var p=ensureProg(id); p.fav=!p.fav; persist(); return p.fav; }

  /* ------------------------------ Stats ---------------------------------- */
  function stat(level){
    var ws=wordsOf(level), s={total:ws.length,mastered:0,learning:0,neu:0,dueToday:0,fav:0};
    ws.forEach(function(wd){ var p=prog(wd.id);
      if(!p||p.st==="new"){ s.neu++; }
      else if(p.st==="mastered"){ s.mastered++; }
      else { s.learning++; }
      if(p&&p.fav) s.fav++;
      if(isDue(wd.id)) s.dueToday++;
    });
    return s;
  }
  function todayLog(){ var k=ymd(); S.logs[k]=S.logs[k]||{n:0,r:0,goal:false}; return S.logs[k]; }

  /* ============================ SESSION ================================== */
  /* size : 5, 10 ou Infinity (illimité). Illimité = tout le niveau sélectionné. */
  function buildSession(favMode, size){
    var lvl=S.settings.level;
    var due=[], neu=[];
    if(favMode){
      DATA.words.forEach(function(wd){ var p=prog(wd.id); if(p&&p.fav) due.push({word:wd,isNew:false,fav:true}); });
      shuffle(due);
      return { queue:due, idx:0, favMode:true, size:Infinity, stats:{n:0,r:0,ok:0,total:due.length} };
    }
    if(size===undefined) size=(S.settings.dailyGoal||10);
    var unlimited=!isFinite(size);
    // révisions dues, les plus urgentes d'abord. En illimité on reste sur le niveau
    // sélectionné ; en 5/10 on inclut aussi les mots ajoutés manuellement (autres niveaux).
    var dueSrc=unlimited? wordsOf(lvl) : DATA.words;
    dueSrc.forEach(function(wd){ if(isDue(wd.id)) due.push({word:wd,isNew:false}); });
    due.sort(function(a,b){ return (prog(a.word.id).next)-(prog(b.word.id).next); });
    // nouveaux mots : toujours le niveau sélectionné (ex. les 1000 mots du DELF B1).
    var pool=wordsOf(lvl);
    var candidates=pool.filter(function(wd){ var p=prog(wd.id); return !p||p.st==="new"; });
    shuffle(candidates);
    var queue;
    if(unlimited){
      candidates.forEach(function(wd){ neu.push({word:wd,isNew:true}); });
      queue=due.concat(neu);
    } else {
      // série bornée à `size` cartes : révisions d'abord, puis nouveaux mots
      var cap=Math.max(1,size|0);
      queue=[];
      for(var i=0;i<due.length && queue.length<cap;i++){ queue.push(due[i]); }
      for(var j=0;j<candidates.length && queue.length<cap;j++){ queue.push({word:candidates[j],isNew:true}); }
    }
    return { queue:queue, idx:0, favMode:false, phase:null, size:size, stats:{n:0,r:0,ok:0,total:queue.length} };
  }
  function startSession(favMode, size){
    SESS=buildSession(favMode, size);
    if(!SESS.queue.length){ SESS=null; renderVocab(); toast(favMode?T("fav_empty2"):T("none_learn")); return; }
    SESS.phase = SESS.queue[0].isNew?"discover":"quiz";
    renderVocab();
  }
  function nextCard(){
    SESS.idx++;
    if(SESS.idx>=SESS.queue.length){ endSession(); return; }
    SESS.phase = SESS.queue[SESS.idx].isNew?"discover":"quiz";
    renderVocab();
  }
  function endSession(){
    var st=SESS.stats;
    if(!SESS.favMode){
      var t=todayLog(); t.n+=st.n; t.r+=st.r;
      // « jouer une fois le jour J » suffit : le jour devient vert (t.goal) et valide le 打卡
      var played=(st.n+st.r)>0;
      var first= (t.goal!==true) && played;
      if(played) t.goal=true;
      if(first){ // 打卡 : incrémente le streak
        var y=ymd(new Date(now()-dayMs()));
        S.streak = (S.lastCheckin===y)? (S.streak+1) : 1;
        S.lastCheckin=ymd();
      }
    }
    persist();
    var done=SESS; SESS=null; renderRecap(done);
  }

  /* ---------------------- Générateurs de quiz ---------------------------- */
  function distractorsSameLevel(wd,n,keyFn){
    var pool=wordsOf(wd.level).filter(function(x){return x.id!==wd.id;});
    // même catégorie grammaticale si possible
    var same=pool.filter(function(x){return x.pos===wd.pos;});
    var use=(same.length>=n)?same:pool;
    shuffle(use);
    var out=[], seen={}; seen[keyFn(wd)]=1;
    for(var i=0;i<use.length && out.length<n;i++){ var k=keyFn(use[i]); if(!seen[k]){ seen[k]=1; out.push(use[i]); } }
    // complète si besoin depuis tout le niveau
    for(var j=0;j<pool.length && out.length<n;j++){ var k2=keyFn(pool[j]); if(!seen[k2]){ seen[k2]=1; out.push(pool[j]); } }
    return out;
  }
  function fourChoices(wd, keyFn){
    var d=distractorsSameLevel(wd,3,keyFn);
    var arr=[{wd:wd,correct:true}].concat(d.map(function(x){return {wd:x,correct:false};}));
    return shuffle(arr);
  }

  /* ============================ RENDU ================================== */
  function toast(msg){ try{ if(window.toast) window.toast(msg,1600); }catch(e){} }

  function header(){
    var h=el("div","vk-head");
    var lvl=el("button","vk-level"); lvl.innerHTML="🎓 <b>"+esc(DATA.levelLabel[S.settings.level])+"</b> ▾";
    lvl.onclick=openLevelSheet;
    var streak=el("div","vk-streak"); streak.innerHTML="🔥 <b>"+(S.streak||0)+"</b> "+T("unit_days");
    var gear=el("button","vk-gear","⚙️"); gear.onclick=openSettings;
    h.appendChild(lvl); h.appendChild(streak); h.appendChild(gear);
    return h;
  }

  function renderVocab(){
    var root=$("vocabScreen"); if(!root) return; root.innerHTML="";
    var scroll=el("div","vk-scroll");
    scroll.appendChild(header());
    if(SESS){ scroll.appendChild(renderCard()); }
    else { scroll.appendChild(renderDash()); }
    root.appendChild(scroll);
  }

  /* --------- Tableau de bord (accueil de l'onglet Vocabulaire) -----------
     Refonte UX : anneau de progression + reprise, tuiles « bento » (dont la
     révision du jour, actionnable), sélecteur de série et semaine compacte.
     Aucune fonction retirée : le calendrier mensuel et la courbe 30 jours
     restent accessibles via « voir le calendrier complet ». */
  function renderDash(){
    var s=stat(S.settings.level), wrap=el("div","vk-dash");
    var pct=s.total?Math.round(s.mastered/s.total*100):0;
    var goal=todayLog().goal, dueN=s.dueToday, size=(S.settings.dailyGoal||10);

    // HERO : anneau de progression + bouton « commencer »
    var hero=el("div","vk-card vkd-hero");
    var circ=2*Math.PI*45, off=circ*(1-pct/100);
    var goalTxt=goal? T("goal_done",{n:(S.streak||0)}) : T("goal_todo",{n:(S.streak||0)});
    hero.innerHTML=
      "<div class='vkd-ring'>"+
        "<svg width='100' height='100' viewBox='0 0 100 100'>"+
          "<circle cx='50' cy='50' r='45' fill='none' stroke='rgba(1,114,176,.14)' stroke-width='10'/>"+
          "<circle cx='50' cy='50' r='45' fill='none' stroke='url(#vkgrad)' stroke-width='10' stroke-linecap='round' stroke-dasharray='"+circ.toFixed(1)+"' stroke-dashoffset='"+off.toFixed(1)+"'/>"+
          "<defs><linearGradient id='vkgrad' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#4AC2DB'/><stop offset='1' stop-color='#0172B0'/></linearGradient></defs>"+
        "</svg>"+
        "<div class='vkd-ringc'><div class='vkd-rp'>"+pct+"%</div></div>"+
      "</div>"+
      "<div class='vkd-herod'>"+
        "<div class='vkd-goal'>"+goalTxt+"</div>"+
        "<button class='vkd-cta' id='vkdStart'>"+T("cta_start")+"<span class='s'>"+T("cta_sub",{n:size})+"</span></button>"+
        "<div class='vkd-mastered'>"+T("mastered_line",{n:s.mastered,total:s.total})+"</div>"+
      "</div>";
    wrap.appendChild(hero);
    var startBtn=hero.querySelector("#vkdStart"); if(startBtn) startBtn.onclick=function(){ startSession(false); };

    // TUILES « bento » : 4 états. Chaque tuile est cliquable et ouvre la liste
    // des mots correspondants (consulter), avec un bouton pour les apprendre /
    // réviser de façon ciblée. La tuile « à réviser » garde un raccourci direct.
    var bento=el("div","vkd-bento");
    function tile(kind, mod, ic, n, label, edge){
      var tl=el("div","vkd-tile act"+(mod||""));
      tl.innerHTML=(edge?"<span class='edge' style='background:"+edge+"'></span>":"")+
        "<div class='ic'>"+ic+"</div><div class='n'>"+n+"</div><div class='l'>"+label+"</div>";
      tl.onclick=function(){ openTileSheet(kind); };
      return tl;
    }
    bento.appendChild(tile("new", "", "🆕", s.neu, T("tile_new"), "#8598a6"));
    bento.appendChild(tile("learning", "", "📖", s.learning, T("tile_learning"), "#4AC2DB"));
    var dueTile=tile("due", " due", "⏰", dueN, T("tile_due"), null);
    if(dueN>0){ var pill=el("span","go",T("due_pill"));
      pill.onclick=function(e){ e.stopPropagation(); startWordsSession(tileWords("due")); };
      dueTile.appendChild(pill); }
    bento.appendChild(dueTile);
    bento.appendChild(tile("mastered", "", "✅", s.mastered, T("tile_mastered"), "#3fae5a"));
    wrap.appendChild(bento);

    // SÉRIE : 5 / 10 / illimité (secondaire)
    wrap.appendChild(el("div","vk-playlab",T("series_label")));
    var series=el("div","vkd-series");
    [{n:5,lab:"5 "+T("words_unit"),sub:T("s_rapid")},{n:10,lab:"10 "+T("words_unit"),sub:T("s_standard")},{n:Infinity,lab:"∞",sub:T("s_all")}].forEach(function(o){
      var b=el("button","vkd-sbtn"); b.innerHTML="<div class='bn'>"+o.lab+"</div><div class='bs'>"+o.sub+"</div>";
      b.onclick=function(){ startSession(false, o.n); }; series.appendChild(b);
    });
    wrap.appendChild(series);

    // HABITUDE : semaine en cours + repli vers calendrier complet & courbe
    var habit=el("div","vk-card");
    var htop=el("div","vkd-habit-top"); htop.innerHTML="<span class='t'>"+T("week_title")+"</span>";
    var lnk=el("button","vkd-habit-lnk",T("see_cal")); htop.appendChild(lnk); habit.appendChild(htop);
    var week=el("div","vkd-week"), names=weekdayNames();
    var d0=new Date(), dow=d0.getDay(), todayKey=ymd();
    var sunday=new Date(d0.getFullYear(),d0.getMonth(),d0.getDate()-dow);
    for(var i=0;i<7;i++){
      var dd=new Date(sunday.getFullYear(),sunday.getMonth(),sunday.getDate()+i);
      var key=ymd(dd), done=!!(S.logs[key]&&S.logs[key].goal), isToday=(key===todayKey), isFuture=(dd>d0 && !isToday);
      var wd=el("div","vkd-wd"+(done?" on":"")+(isToday?" today":"")+(isFuture?" future":""));
      wd.innerHTML="<span class='wl'>"+names[i]+"</span><span class='wc'>"+(done?"✓":"·")+"</span>";
      week.appendChild(wd);
    }
    habit.appendChild(week);
    var more=el("div","vkd-more");
    more.appendChild(renderCalendar());
    more.appendChild(renderCurve());
    habit.appendChild(more);
    lnk.onclick=function(){ var open=more.classList.toggle("show"); lnk.textContent=open?T("hide_cal"):T("see_cal"); };
    wrap.appendChild(habit);

    return wrap;
  }

  /* --- Tuiles bento : consulter les mots d'un état, puis les étudier --- */
  // Mots du niveau courant correspondant à un état donné.
  function tileWords(kind){
    return wordsOf(S.settings.level).filter(function(wd){
      var p=prog(wd.id), st=p&&p.st;
      if(kind==="new")      return !p||st==="new";
      if(kind==="mastered") return st==="mastered";
      if(kind==="due")      return isDue(wd.id);
      return p && st!=="new" && st!=="mastered";   // « en cours »
    });
  }
  // Démarre une session ciblée à partir d'une liste de mots précise (batch de 5).
  function startWordsSession(words){
    if(!words||!words.length){ toast(T("none_here")); return; }
    var pick=shuffle(words.slice()); if(pick.length>5) pick=pick.slice(0,5);
    var queue=pick.map(function(wd){ var p=prog(wd.id); return {word:wd, isNew:(!p||p.st==="new")}; });
    SESS={ queue:queue, idx:0, favMode:false, phase:(queue[0].isNew?"discover":"quiz"),
           size:queue.length, stats:{n:0,r:0,ok:0,total:queue.length} };
    var ov=$("vkSheet"); if(ov) ov.classList.remove("show");
    renderVocab();
  }
  // Feuille listant les mots d'une tuile : on peut les consulter (clic sur un mot)
  // et lancer une série ciblée « apprendre / réviser ».
  function openTileSheet(kind){
    var meta={
      "new":      {t:T("ts_new_t"),      cta:T("ts_new_cta")},
      "learning": {t:T("ts_learning_t"), cta:T("ts_learning_cta")},
      "due":      {t:T("ts_due_t"),      cta:T("ts_due_cta")},
      "mastered": {t:T("ts_mastered_t"), cta:T("ts_mastered_cta")}
    }[kind]||{t:T("ts_default_t"), cta:T("ts_default_cta")};
    var words=tileWords(kind);
    sheet(meta.t, function(card){
      card.appendChild(el("div","vk-sugt", T("ts_count",{n:words.length})));
      if(words.length){
        var go=el("button","vk-revbtn", meta.cta+" ("+Math.min(5,words.length)+")");
        go.onclick=function(){ startWordsSession(words); };
        card.appendChild(go);
        var list=el("div","vk-results");
        // Clic sur un mot → sa fiche ; après « Maîtrisé » on revient à cette liste (à jour).
        words.slice(0,80).forEach(function(wd){
          var r=resultRow(wd);
          r.onclick=function(){ openWordSheet(wd, function(){ openTileSheet(kind); }); };
          list.appendChild(r);
        });
        card.appendChild(list);
        if(words.length>80) card.appendChild(el("div","vk-dstatus",T("ts_more",{n:(words.length-80)})));
      } else {
        card.appendChild(el("div","vk-empty",T("ts_empty")));
      }
    });
  }

  function renderCalendar(){
    var box=el("div","vk-card"); box.appendChild(el("div","vk-ctitle",T("month_title")));
    var d=new Date(), y=d.getFullYear(), m=d.getMonth();
    var first=new Date(y,m,1).getDay(); // 0=dim
    var days=new Date(y,m+1,0).getDate();
    var grid=el("div","vk-cal");
    weekdayNames().forEach(function(w){ grid.appendChild(el("div","vk-cah",w)); });
    for(var i=0;i<((first+6)%7);i++){ grid.appendChild(el("div","vk-cad")); } // lundi-première ? on garde dim=0
    for(var day=1;day<=days;day++){
      var key=y+"-"+pad(m+1)+"-"+pad(day);
      var cell=el("div","vk-cad"+((S.logs[key]&&S.logs[key].goal)?" on":"")+(ymd()===key?" today":""), ""+day);
      grid.appendChild(cell);
    }
    box.appendChild(grid);
    return box;
  }
  function renderCurve(){
    var box=el("div","vk-card"); box.appendChild(el("div","vk-ctitle",T("curve_title")));
    var row=el("div","vk-curve"), max=1, vals=[];
    for(var i=29;i>=0;i--){ var k=ymd(new Date(now()-i*dayMs())); var v=(S.logs[k]&&S.logs[k].n)||0; vals.push(v); if(v>max)max=v; }
    vals.forEach(function(v){ var b=el("div","vk-cb"); b.style.height=Math.round(4+v/max*40)+"px"; b.title=v+" "+T("words_unit"); row.appendChild(b); });
    box.appendChild(row);
    return box;
  }

  /* -------------------- Carte de session (découverte / quiz) ------------- */
  function renderCard(){
    var cur=SESS.queue[SESS.idx];
    var wrap=el("div","vk-sesswrap");
    // barre de progression de session
    var pb=el("div","vk-sessbar"); pb.innerHTML="<i style='width:"+Math.round(SESS.idx/SESS.queue.length*100)+"%'></i>";
    wrap.appendChild(pb);
    var top=el("div","vk-sesstop");
    top.appendChild(el("div","vk-sessmeta", (SESS.idx+1)+" / "+SESS.queue.length+"　"+(cur.isNew?T("badge_new"):T("badge_review"))));
    var skip=el("button","vk-skip",T("skip")); skip.title=T("skip_title"); skip.onclick=function(){ nextCard(); };
    top.appendChild(skip);
    wrap.appendChild(top);
    if(cur.isNew && SESS.phase==="discover"){ wrap.appendChild(discoverCard(cur.word)); }
    else {
      var mode=cur.isNew?"image":MODE[Math.max(1,prog(cur.word.id)?prog(cur.word.id).stage:1)];
      wrap.appendChild(quizCard(cur.word, mode, cur.isNew));
    }
    return wrap;
  }

  function actionRow(wd){
    // Une seule action ici : « ☆ 收藏 » (favori). Passer un mot se fait via « 跳过 ⏭️ » en haut de la carte.
    var row=el("div","vk-actions");
    var p=prog(wd.id);
    var fav=el("button","vk-abtn"+((p&&p.fav)?" on":""), (p&&p.fav)?T("fav_on"):T("fav"));
    fav.onclick=function(){ var v=toggleFav(wd.id); fav.textContent=v?T("fav_on"):T("fav"); fav.classList.toggle("on",v); };
    row.appendChild(fav);
    // « déjà maîtrisé » : envoie le mot direct dans « 已掌握 » et passe au suivant
    if(!p || p.st!=="mastered"){
      var mast=el("button","vk-abtn",T("mast_btn"));
      mast.onclick=function(){ markMastered(wd.id); toast(T("mast_toast")); if(SESS){ nextCard(); } else { renderVocab(); } };
      row.appendChild(mast);
    }
    return row;
  }

  function exBlock(fr, zh, en){
    var ex=el("div","vk-ex");
    ex.innerHTML="<div class='vk-exfr'>"+esc(fr)+" <button class='vk-exaudio'>🔊</button></div>"+
      "<div class='vk-exzh'>"+esc(zh||"")+"</div>"+
      (en?"<div class='vk-exen'>"+esc(en)+"</div>":"");
    ex.querySelector(".vk-exaudio").onclick=function(){ speak(fr); };
    return ex;
  }
  function fiche(wd, opts){
    opts=opts||{};
    var c=el("div","vk-fiche");
    var posline=posOf(wd); // partie du discours (中文 en zh, abrégée fr/en)
    var head=el("div","vk-fhead");
    head.innerHTML="<div class='vk-emoji'>"+(wd.emoji||"🔤")+"</div>"+
      "<div class='vk-fword'><div class='vk-word'>"+esc(displayWord(wd))+"</div>"+
      "<div class='vk-ipa'>"+esc(wd.ipa||"")+"　<span class='vk-pos'>"+esc(posline)+"</span></div></div>";
    c.appendChild(head);
    var play=el("button","vk-play",T("play_word")); play.onclick=function(){ speak(article(wd)); }; c.appendChild(play);
    // traductions : chinois + anglais (pour apprenants anglophones)
    c.appendChild(el("div","vk-zh", wd.zh.join("；")));
    if(wd.en&&wd.en.length){ c.appendChild(el("div","vk-en", wd.en.join("; "))); }
    // deux exemples (fr / zh / en)
    c.appendChild(exBlock(wd.ex_fr, wd.ex_zh, wd.ex_en));
    if(wd.ex2_fr){ c.appendChild(exBlock(wd.ex2_fr, wd.ex2_zh, wd.ex2_en)); }
    // collocations
    if(wd.coll&&wd.coll.length){ var col=el("div","vk-coll"); col.appendChild(el("div","vk-colt",T("colloc")));
      wd.coll.forEach(function(cc){ col.appendChild(el("div","vk-colr","· "+cc.fr+"　"+cc.zh)); }); c.appendChild(col); }
    // notes
    if(wd.notes){ c.appendChild(el("div","vk-notes","💡 "+wd.notes)); }
    return c;
  }

  function discoverCard(wd){
    var box=el("div");
    box.appendChild(fiche(wd));
    box.appendChild(actionRow(wd));
    var next=el("button","vk-next",T("next"));
    next.onclick=function(){ SESS.phase="quiz"; renderVocab(); };
    box.appendChild(next);
    // lecture auto à l'affichage
    setTimeout(function(){ speak(article(wd)); },180);
    return box;
  }

  function quizCard(wd, mode, isNew){
    var box=el("div","vk-quiz");
    var done=false;
    function grade(correct){
      if(done) return; done=true;
      applyResult(wd, correct, isNew);
      if(isNew) SESS.stats.n++; else SESS.stats.r++;
      if(correct) SESS.stats.ok++;
      persist(); beep(correct);
    }
    if(mode==="image"){
      box.appendChild(el("div","vk-qprompt",T("q_image")));
      var wq=el("div","vk-qword"); wq.innerHTML=esc(displayWord(wd))+" <button class='vk-mini'>🔊</button>";
      wq.querySelector(".vk-mini").onclick=function(){ speak(article(wd)); }; box.appendChild(wq);
      var opts=fourChoices(wd,function(x){return x.emoji;});
      var g=el("div","vk-imgs");
      opts.forEach(function(o){ var b=el("button","vk-imgopt",o.wd.emoji);
        b.onclick=function(){ if(done)return; grade(o.correct);
          markImg(g,opts,o); afterAnswer(box,o.correct,wd); };
        g.appendChild(b); });
      box.appendChild(g);
      setTimeout(function(){ speak(article(wd)); },150);
    }
    else if(mode==="fr2zh"||mode==="zh2fr"||mode==="audio"){
      var prompt, keyFn, label;
      if(mode==="fr2zh"){ label=T("q_fr2zh"); prompt=esc(displayWord(wd)); keyFn=function(x){return x.zh[0];}; }
      else if(mode==="zh2fr"){ label=T("q_zh2fr"); prompt=esc(vkLang==="zh"? wd.zh[0] : ((wd.en&&wd.en[0])||wd.zh[0])); keyFn=function(x){return x.word;}; }
      else { label=T("q_audio"); prompt=T("q_audio_play"); keyFn=function(x){return x.word;}; }
      box.appendChild(el("div","vk-qprompt",label));
      var pr=el("div","vk-qword");
      if(mode==="audio"){ pr.innerHTML="<button class='vk-bigplay'>"+T("q_bigplay")+"</button>"; pr.querySelector(".vk-bigplay").onclick=function(){ speak(article(wd)); }; setTimeout(function(){speak(article(wd));},200); }
      else { pr.innerHTML=prompt; if(mode==="fr2zh"){ pr.innerHTML+=" <button class='vk-mini'>🔊</button>"; pr.querySelector(".vk-mini").onclick=function(){speak(article(wd));}; } }
      box.appendChild(pr);
      var choices=fourChoices(wd,keyFn);
      var g2=el("div","vk-opts");
      choices.forEach(function(o){
        // fr2zh : la réponse est en chinois → on montre aussi l'anglais à côté.
        var txt;
        if(mode==="fr2zh"){ var en=(o.wd.en&&o.wd.en.length)?o.wd.en[0]:""; txt=o.wd.zh[0]+(en?("　·　"+en):""); }
        else txt=displayWord(o.wd);
        var b=el("button","vk-opt"+(mode==="fr2zh"?" bi":""),txt);
        b.onclick=function(){ if(done)return; grade(o.correct); markOpt(g2,choices,o,mode); afterAnswer(box,o.correct,wd); };
        g2.appendChild(b); });
      box.appendChild(g2);
    }
    else if(mode==="spell"){
      box.appendChild(el("div","vk-qprompt",T("q_spell")));
      var glose=(vkLang==="zh")? wd.zh[0] : ((wd.en&&wd.en[0])||wd.zh[0]);
      var hint=el("div","vk-qword"); hint.innerHTML=esc(glose)+" <button class='vk-mini'>🔊</button>";
      hint.querySelector(".vk-mini").onclick=function(){ speak(article(wd)); }; box.appendChild(hint);
      setTimeout(function(){speak(article(wd));},200);
      var inp=el("input","vk-input"); inp.type="text"; inp.autocapitalize="off"; inp.autocomplete="off"; inp.spellcheck=false; inp.placeholder=T("spell_ph");
      box.appendChild(inp);
      var sub=el("button","vk-next",T("confirm"));
      sub.onclick=function(){ if(done)return;
        var val=inp.value, exact=(val.trim()===wd.word), soft=(deacc(val)===deacc(wd.word));
        var correct=exact||soft; grade(correct);
        inp.disabled=true; inp.classList.add(correct?"ok":"ko");
        var msg=el("div","vk-spellmsg "+(correct?"ok":"ko"));
        msg.innerHTML= exact? T("spell_exact") : (soft? T("spell_soft",{w:esc(wd.word)}) : T("spell_wrong",{w:esc(wd.word)}));
        box.appendChild(msg);
        afterAnswer(box,correct,wd);
      };
      inp.addEventListener("keydown",function(e){ if(e.key==="Enter") sub.onclick(); });
      box.appendChild(sub);
    }
    return box;
  }
  function markImg(g,opts,chosen){
    var btns=g.querySelectorAll(".vk-imgopt");
    for(var i=0;i<btns.length;i++){ btns[i].disabled=true;
      if(opts[i].correct) btns[i].classList.add("ok");
      if(opts[i]===chosen && !chosen.correct) btns[i].classList.add("ko"); }
  }
  function markOpt(g,opts,chosen,mode){
    var btns=g.querySelectorAll(".vk-opt");
    for(var i=0;i<btns.length;i++){ btns[i].disabled=true;
      if(opts[i].correct) btns[i].classList.add("ok");
      if(opts[i]===chosen && !chosen.correct) btns[i].classList.add("ko"); }
  }
  function afterAnswer(box, correct, wd){
    var fb=el("div","vk-fb "+(correct?"ok":"ko"), correct?T("fb_ok"):T("fb_ko"));
    box.appendChild(fb);
    // rappel court : mot + sens (dans la langue de l'utilisateur si dispo)
    var sens=(vkLang!=="zh" && wd.en && wd.en.length)? wd.en.join("; ") : wd.zh.join("；");
    var rec=el("div","vk-recall"); rec.innerHTML="<b>"+esc(displayWord(wd))+"</b>　"+esc(sens);
    box.appendChild(rec);
    // Actions (favori + « Maîtrisé ») juste au-dessus de « 下一个 », comme en découverte.
    box.appendChild(actionRow(wd));
    var nx=el("button","vk-next",T("next")); nx.onclick=nextCard; box.appendChild(nx);
  }

  function renderRecap(sess){
    var root=$("vocabScreen"); root.innerHTML="";
    var scroll=el("div","vk-scroll"); scroll.appendChild(header());
    var c=el("div","vk-recap");
    var st=sess.stats, rate=st.total?Math.round(st.ok/Math.max(1,(st.n+st.r))*100):0;
    var t=todayLog();
    c.innerHTML="<div class='vk-rtitle'>"+(sess.favMode?T("recap_fav"):T("recap_done"))+"</div>"+
      "<div class='vk-rrow'>"+T("recap_new")+" <b>"+st.n+"</b></div>"+
      "<div class='vk-rrow'>"+T("recap_review")+" <b>"+st.r+"</b></div>"+
      "<div class='vk-rrow'>"+T("recap_rate")+" <b>"+rate+"%</b></div>"+
      (!sess.favMode && t.goal? "<div class='vk-checkin'>"+T("recap_checkin",{n:(S.streak||0)})+"</div>":"");
    scroll.appendChild(c);
    var again=el("button","vk-start"); again.textContent=T("recap_again");
    again.onclick=function(){ startSession(false, sess.size); }; scroll.appendChild(again);
    var back=el("button","vk-next",T("recap_back")); back.onclick=function(){ SESS=null; renderVocab(); }; scroll.appendChild(back);
    root.appendChild(scroll);
  }

  /* ---------------------- Feuilles modales ------------------------------- */
  function sheet(title, buildBody){
    var ov=$("vkSheet"); if(!ov){ ov=el("div"); ov.id="vkSheet"; ov.className="vk-sheetov"; ($("app")||document.body).appendChild(ov); }
    ov.innerHTML=""; var card=el("div","vk-sheet");
    var h=el("div","vk-sheeth"); h.appendChild(el("div","vk-sheettitle",title));
    var x=el("button","vk-sheetx","✕"); x.onclick=function(){ ov.classList.remove("show"); }; h.appendChild(x);
    card.appendChild(h); buildBody(card); ov.appendChild(card); ov.classList.add("show");
    ov.onclick=function(e){ if(e.target===ov) ov.classList.remove("show"); };
  }
  function openLevelSheet(){
    sheet(T("lvl_title"), function(card){
      DATA.levels.forEach(function(lv){
        var s=stat(lv);
        var b=el("button","vk-lvopt"+(lv===S.settings.level?" on":""));
        b.innerHTML="<b>"+esc(DATA.levelLabel[lv])+"</b>"+(vkLang==="zh"?(" · "+esc(DATA.levelZh[lv])):"")+"<span class='vk-lvsub'>"+T("lvl_mastered",{n:s.mastered,total:s.total})+"</span>";
        b.onclick=function(){ S.settings.level=lv; persist(); $("vkSheet").classList.remove("show"); SESS=null; renderVocab(); };
        card.appendChild(b);
      });
    });
  }
  function openSettings(){
    sheet(T("set_title"), function(card){
      card.appendChild(el("div","vk-setlab",T("set_goal")));
      var goals=[5,10,15,20,30], gr=el("div","vk-chiprow");
      goals.forEach(function(g){ var b=el("button","vk-chip"+(S.settings.dailyGoal===g?" on":""), ""+g);
        b.onclick=function(){ S.settings.dailyGoal=g; persist(); openSettings(); }; gr.appendChild(b); });
      card.appendChild(gr);
      card.appendChild(el("div","vk-setlab",T("set_rate")));
      var rates=[[1,T("rate_normal")],[0.75,T("rate_slow")]], rr=el("div","vk-chiprow");
      rates.forEach(function(r){ var b=el("button","vk-chip"+(S.settings.rate===r[0]?" on":""), r[1]);
        b.onclick=function(){ S.settings.rate=r[0]; persist(); openSettings(); }; rr.appendChild(b); });
      card.appendChild(rr);
      card.appendChild(el("div","vk-setlab",T("set_recycle")));
      var tr=el("div","vk-chiprow");
      [[true,T("toggle_on")],[false,T("toggle_off")]].forEach(function(o){ var b=el("button","vk-chip"+(S.settings.recycle===o[0]?" on":""), o[1]);
        b.onclick=function(){ S.settings.recycle=o[0]; persist(); openSettings(); }; tr.appendChild(b); });
      card.appendChild(tr);
    });
  }

  /* ============================ DICTIONNAIRE ============================= */
  function levenshtein(a,b){ a=a||"";b=b||""; var m=a.length,n=b.length,d=[]; if(!m)return n; if(!n)return m;
    for(var i=0;i<=m;i++)d[i]=[i]; for(var j=0;j<=n;j++)d[0][j]=j;
    for(i=1;i<=m;i++)for(j=1;j<=n;j++){ var c=a[i-1]===b[j-1]?0:1; d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c); }
    return d[m][n]; }
  function searchWords(q){
    q=q.trim(); if(q.length<1) return [];
    var qd=deacc(q), isZh=/[一-鿿]/.test(q), out=[];
    DATA.words.forEach(function(wd){
      var hit=false;
      if(isZh){ if(wd.zh.join(" ").indexOf(q)>=0) hit=true; }
      else { if(deacc(wd.word).indexOf(qd)>=0) hit=true; if(!hit && wd.zh.join(" ").indexOf(q)>=0) hit=true; }
      if(hit) out.push(wd);
    });
    return out;
  }
  function pushHistory(q){ q=q.trim(); if(!q) return; S.search=S.search.filter(function(x){return x!==q;}); S.search.unshift(q); if(S.search.length>50) S.search=S.search.slice(0,50); persist(); }

  function renderDict(){
    var root=$("dictScreen"); if(!root) return; root.innerHTML="";
    var scroll=el("div","vk-scroll");
    scroll.appendChild(el("div","vk-dicttitle",T("dict_title")));
    var bar=el("div","vk-searchbar");
    var inp=el("input","vk-search"); inp.type="search"; inp.placeholder=T("dict_search_ph");
    bar.appendChild(inp); scroll.appendChild(bar);
    var res=el("div","vk-results"); scroll.appendChild(res);
    root.appendChild(scroll);

    function renderEmpty(){
      res.innerHTML="";
      // 生词本
      var favs=DATA.words.filter(function(wd){ var p=prog(wd.id); return p&&p.fav; });
      var favBox=el("div","vk-card");
      var ft=el("div","vk-ctitle2"); ft.innerHTML=T("fav_list_title",{n:favs.length});
      favBox.appendChild(ft);
      if(favs.length){
        var rev=el("button","vk-revbtn",T("fav_review_btn")); rev.onclick=function(){ if(window.__gotoVocab) window.__gotoVocab(); startSession(true); }; favBox.appendChild(rev);
        favs.slice(0,20).forEach(function(wd){ favBox.appendChild(resultRow(wd)); });
      } else { favBox.appendChild(el("div","vk-empty",T("fav_none"))); }
      res.appendChild(favBox);
      // historique
      if(S.search.length){
        var hb=el("div","vk-card");
        var hh=el("div","vk-ctitle2"); hh.innerHTML=T("search_history");
        var clr=el("button","vk-clr",T("clear")); clr.onclick=function(){ S.search=[]; persist(); renderEmpty(); }; hh.appendChild(clr);
        hb.appendChild(hh);
        var chips=el("div","vk-chiprow");
        S.search.slice(0,20).forEach(function(q){ var c=el("button","vk-hchip",q); c.onclick=function(){ inp.value=q; run(q); }; chips.appendChild(c); });
        hb.appendChild(chips); res.appendChild(hb);
      }
    }
    function run(q){
      if(!q.trim()){ renderEmpty(); return; }
      var list=searchWords(q); res.innerHTML="";
      if(!list.length){
        var e=el("div","vk-card"); e.appendChild(el("div","vk-empty",T("not_found",{q:esc(q)})));
        // suggestions Levenshtein ≤2 (FR)
        var qd=deacc(q), sug=[];
        DATA.words.forEach(function(wd){ var dd=levenshtein(qd,deacc(wd.word)); if(dd>0&&dd<=2) sug.push({wd:wd,d:dd}); });
        sug.sort(function(a,b){return a.d-b.d;});
        if(sug.length){ e.appendChild(el("div","vk-sugt",T("suggest"))); sug.slice(0,6).forEach(function(o){ e.appendChild(resultRow(o.wd)); }); }
        res.appendChild(e); return;
      }
      list.slice(0,60).forEach(function(wd){ res.appendChild(resultRow(wd)); });
    }
    var tmr=null;
    inp.addEventListener("input",function(){ clearTimeout(tmr); var q=inp.value; tmr=setTimeout(function(){ run(q); },120); });
    inp.addEventListener("change",function(){ if(inp.value.trim()){ pushHistory(inp.value); } });
    renderEmpty();
  }

  function resultRow(wd){
    var p=prog(wd.id);
    // Sens principal dans la langue de l'utilisateur (anglais pour en/fr, chinois pour zh).
    var enS=(wd.en&&wd.en.length)?wd.en.join("; "):"", zhS=wd.zh.join("；");
    var mainG=(vkLang!=="zh" && enS)? enS : zhS;
    var subG =(vkLang!=="zh" && enS)? zhS : (enS!==mainG?enS:"");
    var row=el("button","vk-row");
    row.innerHTML=
      "<span class='vk-remoji'>"+(wd.emoji||"🔤")+"</span>"+
      "<span class='vk-rmid'><span class='vk-rword'>"+esc(displayWord(wd))+"</span>"+
      "<span class='vk-rzh'>"+esc(mainG)+"</span>"+
      (subG?"<span class='vk-ren'>"+esc(subG)+"</span>":"")+"</span>"+
      "<span class='vk-badges'><span class='vk-lvb'>"+esc(DATA.levelLabel[wd.level])+"</span>"+
      "<span class='vk-stb'>"+statusZh(p&&p.st)+"</span></span>";
    row.onclick=function(){ openWordSheet(wd); };
    return row;
  }
  // onAfter (optionnel) : appelé après « Maîtrisé » / « Ajouter » pour revenir à la
  // liste d'origine (tuile) au lieu de fermer — pratique pour traiter plusieurs mots.
  function openWordSheet(wd, onAfter){
    sheet(DATA.levelLabel[wd.level], function(card){
      card.appendChild(fiche(wd));
      var p=prog(wd.id);
      var st=el("div","vk-dstatus"); st.innerHTML=T("learn_status",{st:statusZh(p&&p.st)}); card.appendChild(st);
      function done(){ if(!SESS) renderVocab(); if(onAfter){ onAfter(); } else { $("vkSheet").classList.remove("show"); } }
      var row=el("div","vk-actions");
      // favori
      var fav=el("button","vk-abtn"+((p&&p.fav)?" on":""), (p&&p.fav)?T("fav_on"):T("fav"));
      fav.onclick=function(){ var v=toggleFav(wd.id); fav.textContent=v?T("fav_on"):T("fav"); fav.classList.toggle("on",v); };
      row.appendChild(fav);
      // « déjà maîtrisé » : passe le mot direct en « 已掌握 »
      if(!p || p.st!=="mastered"){
        var mast=el("button","vk-abtn",T("mast_mark"));
        mast.onclick=function(){ markMastered(wd.id); toast(T("mast_toast")); done(); };
        row.appendChild(mast);
      }
      // ajouter à la file (si pas déjà en apprentissage)
      if(!p || p.st==="new"){
        var add=el("button","vk-abtn primary",T("add_queue"));
        add.onclick=function(){ var pp=ensureProg(wd.id); pp.added=true; pp.st="review"; pp.stage=1; pp.next=now(); persist();
          toast(T("added_toast")); done(); };
        row.appendChild(add);
      }
      card.appendChild(row);
    });
  }

  /* ============================ INIT ==================================== */
  function defaults(){
    return { settings:{level:"DELF_B1",dailyGoal:10,rate:1,recycle:false}, prog:{}, logs:{}, streak:0, lastCheckin:null, search:[] };
  }
  window.Vocab={
    init:function(bridge){
      B=bridge; DATA=window.VOCAB_DATA;
      B.store.vocab = B.store.vocab || defaults();
      S=B.store.vocab;
      // complète les champs manquants (compat.)
      var d=defaults(); for(var k in d){ if(S[k]===undefined) S[k]=d[k]; }
      for(var k2 in d.settings){ if(S.settings[k2]===undefined) S.settings[k2]=d.settings[k2]; }
      // migration : la fonction « 斩 » a été retirée — on réintègre les mots anciennement « slashed »
      if(S.prog){ for(var pid in S.prog){ var pp=S.prog[pid];
        if(pp&&pp.st==="slashed"){ pp.st=(pp.stage>0?"review":"new"); if(pp.st==="review") pp.next=now(); } } }
      // suit la langue globale de l'app (fr / en / zh)
      setVkLang(B.store && B.store.appLang);
      loadVoices();
    },
    // Appelé par le sélecteur de langue global : change la langue et re-render si visible.
    setLang:function(lang){
      setVkLang(lang);
      try{
        if($("vocabScreen")&&$("vocabScreen").classList.contains("active")) renderVocab();
        if($("dictScreen")&&$("dictScreen").classList.contains("active")) renderDict();
      }catch(e){}
    },
    renderVocab:renderVocab,
    renderDict:renderDict,
    _dbg:{ state:function(){return S;}, startFav:function(){startSession(true);} }
  };
})();
