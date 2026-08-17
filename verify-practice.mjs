/**
 * 検証スクリプト: node verify-practice.mjs
 *
 * 練習モードの出題が「本番とまったく同じ理屈」で作られていることを確かめる。
 * ここが狂うと、正しく暗算できたのに不正解にされる（練習にならない）。
 */
import fs from 'node:fs';

const read = (name) => fs.readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');

const source = `
${read('cards.js').replace(/^export /gm, '')}
${read('practice.js')
  .replace(/^import[^;]+;$/gm, '')
  .replace(/^export /gm, '')}
${read('scores.js')
  .replace(/^import[^;]+;$/gm, '')
  .replace(/^export async function (load|save|clear)[\s\S]*?\n}\n/gm, '')
  .replace(/^export /gm, '')}
return { CARDS, MAX_NUMBER, createRound, grade, breakdown, PLAYER_LABELS, MAX_PLAYERS,
         EMPTY, keyOf, recordResult };
`;

const {
  CARDS,
  MAX_NUMBER,
  createRound,
  grade,
  breakdown,
  MAX_PLAYERS,
  EMPTY,
  keyOf,
  recordResult,
} = new Function(source)();

let failures = 0;
const check = (label, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`);
  if (!ok) failures += 1;
};

// 決まった乱数列で再現性のあるテストにする
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const ROUNDS = 2000;
let outOfRange = 0;
let answerMismatch = 0;
let sumMismatch = 0;
let breakdownMismatch = 0;
const seen = new Set();

const rand = seeded(12345);
for (let r = 0; r < ROUNDS; r += 1) {
  const players = 1 + (r % MAX_PLAYERS);
  const { targets, answers } = createRound(players, rand);

  if (targets.length !== players) answerMismatch += 1;

  targets.forEach((t, p) => {
    seen.add(t);
    if (t < 1 || t > MAX_NUMBER) outOfRange += 1;

    // 各カードの答えが「その数字がそのカードに載っているか」と一致するか
    CARDS.forEach((card, c) => {
      const expected = card.numbers.includes(t);
      if (answers[c][p] !== expected) answerMismatch += 1;
    });

    // 演者がやる計算 —「ある」のカードの重みを足したら元の数字に戻るか
    const sum = CARDS.reduce((acc, card, c) => acc + (answers[c][p] ? card.bit : 0), 0);
    if (sum !== t) sumMismatch += 1;

    // 採点画面に出す内訳も同じ数字になるか
    const parts = breakdown(t);
    if (parts.reduce((a, b) => a + b, 0) !== t) breakdownMismatch += 1;
  });
}

check(`出題した数字がすべて 1〜${MAX_NUMBER} に収まる`, outOfRange === 0, `はみ出し ${outOfRange} 件`);
check('各カードの「ある / ない」が実際のカードの内容と一致する', answerMismatch === 0, `不一致 ${answerMismatch} 件`);
check(
  '「ある」と答えたカードの重みの合計が、出題した数字に戻る',
  sumMismatch === 0,
  `不一致 ${sumMismatch} 件`
);
check('採点画面に出す内訳の合計も正しい', breakdownMismatch === 0, `不一致 ${breakdownMismatch} 件`);
check(`${ROUNDS}回まわして 1〜${MAX_NUMBER} が全部出題される（偏りがない）`, seen.size === MAX_NUMBER, `出た数字 ${seen.size} 種類`);

// 採点そのもの
const g = grade([37, 5, 60], ['37', '6', '60']);
check(
  '採点が正しい（正解・不正解・文字列入力）',
  g[0].correct === true && g[1].correct === false && g[2].correct === true && g[1].value === 6
);
const gEmpty = grade([12], ['']);
check('未入力は不正解として扱う', gEmpty[0].correct === false && gEmpty[0].value === null);

/* ---- 記録（スコア）の集計 ---- */

const run = (players, limitId, hit, total, seconds) => ({
  players,
  limitId,
  hit,
  total,
  seconds,
  at: 0,
});

let s = EMPTY;
let out = recordResult(s, run(3, '3', 3, 3, 20.0));
check('全問正解で連続数が1になる', out.state.streak === 1 && out.perfect === true);
check('初回の全問正解はベスト記録になる', out.isBestTime === true && out.state.best[keyOf(3, '3')] === 20.0);

s = out.state;
out = recordResult(s, run(3, '3', 3, 3, 25.0));
check('遅いタイムではベストを更新しない', out.isBestTime === false && out.state.best[keyOf(3, '3')] === 20.0);
check('連続数は伸びる', out.state.streak === 2);

s = out.state;
out = recordResult(s, run(3, '3', 3, 3, 12.5));
check('速いタイムでベストを更新する', out.isBestTime === true && out.state.best[keyOf(3, '3')] === 12.5);

s = out.state;
out = recordResult(s, run(3, '3', 2, 3, 9.0));
check('1問でも間違えたら連続数がリセットされる', out.state.streak === 0);
check('間違えたときは速くてもベストにしない', out.isBestTime === false && out.state.best[keyOf(3, '3')] === 12.5);
check('連続の最高記録は残る', out.state.bestStreak === 3);

s = out.state;
out = recordResult(s, run(5, '3', 5, 5, 40.0));
check(
  '人数が違えばベストは別枠',
  out.state.best[keyOf(5, '3')] === 40.0 && out.state.best[keyOf(3, '3')] === 12.5
);
check('履歴が新しい順に積まれる', out.state.history[0].players === 5 && out.state.history.length === 5);

check('元の記録は書き換えられていない（純粋関数）', EMPTY.streak === 0 && Object.keys(EMPTY.best).length === 0);

console.log('');
console.log('例）37 の内訳:', breakdown(37).join(' + '), '=', breakdown(37).reduce((a, b) => a + b, 0));

console.log('');
if (failures > 0) {
  console.log(`${failures} 件の検証に失敗しました`);
  process.exit(1);
}
console.log('すべての検証に合格しました');
