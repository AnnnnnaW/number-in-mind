import React, { useMemo, useState } from 'react';
import {
  Animated,
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
import { useCardReveal } from './useCardReveal';
import { AllNoRetry } from './AllNoRetry';
import { t } from './i18n';

/**
 * イントロ。初回起動のときだけ出る。
 *
 * ここではアプリのほうが手品をする。使う人自身が「読まれる側」を一度体験してから、
 * 種明かしを探しに行く、という流れ。
 *
 * 仕組みを知っている人のために、最初の画面からスキップできる。
 *
 * カードを見せて当てる部分（GUESSING）のロジックは useCardReveal に切り出してあり、
 * 何度でも遊べる「あてっこモード」（GuessScreen.js）と共通。ここでは
 * 「種明かしへ誘導する」という、イントロだけの一回きりの誘導だけを持つ。
 */

const PHASE = { WELCOME: 'welcome', GUESSING: 'guessing', TEASE: 'tease' };

export default function IntroScreen({ onFinish, onSkip }) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [phase, setPhase] = useState(PHASE.WELCOME);
  const guess = useCardReveal();

  /* ---------------- はじめの説明 ---------------- */
  if (phase === PHASE.WELCOME) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.introBody}>
          <Text style={styles.introSmall}>{t('intro.hello')}</Text>
          <View style={styles.introRule} />
          <Text style={styles.introLead}>{t('intro.lead1', { max: MAX_NUMBER })}</Text>
          <Text style={styles.introLead}>{t('intro.lead2')}</Text>
          <Text style={styles.introLead}>{t('intro.lead3')}</Text>
          <View style={styles.introRule} />
          <Text style={styles.introSub}>{t('intro.sub1', { count: CARDS.length })}</Text>
          <Text style={styles.introSub}>{t('intro.sub2')}</Text>
          <Text style={styles.introSub}>{t('intro.sub3')}</Text>
        </View>

        <Pressable
          onPress={() => setPhase(PHASE.GUESSING)}
          style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.55 }]}
        >
          <Text style={styles.startText}>{t('common.start')}</Text>
        </Pressable>

        <Pressable
          onPress={onSkip}
          hitSlop={16}
          style={({ pressed }) => [styles.skip, pressed && { opacity: 0.4 }]}
        >
          <Text style={styles.skipText}>{t('intro.skip')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  /* ---------------- 質問中 ---------------- */
  if (phase === PHASE.GUESSING && guess.stage === 'asking') {
    const translateX = guess.shift.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [-width * 1.05, 0, width * 1.05],
    });
    const opacity = guess.shift.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 1, 0],
    });

    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.stage}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity, transform: [{ translateX }] }]}>
            <CardFace card={CARDS[guess.index]} />
          </Animated.View>
        </View>

        <View style={styles.dots}>
          {CARDS.map((c, i) => (
            <View key={c.bit} style={[styles.dot, i <= guess.index && styles.dotOn]} />
          ))}
        </View>

        <Text style={styles.question}>{t('intro.question')}</Text>

        <View style={styles.choices}>
          <Pressable
            onPress={() => guess.answer(true)}
            style={({ pressed }) => [styles.choice, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.choiceText}>{t('common.yes')}</Text>
          </Pressable>
          <Pressable
            onPress={() => guess.answer(false)}
            style={({ pressed }) => [styles.choice, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.choiceText}>{t('common.no')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------------- 言い当てる ---------------- */
  if (phase === PHASE.GUESSING) {
    // 0 を思い浮かべることはできないので、全部「ない」なら聞き直す
    if (guess.number === 0) {
      return (
        <SafeAreaView style={styles.root}>
          <AllNoRetry onRetry={guess.reset} styles={styles} />
        </SafeAreaView>
      );
    }

    return (
      <Pressable
        style={styles.root}
        onPress={() => guess.revealDone && setPhase(PHASE.TEASE)}
        disabled={!guess.revealDone}
      >
        <SafeAreaView style={styles.revealBody}>
          <Animated.Text style={[styles.revealLead, { opacity: guess.titleIn }]}>
            {t('intro.revealLead')}
          </Animated.Text>

          <Animated.Text
            allowFontScaling={false}
            style={[
              styles.revealNumber,
              {
                opacity: guess.numberIn,
                transform: [
                  {
                    scale: guess.numberIn.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.07, 1],
                    }),
                  },
                  {
                    translateY: guess.numberIn.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {guess.number}
          </Animated.Text>

          <Animated.Text style={[styles.revealTail, { opacity: guess.tailIn }]}>
            {t('intro.revealTail')}
          </Animated.Text>

          <Animated.Text style={[styles.revealHint, { opacity: guess.tailIn }]}>
            {t('intro.tap')}
          </Animated.Text>
        </SafeAreaView>
      </Pressable>
    );
  }

  /* ---------------- 誘導 ---------------- */
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.introBody}>
        <Text style={styles.teaseLead}>{t('intro.teaseLead')}</Text>
        <View style={styles.introRule} />
        <Text style={styles.teaseSub}>{t('intro.tease1')}</Text>
        <Text style={styles.teaseSub}>{t('intro.tease2')}</Text>
        <Text style={styles.teaseSub}>{t('intro.tease3')}</Text>
      </View>

      <Pressable
        onPress={() => onFinish(guess.number)}
        style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.55 }]}
      >
        <Text style={styles.startText}>{t('intro.seek')}</Text>
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
    introSmall: { color: theme.accent, fontSize: 14, letterSpacing: 5 },
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

    skip: { position: 'absolute', bottom: 26, left: 0, right: 0, alignItems: 'center', padding: 10 },
    skipText: { color: theme.inkFaint, fontSize: 14, letterSpacing: 1 },

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
      lineHeight: Math.round(108 * theme.numberLineHeight),
      fontFamily: theme.numberFont,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    revealTail: { color: theme.ink, fontSize: 20, letterSpacing: 3, marginTop: 14 },
    revealHint: {
      position: 'absolute',
      bottom: 30,
      color: theme.inkFaint,
      fontSize: 14,
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
