import React, { useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BITS, MAX_NUMBER } from './cards';
import { useTheme } from './ThemeContext';

/**
 * 種明かし。ロゴをタップすると開く。
 *
 * イントロで当てた数字が残っていればそれを例にする。
 * スキップした人など、数字がない場合は 37 で説明する。
 */

const SAMPLE = 37;

export default function ExplainScreen({ number, onClose, onReplayIntro }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const target = number || SAMPLE;
  const mine = Boolean(number);
  const parts = BITS.filter((bit) => (target & bit) !== 0);
  const binary = target.toString(2);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.eyebrow}>見つけましたね</Text>
        <Text style={styles.title}>種明かし</Text>

        <Text style={styles.big}>「ある」と答えたカードの</Text>
        <Text style={styles.big}>一番左上の数字を</Text>
        <Text style={styles.big}>足していくだけです。</Text>

        <View style={styles.exampleBox}>
          <Text style={styles.exampleLead}>
            {mine ? 'さっきのあなたの答え' : `たとえば ${SAMPLE} を思い浮かべた人の答え`}
          </Text>

          <View style={styles.cardRow}>
            {BITS.map((bit) => {
              const yes = (target & bit) !== 0;
              return (
                <View style={[styles.miniCard, yes && styles.miniCardYes]} key={bit}>
                  <Text style={[styles.miniNumber, yes && styles.miniNumberYes]}>{bit}</Text>
                  <Text style={[styles.miniLabel, yes && styles.miniLabelYes]}>
                    {yes ? 'ある' : 'ない'}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.arrow}>↓</Text>

          <View style={styles.sumRow}>
            {parts.map((bit, i) => (
              <React.Fragment key={bit}>
                {i > 0 ? <Text style={styles.plus}>+</Text> : null}
                <Text style={styles.sumPart}>{bit}</Text>
              </React.Fragment>
            ))}
            <Text style={styles.equals}>=</Text>
            <Text style={styles.answer}>{target}</Text>
          </View>
        </View>

        <Text style={styles.p}>
          カードの左上の数字は、6枚それぞれ 1 / 2 / 4 / 8 / 16 / 32。
          覚える必要はありません。カードに書いてあります。
        </Text>

        <Text style={styles.h}>なぜこれで当たるのか</Text>
        <Text style={styles.p}>
          この 6 つの数字は、いわゆる<Text style={styles.em}>2進数</Text>です。
          1 〜 {MAX_NUMBER} のどんな数字も、この 6 つの足し算で
          <Text style={styles.em}>ただ1通りにしか表せません</Text>。
        </Text>
        <Text style={styles.p}>
          そして各カードには、その数字を作るのにそのカードが必要になる数字だけが載っています。
          だから「ある / ない」の答え方が同じになる数字は 2 つとなく、必ず当たります。
        </Text>
        <Text style={styles.note}>
          {target} は2進数で {binary}。あなたの「ある / ない」は、そのまま この 1 と 0 です。
        </Text>

        <Text style={styles.h}>赤や緑の数字には意味がある？</Text>
        <Text style={styles.p}>
          ありません。相手に法則を探させるための飾りです。
        </Text>

        <View style={styles.closing}>
          <Text style={styles.closingText}>これであなたも同じことができます。</Text>
          <Text style={styles.closingText}>今度はあなたが、誰かの心を読む番です。</Text>
        </View>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.55 }]}
        >
          <Text style={styles.primaryText}>閉じる</Text>
        </Pressable>

        <Pressable
          onPress={onReplayIntro}
          style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.5 }]}
        >
          <Text style={styles.secondaryText}>イントロをもう一度見る</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.backdrop, paddingHorizontal: 36 },
    body: { paddingTop: 34, paddingBottom: 50 },

    eyebrow: { color: theme.accent, fontSize: 12, letterSpacing: 4, textAlign: 'center' },
    title: {
      color: theme.ink,
      fontSize: 26,
      letterSpacing: 6,
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 30,
      marginLeft: 6,
    },

    big: {
      color: theme.ink,
      fontSize: 19,
      lineHeight: 34,
      letterSpacing: 1.5,
      textAlign: 'center',
    },

    exampleBox: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.accentFaint,
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 8,
      marginTop: 26,
      marginBottom: 26,
      alignItems: 'center',
    },
    exampleLead: { color: theme.inkSoft, fontSize: 12, letterSpacing: 1, marginBottom: 16 },

    cardRow: { flexDirection: 'row', justifyContent: 'center' },
    miniCard: {
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.inkWash16,
      borderRadius: 7,
      paddingVertical: 8,
      paddingHorizontal: 4,
      marginHorizontal: 2,
      minWidth: 42,
    },
    miniCardYes: { borderColor: theme.accent, backgroundColor: theme.accentWash12 },
    miniNumber: {
      color: theme.inkFaint,
      fontSize: 17,
      lineHeight: Math.round(17 * theme.numberLineHeight),
      fontFamily: theme.numberFont,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    miniNumberYes: { color: theme.accent },
    miniLabel: { color: theme.inkFaint, fontSize: 10, letterSpacing: 1, marginTop: 4 },
    miniLabelYes: { color: theme.inkSoft },

    arrow: { color: theme.inkFaint, fontSize: 15, marginTop: 12, marginBottom: 6 },

    sumRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
    sumPart: {
      color: theme.accent,
      fontSize: 21,
      lineHeight: Math.round(21 * theme.numberLineHeight),
      fontFamily: theme.numberFont,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    plus: { color: theme.inkSoft, fontSize: 16, marginHorizontal: 7 },
    equals: { color: theme.inkSoft, fontSize: 16, marginHorizontal: 11 },
    answer: {
      color: theme.ink,
      fontSize: 34,
      lineHeight: Math.round(34 * theme.numberLineHeight),
      fontFamily: theme.numberFont,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },

    h: { color: theme.accent, fontSize: 14, letterSpacing: 2, marginTop: 30, marginBottom: 10 },
    p: { color: theme.inkSoft, fontSize: 14, lineHeight: 28, letterSpacing: 0.6 },
    em: { color: theme.ink },
    note: {
      color: theme.inkFaint,
      fontSize: 12,
      lineHeight: 22,
      letterSpacing: 0.5,
      marginTop: 12,
    },

    closing: {
      marginTop: 34,
      paddingTop: 22,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.inkLine,
      alignItems: 'center',
    },
    closingText: { color: theme.ink, fontSize: 14, lineHeight: 26, letterSpacing: 1 },

    primary: {
      alignSelf: 'center',
      marginTop: 30,
      paddingVertical: 14,
      paddingHorizontal: 52,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    primaryText: { color: theme.accent, fontSize: 15, letterSpacing: 4, marginLeft: 4 },
    secondary: { alignSelf: 'center', marginTop: 14, padding: 12 },
    secondaryText: { color: theme.inkFaint, fontSize: 12, letterSpacing: 1 },
  });
}
