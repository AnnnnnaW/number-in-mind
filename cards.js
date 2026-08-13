/**
 * 数字当てカードの中身を生成する。
 *
 * 各カードは 1 / 2 / 4 / 8 / 16 / 32 という「重み」を持ち、
 * そのビットが立っている数字だけを載せる。
 * 相手が「ある」と答えたカードの重みを足すと、思い浮かべた数字になる。
 *
 * 数字はハードコードせず、すべてここで計算する。
 */

export const MAX_NUMBER = 60;

export const BITS = [1, 2, 4, 8, 16, 32];

/** 1行あたりに並べる数字の個数 */
export const COLUMNS = 4;

/**
 * @param {number} max  最大の数字（1〜max を対象にする）
 * @param {number[]} bits カードの重みの一覧
 * @returns {{bit:number, numbers:number[]}[]}
 */
export function buildCards(max = MAX_NUMBER, bits = BITS) {
  return bits.map((bit) => {
    const numbers = [];
    for (let n = 1; n <= max; n += 1) {
      if ((n & bit) !== 0) numbers.push(n);
    }
    return { bit, numbers };
  });
}

/* ------------------------------------------------------------------ *
 * 色のギミック（＝ミスディレクション）
 *
 * 相手に「色に意味がある」と錯覚させるためだけの飾り。
 * 手品の答えとは一切関係がない。
 *
 * - 奇数枚目のカード（1 / 4 / 16）… 一部の数字が赤
 * - 偶数枚目のカード（2 / 8 / 32）… 一部の数字が緑
 *
 * どの数字を塗るかは「カードの重み × 数字」から決まる固定のハッシュ順で選ぶ。
 * 規則性が読み取れないので、相手はいつまでも法則を探し続ける。
 * 毎回同じ配色になるので、繰り返し見せても矛盾しない。
 * ------------------------------------------------------------------ */

/** 1枚あたりに色をつける数字の個数 */
export const ACCENT_PER_CARD = 7;

export const ACCENT_COLORS = {
  red: '#FF6A5E',
  green: '#4FE0A8',
};

/** 見た目がバラバラになる固定ハッシュ（乱数ではないので毎回同じ結果） */
function scramble(bit, n) {
  let h = (n * 2654435761 + bit * 40503 + 0x9e37) >>> 0;
  h ^= h >>> 13;
  h = (h * 1274126177) >>> 0;
  h ^= h >>> 16;
  return h;
}

/**
 * カードごとに色をつける数字を決める。
 * 左上の数字（＝そのカードの重み）は必ず白のまま残す。
 * 演者が読む数字に色がつかないので、色と答えが結びつく余地がない。
 */
export function withAccents(cards) {
  // 各カードごとに「色をつける優先順位」を固定ハッシュで並べる
  const ranked = cards.map((card) =>
    card.numbers
      .slice(1) // 左上（＝重み）は除外
      .slice()
      .sort((a, b) => scramble(card.bit, a) - scramble(card.bit, b))
  );

  // ある数字が「載っているカードすべてで色つき」になると
  // 「色 ＝ その数字の印」という単純な法則に見えてしまう。
  // そこで、各数字に色をつけられるのは（載っている枚数 − 1）枚までに制限する。
  // どの数字も必ず「色がついていないカード」を1枚以上持つので、法則が成立しない。
  const cardCount = (n) => cards.filter((c) => (n & c.bit) !== 0).length;
  const used = new Map();

  const chosen = ranked.map((list) => {
    const picked = [];
    for (const n of list) {
      if (picked.length >= ACCENT_PER_CARD) break;
      const already = used.get(n) || 0;
      if (already >= cardCount(n) - 1) continue;
      used.set(n, already + 1);
      picked.push(n);
    }
    return picked;
  });

  return cards.map((card, i) => ({
    ...card,
    color: i % 2 === 0 ? 'red' : 'green',
    accents: new Set(chosen[i].slice().sort((a, b) => a - b)),
  }));
}

export const CARDS = withAccents(buildCards());

/** グリッドの行数（すべてのカードで同じ行数になるよう最大値で揃える） */
export const ROWS = Math.ceil(
  CARDS.reduce((max, card) => Math.max(max, card.numbers.length), 0) / COLUMNS
);
