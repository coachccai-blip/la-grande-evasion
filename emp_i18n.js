window.EMP_I18N = {
  ui: {
    en: { prixAchat:"Purchase price", construction:"Building", parNiveau:"/ level", loyerNu:"Bare land rent", quartierComplet:"full district", niveauActuel:"Current level", loyerDu:"rent due", terrainNu:"Bare land (no buildings)" },
    zh: { prixAchat:"购买价格", construction:"建造", parNiveau:"/ 每级", loyerNu:"空地租金", quartierComplet:"整片街区", niveauActuel:"当前等级", loyerDu:"应付租金", terrainNu:"空地（无建筑）" }
  },
  status: {
    en:{ libre:"UNOWNED property — up for grabs!", mine:"This is your property.", other:"Owned by {owner}" },
    zh:{ libre:"无主地产 —— 快来买下！", mine:"这是你的地产。", other:"{owner} 的地产" }
  },
  build: { en:["Stall","Shop","Department Store","Palace"], zh:["摊位","店铺","百货商场","宫殿"] },
  types: {
    en:{
      transport:"<b>Migration route</b> — Transport for sale (<b>₵200</b>).<br>Rent climbs with the number of lines you own (100 → 400 ₵).",
      service:"<b>Valley utility</b> — For sale (<b>₵150</b>).<br>Rent = <b>10 × the visitor's dice total</b> (× 20 if you own both utilities).",
      depart:"<b>Grand Baobab (Start)</b><br>Collect <b>200 ₵</b> in salary each time you pass. Try the <b>Prime de la Jungle</b> to double it!",
      impot:"<b>Kibble tax</b><br>Pay <b>100 ₵</b> to the bank.",
      patte:"<b>Coup de Patte</b><br>Draw a card: a <b>good or bad</b> surprise!",
      cagnotte:"<b>Cagnotte de la Meute</b><br>Draw a card from the common pot, <b>mostly in your favor</b>.",
      fourriere:"<b>Fourrière (just visiting)</b><br>Just visiting: nothing happens… unless you get locked up!",
      gardien:"<b>The Keeper!</b><br>He's spotted you: off to the <b>Fourrière</b>, with no salary as you pass.",
      repos:"<b>Le Point d'Eau</b><br>Rest stop: take a breather, nothing happens."
    },
    zh:{
      transport:"<b>迁徙路线</b> —— 可购买的运输（<b>₵200</b>）。<br>拥有的线路越多，租金越高（100 → 400 ₵）。",
      service:"<b>山谷公共设施</b> —— 可购买（<b>₵150</b>）。<br>租金 = <b>访客骰子点数总和 × 10</b>（同时拥有两处设施时 × 20）。",
      depart:"<b>Grand Baobab（起点）</b><br>每次经过领取 <b>200 ₵</b> 薪水。试试 <b>Prime de la Jungle</b> 让它翻倍！",
      impot:"<b>狗粮税</b><br>向银行支付 <b>100 ₵</b>。",
      patte:"<b>Coup de Patte</b><br>抽一张卡：<b>好运或厄运</b>，全凭手气！",
      cagnotte:"<b>Cagnotte de la Meute</b><br>从公共基金抽一张卡，<b>多半是好事</b>。",
      fourriere:"<b>Fourrière（参观）</b><br>只是路过参观：什么都不会发生……除非你被关进去！",
      gardien:"<b>管理员来了！</b><br>他发现了你：直接送进 <b>Fourrière</b>，经过时也拿不到薪水。",
      repos:"<b>Le Point d'Eau</b><br>休息格：喘口气，什么都不会发生。"
    }
  },
  cards: {
    "Un car de touristes photographie ton stand : encaisse 75 ₵.": {en:"A tour bus snaps photos of your stall: collect 75 ₵.", zh:"一车游客给你的摊位拍照：收取 75 ₵。"},
    "Braquage de cacahuètes : le plus riche te verse 100 ₵.": {en:"Peanut heist: the richest player pays you 100 ₵.", zh:"花生大劫案：最富有的玩家付给你 100 ₵。"},
    "Vent porteur : avance jusqu'au Grand Baobab et touche ton salaire.": {en:"Tailwind: advance to the Grand Baobab and collect your salary.", zh:"顺风助力：前进到 Grand Baobab 并领取薪水。"},
    "Tempête de sable : recule de 3 cases.": {en:"Sandstorm: move back 3 spaces.", zh:"沙尘暴：后退 3 格。"},
    "Le gardien te reconnaît sur une affiche : file à la Fourrière !": {en:"The keeper spots you on a poster: off to the Fourrière!", zh:"管理员在通缉海报上认出了你：滚去 Fourrière！"},
    "Travaux : paie 25 ₵ par bâtiment construit.": {en:"Roadworks: pay 25 ₵ per building you've built.", zh:"施工中：每座已建建筑支付 25 ₵。"},
    "Bonne affaire de la jungle : reçois 120 ₵.": {en:"Great jungle deal: receive 120 ₵.", zh:"丛林好买卖：获得 120 ₵。"},
    "Pluie tropicale : tout le monde te donne 30 ₵.": {en:"Tropical rain: everyone gives you 30 ₵.", zh:"热带暴雨：每个人给你 30 ₵。"},
    "Amende de stationnement de brouette : paie 40 ₵.": {en:"Wheelbarrow parking fine: pay 40 ₵.", zh:"手推车违停罚款：支付 40 ₵。"},
    "Coup de chance au marché : reçois 60 ₵.": {en:"Lucky break at the market: receive 60 ₵.", zh:"市集上走了好运：获得 60 ₵。"},
    "Glissade sur une peau de banane : recule de 2 cases.": {en:"Slip on a banana peel: move back 2 spaces.", zh:"踩到香蕉皮滑倒：后退 2 格。"},
    "Publicité réussie : avance de 3 cases.": {en:"Ad campaign pays off: move forward 3 spaces.", zh:"广告大获成功：前进 3 格。"},
    "La meute finance ton projet : reçois 200 ₵.": {en:"The pack funds your project: receive 200 ₵.", zh:"兽群资助你的项目：获得 200 ₵。"},
    "Remboursement de la nourriture du zoo : 20 ₵ par animal libéré au jeu 1.": {en:"Zoo food refund: 20 ₵ per animal freed in game 1.", zh:"动物园食物退款：第一局每解救一只动物得 20 ₵。"},
    "Anniversaire de l'Évasion : chaque joueur te verse 50 ₵.": {en:"Escape anniversary: each player pays you 50 ₵.", zh:"越狱纪念日：每位玩家付给你 50 ₵。"},
    "Amende pour sieste sur la voie publique : paie 50 ₵.": {en:"Fine for napping on the public road: pay 50 ₵.", zh:"在公共道路上打盹被罚款：支付 50 ₵。"},
    "Solidarité de la vallée : reçois 90 ₵.": {en:"Valley solidarity: receive 90 ₵.", zh:"山谷互助：获得 90 ₵。"},
    "Partage du butin : reçois 130 ₵.": {en:"Loot share: receive 130 ₵.", zh:"分赃：获得 130 ₵。"},
    "Cotisation de la meute : paie 30 ₵.": {en:"Pack dues: pay 30 ₵.", zh:"兽群会费：支付 30 ₵。"},
    "Prime de bravoure : reçois 75 ₵.": {en:"Bravery bonus: receive 75 ₵.", zh:"英勇奖金：获得 75 ₵。"}
  },
  rulesTitle: { en:"📜 Rules of the Empire", zh:"📜 帝国规则" },
  rulesOk: { en:"Got it", zh:"我明白了" },
  rulesHTML: {
    en: "<p><b>🎯 Goal</b><br>Be the last solvent animal: bankrupt every bot to crown your empire.</p><p><b>🎲 Moving</b><br>Roll the dice and move around the ring. Passing the Grand Baobab 🌳 again earns ₵200.</p><p><b>🏠 Buying</b><br>Land on unowned land and you can buy it. Land on a rival's property and you pay rent.</p><p><b>🏗️ Building</b><br>You can only build if you own a <b>whole district</b>: <b>both spaces of the same color</b>. Each level (Stall → Shop → Department Store → Palace) pushes the rents higher.</p><p><b>💰 Rent &amp; haggling</b><br>On a rival's land you pay rent. You can <b>haggle it ÷2</b> by getting <b>1 question</b> right — but miss it and the <b>rent is tripled</b>! Animals can demand a haggle from you too: defend your full price with <b>1 correct answer</b>.</p><p><b>⚔️ Takeover</b><br>On a rival's land you can attempt a <b>takeover</b> (forced buyout): get <b>3 questions</b> right to wrest it from its owner. <b>Big risk:</b> miss a single question and the takeover fails and you pay <b>5 times the rent</b>. One takeover per turn. Watch out: an animal can launch a <b>hostile takeover against you</b> — defend yourself with <b>3 correct answers</b>.</p><p><b>🔒 Fourrière</b><br>Two doubles in a row, or the Gardien 🚓 space, send you to the Fourrière. You get out by paying or by answering correctly.</p><p><b>❓ Questions</b><br>Most actions (purchases, takeovers, leaving the Fourrière) are won by answering French questions correctly.</p><p><b>🤝 Purchase offer</b><br>From a rival property's card, propose a buyout price. The lower your offer, the more correct answers you must string together (down to half the original price). A generous offer is easier to get accepted.</p>",
    zh: "<p><b>🎯 游戏目标</b><br>成为最后一只有偿付能力的动物：让所有机器人破产，加冕你的帝国。</p><p><b>🎲 移动</b><br>掷骰子沿环形棋盘前进。再次经过 Grand Baobab 🌳 可获得 ₵200。</p><p><b>🏠 购买</b><br>停在无主地上时，你可以买下它。停在对手的地产上则要付租金。</p><p><b>🏗️ 建造</b><br>只有当你拥有<b>整片街区</b>——即<b>同一颜色的两个格子</b>时才能建造。每提升一级（摊位 → 店铺 → 百货商场 → 宫殿）都会让租金上涨。</p><p><b>💰 租金 &amp; 讨价还价</b><br>停在对手地产上要付租金。答对 <b>1 道题</b>即可<b>把租金砍半</b>——但答错，<b>租金翻三倍</b>！动物们也能向你发起讨价还价：用 <b>1 个正确答案</b>捍卫你的全额租金。</p><p><b>⚔️ 强购</b><br>在对手的地产上，你可以尝试<b>强购</b>（强制收购）：答对 <b>3 道题</b>即可从原主手中夺走它。<b>风险极大：</b>只要答错一道，强购就失败，你要支付 <b>5 倍租金</b>。每回合只能强购一次。当心：动物也能对你发动<b>恶意强购</b>——用 <b>3 个正确答案</b>保护自己。</p><p><b>🔒 Fourrière</b><br>连续掷出两次双数，或停在 Gardien 🚓 格，都会把你送进 Fourrière。付钱或答对题目即可脱身。</p><p><b>❓ 题目</b><br>大多数操作（购买、强购、脱离 Fourrière）都要靠答对法语题目来完成。</p><p><b>🤝 收购报价</b><br>在对手地产的详情页，可提出收购价。报价越低，需要连续答对的题目就越多（最低可至原价的一半）。慷慨的报价更容易被接受。</p>"
  }
};
