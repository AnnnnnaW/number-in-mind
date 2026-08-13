/**
 * 練習モードのロジック。
 *
 * ここには「答えを計算する処理」が入っている。
 * 本番（PerformanceScreen）からは一切 import しない。
 * 手品の最中に答えが計算されることは絶対にない、という境界をファイルで引いている。
 */

import { CARDS, MAX_NUMBER } from './cards';

export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 5;
export const PLAYER_LABELS = ['A', 'B', 'C', 'D', 'E'];

/** 制限時間の選択肢（秒）。null は無制限 */
export const TIME_LIMITS = [
  { label: '自分のペース', seconds: null },
  { label: '5秒', seconds: 5 },
  { label: '3秒', seconds: 3 },
  { label: '2秒', seconds: 2 },
];

/**
 * 観客役を playerCount 人ぶん用意する。
 *
 * @returns {{
 *   targets: number[],              // 各人が思い浮かべた数字（採点まで見せない）
 *   answers: boolean[][]            // answers[カード番号][人] = 「ある」なら true
 * }}
 */
export function createRound(playerCount, random = Math.random) {
  const targets = Array.from(
    { length: playerCount },
    () => 1 + Math.floor(random() * MAX_NUMBER)
  );

  const answers = CARDS.map((card) => targets.map((t) => (t & card.bit) !== 0));

  return { targets, answers };
}

/**
 * 入力を採点する。inputs は文字列でも数値でもよい。
 */
export function grade(targets, inputs) {
  return targets.map((target, i) => {
    const value = inputs[i] === '' || inputs[i] == null ? null : Number(inputs[i]);
    return { player: PLAYER_LABELS[i], target, value, correct: value === target };
  });
}

/**
 * 演者が本来やるべき計算。採点結果の解説に使う。
 * 「ある」と答えたカードの重みを並べる。
 */
export function breakdown(target) {
  return CARDS.filter((card) => (target & card.bit) !== 0).map((card) => card.bit);
}
