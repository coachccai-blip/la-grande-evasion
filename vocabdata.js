/* ============================================================================
   VOCAB_DATA — Banque de vocabulaire français DELF/DALF (module 百词斩)
   Format conforme au brief §6.3. Contenu 100 % hors-ligne.
   « image » = emoji (association visuelle façon 百词斩, sans pipeline d'images).
   Amorce curée ; les listes complètes (≥200/niveau) se rajoutent ici sans
   toucher au code (livrable de contenu §12).
   ========================================================================== */
(function(){
  "use strict";
  function w(id,level,word,pos,pos_zh,gender,ipa,emoji,zh,ex_fr,ex_zh,coll,notes){
    return {id:id,level:level,word:word,pos:pos,pos_zh:pos_zh,gender:gender,ipa:ipa,emoji:emoji,
      zh:zh,ex_fr:ex_fr,ex_zh:ex_zh,coll:coll||[],notes:notes||""};
  }
  var L1="DELF_B1", L2="DELF_B2", L3="DALF_C1", L4="DALF_C2";
  var WORDS=[
    /* ---------------- DELF B1 : quotidien, voyages, travail, sentiments ---------------- */
    w("b1_001",L1,"améliorer","v.","动词",null,"[ameljɔʁe]","📈",["改善","提高"],"Je voudrais améliorer mon niveau de français.","我想提高我的法语水平。",[{fr:"améliorer la qualité",zh:"提高质量"}],"注意区分 « améliorer »（改善某物）和 « s'améliorer »（自身变好）。"),
    w("b1_002",L1,"voyage","n.m.","阳性名词","m","[vwajaʒ]","🧳",["旅行","旅程"],"Nous préparons un voyage en Italie.","我们在准备一次去意大利的旅行。",[{fr:"partir en voyage",zh:"去旅行"}],""),
    w("b1_003",L1,"quotidien","adj.","形容词",null,"[kɔtidjɛ̃]","📅",["日常的","每天的"],"La vie quotidienne à Paris est chère.","巴黎的日常生活很贵。",[{fr:"la vie quotidienne",zh:"日常生活"}],""),
    w("b1_004",L1,"réussir","v.","动词",null,"[ʁeysiʁ]","🏆",["成功","考取"],"Elle a réussi son examen.","她考试通过了。",[{fr:"réussir un examen",zh:"通过考试"}],""),
    w("b1_005",L1,"inquiet","adj.","形容词",null,"[ɛ̃kjɛ]","😟",["担心的","不安的"],"Je suis inquiet pour mon avenir.","我为我的未来感到担心。",[{fr:"être inquiet",zh:"感到担心"}],"阴性形式为 « inquiète »。"),
    w("b1_006",L1,"souvenir","n.m.","阳性名词","m","[suvniʁ]","📸",["回忆","纪念品"],"J'ai de bons souvenirs de ce voyage.","我对这次旅行有美好的回忆。",[{fr:"garder un souvenir",zh:"留下回忆"}],""),
    w("b1_007",L1,"entreprise","n.f.","阴性名词","f","[ɑ̃tʁəpʁiz]","🏢",["公司","企业"],"Il travaille dans une grande entreprise.","他在一家大公司工作。",[{fr:"créer une entreprise",zh:"创办公司"}],""),
    w("b1_008",L1,"conseil","n.m.","阳性名词","m","[kɔ̃sɛj]","💡",["建议","忠告"],"Merci pour tes conseils.","谢谢你的建议。",[{fr:"donner un conseil",zh:"给建议"}],""),
    w("b1_009",L1,"emprunter","v.","动词",null,"[ɑ̃pʁœ̃te]","🔁",["借入","借用"],"Je peux emprunter ton stylo ?","我能借用你的笔吗？",[{fr:"emprunter de l'argent",zh:"借钱"}],"« emprunter »（借入）≠ « prêter »（借出）。"),
    w("b1_010",L1,"gentil","adj.","形容词",null,"[ʒɑ̃ti]","😊",["善良的","友好的"],"Ta voisine est très gentille.","你的邻居非常友好。",[{fr:"être gentil avec",zh:"对…友好"}],""),
    w("b1_011",L1,"santé","n.f.","阴性名词","f","[sɑ̃te]","🩺",["健康"],"La santé est plus importante que l'argent.","健康比金钱更重要。",[{fr:"être en bonne santé",zh:"身体健康"}],""),
    w("b1_012",L1,"décider","v.","动词",null,"[deside]","✅",["决定"],"Nous avons décidé de partir demain.","我们决定明天出发。",[{fr:"décider de faire",zh:"决定做某事"}],""),
    w("b1_013",L1,"météo","n.f.","阴性名词","f","[meteo]","🌦️",["天气预报","天气"],"La météo annonce de la pluie.","天气预报说要下雨。",[{fr:"regarder la météo",zh:"看天气预报"}],""),
    w("b1_014",L1,"cuisine","n.f.","阴性名词","f","[kɥizin]","🍳",["厨房","烹饪"],"J'adore la cuisine française.","我很喜欢法国菜。",[{fr:"faire la cuisine",zh:"做饭"}],""),
    w("b1_015",L1,"fatigué","adj.","形容词",null,"[fatiɡe]","😴",["疲惫的","累的"],"Je suis très fatigué ce soir.","我今晚很累。",[{fr:"se sentir fatigué",zh:"感到疲惫"}],""),
    w("b1_016",L1,"argent","n.m.","阳性名词","m","[aʁʒɑ̃]","💰",["钱","银"],"Je n'ai pas assez d'argent.","我的钱不够。",[{fr:"gagner de l'argent",zh:"赚钱"}],""),
    w("b1_017",L1,"rencontrer","v.","动词",null,"[ʁɑ̃kɔ̃tʁe]","🤝",["遇见","结识"],"J'ai rencontré un ami en ville.","我在城里遇见了一个朋友。",[{fr:"rencontrer quelqu'un",zh:"遇见某人"}],""),
    w("b1_018",L1,"heureux","adj.","形容词",null,"[œʁø]","😄",["幸福的","高兴的"],"Ils sont heureux ensemble.","他们在一起很幸福。",[{fr:"rendre heureux",zh:"使…幸福"}],"阴性形式为 « heureuse »。"),
    w("b1_019",L1,"gare","n.f.","阴性名词","f","[ɡaʁ]","🚉",["火车站"],"Le train part de la gare à midi.","火车中午从车站出发。",[{fr:"aller à la gare",zh:"去火车站"}],""),
    w("b1_020",L1,"projet","n.m.","阳性名词","m","[pʁɔʒɛ]","📋",["计划","项目"],"Elle a un projet intéressant.","她有一个有趣的计划。",[{fr:"réaliser un projet",zh:"实现计划"}],""),
    w("b1_021",L1,"oublier","v.","动词",null,"[ublije]","🤦",["忘记"],"N'oublie pas ton passeport !","别忘了你的护照！",[{fr:"oublier de faire",zh:"忘了做某事"}],""),
    w("b1_022",L1,"cadeau","n.m.","阳性名词","m","[kado]","🎁",["礼物"],"C'est un cadeau pour toi.","这是给你的礼物。",[{fr:"offrir un cadeau",zh:"送礼物"}],"复数为 « cadeaux »。"),
    w("b1_023",L1,"content","adj.","形容词",null,"[kɔ̃tɑ̃]","🙂",["满意的","高兴的"],"Je suis content de te voir.","见到你我很高兴。",[{fr:"être content de",zh:"对…满意"}],""),
    w("b1_024",L1,"voisin","n.m.","阳性名词","m","[vwazɛ̃]","🏠",["邻居"],"Mon voisin est musicien.","我的邻居是音乐家。",[{fr:"un bon voisin",zh:"好邻居"}],""),

    /* ---------------- DELF B2 : argumentation, société, environnement ---------------- */
    w("b2_001",L2,"environnement","n.m.","阳性名词","m","[ɑ̃viʁɔnmɑ̃]","🌍",["环境"],"Il faut protéger l'environnement.","必须保护环境。",[{fr:"protéger l'environnement",zh:"保护环境"}],""),
    w("b2_002",L2,"pollution","n.f.","阴性名词","f","[pɔlysjɔ̃]","🏭",["污染"],"La pollution de l'air augmente en ville.","城市里的空气污染在加剧。",[{fr:"réduire la pollution",zh:"减少污染"}],""),
    w("b2_003",L2,"chômage","n.m.","阳性名词","m","[ʃomaʒ]","📉",["失业"],"Le taux de chômage a baissé.","失业率下降了。",[{fr:"lutter contre le chômage",zh:"应对失业"}],""),
    w("b2_004",L2,"citoyen","n.m.","阳性名词","m","[sitwajɛ̃]","🗳️",["公民"],"Chaque citoyen a des droits.","每个公民都有权利。",[{fr:"un citoyen responsable",zh:"负责任的公民"}],""),
    w("b2_005",L2,"débat","n.m.","阳性名词","m","[deba]","💬",["辩论","讨论"],"Le débat sur l'école continue.","关于学校的辩论仍在继续。",[{fr:"lancer un débat",zh:"发起讨论"}],""),
    w("b2_006",L2,"inégalité","n.f.","阴性名词","f","[inegalite]","⚖️",["不平等"],"Les inégalités sociales se creusent.","社会不平等在加剧。",[{fr:"réduire les inégalités",zh:"缩小不平等"}],""),
    w("b2_007",L2,"développer","v.","动词",null,"[devlɔpe]","🚀",["发展","开发"],"L'entreprise veut développer ses activités.","公司想发展业务。",[{fr:"développer une idée",zh:"展开论述"}],""),
    w("b2_008",L2,"conséquence","n.f.","阴性名词","f","[kɔ̃sekɑ̃s]","➡️",["后果","结果"],"Cette décision a de lourdes conséquences.","这个决定有严重后果。",[{fr:"avoir des conséquences",zh:"产生后果"}],""),
    w("b2_009",L2,"nuisible","adj.","形容词",null,"[nɥizibl]","☠️",["有害的"],"Le tabac est nuisible à la santé.","烟草对健康有害。",[{fr:"nuisible à",zh:"对…有害"}],""),
    w("b2_010",L2,"gaspillage","n.m.","阳性名词","m","[ɡaspijaʒ]","🗑️",["浪费"],"Le gaspillage alimentaire est un problème.","食物浪费是个问题。",[{fr:"lutter contre le gaspillage",zh:"反对浪费"}],""),
    w("b2_011",L2,"favoriser","v.","动词",null,"[favɔʁize]","👍",["促进","有利于"],"Le sport favorise la santé.","运动有益于健康。",[{fr:"favoriser l'accès",zh:"促进获取"}],""),
    w("b2_012",L2,"méfiance","n.f.","阴性名词","f","[mefjɑ̃s]","🤨",["不信任","戒备"],"Il regarde les publicités avec méfiance.","他对广告心存戒备。",[{fr:"éveiller la méfiance",zh:"引起戒心"}],""),
    w("b2_013",L2,"engagement","n.m.","阳性名词","m","[ɑ̃ɡaʒmɑ̃]","✊",["承诺","投入"],"Son engagement pour l'écologie est fort.","他对生态的投入很深。",[{fr:"prendre un engagement",zh:"作出承诺"}],""),
    w("b2_014",L2,"remettre en cause","loc.","短语","","[ʁəmɛtʁ ɑ̃ koz]","❓",["质疑","重新审视"],"Il faut remettre en cause nos habitudes.","我们必须质疑自己的习惯。",[{fr:"remettre en cause un choix",zh:"质疑一个选择"}],""),
    w("b2_015",L2,"durable","adj.","形容词",null,"[dyʁabl]","♻️",["可持续的","持久的"],"Nous cherchons un développement durable.","我们追求可持续发展。",[{fr:"développement durable",zh:"可持续发展"}],""),
    w("b2_016",L2,"solidarité","n.f.","阴性名词","f","[sɔlidaʁite]","🤲",["团结","互助"],"La solidarité entre voisins compte.","邻里之间的互助很重要。",[{fr:"élan de solidarité",zh:"互助的热潮"}],""),
    w("b2_017",L2,"préjugé","n.m.","阳性名词","m","[pʁeʒyʒe]","🏷️",["偏见"],"Il faut lutter contre les préjugés.","必须消除偏见。",[{fr:"avoir des préjugés",zh:"抱有偏见"}],""),
    w("b2_018",L2,"croissance","n.f.","阴性名词","f","[kʁwasɑ̃s]","📊",["增长"],"La croissance économique ralentit.","经济增长在放缓。",[{fr:"la croissance économique",zh:"经济增长"}],""),
    w("b2_019",L2,"répandre","v.","动词",null,"[ʁepɑ̃dʁ]","📡",["传播","散布"],"Les rumeurs se répandent vite.","谣言传播得很快。",[{fr:"se répandre",zh:"扩散"}],""),
    w("b2_020",L2,"enjeu","n.m.","阳性名词","m","[ɑ̃ʒø]","🎯",["利害","关键问题"],"Le climat est un enjeu majeur.","气候是一个重大议题。",[{fr:"un enjeu de taille",zh:"重大议题"}],"复数为 « enjeux »。"),
    w("b2_021",L2,"efficace","adj.","形容词",null,"[efikas]","⚙️",["有效的","高效的"],"Cette méthode est très efficace.","这个方法非常有效。",[{fr:"une solution efficace",zh:"有效的解决方案"}],""),
    w("b2_022",L2,"sensibiliser","v.","动词",null,"[sɑ̃sibilize]","📣",["使…意识到","提高意识"],"Il faut sensibiliser les jeunes au tri.","要提高年轻人对垃圾分类的意识。",[{fr:"sensibiliser le public",zh:"提高公众意识"}],""),

    /* ---------------- DALF C1 : soutenu, presse, abstraction ---------------- */
    w("c1_001",L3,"néanmoins","adv.","副词",null,"[neɑ̃mwɛ̃]","🔄",["然而","尽管如此"],"Le projet est risqué ; néanmoins, il mérite d'être tenté.","这个项目有风险；然而，它值得一试。",[{fr:"néanmoins, il faut",zh:"然而，必须"}],"书面连接词，比 « mais » 更正式。"),
    w("c1_002",L3,"pertinence","n.f.","阴性名词","f","[pɛʁtinɑ̃s]","🎯",["中肯","切题"],"On peut douter de la pertinence de cet argument.","人们可以怀疑这个论点是否切题。",[{fr:"la pertinence d'une analyse",zh:"分析的中肯性"}],""),
    w("c1_003",L3,"nuance","n.f.","阴性名词","f","[nɥɑ̃s]","🎨",["细微差别","微妙之处"],"Il faut apporter des nuances à ce jugement.","应该对这一判断加以细化。",[{fr:"apporter une nuance",zh:"加以细化"}],""),
    w("c1_004",L3,"souligner","v.","动词",null,"[suliɲe]","✏️",["强调","指出"],"L'auteur souligne l'importance du débat.","作者强调了这场辩论的重要性。",[{fr:"souligner un point",zh:"强调一点"}],""),
    w("c1_005",L3,"paradoxe","n.m.","阳性名词","m","[paʁadɔks]","🔀",["悖论","矛盾"],"C'est un paradoxe apparent.","这是一个表面上的悖论。",[{fr:"un paradoxe frappant",zh:"惊人的悖论"}],""),
    w("c1_006",L3,"préconiser","v.","动词",null,"[pʁekɔnize]","📢",["建议","主张"],"L'expert préconise la prudence.","专家主张谨慎行事。",[{fr:"préconiser une mesure",zh:"主张采取措施"}],""),
    w("c1_007",L3,"ambiguïté","n.f.","阴性名词","f","[ɑ̃biɡɥite]","🌫️",["含糊","歧义"],"Son discours entretient l'ambiguïté.","他的讲话保持着一种含糊。",[{fr:"lever l'ambiguïté",zh:"消除歧义"}],""),
    w("c1_008",L3,"remarquable","adj.","形容词",null,"[ʁəmaʁkabl]","🌟",["卓越的","显著的"],"Elle a fait un travail remarquable.","她做出了出色的工作。",[{fr:"un effort remarquable",zh:"显著的努力"}],""),
    w("c1_009",L3,"inéluctable","adj.","形容词",null,"[inelyktabl]","⏳",["不可避免的"],"Le changement paraît inéluctable.","这一变化似乎不可避免。",[{fr:"une issue inéluctable",zh:"不可避免的结局"}],""),
    w("c1_010",L3,"discernement","n.m.","阳性名词","m","[disɛʁnəmɑ̃]","🧭",["辨别力","判断力"],"Il agit toujours avec discernement.","他做事总是有分寸。",[{fr:"faire preuve de discernement",zh:"表现出判断力"}],""),
    w("c1_011",L3,"contrecarrer","v.","动词",null,"[kɔ̃tʁəkaʁe]","🛑",["阻挠","挫败"],"Ils cherchent à contrecarrer ce projet.","他们试图阻挠这个计划。",[{fr:"contrecarrer un plan",zh:"挫败一个计划"}],""),
    w("c1_012",L3,"consensus","n.m.","阳性名词","m","[kɔ̃sɛ̃sys]","🤝",["共识"],"Un consensus s'est dégagé de la réunion.","会议达成了共识。",[{fr:"trouver un consensus",zh:"达成共识"}],""),
    w("c1_013",L3,"exacerber","v.","动词",null,"[ɛɡzasɛʁbe]","🔥",["加剧","激化"],"La crise exacerbe les tensions.","危机激化了紧张局势。",[{fr:"exacerber un conflit",zh:"激化冲突"}],""),
    w("c1_014",L3,"perspicace","adj.","形容词",null,"[pɛʁspikas]","🔍",["敏锐的","有洞察力的"],"C'est une observatrice perspicace.","她是位敏锐的观察者。",[{fr:"un esprit perspicace",zh:"敏锐的头脑"}],""),
    w("c1_015",L3,"préalable","adj.","形容词",null,"[pʁealabl]","1️⃣",["事先的","前提的"],"Une réflexion préalable est nécessaire.","事先的思考是必要的。",[{fr:"un accord préalable",zh:"事先的同意"}],""),
    w("c1_016",L3,"entériner","v.","动词",null,"[ɑ̃teʁine]","🖋️",["批准","确认"],"Le conseil a entériné la décision.","理事会批准了这一决定。",[{fr:"entériner un accord",zh:"批准协议"}],""),
    w("c1_017",L3,"prépondérant","adj.","形容词",null,"[pʁepɔ̃deʁɑ̃]","⭐",["占主导的","首要的"],"Ce facteur joue un rôle prépondérant.","这个因素起着主导作用。",[{fr:"un rôle prépondérant",zh:"主导作用"}],""),
    w("c1_018",L3,"susciter","v.","动词",null,"[sysite]","💥",["引起","激起"],"Ce film a suscité de vives réactions.","这部电影引起了强烈反响。",[{fr:"susciter l'intérêt",zh:"激起兴趣"}],""),
    w("c1_019",L3,"corollaire","n.m.","阳性名词","m","[kɔʁɔlɛʁ]","🔗",["必然结果","推论"],"La liberté a pour corollaire la responsabilité.","自由的必然结果是责任。",[{fr:"le corollaire de",zh:"…的必然结果"}],""),
    w("c1_020",L3,"délibéré","adj.","形容词",null,"[delibeʁe]","🎯",["蓄意的","深思熟虑的"],"C'est un choix délibéré.","这是一个深思熟虑的选择。",[{fr:"de manière délibérée",zh:"有意地"}],""),

    /* ---------------- DALF C2 : littéraire, très soutenu, figé ---------------- */
    w("c2_001",L4,"idoine","adj.","形容词",null,"[idwan]","🧩",["恰当的","合适的"],"Il a trouvé le mot idoine.","他找到了恰如其分的词。",[{fr:"la solution idoine",zh:"恰当的方案"}],"极书面用语。"),
    w("c2_002",L4,"protéiforme","adj.","形容词",null,"[pʁɔteifɔʁm]","🌀",["多变的","变化多端的"],"Une menace protéiforme et insaisissable.","一种变化多端、难以捉摸的威胁。",[{fr:"un phénomène protéiforme",zh:"多变的现象"}],""),
    w("c2_003",L4,"obédience","n.f.","阴性名词","f","[ɔbedjɑ̃s]","🏛️",["派别","归属"],"Un penseur d'obédience libérale.","一位属于自由派的思想家。",[{fr:"d'obédience",zh:"属于…派别"}],""),
    w("c2_004",L4,"sciemment","adv.","副词",null,"[sjamɑ̃]","🎭",["故意地","明知地"],"Il a sciemment ignoré l'avertissement.","他明知故犯，无视了警告。",[{fr:"agir sciemment",zh:"故意行事"}],""),
    w("c2_005",L4,"palinodie","n.f.","阴性名词","f","[palinɔdi]","🔃",["自食其言","变卦"],"Ses palinodies lassent l'auditoire.","他反复变卦让听众厌倦。",[{fr:"une palinodie politique",zh:"政治上的出尔反尔"}],""),
    w("c2_006",L4,"prégnance","n.f.","阴性名词","f","[pʁeɡnɑ̃s]","🧲",["强烈影响","深刻印记"],"La prégnance du mythe dans l'œuvre.","神话在作品中的深刻印记。",[{fr:"la prégnance d'une image",zh:"某个意象的深刻印记"}],""),
    w("c2_007",L4,"éculé","adj.","形容词",null,"[ekyle]","👞",["陈旧的","用滥的"],"Un argument éculé et sans force.","一个用滥了、毫无说服力的论点。",[{fr:"un procédé éculé",zh:"陈旧的手法"}],""),
    w("c2_008",L4,"prolixe","adj.","形容词",null,"[pʁɔliks]","🗯️",["冗长的","啰嗦的"],"Un auteur brillant mais prolixe.","一位才华横溢却啰嗦的作者。",[{fr:"un style prolixe",zh:"冗长的文风"}],""),
    w("c2_009",L4,"achoppement","n.m.","阳性名词","m","[aʃɔpmɑ̃]","🪨",["障碍","症结"],"La pierre d'achoppement des négociations.","谈判的症结所在。",[{fr:"pierre d'achoppement",zh:"绊脚石"}],""),
    w("c2_010",L4,"consubstantiel","adj.","形容词",null,"[kɔ̃sypstɑ̃sjɛl]","🔗",["本质相连的","同体的"],"Une liberté consubstantielle à la démocratie.","一种与民主本质相连的自由。",[{fr:"consubstantiel à",zh:"与…本质相连"}],""),
    w("c2_011",L4,"délétère","adj.","形容词",null,"[deletɛʁ]","☣️",["有害的","毒害的"],"Un climat délétère régnait dans l'équipe.","团队里弥漫着一种有害的氛围。",[{fr:"une influence délétère",zh:"毒害性的影响"}],""),
    w("c2_012",L4,"exégèse","n.f.","阴性名词","f","[ɛɡzeʒɛz]","📜",["诠释","解经"],"Son exégèse du texte est subtile.","他对文本的诠释很精妙。",[{fr:"se livrer à l'exégèse",zh:"进行诠释"}],""),
    w("c2_013",L4,"velléité","n.f.","阴性名词","f","[veleite]","🌫️",["三分钟热度","微弱意愿"],"De simples velléités de réforme.","不过是些改革的空想罢了。",[{fr:"des velléités de",zh:"…的空想"}],""),
    w("c2_014",L4,"emphase","n.f.","阴性名词","f","[ɑ̃faz]","🎺",["夸张","浮夸"],"Il parle avec emphase.","他说话很浮夸。",[{fr:"parler avec emphase",zh:"夸张地说"}],""),
    w("c2_015",L4,"laconique","adj.","形容词",null,"[lakɔnik]","🤐",["简洁的","言简意赅的"],"Une réponse laconique et tranchante.","一个简洁而干脆的回答。",[{fr:"un ton laconique",zh:"简洁的语气"}],""),
    w("c2_016",L4,"sagacité","n.f.","阴性名词","f","[saɡasite]","🦉",["睿智","洞察力"],"Il a analysé la situation avec sagacité.","他睿智地分析了局势。",[{fr:"faire preuve de sagacité",zh:"展现出睿智"}],""),
    w("c2_017",L4,"tergiverser","v.","动词",null,"[tɛʁʒivɛʁse]","🌀",["支吾","拖延推诿"],"Cesse de tergiverser et décide-toi.","别再推诿，快做决定。",[{fr:"tergiverser sans fin",zh:"没完没了地推诿"}],""),
    w("c2_018",L4,"pusillanime","adj.","形容词",null,"[pyzilanim]","🐁",["胆小的","懦弱的"],"Une attitude pusillanime devant le danger.","面对危险的一种懦弱态度。",[{fr:"un chef pusillanime",zh:"懦弱的领导"}],""),
    w("c2_019",L4,"apophtegme","n.m.","阳性名词","m","[apɔftɛɡm]","💬",["格言","箴言"],"Il ponctue ses discours d'apophtegmes.","他的讲话中不时穿插格言。",[{fr:"citer un apophtegme",zh:"引用格言"}],""),
    w("c2_020",L4,"éluder","v.","动词",null,"[elyde]","🙈",["回避","躲闪"],"Le ministre a éludé la question.","部长回避了这个问题。",[{fr:"éluder une question",zh:"回避问题"}],"")
  ];
  window.VOCAB_DATA={
    levels:[L1,L2,L3,L4],
    levelLabel:{DELF_B1:"DELF B1",DELF_B2:"DELF B2",DALF_C1:"DALF C1",DALF_C2:"DALF C2"},
    levelZh:{DELF_B1:"B1 日常",DELF_B2:"B2 社会",DALF_C1:"C1 高级",DALF_C2:"C2 精通"},
    words:WORDS
  };
})();
