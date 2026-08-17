/**
 * アプリ全体の状態。
 *
 * - introSeen   … イントロを見た（またはスキップした）か
 * - explainSeen … 種明かしを見つけたか
 * - lastNumber  … イントロで当てた数字。種明かしで「あの数字はこうでした」と使う
 * - paletteId   … 選択中の配色テーマ（theme.js の PALETTES のキー）
 * - fontId      … 選択中の数字フォント（theme.js の FONTS のキー）
 * - keepAwake   … 手品を見せている間、画面を暗くしないか
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_FONT_ID, DEFAULT_PALETTE_ID } from './theme';

const STORAGE_KEY = 'number-in-mind:prefs:v1';

export const DEFAULTS = {
  introSeen: false,
  explainSeen: false,
  lastNumber: null,
  paletteId: DEFAULT_PALETTE_ID,
  fontId: DEFAULT_FONT_ID,
  keepAwake: true,
};

// 直近に読み書きした内容。読み込みを待たずに初期値を出したい画面のために持っておく
let cache = DEFAULTS;

/** 直近の内容を同期で返す。まだ一度も読んでいなければ既定値 */
export function snapshot() {
  return cache;
}

export async function load() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch (e) {
    cache = DEFAULTS;
  }
  return cache;
}

export async function update(patch) {
  const current = await load();
  const next = { ...current, ...patch };
  cache = next;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    // 保存に失敗しても動作には影響しない
  }
  return next;
}

export async function reset() {
  cache = DEFAULTS;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // 同上
  }
  return DEFAULTS;
}
