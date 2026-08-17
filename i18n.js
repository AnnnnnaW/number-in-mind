/**
 * 端末の言語に合わせて文言を切り替える。
 * 日本語（ja*）以外はすべて英語。
 */

function detectLocale() {
  let tag = "";
  try {
    tag = Intl.DateTimeFormat().resolvedOptions().locale || "";
  } catch (e) {
    // Intl が使えない環境向け
  }
  if (!tag && typeof navigator !== "undefined") {
    tag = navigator.language || (navigator.languages && navigator.languages[0]) || "";
  }
  return String(tag).toLowerCase().startsWith("ja") ? "ja" : "en";
}

export const locale = detectLocale();

const ja = {
  // ホーム
  "home.start": "はじめる",
  "home.practice": "練習",
  "home.settings": "設定",

  // 共通
  "common.yes": "ある",
  "common.no": "ない",
  "common.start": "はじめる",
  "common.again": "もう一度",
  "common.close": "閉じる",

  // 設定
  "settings.title": "設定",
  "settings.palette": "カードの配色",
  "settings.font": "フォント",
  "settings.note":
    "選択するとその場で変更が反映され、次回起動時も同じ設定で開きます。",
  "palette.gold": "ネイビー",
  "palette.crimson": "レッド",
  "palette.ivory": "アイボリー",

  // イントロ
  "intro.hello": "はじめまして",
  "intro.lead1": "1 〜 {max} の中から",
  "intro.lead2": "好きな数字をひとつ",
  "intro.lead3": "思い浮かべてください",
  "intro.sub1": "{count} 枚のカードをお見せします",
  "intro.sub2": "その数字があれば「ある」",
  "intro.sub3": "なければ「ない」を押してください",
  "intro.skip": "仕組みを知っているのでスキップ",
  "intro.question": "この中にありますか？",
  "intro.oops": "おや",
  "intro.allNo1": "すべて「ない」と答えられると",
  "intro.allNo2": "さすがに分かりません",
  "intro.allNo3": "もう一度お願いします",
  "intro.revealLead": "あなたが思い浮かべたのは",
  "intro.revealTail": "ですね？",
  "intro.tap": "画面をタップ",
  "intro.teaseLead": "なぜ、あなたの数字が分かったのか？",
  "intro.tease1": "その秘密は、このアプリの中に隠されています。",
  "intro.tease2": "秘密を解き明かしたら、",
  "intro.tease3": "今度はあなたが誰かの数字を当ててみましょう。",
  "intro.seek": "探す",

  // 本番
  "perform.lead1": "1 〜 {max} の中から",
  "perform.lead2": "好きな数字をひとつ",
  "perform.lead3": "思い浮かべてください",
  "perform.sub1": "これから {count} 枚のカードをお見せします",
  "perform.sub2": "その数字があれば「ある」",
  "perform.sub3": "なければ「ない」とお答えください",
  "perform.hint": "カードは横に払うとめくれます",
  "perform.end1": "あなたの思い浮かべた",
  "perform.end2": "数字は",
  "perform.restart": "もう一度",

  // 種明かし
  "explain.eyebrow": "見つけましたね",
  "explain.title": "種明かし",
  "explain.big1": "「ある」と答えたカードの",
  "explain.big2": "一番左上の数字を",
  "explain.big3": "足していくだけです。",
  "explain.exampleMine": "さっきのあなたの答え",
  "explain.exampleSample": "たとえば {sample} を思い浮かべた人の答え",
  "explain.p1":
    "カードの左上の数字は、6枚それぞれ 1 / 2 / 4 / 8 / 16 / 32。覚える必要はありません。カードに書いてあります。",
  "explain.hWhy": "なぜこれで当たるのか",
  "explain.p2a": "この 6 つの数字は、いわゆる",
  "explain.p2b": "2進数",
  "explain.p2c": "です。1 〜 {max} のどんな数字も、この 6 つの足し算で",
  "explain.p2d": "ただ1通りにしか表せません",
  "explain.p2e": "。",
  "explain.p3":
    "そして各カードには、その数字を作るのにそのカードが必要になる数字だけが載っています。だから「ある / ない」の答え方が同じになる数字は 2 つとなく、必ず当たります。",
  "explain.note":
    "{target} は2進数で {binary}。あなたの「ある / ない」は、そのまま この 1 と 0 です。",
  "explain.hColor": "赤や緑の数字には意味がある？",
  "explain.pColor": "ありません。相手に法則を探させるための飾りです。",
  "explain.closing1": "これであなたも同じことができます。",
  "explain.closing2": "今度はあなたが、誰かの心を読む番です。",
  "explain.replay": "イントロをもう一度見る",

  // 練習
  "practice.title": "練習",
  "practice.note":
    "アプリが観客役をやります。カードごとに全員の「ある / ない」が出るので、頭の中で人数ぶんの合計を同時に追ってください。",
  "practice.players": "人数",
  "practice.playersCount": "{n}人",
  "practice.timePerCard": "1枚あたりの時間",
  "practice.streak": "全問正解 連続",
  "practice.bestStreak": "連続の最高",
  "practice.bestSeconds": "この設定のベスト秒",
  "practice.history": "直近の記録",
  "practice.clearHistory": "記録を消す",
  "practice.askNumbers": "それぞれの数字は？",
  "practice.nextPerson": "次の人",
  "practice.grade": "採点",
  "practice.inputHint": "2桁入れると自動で次の人へ移ります",
  "practice.scoreTitle": "{hit} / {total} 正解",
  "practice.scoreMeta": "{seconds} 秒 ・ {key}",
  "practice.historyLine": "{hit}/{total} ・ {seconds}秒",
  "practice.personalBest": "自己ベスト",
  "practice.streakBadge": "{n} 連続 全問正解",
  "practice.yours": "あなた {value}",
  "practice.changeSetup": "設定を変える",
  "practice.scoreKey": "{players}人 / {limit}",
  "timeLimit.pace": "自分のペース",
  "timeLimit.5": "5秒",
  "timeLimit.3": "3秒",
  "timeLimit.2": "2秒",
};

