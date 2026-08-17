import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CARDS, MAX_NUMBER } from './cards';
import { CardFace } from './ui';
import { useTheme } from './ThemeContext';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLAYER_LABELS,
  TIME_LIMITS,
  breakdown,
  createRound,
  grade,
} from './practice';
import { EMPTY, clear, keyOf, load, recordResult, save } from './scores';

/**
 * 練習モード。
 * アプリが観客役をやるので、演者は複数人ぶんの合計を頭の中で追う訓練ができる。
 */

const PHASE = { SETUP: 'setup', CARDS: 'cards', INPUT: 'input', RESULT: 'result' };

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['del', '0', 'next'],
];

export default function PracticeScreen({ onExit }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [phase, setPhase] = useState(PHASE.SETUP);
  const [players, setPlayers] = useState(3);
  const [limitIndex, setLimitIndex] = useState(0);

  const [round, setRound] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [inputs, setInputs] = useState([]);
  const [focus, setFocus] = useState(0);

  const [scores, setScores] = useState(EMPTY);
  const [run, setRun] = useState(null); // 直近1回の結果

  const startedAt = useRef(0);
  const limitLabel = TIME_LIMITS[limitIndex].label;
  const limit = TIME_LIMITS[limitIndex].seconds;

  useEffect(() => {
    let alive = true;
    load().then((s) => {
      if (alive) setScores(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const start = useCallback(() => {
    setRound(createRound(players));
    setInputs(Array.from({ length: players }, () => ''));
    setFocus(0);
    setCardIndex(0);
    setRun(null);
    startedAt.current = Date.now();
    setPhase(PHASE.CARDS);
  }, [players]);

  const nextCard = useCallback(() => {
    setCardIndex((i) => {
      if (i + 1 >= CARDS.length) {
        setPhase(PHASE.INPUT);
        return i;
      }
      return i + 1;
    });
  }, []);

  // 制限時間つきのときは自動でめくる
  useEffect(() => {
    if (phase !== PHASE.CARDS || limit == null) return undefined;
    const id = setTimeout(nextCard, limit * 1000);
    return () => clearTimeout(id);
  }, [phase, cardIndex, limit, nextCard]);

  const press = useCallback(
    (key) => {
      if (key === 'del') {
        setInputs((prev) => {
          const next = prev.slice();
          next[focus] = (next[focus] || '').slice(0, -1);
          return next;
        });
        return;
      }
      if (key === 'next') {
        setFocus((f) => (f + 1 < inputs.length ? f + 1 : 0));
        return;
      }

      const candidate = `${inputs[focus] ?? ''}${key}`.replace(/^0+/, '');
      if (candidate === '') return;
      const value = Number(candidate);
      if (value < 1 || value > MAX_NUMBER) return;

      const next = inputs.slice();
      next[focus] = candidate;
      setInputs(next);

      // 2桁入れたら確定。1桁でも 7/8/9 は 70 以上になれないのでその場で確定
      const cannotGrow = candidate.length >= 2 || value * 10 > MAX_NUMBER;
      if (cannotGrow && focus + 1 < next.length) setFocus(focus + 1);
    },
    [inputs, focus]
  );

  const submit = useCallback(() => {
    const seconds = (Date.now() - startedAt.current) / 1000;
    const results = grade(round.targets, inputs);
    const hit = results.filter((r) => r.correct).length;

    const outcome = recordResult(scores, {
      players,
      limitLabel,
      hit,
      total: results.length,
      seconds,
      at: Date.now(),
    });

    setScores(outcome.state);
    save(outcome.state);
    setRun({ results, hit, seconds, perfect: outcome.perfect, isBestTime: outcome.isBestTime });
    setPhase(PHASE.RESULT);
  }, [round, inputs, scores, players, limitLabel]);

  const resetScores = useCallback(() => {
    clear().then(setScores);
  }, []);

  /* ---------------- 設定 ---------------- */
  if (phase === PHASE.SETUP) {
    const best = scores.best[keyOf(players, limitLabel)];
    return (
      <SafeAreaView style={styles.root}>
        <BackLink onPress={onExit} styles={styles} />
        <ScrollView contentContainerStyle={styles.setupBody}>
          <Text style={styles.h1}>練習</Text>
          <Text style={styles.note}>
            アプリが観客役をやります。カードごとに全員の「ある / ない」が出るので、
            頭の中で人数ぶんの合計を同時に追ってください。
          </Text>

          <Text style={styles.label}>人数</Text>
          <View style={styles.chipRow}>
            {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS).map(
              (n) => (
                <Chip key={n} active={players === n} onPress={() => setPlayers(n)} styles={styles}>
                  {`${n}人`}
                </Chip>
              )
            )}
          </View>

          <Text style={styles.label}>1枚あたりの時間</Text>
          <View style={styles.chipRow}>
            {TIME_LIMITS.map((t, i) => (
              <Chip key={t.label} active={limitIndex === i} onPress={() => setLimitIndex(i)} styles={styles}>
                {t.label}
              </Chip>
            ))}
          </View>

          <View style={styles.record}>
            <View style={styles.recordCell}>
              <Text style={styles.recordValue}>{scores.streak}</Text>
              <Text style={styles.recordCaption}>全問正解 連続</Text>
            </View>
            <View style={styles.recordDivider} />
            <View style={styles.recordCell}>
              <Text style={styles.recordValue}>{scores.bestStreak}</Text>
              <Text style={styles.recordCaption}>連続の最高</Text>
            </View>
            <View style={styles.recordDivider} />
            <View style={styles.recordCell}>
              <Text style={styles.recordValue}>{best == null ? '–' : best.toFixed(1)}</Text>
              <Text style={styles.recordCaption}>この設定のベスト秒</Text>
            </View>
          </View>

          <Pressable
            onPress={start}
            style={({ pressed }) => [styles.primary, pressed && { opacity: 0.55 }]}
          >
            <Text style={styles.primaryText}>はじめる</Text>
          </Pressable>

          {scores.history.length > 0 ? (
            <>
              <Text style={styles.label}>直近の記録</Text>
              {scores.history.slice(0, 5).map((h, i) => (
                <View style={styles.historyRow} key={`${h.at}-${i}`}>
                  <Text style={styles.historyLeft}>{keyOf(h.players, h.limitLabel)}</Text>
                  <Text
                    style={[
                      styles.historyRight,
                      h.hit === h.total && { color: theme.accent },
                    ]}
                  >
                    {h.hit}/{h.total} ・ {h.seconds.toFixed(1)}秒
                  </Text>
                </View>
              ))}
              <Pressable
                onPress={resetScores}
                style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.5 }]}
              >
                <Text style={styles.clearText}>記録を消す</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ---------------- カード提示 ---------------- */
  if (phase === PHASE.CARDS) {
    const answers = round.answers[cardIndex];
    return (
      <SafeAreaView style={styles.root}>
        <Pressable style={styles.fill} onPress={limit == null ? nextCard : undefined}>
          <View style={styles.stage}>
            <CardFace card={CARDS[cardIndex]} />
          </View>

          <View style={styles.answerBar}>
            {answers.map((yes, i) => (
              <View style={styles.answerCell} key={PLAYER_LABELS[i]}>
                <Text style={styles.answerName}>{PLAYER_LABELS[i]}</Text>
                <Text style={[styles.answerValue, yes ? styles.answerYes : styles.answerNo]}>
                  {yes ? 'ある' : 'ない'}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.progress}>
            {CARDS.map((c, i) => (
              <View
                key={c.bit}
                style={[styles.progressDot, i <= cardIndex && { backgroundColor: theme.accent }]}
              />
            ))}
          </View>
        </Pressable>
      </SafeAreaView>
    );
  }

  /* ---------------- 回答入力 ---------------- */
  if (phase === PHASE.INPUT) {
    const filled = inputs.every((v) => v !== '');
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.h2}>それぞれの数字は？</Text>

        <View style={styles.slotRow}>
          {inputs.map((v, i) => (
            <Pressable
              key={PLAYER_LABELS[i]}
              onPress={() => setFocus(i)}
              style={[styles.slot, focus === i && styles.slotActive]}
            >
              <Text style={styles.slotName}>{PLAYER_LABELS[i]}</Text>
              <Text style={styles.slotValue}>{v || '–'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.keypad}>
          {KEYPAD.map((row, r) => (
            <View style={styles.keyRow} key={`k${r}`}>
              {row.map((k) => (
                <Pressable
                  key={k}
                  onPress={() => press(k)}
                  style={({ pressed }) => [
                    styles.key,
                    k === 'next' && styles.keyNext,
                    pressed && { opacity: 0.5 },
                  ]}
                >
                  <Text style={[styles.keyText, k === 'next' && styles.keyNextText]}>
                    {k === 'del' ? '⌫' : k === 'next' ? '次の人' : k}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}

          <Pressable
            disabled={!filled}
            onPress={submit}
            style={({ pressed }) => [
              styles.submit,
              !filled && { opacity: 0.25 },
              pressed && filled && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.submitText}>採点</Text>
          </Pressable>
        </View>

        <Text style={styles.inputHint}>2桁入れると自動で次の人へ移ります</Text>
      </SafeAreaView>
    );
  }

  /* ---------------- 採点 ---------------- */
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.resultBody}>
        <Text style={styles.h1}>
          {run.hit} / {run.results.length} 正解
        </Text>
        <Text style={styles.note}>
          {run.seconds.toFixed(1)} 秒 ・ {keyOf(players, limitLabel)}
        </Text>

        <View style={styles.badgeRow}>
          {run.isBestTime ? <Badge styles={styles}>自己ベスト</Badge> : null}
          {run.perfect && scores.streak > 1 ? (
            <Badge styles={styles}>{scores.streak} 連続 全問正解</Badge>
          ) : null}
        </View>

        {run.results.map((r) => (
          <View style={styles.resultRow} key={r.player}>
            <Text style={[styles.resultMark, { color: r.correct ? theme.accent : theme.no === theme.accent ? theme.accent : '#FF6A5E' }]}>
              {r.correct ? '○' : '×'}
            </Text>
            <Text style={styles.resultName}>{r.player}</Text>
            <View style={styles.resultNumbers}>
              <Text style={styles.resultTarget}>{r.target}</Text>
              <Text style={styles.resultBreakdown}>{breakdown(r.target).join(' + ')}</Text>
            </View>
            {!r.correct ? <Text style={styles.resultYours}>あなた {r.value ?? '–'}</Text> : null}
          </View>
        ))}

        <Pressable
          onPress={start}
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.55 }]}
        >
          <Text style={styles.primaryText}>もう一度</Text>
        </Pressable>
        <Pressable
          onPress={() => setPhase(PHASE.SETUP)}
          style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.5 }]}
        >
          <Text style={styles.secondaryText}>設定を変える</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ active, onPress, children, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{children}</Text>
    </Pressable>
  );
}

function Badge({ children, styles }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

function BackLink({ onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={20}
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.4 }]}
    >
      <Text style={styles.backText}>‹</Text>
    </Pressable>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.backdrop,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    fill: { flex: 1 },
    stage: { flex: 1 },

    back: {
      position: 'absolute',
      top: 6,
      left: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      zIndex: 2,
    },
    backText: { color: theme.inkFaint, fontSize: 30, lineHeight: 34 },

    h1: { color: theme.ink, fontSize: 26, letterSpacing: 3, textAlign: 'center', marginBottom: 10 },
    h2: {
      color: theme.ink,
      fontSize: 20,
      letterSpacing: 2,
      textAlign: 'center',
      marginTop: 18,
      marginBottom: 4,
    },
    note: {
      color: theme.inkSoft,
      fontSize: 13,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 14,
    },
    label: {
      color: theme.accent,
      fontSize: 12,
      letterSpacing: 3,
      marginBottom: 10,
      marginTop: 18,
      textAlign: 'center',
    },

    setupBody: { paddingTop: 44, paddingBottom: 40 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.accentFaint,
      borderRadius: 999,
      paddingVertical: 9,
      paddingHorizontal: 18,
      margin: 4,
    },
    chipActive: { borderColor: theme.accent, backgroundColor: theme.accentWash14 },
    chipText: { color: theme.inkSoft, fontSize: 14, letterSpacing: 1 },
    chipTextActive: { color: theme.ink },

    /* 記録 */
    record: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 30,
      paddingVertical: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.inkLine,
    },
    recordCell: { flex: 1, alignItems: 'center' },
    recordDivider: {
      width: StyleSheet.hairlineWidth,
      height: 30,
      backgroundColor: theme.inkLine,
    },
    recordValue: {
      color: theme.ink,
      fontSize: 24,
      lineHeight: Math.round(24 * theme.numberLineHeight),
      fontFamily: theme.numberFont,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    recordCaption: { color: theme.inkFaint, fontSize: 10, letterSpacing: 1, marginTop: 4 },

    historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    historyLeft: { color: theme.inkSoft, fontSize: 12, letterSpacing: 1 },
    historyRight: { color: theme.inkSoft, fontSize: 12, letterSpacing: 1 },
    clearText: { color: theme.inkFaint, fontSize: 12, letterSpacing: 2 },

    primary: {
      alignSelf: 'center',
      marginTop: 34,
      paddingVertical: 15,
      paddingHorizontal: 52,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    primaryText: { color: theme.accent, fontSize: 16, letterSpacing: 4, marginLeft: 4 },
    secondary: { alignSelf: 'center', marginTop: 16, padding: 12 },
    secondaryText: { color: theme.inkSoft, fontSize: 14, letterSpacing: 2 },

    /* 回答バー */
    answerBar: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
    answerCell: { alignItems: 'center', minWidth: 62, paddingHorizontal: 4 },
    answerName: { color: theme.accent, fontSize: 11, letterSpacing: 2, marginBottom: 3 },
    answerValue: { fontSize: 20, letterSpacing: 1, fontWeight: '600' },
    answerYes: { color: theme.yes },
    answerNo: { color: theme.no },

    progress: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, marginBottom: 2 },
    progressDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      marginHorizontal: 4,
      backgroundColor: theme.accentWash22,
    },

    /* 入力 */
    slotRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginVertical: 18 },
    slot: {
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.accentFaint,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      margin: 4,
      minWidth: 60,
    },
    slotActive: { borderColor: theme.accent, backgroundColor: theme.accentWash12 },
    slotName: { color: theme.accent, fontSize: 11, letterSpacing: 2 },
    slotValue: {
      color: theme.ink,
      fontSize: 28,
      lineHeight: Math.round(28 * theme.numberLineHeight),
      fontFamily: theme.numberFont,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },

    keypad: { marginTop: 'auto' },
    keyRow: { flexDirection: 'row' },
    key: {
      flex: 1,
      margin: 5,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.inkWash05,
    },
    keyText: {
      color: theme.ink,
      fontSize: 24,
      lineHeight: Math.round(24 * theme.numberLineHeight),
      fontFamily: theme.numberFont,
      fontWeight: '600',
    },
    keyNext: { backgroundColor: theme.inkWash05 },
    keyNextText: { color: theme.inkSoft, fontSize: 14, letterSpacing: 1, fontWeight: '400' },

    submit: {
      marginHorizontal: 5,
      marginTop: 8,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: theme.accentWash18,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    submitText: { color: theme.accent, fontSize: 17, letterSpacing: 4, marginLeft: 4 },
    inputHint: {
      color: theme.inkFaint,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 10,
      letterSpacing: 0.5,
    },

    /* 採点 */
    resultBody: { paddingTop: 30, paddingBottom: 40 },
    badgeRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 },
    badge: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.accent,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 14,
      margin: 4,
    },
    badgeText: { color: theme.accent, fontSize: 11, letterSpacing: 2 },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.inkLine,
      paddingVertical: 14,
      paddingHorizontal: 8,
    },
    resultMark: { fontSize: 20, width: 28 },
    resultName: { color: theme.accent, fontSize: 13, letterSpacing: 2, width: 26 },
    resultNumbers: { flex: 1 },
    resultTarget: {
      color: theme.ink,
      fontSize: 26,
      lineHeight: Math.round(26 * theme.numberLineHeight),
      fontFamily: theme.numberFont,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    resultBreakdown: { color: theme.inkSoft, fontSize: 12, letterSpacing: 1, marginTop: 2 },
    resultYours: { color: '#FF6A5E', fontSize: 12, letterSpacing: 1 },
  });
}
