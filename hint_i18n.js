/* Traduction HORS-LIGNE des consignes de questions (FR → EN / 中).
   Les consignes sont un ensemble fini : ~28 phrases fixes + un motif de
   conjugation « Conjugue « {verbe} » {temps} ({sujet}) » + 2 préfixes.
   On traduit les parties fixes ; le verbe et les prénoms propres restent tels
   quels (contenu à apprendre). Aucun réseau nécessaire. */
window.HINT_I18N = {
  /* Libellés de temps (clé = libellé FR exact tel qu'assemblé dans la consigne) */
  tense: {
    "au présent":              {en:"the present tense",     zh:"现在时"},
    "au passé composé":        {en:"the passé composé",     zh:"复合过去时"},
    "à l'imparfait":           {en:"the imperfect",         zh:"未完成过去时"},
    "au futur simple":         {en:"the simple future",     zh:"简单将来时"},
    "au conditionnel présent": {en:"the present conditional",zh:"条件式现在时"},
    "au subjonctif présent":   {en:"the present subjunctive",zh:"虚拟式现在时"},
    "à l'impératif":           {en:"the imperative",        zh:"命令式"},
    "au plus-que-parfait":     {en:"the pluperfect",        zh:"愈过去时"},
    "au conditionnel passé":   {en:"the past conditional",  zh:"条件式过去时"},
    "au subjonctif passé":     {en:"the past subjunctive",  zh:"虚拟式过去时"},
    "au futur antérieur":      {en:"the future perfect",    zh:"先将来时"}
  },
  /* Sujets traduisibles (pronoms + noms communs). Les prénoms propres absents
     de cette table sont laissés tels quels. */
  subj: {
    "je":{en:"I",zh:"我"}, "tu":{en:"you",zh:"你"}, "il":{en:"he",zh:"他"},
    "elle":{en:"she",zh:"她"}, "on":{en:"we",zh:"我们"}, "nous":{en:"we",zh:"我们"},
    "vous":{en:"you (pl.)",zh:"你们"}, "ils":{en:"they",zh:"他们"}, "elles":{en:"they",zh:"她们"},
    "le maître":{en:"the teacher",zh:"老师"}, "la maîtresse":{en:"the teacher",zh:"女老师"},
    "mon frère":{en:"my brother",zh:"我哥哥"}, "ma sœur":{en:"my sister",zh:"我姐姐"},
    "le voisin":{en:"the neighbor",zh:"邻居"}, "la voisine":{en:"the neighbor",zh:"女邻居"},
    "le facteur":{en:"the postman",zh:"邮递员"},
    "les enfants":{en:"the children",zh:"孩子们"}, "les élèves":{en:"the students",zh:"学生们"},
    "mes amis":{en:"my friends",zh:"我的朋友们"}, "les joueurs":{en:"the players",zh:"选手们"},
    "mes parents":{en:"my parents",zh:"我父母"}, "les filles":{en:"the girls",zh:"女孩们"},
    "les touristes":{en:"the tourists",zh:"游客们"}, "les voisins":{en:"the neighbors",zh:"邻居们"}
  },
  /* Consignes fixes (clé = consigne FR exacte) */
  map: {
    "Accorde l'adjectif (genre et nombre)":            {en:"Make the adjective agree (gender & number)", zh:"让形容词性数一致"},
    "Accorde le participe (voix passive)":             {en:"Make the participle agree (passive voice)",  zh:"让分词配合（被动语态）"},
    "Accorde le participe passé (auxiliaire avoir)":   {en:"Agree the past participle (with « avoir »)",  zh:"配合过去分词（助动词 avoir）"},
    "Accorde le participe passé (auxiliaire être)":    {en:"Agree the past participle (with « être »)",   zh:"配合过去分词（助动词 être）"},
    "Calcul":                                          {en:"Arithmetic", zh:"计算"},
    "Choisis la bonne préposition (lieu)":             {en:"Choose the correct preposition (place)", zh:"选择正确的介词（地点）"},
    "Choisis le bon connecteur logique":               {en:"Choose the correct linking word", zh:"选择正确的逻辑连接词"},
    "Choisis le bon déterminant":                      {en:"Choose the correct determiner", zh:"选择正确的限定词"},
    "Choisis le bon homonyme":                         {en:"Choose the correct homonym", zh:"选择正确的同音词"},
    "Choisis le bon pronom relatif":                   {en:"Choose the correct relative pronoun", zh:"选择正确的关系代词"},
    "Choisis le mot juste":                            {en:"Choose the right word", zh:"选择恰当的词"},
    "Complète avec le bon mot":                        {en:"Complete with the correct word", zh:"用正确的词补全"},
    "Complète l'expression imagée":                    {en:"Complete the idiom", zh:"补全这个习语"},
    "Donne la nature (classe) du mot":                 {en:"Give the word's part of speech", zh:"指出该词的词性"},
    "Forme l'adverbe en -ment":                        {en:"Form the « -ment » adverb", zh:"构成 -ment 副词"},
    "Homophones grammaticaux":                         {en:"Grammatical homophones", zh:"语法同音词"},
    "Mot du quotidien":                                {en:"Everyday word", zh:"日常词汇"},
    "Même famille de mots":                            {en:"Same word family", zh:"同一词族"},
    "Paronymes (mots proches à ne pas confondre)":     {en:"Paronyms (lookalike words not to confuse)", zh:"近形词（易混淆的词）"},
    "Quel type de phrase ?":                           {en:"What type of sentence?", zh:"这是哪种句型？"},
    "Registre de langue":                              {en:"Language register", zh:"语域（语言风格）"},
    "Règle m devant m, b, p":                          {en:"Rule: « m » before m, b, p", zh:"规则：m 在 m、b、p 前"},
    "Sens du mot (中文 · English)":                     {en:"Word meaning", zh:"词义"},
    "Trouve le mot de sens OPPOSÉ":                    {en:"Find the word with the OPPOSITE meaning", zh:"找出意思相反的词"},
    "Trouve un mot de sens PROCHE":                    {en:"Find a word with a SIMILAR meaning", zh:"找出意思相近的词"},
    "« -er » (infinitif) ou « -é » (participe) ?":     {en:"« -er » (infinitive) or « -é » (participle)?", zh:"« -er »（不定式）还是 « -é »（分词）？"},
    "Écris le bon pluriel":                            {en:"Write the correct plural", zh:"写出正确的复数"},
    "é (participe) ou er (infinitif) ?":               {en:"« é » (participle) or « er » (infinitive)?", zh:"é（分词）还是 er（不定式）？"}
  },
  /* Préfixes semi-dynamiques (le reste = note, conservée telle quelle) */
  prefix: {
    "Orthographe : ": {en:"Spelling: ", zh:"拼写："}
  }
};
