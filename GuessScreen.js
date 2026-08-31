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

import { CARDS } from './cards';
import { CardFace } from './ui';
import { useTheme } from './ThemeContext';
import { sumOf } from './solve';
import { t } from './i18n';

/**
 * あてっこモード。
 *
 * イントロの ASKING → REVEAL とまったく同じ「アプリが手品をする」体験を、
 * 何度でもループできる形にしたもの。イントロは初回だけの一回きりの流れだが、
 * こちらは子どもが「もう一回！」と繰り返し遊べることを目的にしている。
 *
 * イントロと同じ理由で、ここでも solve.js を import する（＝アプリが答えを
 * 計算する）。ただし本番（PerformanceScreen）からは今までどおり一切 import しない。
 */

const OUT_MS = 240;
const IN_MS = 260;

const PHASE = { ASKING: 'asking', REVEAL: 'reveal' };

export default function GuessScreen({ onExit }) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [phase, setPhase] = useState(PHASE.ASKING);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState([]);
  const [round, setRound] = useState(0);

  const shift = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  const titleIn = useRef(new Animated.Value(0)).current;
  const numberIn = useRef(new Animated.Value(0)).current;
  const tailIn = useRef(new Animated.Value(0)).current;
  const [revealDone, setRevealDone] = useState(false);

  const playAgain = useCallback(() => {
    setPicks([]);
    setIndex(0);
    setRevealDone(false);
    titleIn.setValue(0);
    numberIn.setValue(0);
    tailIn.setValue(0);
    setPhase(PHASE.ASKING);
    setRound((r) => r + 1);
  }, [titleIn, numberIn, tailIn]);

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
  }, [phase, round, titleIn, numberIn, tailIn]);

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
        <BackLink onPress={onExit} styles={styles} />

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

        <Text style={styles.question}>{t('intro.question')}</Text>

        <View style={styles.choices}>
          <Pressable
            onPress={() => answer(true)}
            style={({ pressed }) => [styles.choice, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.choiceText}>{t('common.yes')}</Text>
          </Pressable>
          <Pressable
            onPress={() => answer(false)}
            style={({ pressed }) => [styles.choice, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.choiceText}>{t('common.no')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------------- 言い当てる ---------------- */
  const number = sumOf(picks);

  if (number === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <BackLink onPress={onExit} styles={styles} />
        <View style={styles.introBody}>
          <Text style={styles.introLead}>{t('intro.oops')}</Text>
          <View style={styles.introRule} />
          <Text style={styles.introSub}>{t('intro.allNo1')}</Text>
          <Text style={styles.introSub}>{t('intro.allNo2')}</Text>
          <Text style={styles.introSub}>{t('intro.allNo3')}</Text>
        </View>
        <Pressable
          onPress={playAgain}
          style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.55 }]}
        >
          <Text style={styles.startText}>{t('common.again')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <BackLink onPress={onExit} styles={styles} />

      <View style={styles.revealBody}>
        <Animated.Text style={[styles.revealLead, { opacity: titleIn }]}>
          {t('intro.revealLead')}
        </Animated.Text>

        <Animated.Text
          allowFontScaling={false}
          style={[
            styles.revealNumber,
            {
              opacity: numberIn,
              transform: [
                {
                  scale: numberIn.interpolate({ inputRange: [0, 1], outputRange: [1.07, 1] }),
                },
                {
                  translateY: numberIn.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
                },
              ],
            },
          ]}
        >
          {number}
        </Animated.Text>

        <Animated.Text style={[styles.revealTail, { opacity: tailIn }]}>
          {t('intro.revealTail')}
        </Animated.Text>
      </View>

      {revealDone && (
        <Pressable
          onPress={playAgain}
          style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.55 }]}
        >
          <Text style={styles.startText}>{t('common.again')}</Text>
        </Pressable>
      )}
    </SafeAreaView>
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
      justifyContent: 'center',
    },
    stage: { flex: 1, marginTop: 14 },

    back: {
      position: 'absolute',
      top: 6,
      left: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      zIndex: 2,
    },
    backText: { color: theme.ink, fontSize: 40, lineHeight: 44 },

    introBody: { alignItems: 'center', paddingHorizontal: 24 },
    introLead: { color: theme.ink, fontSize: 22, lineHeight: 38, letterSpacing: 1.5 },
    introRule: {
      width: 56,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.accentFaint,
      marginVertical: 24,
    },
    introSub: { color: theme.inkSoft, fontSize: 16, lineHeight: 26, letterSpacing: 1 },

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

    revealBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    revealLead: { color: theme.inkSoft, fontSize: 17, letterSpacing: 2, marginBottom: 18 },
    revealNumber: {
      color: theme.accent,
      fontSize: 108,
      lineHeight: Math.round(108 * theme.numberLineHeight),
      fontFamily: theme.numberFont,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    revealTail: { color: theme.ink, fontSize: 20, letterSpacing: 3, marginTop: 14 },
  });
}
