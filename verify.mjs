/**
 * 検証スクリプト: node verify.mjs
 *
 * cards.js の中身をそのまま読み込んで実行し、
 * 6枚のカードで 1〜60 が一意に表現できることを機械的に確かめる。
 */
import fs from 'node:fs';

const src = fs.readFileSync(new URL('./cards.js', import.meta.url), 'utf8');
const factory = new Function(
  `${src.replace(/^export /gm, '')}
   return { MAX_NUMBER, BITS, COLUMNS, CARDS, ROWS, buildCards, ACCENT_PER_CARD, ACCENT_COLORS };`
);
const { MAX_NUMBER, BITS, COLUMNS, CARDS, ROWS, ACCENT_PER_CARD } = factory();

let failures = 0;
const check = (label, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`);
  if (!ok) failures += 1;
};

// 1. 枚数
check('カードは6枚', CARDS.length === 6, `${CARDS.length}枚`);

// 2. 各カードの重みと先頭の数字が一致する（＝左上の数字がそのカードの値）
check(
  '各カードの左上の数字＝そのカードの重み',
  CARDS.every((c) => c.numbers[0] === c.bit),
  CARDS.map((c) => `${c.bit}→${c.numbers[0]}`).join(' ')
);

// 3. YES/NO の全パターン（2^6）から復元した数字が一意で、1〜60を過不足なく覆う
const restored = new Map();
for (let pattern = 0; pattern < 1 << CARDS.length; pattern += 1) {
  let sum = 0;
  CARDS.forEach((card, i) => {
    if (pattern & (1 << i)) sum += card.bit;
  });
  if (sum >= 1 && sum <= MAX_NUMBER) {
    if (restored.has(sum)) restored.set(sum, restored.get(sum) + 1);
    else restored.set(sum, 1);
  }
}
check(
  '1〜60 のすべてが復元できる',
  Array.from({ length: MAX_NUMBER }, (_, i) => i + 1).every((n) => restored.has(n)),
  `復元できた数字 ${restored.size} 個`
);
check(
  '同じ数字を生む YES/NO パターンが重複しない（一意性）',
  Array.from(restored.values()).every((count) => count === 1)
);

// 4. 逆向きの確認: 各数字が載っているカードの重みの合計＝その数字
const wrong = [];
for (let n = 1; n <= MAX_NUMBER; n += 1) {
  const sum = CARDS.filter((c) => c.numbers.includes(n)).reduce((a, c) => a + c.bit, 0);
  if (sum !== n) wrong.push(`${n}→${sum}`);
}
check('各数字が載っているカードの重みの合計＝その数字', wrong.length === 0, wrong.join(' '));

// 5. グリッドに収まるか
check(
  `${COLUMNS}列 × ${ROWS}行 のグリッドに全数字が収まる`,
  CARDS.every((c) => c.numbers.length <= COLUMNS * ROWS),
  CARDS.map((c) => `${c.bit}のカード:${c.numbers.length}個`).join(' / ')
);

// 6. 昇順であること
check('カード内の数字は昇順', CARDS.every((c) => c.numbers.every((n, i) => i === 0 || n > c.numbers[i - 1])));

// 7. カードの順番が 1,2,4,8,16,32
check('カードの順番は 1→2→4→8→16→32', CARDS.map((c) => c.bit).join(',') === BITS.join(','));

/* ---- 色のギミック（答えと無関係であることの確認）---- */

// 8. 色つきの個数
check(
  `色つきの数字は各カード ${ACCENT_PER_CARD} 個`,
  CARDS.every((c) => c.accents.size === ACCENT_PER_CARD),
  CARDS.map((c) => `${c.bit}:${c.accents.size}`).join(' ')
);

// 9. 左上（＝そのカードの重み＝演者が読む数字）には絶対に色をつけない
check(
  '左上の数字（＝重み）は必ず白のまま',
  CARDS.every((c) => !c.accents.has(c.bit)),
  CARDS.filter((c) => c.accents.has(c.bit)).map((c) => c.bit).join(' ')
);

// 10. 奇数枚目＝赤 / 偶数枚目＝緑
check(
  '奇数枚目は赤・偶数枚目は緑',
  CARDS.every((c, i) => c.color === (i % 2 === 0 ? 'red' : 'green')),
  CARDS.map((c) => `${c.bit}:${c.color}`).join(' ')
);

// 11. 「色つきだけを足す」「色つきの個数を数える」等では答えに到達できない
//     ＝色は答えの情報を一切持っていない（ミスディレクションとして成立する）
const accentSum = CARDS.reduce((a, c) => a + [...c.accents].reduce((x, y) => x + y, 0), 0);
check(
  '色つきの数字の合計が 1〜60 のどれかに一致しない（偶然の意味づけを避ける）',
  accentSum > MAX_NUMBER,
  `合計 ${accentSum}`
);
const accentedOnEveryCard = [];
for (let n = 1; n <= MAX_NUMBER; n += 1) {
  const on = CARDS.filter((c) => c.numbers.includes(n));
  if (on.length > 1 && on.every((c) => c.accents.has(n))) accentedOnEveryCard.push(n);
}
check(
  '「載っているカードすべてで色つき」になる数字がない（単純な法則に見えない）',
  accentedOnEveryCard.length === 0,
  accentedOnEveryCard.join(' ')
);

// 12. 何度実行しても同じ配色（＝繰り返し見せても矛盾しない）
const again = factory().CARDS;
check(
  '配色は毎回同じ（乱数ではない）',
  again.every((c, i) => [...c.accents].join(',') === [...CARDS[i].accents].join(','))
);

console.log('');
CARDS.forEach((c) => {
  const mark = c.color === 'red' ? '赤' : '緑';
  const line = c.numbers.map((n) => (c.accents.has(n) ? `[${n}]` : `${n}`)).join(' ');
  console.log(`【${c.bit}のカード】(${c.numbers.length}個 / 色つき=${mark}) ${line}`);
});

console.log('');
if (failures > 0) {
  console.log(`${failures} 件の検証に失敗しました`);
  process.exit(1);
}
console.log('すべての検証に合格しました');
