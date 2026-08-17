/**
 * 練習の記録。
 *
 * 保存の中身は「練習の成績」だけ。手品の答えは何も残さない。
 * 集計ロジック（recordResult）は副作用のない純粋な関数にしてあり、
 * verify-practice.mjs でそのまま検証している。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "number-in-mind:scores:v1";
const HISTORY_LIMIT = 50;

/** 旧データ（日本語ラベル）→ 安定 ID */
const LEGACY_LIMIT_ID = {
  "自分のペース": "pace",
  "5秒": "5",
  "3秒": "3",
  "2秒": "2",
};

export const EMPTY = {
  streak: 0, // 現在の「全問正解」連続回数
  bestStreak: 0,
  best: {}, // 設定ごとの最速タイム（全問正解したときだけ更新）
  history: [],
};

/** 人数と制限時間 ID の組み合わせを1つのキーにする（言語に依存しない） */
export function keyOf(players, limitId) {
  return `${players}|${limitId}`;
}

function normalizeLimitId(value) {
  if (value == null) return value;
  return LEGACY_LIMIT_ID[value] || value;
}

/** 旧形式の best キー「3人 / 5秒」などを新形式へ */
function migrateState(state) {
  const best = {};
  for (const [k, v] of Object.entries(state.best || {})) {
    const m = /^(\d+)人 \/ (.+)$/.exec(k);
    if (m) {
      best[keyOf(Number(m[1]), normalizeLimitId(m[2]))] = v;
    } else {
      best[k] = v;
    }
  }
  const history = (state.history || []).map((h) => {
    const limitId = normalizeLimitId(h.limitId ?? h.limitLabel);
    return {
      players: h.players,
      limitId,
      hit: h.hit,
      total: h.total,
      seconds: h.seconds,
      at: h.at,
    };
  });
  return { ...state, best, history };
}

/**
 * 1回ぶんの結果を記録に反映する（純粋関数）。
 * @returns {{ state: object, perfect: boolean, isBestTime: boolean }}
 */
export function recordResult(state, run) {
  const { players, limitId, hit, total, seconds, at } = run;
  const perfect = total > 0 && hit === total;
  const key = keyOf(players, limitId);
  const prevBest = state.best[key];
  const isBestTime = perfect && (prevBest == null || seconds < prevBest);
  const streak = perfect ? state.streak + 1 : 0;

  return {
    state: {
      streak,
      bestStreak: Math.max(state.bestStreak ?? 0, streak),
      best: isBestTime ? { ...state.best, [key]: seconds } : state.best,
      history: [
        { players, limitId, hit, total, seconds, at },
        ...state.history,
      ].slice(0, HISTORY_LIMIT),
    },
    perfect,
    isBestTime,
  };
}

export async function load() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return migrateState({ ...EMPTY, ...parsed });
  } catch (e) {
    return EMPTY;
  }
}

export async function save(state) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // 保存に失敗しても練習は続けられるので握りつぶす
  }
}

export async function clear() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // 同上
  }
  return EMPTY;
}
