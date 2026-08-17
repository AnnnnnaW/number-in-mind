/**
 * 「ある」と答えたカードから数字を割り出す。
 *
 * 使うのはイントロ（アプリが一度だけ手品をして見せる）と、
 * 種明かしの画面だけ。
 *
 * 通常モード（PerformanceScreen）と裏返しモード（FlipScreen）は
 * このファイルを import していない。手品の最中にアプリが答えを知ることはない。
 */

import { CARDS } from './cards';

/** picks は [{ bit, yes }] の配列 */
export function sumOf(picks) {
  return picks.reduce((total, p) => total + (p.yes ? p.bit : 0), 0);
}

/** 「ある」と答えたカードの重みだけを並べる（種明かしの内訳表示に使う） */
export function partsOf(picks) {
  return picks.filter((p) => p.yes).map((p) => p.bit);
}

/** ある数字を思い浮かべた人が返すはずの答え（検証用） */
export function answersFor(target) {
  return CARDS.map((card) => ({ bit: card.bit, yes: (target & card.bit) !== 0 }));
}
