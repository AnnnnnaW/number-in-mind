import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { FONTS, PALETTES } from "./theme";
import { useThemeSettings } from "./ThemeContext";
import * as prefs from "./prefs";
import { t } from "./i18n";

/**
 * 設定画面。
 *
 * カードの配色とフォントを切り替えられる。
 * 選ぶとその場でアプリ全体に反映される（テーマは Context 経由で配っている）ので、
 * ここに置いたスウォッチ自体が現在の配色のプレビューになる。
 *
 * 選択は prefs.js に保存され、次回起動時も復元される（ThemeContext 側の責務）。
 * スリープ防止は本番・練習の画面が開くときに prefs から読むので、ここでは保存だけする。
 */

const APP_STORE_URL = "https://apps.apple.com/us/app/number-in-mind/id6801572572";

export default function SettingsScreen({ onExit, onReplayIntro }) {
  const { theme, paletteId, fontId, setPaletteId, setFontId } =
    useThemeSettings();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // 起動時に読み込んだ内容がキャッシュにあるので、初期表示から正しい状態で出せる
  const [keepAwake, setKeepAwake] = useState(() => prefs.snapshot().keepAwake);

  // キャッシュが空のまま開かれた場合の保険
  useEffect(() => {
    let alive = true;
    prefs.load().then((p) => {
      if (alive) setKeepAwake(p.keepAwake);
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggleKeepAwake = (value) => {
    setKeepAwake(value);
    prefs.update({ keepAwake: value });
  };

  const shareApp = () => {
    Share.share({
      message: `${t("settings.shareText")} ${APP_STORE_URL}`,
      url: APP_STORE_URL, // iOS ではこちらが優先して使われる
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.root}>
      <BackLink onPress={onExit} styles={styles} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.h1}>{t("settings.title")}</Text>

        <Text style={styles.label}>{t("settings.palette")}</Text>
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

        <Text style={styles.label}>{t("settings.font")}</Text>
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

        <Text style={styles.label}>{t("settings.screen")}</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchTexts}>
            <Text style={styles.switchLabel}>{t("settings.keepAwake")}</Text>
            <Text style={styles.switchNote}>{t("settings.keepAwakeNote")}</Text>
          </View>
          <Switch
            value={keepAwake}
            onValueChange={toggleKeepAwake}
            trackColor={{ false: theme.inkLine, true: theme.accent }}
            thumbColor={theme.cardBottom}
            ios_backgroundColor={theme.inkLine}
          />
        </View>

        <Text style={styles.label}>{t("settings.helpShare")}</Text>
        <View style={styles.helpColumn}>
          <Pressable
            onPress={onReplayIntro}
            style={({ pressed }) => [styles.helpRow, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.helpText}>{t("settings.replayIntro")}</Text>
          </Pressable>
          <Pressable
            onPress={shareApp}
            style={({ pressed }) => [styles.helpRow, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.helpText}>{t("settings.shareApp")}</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>{t("settings.note")}</Text>
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
      <View
        style={[styles.paletteSwatch, { backgroundColor: palette.backdrop }]}
      >
        <View
          style={[
            styles.paletteSwatchCard,
            {
              backgroundColor: palette.cardBottom,
              borderColor: palette.accent,
            },
          ]}
        >
          <View
            style={[
              styles.paletteSwatchDot,
              { backgroundColor: palette.accent },
            ]}
          />
        </View>
      </View>
      <Text style={[styles.paletteLabel, active && styles.paletteLabelActive]}>
        {t(`palette.${palette.id}`)}
      </Text>
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
      {/* プレビューは全書体で同じ枠サイズ。カード用 numberLineHeight は使わない */}
      <View style={styles.fontSampleWrap}>
        <Text
          style={[
            styles.fontSample,
            { fontFamily: font.family },
            // 字面が上寄りのメトリクスを持つ書体は、プレビューだけ下にずらして揃える
            font.id === "engraved" && styles.fontSampleOpticalDown,
          ]}
          allowFontScaling={false}
        >
          123
        </Text>
      </View>
      <Text style={[styles.fontLabel, active && styles.fontLabelActive]}>
        {font.label}
      </Text>
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
      position: "absolute",
      top: 14,
      left: 18,
      paddingHorizontal: 10,
      paddingVertical: 4,
      zIndex: 2,
    },
    backText: { color: theme.ink, fontSize: 40, lineHeight: 44 },

    h1: {
      color: theme.ink,
      fontSize: 22,
      letterSpacing: 4,
      textAlign: "center",
      marginBottom: 8,
    },

    label: {
      color: theme.accent,
      fontSize: 14,
      letterSpacing: 3,
      marginTop: 30,
      marginBottom: 14,
      textAlign: "center",
    },

    paletteRow: { flexDirection: "row", justifyContent: "center" },
    paletteCard: {
      alignItems: "center",
      marginHorizontal: 8,
      padding: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "transparent",
    },
    paletteCardActive: {
      borderColor: theme.accent,
      backgroundColor: theme.accentWash10,
    },
    paletteSwatch: {
      width: 64,
      height: 64,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    paletteSwatchCard: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    paletteSwatchDot: { width: 8, height: 8, borderRadius: 4 },
    paletteLabel: {
      color: theme.inkSoft,
      fontSize: 14,
      letterSpacing: 1,
      marginTop: 10,
    },
    paletteLabelActive: { color: theme.ink },

    fontColumn: { alignSelf: "stretch" },
    fontRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.inkLine,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 18,
      marginBottom: 10,
    },
    fontRowActive: {
      borderColor: theme.accent,
      backgroundColor: theme.accentWash10,
    },
    fontSampleWrap: {
      width: 44,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
    },
    fontSample: {
      color: theme.ink,
      fontSize: 20,
      lineHeight: 24,
      fontVariant: ["tabular-nums"],
      textAlign: "center",
      includeFontPadding: false,
    },
    fontSampleOpticalDown: {
      transform: [{ translateY: 4 }],
    },
    fontLabel: {
      color: theme.inkSoft,
      fontSize: 16,
      letterSpacing: 1,
      flex: 1,
    },
    fontLabelActive: { color: theme.ink },
    fontCheck: { color: theme.accent, fontSize: 16 },

    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.inkLine,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    switchTexts: { flex: 1, paddingRight: 14 },
    switchLabel: { color: theme.ink, fontSize: 16, letterSpacing: 1 },
    switchNote: {
      color: theme.inkFaint,
      fontSize: 14,
      lineHeight: 18,
      marginTop: 4,
    },

    helpColumn: { alignSelf: "stretch" },
    helpRow: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.inkLine,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 18,
      marginBottom: 10,
    },
    helpText: { color: theme.accent, fontSize: 16, letterSpacing: 1, textAlign: "center" },

    note: {
      color: theme.inkFaint,
      fontSize: 14,
      lineHeight: 22,
      textAlign: "center",
      marginTop: 34,
      paddingHorizontal: 10,
    },
  });
}
