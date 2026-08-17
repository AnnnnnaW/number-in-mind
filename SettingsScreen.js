import React, { useMemo } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FONTS, PALETTES } from './theme';
import { useThemeSettings } from './ThemeContext';

/**
 * 設定画面。
 *
 * カードの配色とフォントを切り替えられる。
 * 選ぶとその場でアプリ全体に反映される（テーマは Context 経由で配っている）ので、
 * ここに置いたスウォッチ自体が現在の配色のプレビューになる。
 *
 * 選択は prefs.js に保存され、次回起動時も復元される（ThemeContext 側の責務）。
 */

export default function SettingsScreen({ onExit }) {
  const { theme, paletteId, fontId, setPaletteId, setFontId } = useThemeSettings();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.root}>
      <BackLink onPress={onExit} styles={styles} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.h1}>設定</Text>

        <Text style={styles.label}>カードの配色</Text>
        <View style={styles.paletteRow}>
          {Object.values(PALETTES).map((p) => (
            <PaletteOption
              key={p.id}
              palette={p}
              active={paletteId === p.id}
              onPress={() => setPaletteId(p.id)}
              styles={styles}
            />
          ))}
        </View>

        <Text style={styles.label}>フォント</Text>
        <View style={styles.fontColumn}>
          {Object.values(FONTS).map((f) => (
            <FontOption
              key={f.id}
              font={f}
              active={fontId === f.id}
              onPress={() => setFontId(f.id)}
              styles={styles}
            />
          ))}
        </View>

        <Text style={styles.note}>選ぶとその場で反映されます。次回起動時も同じ設定で開きます。</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PaletteOption({ palette, active, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.paletteCard,
        active && styles.paletteCardActive,
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.paletteSwatch, { backgroundColor: palette.backdrop }]}>
        <View style={[styles.paletteSwatchCard, { backgroundColor: palette.cardBottom, borderColor: palette.accent }]}>
          <View style={[styles.paletteSwatchDot, { backgroundColor: palette.accent }]} />
        </View>
      </View>
      <Text style={[styles.paletteLabel, active && styles.paletteLabelActive]}>{palette.label}</Text>
    </Pressable>
  );
}

function FontOption({ font, active, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fontRow,
        active && styles.fontRowActive,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text
        style={[
          styles.fontSample,
          {
            fontFamily: font.family,
            lineHeight: Math.round(20 * (font.numberLineHeight ?? 1.2)),
          },
        ]}
      >
        123
      </Text>
      <Text style={[styles.fontLabel, active && styles.fontLabelActive]}>{font.label}</Text>
      {active ? <Text style={styles.fontCheck}>✓</Text> : null}
    </Pressable>
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
    root: { flex: 1, backgroundColor: theme.backdrop },
    body: { paddingTop: 44, paddingBottom: 50, paddingHorizontal: 28 },

    back: {
      position: 'absolute',
      top: 14,
      left: 18,
      paddingHorizontal: 10,
      paddingVertical: 4,
      zIndex: 2,
    },
    backText: { color: theme.inkFaint, fontSize: 30, lineHeight: 34 },

    h1: { color: theme.ink, fontSize: 22, letterSpacing: 4, textAlign: 'center', marginBottom: 8 },

    label: {
      color: theme.accent,
      fontSize: 12,
      letterSpacing: 3,
      marginTop: 30,
      marginBottom: 14,
      textAlign: 'center',
    },

    paletteRow: { flexDirection: 'row', justifyContent: 'center' },
    paletteCard: {
      alignItems: 'center',
      marginHorizontal: 8,
      padding: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    paletteCardActive: { borderColor: theme.accent, backgroundColor: theme.accentWash10 },
    paletteSwatch: {
      width: 64,
      height: 64,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paletteSwatchCard: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paletteSwatchDot: { width: 8, height: 8, borderRadius: 4 },
    paletteLabel: { color: theme.inkSoft, fontSize: 12, letterSpacing: 1, marginTop: 10 },
    paletteLabelActive: { color: theme.ink },

    fontColumn: { alignSelf: 'stretch' },
    fontRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.inkLine,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 18,
      marginBottom: 10,
    },
    fontRowActive: { borderColor: theme.accent, backgroundColor: theme.accentWash10 },
    fontSample: {
      color: theme.ink,
      fontSize: 20,
      fontVariant: ['tabular-nums'],
      width: 44,
    },
    fontLabel: { color: theme.inkSoft, fontSize: 14, letterSpacing: 1, flex: 1 },
    fontLabelActive: { color: theme.ink },
    fontCheck: { color: theme.accent, fontSize: 16 },

    note: {
      color: theme.inkFaint,
      fontSize: 11,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 34,
      paddingHorizontal: 10,
    },
  });
}
