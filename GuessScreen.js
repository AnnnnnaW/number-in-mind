import React, { useCallback, useMemo, useState } from 'react';
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
import { BackLink, CardFace, PillButton } from './ui';
import { useTheme } from './ThemeContext';
import { useCardReveal } from './useCardReveal';
import { AllNoRetry } from './AllNoRetry';
import { t } from './i18n';

/**
 * あてっこモード。
 *
 * イントロの ASKING → REVEAL とまったく同じ「アプリが手品をする」体験を、
 * 何度でもループできる形にしたもの。イントロは初回だけの一回きりの流れだが、
 * こちらは子どもが「もう一回！」と繰り返し遊べることを目的にしている。
 *
 * カードを見せて当てる部分のロジックは useCardReveal に切り出してあり、
 * イントロ（IntroScreen.js）と共通。ここでは「何度でもループする」という、
 * あてっこモードだけの誘導（WELCOME を毎回はさむ）を持つ。
 *
 * 本番（PerformanceScreen）からは今までどおり一切 import しない。
 */

const PHASE = { WELCOME: 'welcome', GUESSING: 'guessing' };

export default function GuessScreen({ onExit }) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [phase, setPhase] = useState(PHASE.WELCOME);
  const guess = useCardReveal();

  // 「もう一度」。次のラウンドの前に、必ず「数字を思い浮かべてください」の画面へ戻す
  const playAgain = useCallback(() => {
    guess.reset();
    setPhase(PHASE.WELCOME);
  }, [guess]);

  /* ---------------- 数字を思い浮かべる ---------------- */
  if (phase === PHASE.WELCOME) {
    return (
      <SafeAreaView style={styles.root}>
        <BackLink onPress={onExit} />

        <View style={styles.introBody}>
          <Text style={styles.introLead}>{t('intro.lead1', { max: MAX_NUMBER })}</Text>
          <Text style={styles.introLead}>{t('intro.lead2')}</Text>
          <Text style={styles.introLead}>{t('intro.lead3')}</Text>
          <View style={styles.introRule} />
          <Text style={styles.introSub}>{t('intro.sub1', { count: CARDS.length })}</Text>
          <Text style={styles.introSub}>{t('intro.sub2')}</Text>
          <Text style={styles.introSub}>{t('intro.sub3')}</Text>
        </View>

        <PillButton
          onPress={() => setPhase(PHASE.GUESSING)}
          style={styles.startButton}
          textStyle={styles.startText}
        >
          {t('common.start')}
        </PillButton>
      </SafeAreaView>
    );
  }

  /* ---------------- 質問中 ---------------- */
  if (guess.stage === 'asking') {
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
        <BackLink onPress={onExit} />

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
  if (guess.number === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <BackLink onPress={onExit} />
        <AllNoRetry
          onRetry={guess.reset}
          styles={styles}
          buttonStyle={styles.startButton}
          buttonTextStyle={styles.startText}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <BackLink onPress={onExit} />

      <View style={styles.revealBody}>
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
                  scale: guess.numberIn.interpolate({ inputRange: [0, 1], outputRange: [1.07, 1] }),
                },
                {
                  translateY: guess.numberIn.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
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
      </View>

      {/* ボタンの出現でrevealBody(flex:1)の高さが変わり画面が跳ねないよう、
          出し入れではなく最初から置いたまま透明度と押下可否だけ切り替える */}
      <PillButton
        onPress={guess.revealDone ? playAgain : undefined}
        style={[styles.startButton, !guess.revealDone && styles.startButtonHidden]}
        textStyle={styles.startText}
      >
        {t('common.again')}
      </PillButton>
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
    introLead: { color: theme.ink, fontSize: 22, lineHeight: 38, letterSpacing: 1.5 },
    introRule: {
      width: 56,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.accentFaint,
      marginVertical: 24,
    },
    introSub: { color: theme.inkSoft, fontSize: 16, lineHeight: 26, letterSpacing: 1 },

    // PillButton/BackLink(ui.js)への上書き分だけ残す
    startButton: { marginTop: 46, paddingHorizontal: 54 },
    startText: { letterSpacing: 5, marginLeft: 5 },
    // revealDoneになるまでは場所だけ確保して透明にしておく（②の跳ね防止）
    startButtonHidden: { opacity: 0 },

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
