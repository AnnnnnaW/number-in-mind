import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './ThemeContext';
import * as prefs from './prefs';
import { t } from './i18n';
import PerformanceScreen from './PerformanceScreen';
import PracticeScreen from './PracticeScreen';
import IntroScreen from './IntroScreen';
import ExplainScreen from './ExplainScreen';
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
  EXPLAIN: 'explain',
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

  const replayIntro = useCallback(() => {
    setMode(null);
    setShowIntro(true);
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
        <ExplainScreen
          number={lastNumber}
          onClose={() => setMode(null)}
          onReplayIntro={replayIntro}
        />
      </>
    );
  }

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });
  const markScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />

      <Pressable onPress={openExplain} hitSlop={18}>
        <Animated.View style={[styles.mark, { transform: [{ scale: markScale }] }]}>
          <Animated.View style={[styles.markGlow, { opacity: glowOpacity }]} />
          <View style={styles.diamond} />
        </Animated.View>
      </Pressable>

      <Text style={styles.title}>Number in mind</Text>

      <Pressable
        onPress={() => setMode(MODE.PERFORM)}
        style={({ pressed }) => [styles.primary, pressed && { opacity: 0.55 }]}
      >
        <Text style={styles.primaryText}>{t('home.start')}</Text>
      </Pressable>

      <Pressable
        onPress={() => setMode(MODE.PRACTICE)}
        style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.5 }]}
      >
        <Text style={styles.secondaryText}>{t('home.practice')}</Text>
      </Pressable>

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
    primary: {
      minWidth: 200,
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    primaryText: {
      color: theme.accent,
      fontSize: 16,
      letterSpacing: 4,
      marginLeft: 4,
    },
    secondary: {
      marginTop: 20,
      padding: 14,
    },
    secondaryText: {
      color: theme.inkSoft,
      fontSize: 14,
      letterSpacing: 3,
    },
    footerLink: { marginTop: 8, padding: 10 },
    footerLinkText: { color: theme.inkFaint, fontSize: 12, letterSpacing: 2 },
  });
}
