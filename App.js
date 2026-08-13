import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { C } from './ui';
import PerformanceScreen from './PerformanceScreen';
import PracticeScreen from './PracticeScreen';

/**
 * Number in mind
 *
 * 実物の「1〜60 数字当てカード6枚」をスマホで代用するアプリ。
 * 本番中のアプリは答えを計算しない。計算するのは練習モードだけで、
 * そのコード（practice.js）は本番の画面から一切参照されていない。
 */

const MODE = { PERFORM: 'perform', PRACTICE: 'practice' };

export default function App() {
  const [mode, setMode] = useState(null);

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

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <View style={styles.mark}>
        <View style={styles.diamond} />
      </View>
      <Text style={styles.title}>Number in mind</Text>

      <Pressable
        onPress={() => setMode(MODE.PERFORM)}
        style={({ pressed }) => [styles.primary, pressed && { opacity: 0.55 }]}
      >
        <Text style={styles.primaryText}>はじめる</Text>
      </Pressable>

      <Pressable
        onPress={() => setMode(MODE.PRACTICE)}
        style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.5 }]}
      >
        <Text style={styles.secondaryText}>練習</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 74,
    height: 74,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.goldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  diamond: {
    width: 26,
    height: 26,
    backgroundColor: C.gold,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    color: C.ink,
    fontSize: 19,
    letterSpacing: 4,
    marginBottom: 62,
  },
  primary: {
    paddingVertical: 15,
    paddingHorizontal: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.gold,
  },
  primaryText: {
    color: C.gold,
    fontSize: 16,
    letterSpacing: 4,
    marginLeft: 4,
  },
  secondary: {
    marginTop: 22,
    padding: 14,
  },
  secondaryText: {
    color: C.inkSoft,
    fontSize: 14,
    letterSpacing: 3,
  },
});
