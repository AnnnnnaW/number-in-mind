/**
 * 検証スクリプト: node verify-intro.mjs
 *
 * イントロでアプリが数字を言い当てる部分の検証。
 * ここを外すと、初回起動でいきなり間違った数字を言うことになる。
 */
import fs from 'node:fs';

const read = (name) => fs.readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');

const source = `
${read('cards.js').replace(/^export /gm, '')}
${read('solve.js')
  .replace(/^import[^;]+;$/gm, '')
  .replace(/^export /gm, '')}
return { CARDS, BITS, MAX_NUMBER, sumOf, partsOf, answersFor };
`;

const { CARDS, BITS, MAX_NUMBER, sumOf, partsOf, answersFor } = new Function(source)();

let failures = 0;
const check = (label, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`);
  if (!ok) failures += 1;
};

// 1〜60 のすべてについて、正しい答え方をすれば正しく言い当てられるか
const missed = [];
for (let n = 1; n <= MAX_NUMBER; n += 1) {
  if (sumOf(answersFor(n)) !== n) missed.push(n);
}
check(`1〜${MAX_NUMBER} をすべて正しく言い当てる`, missed.length === 0, missed.join(' '));

// 答え方（ある/ない の並び）が数字ごとに一意か
const patterns = new Map();
for (let n = 1; n <= MAX_NUMBER; n += 1) {
  const key = answersFor(n)
    .map((a) => (a.yes ? '1' : '0'))
    .join('');
  if (patterns.has(key)) patterns.set(key, [...patterns.get(key), n]);
  else patterns.set(key, [n]);
}
const collisions = [...patterns.entries()].filter(([, ns]) => ns.length > 1);
check(
  '同じ答え方になる数字が2つとない',
  collisions.length === 0,
  collisions.map(([k, ns]) => `${k}:${ns.join('/')}`).join(' ')
);

// カードの並び順が変わっても結果が変わらない（順番はランダムでも成立する）
let orderIssues = 0;
for (let n = 1; n <= MAX_NUMBER; n += 1) {
  const picks = answersFor(n);
  const reversed = picks.slice().reverse();
  if (sumOf(reversed) !== n) orderIssues += 1;
}
check('カードを出す順番が変わっても答えは同じ', orderIssues === 0, `${orderIssues} 件`);

// 種明かしに出す内訳
check(
  '内訳が「ある」と答えたカードの重みと一致する',
  [37, 1, 60, 23].every((n) => {
    const parts = partsOf(answersFor(n));
    return parts.reduce((a, b) => a + b, 0) === n && parts.every((p) => BITS.includes(p));
  }),
  `37 → ${partsOf(answersFor(37)).join(' + ')}`
);

// 全部「ない」のときは 0。イントロ側で聞き直す分岐に入る値
check(
  'すべて「ない」なら 0 が返る（聞き直しの合図）',
  sumOf(CARDS.map((c) => ({ bit: c.bit, yes: false }))) === 0
);

console.log('');
console.log('例）37 の答え方:', answersFor(37).map((a) => `${a.bit}:${a.yes ? 'ある' : 'ない'}`).join(' '));
console.log('    → 内訳', partsOf(answersFor(37)).join(' + '), '=', sumOf(answersFor(37)));

console.log('');
if (failures > 0) {
  console.log(`${failures} 件の検証に失敗しました`);
  process.exit(1);
}
console.log('すべての検証に合格しました');
