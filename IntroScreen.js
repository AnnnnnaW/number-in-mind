import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { CARDS, MAX_NUMBER } from './cards';
import { CardFace } from './ui';
import { useTheme } from './ThemeContext';
import { sumOf } from './solve';

/**
 * イントロ。初回起動のときだけ出る。
 *
 * ここではアプリのほうが手品をする。使う人自身が「読まれる側」を一度体験してから、
 * 種明かしを探しに行く、という流れ。
 *
 * 仕組みを知っている人のために、最初の画面からスキップできる。
 */

const OUT_MS = 240;
const IN_MS = 260;

const PHASE = { WELCOME: 'welcome', ASKING: 'asking', REVEAL: 'reveal', TEASE: 'tease' };

export default function IntroScreen({ onFinish, onSkip }) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [phase, setPhase] = useState(PHASE.WELCOME);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState([]);

  const shift = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  // 種明かしの演出用
  const titleIn = useRef(new Animated.Value(0)).current;
  const numberIn = useRef(new Animated.Value(0)).current;
  const tailIn = useRef(new Animated.Value(0)).current;
  const [revealDone, setRevealDone] = useState(false);

  const answer = useCallback(
    (yes) => {
      if (busy.current) return;
      busy.current = true;
      const card = CARDS[index];

      Animated.timing(shift, {
        toValue: -1,
        duration: OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        const nextPicks = [...picks, { bit: card.bit, yes }];
        setPicks(nextPicks);

        if (index + 1 >= CARDS.length) {
          setPhase(PHASE.REVEAL);
          shift.setValue(0);
          busy.current = false;
          return;
        }

        setIndex(index + 1);
        shift.setValue(1);
        Animated.timing(shift, {
          toValue: 0,
          duration: IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          busy.current = false;
        });
      });
    },
    [index, picks, shift]
  );

  // 「あなたが思い浮かべたのは」→ 数字 → 「ですね？」の順に出す
  useEffect(() => {
    if (phase !== PHASE.REVEAL) return undefined;
    const anim = Animated.sequence([
      Animated.delay(500),
      Animated.timing(titleIn, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(1100),
      // バネで跳ねさせず、ゆっくり滲み出させる。
      // わずかに大きい状態から等倍へ沈み込むので、飛び出さずに「像を結ぶ」感じになる
      Animated.timing(numberIn, {
        toValue: 1,
        duration: 1700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(600),
      Animated.timing(tailIn, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    anim.start(() => setRevealDone(true));
    return () => anim.stop();
  }, [phase, titleIn, numberIn, tailIn]);

  /* ---------------- はじめの説明 ---------------- */
  if (phase === PHASE.WELCOME) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.introBody}>
          <Text style={styles.introSmall}>はじめまして</Text>
          <View style={styles.introRule} />
          <Text style={styles.introLead}>1 〜 {MAX_NUMBER} の中から</Text>
          <Text style={styles.introLead}>好きな数字をひとつ</Text>
          <Text style={styles.introLead}>思い浮かべてください</Text>
          <View style={styles.introRule} />
          <Text style={styles.introSub}>{CARDS.length} 枚のカードをお見せします</Text>
          <Text style={styles.introSub}>その数字があれば「ある」</Text>
          <Text style={styles.introSub}>なければ「ない」を押してください</Text>
        </View>

        <Pressable
          onPress={() => setPhase(PHASE.ASKING)}
          style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.55 }]}
        >
          <Text style={styles.startText}>はじめる</Text>
        </Pressable>

        <Pressable
          onPress={onSkip}
          hitSlop={16}
          style={({ pressed }) => [styles.skip, pressed && { opacity: 0.4 }]}
        >
          <Text style={styles.skipText}>仕組みを知っているのでスキップ</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  /* ---------------- 質問中 ---------------- */
  if (phase === PHASE.ASKING) {
    const translateX = shift.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [-width * 1.05, 0, width * 1.05],
    });
    const opacity = shift.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 1, 0],
    });

    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.stage}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity, transform: [{ translateX }] }]}>
            <CardFace card={CARDS[index]} />
          </Animated.View>
        </View>

        <View style={styles.dots}>
          {CARDS.map((c, i) => (
            <View key={c.bit} style={[styles.dot, i <= index && styles.dotOn]} />
          ))}
        </View>

        <Text style={styles.question}>この中にありますか？</Text>

        <View style={styles.choices}>
          <Pressable
            onPress={() => answer(true)}
            style={({ pressed }) => [styles.choice, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.choiceText}>ある</Text>
          </Pressable>
          <Pressable
            onPress={() => answer(false)}
            style={({ pressed }) => [styles.choice, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.choiceText}>ない</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------------- 言い当てる ---------------- */
  const number = sumOf(picks);

  if (phase === PHASE.REVEAL) {
    // 0 を思い浮かべることはできないので、全部「ない」なら聞き直す
    if (number === 0) {
      return (
        <SafeAreaView style={styles.root}>
          <View style={styles.introBody}>
            <Text style={styles.introLead}>おや</Text>
            <View style={styles.introRule} />
            <Text style={styles.introSub}>すべて「ない」と答えられると</Text>
            <Text style={styles.introSub}>さすがに分かりません</Text>
            <Text style={styles.introSub}>もう一度お願いします</Text>
          </View>
          <Pressable
            onPress={() => {
              setPicks([]);
              setIndex(0);
              setPhase(PHASE.ASKING);
            }}
            style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.55 }]}
          >
            <Text style={styles.startText}>もう一度</Text>
          </Pressable>
        </SafeAreaView>
      );
    }

    return (
      <Pressable
        style={styles.root}
        onPress={() => revealDone && setPhase(PHASE.TEASE)}
        disabled={!revealDone}
      >
        <SafeAreaView style={styles.revealBody}>
          <Animated.Text style={[styles.revealLead, { opacity: titleIn }]}>
            あなたが思い浮かべたのは
          </Animated.Text>

          <Animated.Text
            allowFontScaling={false}
            style={[
              styles.revealNumber,
              {
                opacity: numberIn,
                transform: [
                  {
                    scale: numberIn.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.07, 1],
                    }),
                  },
                  {
                    translateY: numberIn.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {number}
          </Animated.Text>

          <Animated.Text style={[styles.revealTail, { opacity: tailIn }]}>ですね？</Animated.Text>

          <Animated.Text style={[styles.revealHint, { opacity: tailIn }]}>
            画面をタップ
          </Animated.Text>
        </SafeAreaView>
      </Pressable>
    );
  }

  /* ---------------- 誘導 ---------------- */
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.introBody}>
        <Text style={styles.teaseLead}>なぜ、あなたの数字が分かったのか？</Text>
        <View style={styles.introRule} />
        <Text style={styles.teaseSub}>その秘密は、このアプリの中に隠されています。</Text>
        <Text style={styles.teaseSub}>秘密を解き明かしたら、</Text>
        <Text style={styles.teaseSub}>今度はあなたが誰かの数字を当ててみましょう。</Text>
      </View>

      <Pressable
        onPress={() => onFinish(number)}
        style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.55 }]}
      >
        <Text style={styles.startText}>探す</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.backdrop,
      paddingHorizontal: 12,
      paddingVertical: 10,
      justifyContent: 'center',
    },
    stage: { flex: 1, marginTop: 14 },

    introBody: { alignItems: 'center', paddingHorizontal: 24 },
    introSmall: { color: theme.accent, fontSize: 13, letterSpacing: 5 },
    introLead: { color: theme.ink, fontSize: 22, lineHeight: 38, letterSpacing: 1.5 },
    introRule: {
      width: 56,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.accentFaint,
      marginVertical: 24,
    },
    introSub: { color: theme.inkSoft, fontSize: 14, lineHeight: 26, letterSpacing: 1 },

    startButton: {
      alignSelf: 'center',
      marginTop: 46,
      paddingVertical: 15,
      paddingHorizontal: 54,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    startText: { color: theme.accent, fontSize: 16, letterSpacing: 5, marginLeft: 5 },

    skip: { position: 'absolute', bottom: 26, left: 0, right: 0, alignItems: 'center', padding: 10 },
    skipText: { color: theme.inkFaint, fontSize: 12, letterSpacing: 1 },

    dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      marginHorizontal: 4,
      backgroundColor: theme.accentWash22,
    },
    dotOn: { backgroundColor: theme.accent },

    question: { color: theme.ink, fontSize: 17, letterSpacing: 2, textAlign: 'center', marginTop: 18 },
    choices: { flexDirection: 'row', justifyContent: 'center', marginTop: 14, marginBottom: 6 },
    choice: {
      flex: 1,
      marginHorizontal: 6,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.inkWash30,
    },
    choiceText: { color: theme.ink, fontSize: 20, letterSpacing: 4, marginLeft: 4 },

    /* 言い当てる */
    revealBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    revealLead: { color: theme.inkSoft, fontSize: 17, letterSpacing: 2, marginBottom: 18 },
    revealNumber: {
      color: theme.accent,
      fontSize: 108,
      lineHeight: 128,
      fontFamily: theme.numberFont,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    revealTail: { color: theme.ink, fontSize: 20, letterSpacing: 3, marginTop: 14 },
    revealHint: {
      position: 'absolute',
      bottom: 30,
      color: theme.inkFaint,
      fontSize: 12,
      letterSpacing: 2,
    },

    /* 誘導 */
    teaseLead: {
      color: theme.ink,
      fontSize: 19,
      lineHeight: 32,
      letterSpacing: 1,
      textAlign: 'center',
    },
    teaseSub: {
      color: theme.inkSoft,
      fontSize: 15,
      lineHeight: 30,
      letterSpacing: 0.8,
      textAlign: 'center',
    },
  });
}
