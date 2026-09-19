import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './ThemeContext';
import * as prefs from './prefs';
import { t } from './i18n';
import { PillButton, TextButton } from './ui';
import PerformanceScreen from './PerformanceScreen';
import PracticeScreen from './PracticeScreen';
import GuessScreen from './GuessScreen';
import IntroScreen from './IntroScreen';
import ExplainScreen from './ExplainScreen';
import HowToScreen from './HowToScreen';
import SettingsScreen from './SettingsScreen';

/**
 * Number in mind
 *
 * 実物の「1〜60 数字当てカード6枚」をスマホで代用するアプリ。
 *
 * 初回だけイントロが出て、アプリのほうが手品をして見せる。
 * その理由（種明かし）はロゴをタップすると読める。
 *
 * 手品の本番（通常モード）では、アプリは答えを計算しない。
 * 計算するファイル（solve.js / practice.js）は、本番の画面から import していない。
 */

const MODE = {
  PERFORM: 'perform',
  PRACTICE: 'practice',
  GUESS: 'guess',
  EXPLAIN: 'explain',
  HOWTO: 'howto',
  SETTINGS: 'settings',
};

function AppInner() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [ready, setReady] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [explainSeen, setExplainSeen] = useState(true);
  const [lastNumber, setLastNumber] = useState(null);
  const [mode, setMode] = useState(null);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    prefs.load().then((p) => {
      if (!alive) return;
      setShowIntro(!p.introSeen);
      setExplainSeen(p.explainSeen);
      setLastNumber(p.lastNumber);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 種明かしをまだ見つけていない間だけ、ロゴがゆっくり息をする。
  // 「どこかに隠してある」と言われて途方に暮れないための、控えめな道しるべ。
  useEffect(() => {
    if (explainSeen || mode !== null || showIntro) {
      pulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [explainSeen, mode, showIntro, pulse]);

  const finishIntro = useCallback((number) => {
    prefs.update({ introSeen: true, lastNumber: number ?? null });
    setLastNumber(number ?? null);
    setShowIntro(false);
  }, []);

  const skipIntro = useCallback(() => {
    // スキップした人は仕組みを知っている人なので、探させる意味がない
    prefs.update({ introSeen: true, explainSeen: true });
    setExplainSeen(true);
    setShowIntro(false);
  }, []);

  const openExplain = useCallback(() => {
    prefs.update({ explainSeen: true });
    setExplainSeen(true);
    setMode(MODE.EXPLAIN);
  }, []);

  // 設定の読み込み中。背景色だけ出しておいて画面のちらつきを防ぐ
  if (!ready) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
      </View>
    );
  }

  if (showIntro) {
    return (
      <>
        <StatusBar hidden />
        <IntroScreen onFinish={finishIntro} onSkip={skipIntro} />
      </>
    );
  }

  if (mode === MODE.PERFORM) {
    return (
      <>
        <StatusBar hidden />
        <PerformanceScreen onExit={() => setMode(null)} />
      </>
    );
  }

  if (mode === MODE.PRACTICE) {
    return (
      <>
        <StatusBar hidden />
        <PracticeScreen onExit={() => setMode(null)} />
      </>
    );
  }

  if (mode === MODE.GUESS) {
    return (
      <>
        <StatusBar hidden />
        <GuessScreen onExit={() => setMode(null)} />
      </>
    );
  }

  if (mode === MODE.SETTINGS) {
    return (
      <>
        <StatusBar hidden />
        <SettingsScreen onExit={() => setMode(null)} />
      </>
    );
  }

  if (mode === MODE.EXPLAIN) {
    return (
      <>
        <StatusBar hidden />
        <ExplainScreen number={lastNumber} onClose={() => setMode(null)} />
      </>
    );
  }

  if (mode === MODE.HOWTO) {
    return (
      <>
        <StatusBar hidden />
        <HowToScreen onClose={() => setMode(null)} />
      </>
    );
  }

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });
  const markScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />

      <Pressable
        onPress={() => setMode(MODE.HOWTO)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t('home.howto')}
        style={({ pressed }) => [styles.help, pressed && { opacity: 0.5 }]}
      >
        <Text style={styles.helpMark}>?</Text>
      </Pressable>

      <Pressable onPress={openExplain} hitSlop={18}>
        <Animated.View style={[styles.mark, { transform: [{ scale: markScale }] }]}>
          <Animated.View style={[styles.markGlow, { opacity: glowOpacity }]} />
          <View style={styles.diamond} />
        </Animated.View>
      </Pressable>

      <Text style={styles.title}>Number in mind</Text>

      <PillButton onPress={() => setMode(MODE.PERFORM)} filled style={styles.primaryBox}>
        {t('home.start')}
      </PillButton>

      <PillButton
        onPress={() => setMode(MODE.GUESS)}
        style={[styles.primaryBox, styles.primaryStacked]}
      >
        {t('home.guess')}
      </PillButton>

      <TextButton
        onPress={() => setMode(MODE.PRACTICE)}
        style={styles.secondaryStack}
        textStyle={styles.secondaryLabel}
      >
        {t('home.practice')}
      </TextButton>

      <Pressable
        onPress={() => setMode(MODE.SETTINGS)}
        hitSlop={10}
        style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.5 }]}
      >
        <Text style={styles.footerLinkText}>{t('home.settings')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.backdrop,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mark: {
      width: 74,
      height: 74,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.accentFaint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 26,
    },
    markGlow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 16,
      backgroundColor: theme.accentWash12,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    diamond: {
      width: 26,
      height: 26,
      backgroundColor: theme.accent,
      transform: [{ rotate: '45deg' }],
    },
    title: {
      color: theme.ink,
      fontSize: 19,
      letterSpacing: 4,
      marginBottom: 48,
    },
    // PillButton/TextButton は ui.js の共通コンポーネント。
    // ここではホーム画面だけの個別事情(幅を揃える・letterSpacingが他画面と違う等)だけを上書きする
    primaryBox: {
      width: 240,
      paddingHorizontal: 20,
    },
    primaryStacked: {
      marginTop: 14,
    },
    secondaryStack: {
      marginTop: 20,
    },
    secondaryLabel: {
      letterSpacing: 3,
    },
    footerLink: { marginTop: 8, padding: 10 },
    footerLinkText: { color: theme.inkFaint, fontSize: 14, letterSpacing: 2 },
    help: {
      position: 'absolute',
      top: 14,
      right: 22,
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.accentFaint,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    helpMark: {
      color: theme.inkSoft,
      fontSize: 18,
      lineHeight: 22,
    },
  });
}