const en = {
  "home.start": "Start",
  "home.practice": "Practice",
  "home.settings": "Settings",

  "common.yes": "Yes",
  "common.no": "No",
  "common.start": "Start",
  "common.again": "Try again",
  "common.close": "Close",

  "settings.title": "Settings",
  "settings.palette": "Card colors",
  "settings.font": "Font",
  "settings.note":
    "Changes apply right away and are saved for next time.",
  "palette.gold": "Navy",
  "palette.crimson": "Red",
  "palette.ivory": "Ivory",

  "intro.hello": "Hello",
  "intro.lead1": "Pick a number",
  "intro.lead2": "from 1 to {max}",
  "intro.lead3": "and keep it in mind",
  "intro.sub1": "I'll show you {count} cards",
  "intro.sub2": 'Tap "Yes" if your number is there',
  "intro.sub3": 'or "No" if it isn\'t',
  "intro.skip": "I already know how it works — skip",
  "intro.question": "Is it on this card?",
  "intro.oops": "Hmm",
  "intro.allNo1": 'If every answer is "No"',
  "intro.allNo2": "there's nothing I can guess",
  "intro.allNo3": "Please try again",
  "intro.revealLead": "The number you thought of is",
  "intro.revealTail": "isn't it?",
  "intro.tap": "Tap to continue",
  "intro.teaseLead": "How did I know your number?",
  "intro.tease1": "The secret is hidden somewhere in this app.",
  "intro.tease2": "Once you uncover it,",
  "intro.tease3": "it'll be your turn to read someone's mind.",
  "intro.seek": "Find it",

  "perform.lead1": "Pick a number",
  "perform.lead2": "from 1 to {max}",
  "perform.lead3": "and keep it in mind",
  "perform.sub1": "I'll show you {count} cards",
  "perform.sub2": 'Say "Yes" if your number is there',
  "perform.sub3": 'or "No" if it isn\'t',
  "perform.hint": "Swipe sideways to flip the cards",
  "perform.end1": "The number",
  "perform.end2": "you thought of is",
  "perform.restart": "Again",

  "explain.eyebrow": "You found it",
  "explain.title": "The secret",
  "explain.big1": "Just add up the top-left",
  "explain.big2": "numbers on the cards",
  "explain.big3": 'you answered "Yes" to.',
  "explain.exampleMine": "Your answers from earlier",
  "explain.exampleSample": "For example, someone who thought of {sample}",
  "explain.p1":
    "The top-left numbers on the six cards are 1 / 2 / 4 / 8 / 16 / 32. You don't need to memorize them — they're printed on the cards.",
  "explain.hWhy": "Why this always works",
  "explain.p2a": "Those six numbers are ",
  "explain.p2b": "binary",
  "explain.p2c":
    ". Every number from 1 to {max} can be written as a sum of them in ",
  "explain.p2d": "exactly one way",
  "explain.p2e": ".",
  "explain.p3":
    'Each card only lists the numbers that need that card\'s value. So no two numbers share the same Yes/No pattern — the answer is unique.',
  "explain.note":
    "{target} in binary is {binary}. Your Yes/No answers are exactly those 1s and 0s.",
  "explain.hColor": "Do the red and green numbers mean anything?",
  "explain.pColor":
    "No. They're decoration to keep people hunting for a fake pattern.",
  "explain.closing1": "Now you can do the same.",
  "explain.closing2": "It's your turn to read someone's mind.",
  "explain.replay": "Watch the intro again",

  "practice.title": "Practice",
  "practice.note":
    "The app plays the audience. For each card you'll see everyone's Yes/No — keep a running total for each person in your head.",
  "practice.players": "Players",
  "practice.playersCount": "{n}",
  "practice.timePerCard": "Time per card",
  "practice.streak": "Perfect streak",
  "practice.bestStreak": "Best streak",
  "practice.bestSeconds": "Best time (this setup)",
  "practice.history": "Recent runs",
  "practice.clearHistory": "Clear history",
  "practice.askNumbers": "What were the numbers?",
  "practice.nextPerson": "Next",
  "practice.grade": "Check",
  "practice.inputHint": "After two digits, focus moves to the next person",
  "practice.scoreTitle": "{hit} / {total} correct",
  "practice.scoreMeta": "{seconds} s · {key}",
  "practice.historyLine": "{hit}/{total} · {seconds}s",
  "practice.personalBest": "Personal best",
  "practice.streakBadge": "{n} perfect in a row",
  "practice.yours": "Yours {value}",
  "practice.changeSetup": "Change setup",
  "practice.scoreKey": "{players}p / {limit}",
  "timeLimit.pace": "Your pace",
  "timeLimit.5": "5 sec",
  "timeLimit.3": "3 sec",
  "timeLimit.2": "2 sec",
};

const tables = { ja, en };

/** 文言を取得。`{name}` を vars で置換する */
export function t(key, vars) {
  const table = tables[locale] || en;
  let s = table[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

/** 練習の人数×制限時間キーを表示用に整形 */
export function formatScoreKey(players, limitId) {
  return t("practice.scoreKey", {
    players,
    limit: t(`timeLimit.${limitId}`),
  });
}
