import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLUMNS, ROWS, ACCENT_COLORS } from './cards';
import { useTheme } from './ThemeContext';

/* ------------------------------------------------------------------ *
 * 配色とカードの見た目。本番・練習の両方でこれを使う。
 * 色そのものは theme.js のパレットから来る（useTheme() で取得）。
 * ------------------------------------------------------------------ */

function makeStyles(theme) {
  return StyleSheet.create({
    surface: {
      flex: 1,
      borderRadius: 22,
      backgroundColor: theme.cardBottom,
      borderWidth: 1.5,
      borderColor: theme.accent,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.55,
          shadowRadius: 18,
          shadowOffset: { width: -6, height: 6 },
        },
        android: { elevation: 12 },
      }),
    },
    surfaceSheen: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '55%',
      backgroundColor: theme.cardTop,
      opacity: 0.75,
    },
    surfaceInner: {
      position: 'absolute',
      top: 7,
      left: 7,
      right: 7,
      bottom: 7,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.accentFaint,
    },
    surfaceBody: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 18,
    },

    ornament: {
      height: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    ornamentLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.accentFaint,
    },
    ornamentDiamond: {
      width: 6,
      height: 6,
      marginHorizontal: 10,
      backgroundColor: theme.accent,
      transform: [{ rotate: '45deg' }],
      opacity: 0.85,
    },

    grid: {
      flex: 1,
      marginVertical: 6,
    },
    gridRow: {
      flex: 1,
      flexDirection: 'row',
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    number: {
      color: theme.ink,
      fontFamily: theme.numberFont,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
    },
  });
}

/** カードの台紙（濃紺 + 金の二重枠。テーマにより配色は変わる） */
export function Surface({ children }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.surface}>
      <View style={styles.surfaceSheen} pointerEvents="none" />
      <View style={styles.surfaceInner} pointerEvents="none" />
      <View style={styles.surfaceBody}>{children}</View>
    </View>
  );
}

/** カード上下の細い金のライン + 中央の菱形 */
export function Ornament({ flipped }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[styles.ornament, flipped && { transform: [{ rotate: '180deg' }] }]}>
      <View style={styles.ornamentLine} />
      <View style={styles.ornamentDiamond} />
      <View style={styles.ornamentLine} />
    </View>
  );
}

/**
 * 直前に測ったグリッドの大きさ。
 *
 * カードはどれも同じ寸法なので、2枚目以降は測り直す前から正しい文字サイズで描ける。
 * これがないと、新しいカードが現れた瞬間に数字が一瞬消えてチカチカする。
 */
let lastGrid = null;

/** 数字が並んだカードの面 */
export function CardFace({ card }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { numbers, accents, color } = card;
  const accentColor = ACCENT_COLORS[color];
  const [grid, setGrid] = useState(lastGrid);

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    lastGrid = { width, height };
    // 自分がすでに同じ寸法を持っているときだけ更新を省く。
    // ここで「共有のキャッシュと同じだから」で早期 return すると、
    // 自分の state が null のままのカードが数字を出せなくなる
    setGrid((prev) =>
      prev && Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
        ? prev
        : { width, height }
    );
  }, []);

  let fontSize = 0;
  if (grid) {
    const cellW = grid.width / COLUMNS;
    const cellH = grid.height / ROWS;
    fontSize = Math.floor(Math.min(cellW * 0.64, cellH * 0.66));
  }

  const rows = [];
  for (let r = 0; r < ROWS; r += 1) {
    rows.push(numbers.slice(r * COLUMNS, r * COLUMNS + COLUMNS));
  }

  return (
    <Surface>
      <Ornament />
      <View style={styles.grid} onLayout={onLayout}>
        {rows.map((row, r) => (
          <View style={styles.gridRow} key={`r${r}`}>
            {Array.from({ length: COLUMNS }).map((_, c) => (
              <View style={styles.cell} key={`c${r}-${c}`}>
                {row[c] !== undefined && fontSize > 0 ? (
                  <Text
                    style={[
                      styles.number,
                      { fontSize, lineHeight: Math.round(fontSize * theme.numberLineHeight) },
                      accents.has(row[c]) && { color: accentColor },
                    ]}
                    allowFontScaling={false}
                  >
                    {row[c]}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>
      <Ornament flipped />
    </Surface>
  );
}

/* ------------------------------------------------------------------ *
 * 戻るボタン・丸ボタン。
 *
 * 設定・練習・あてっこ・種明かし・本番・ホームなど、ほとんどの画面が
 * 同じ形のボタン（‹ の戻る／枠線か塗りつぶしの丸ボタン／文字だけのボタン）を
 * それぞれ別々に定義していたので、ここに共通化した。
 *
 * padding や letterSpacing は画面ごとに少しずつ違う（意図的な差もある）ため
 * 値そのものは変えず、style / textStyle で呼び出し側から上書きできるように
 * してある。
 * ------------------------------------------------------------------ */

function chromeStyles(theme) {
  return StyleSheet.create({
    back: {
      position: 'absolute',
      top: 6,
      left: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      zIndex: 2,
    },
    backText: { color: theme.ink, fontSize: 48, lineHeight: 52 },

    pill: {
      alignSelf: 'center',
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    pillFilled: { backgroundColor: theme.accent },
    pillText: { color: theme.accent, fontSize: 16, letterSpacing: 4, marginLeft: 4, textAlign: 'center' },
    pillTextFilled: { color: theme.backdrop },

    text: { alignSelf: 'center', padding: 14 },
    textLabel: { color: theme.inkSoft, fontSize: 16, letterSpacing: 2, textAlign: 'center' },
  });
}

/** 「‹」の戻るボタン。置き場所は画面ごとに少し違うので style で上書きできる */
export function BackLink({ onPress, style }) {
  const theme = useTheme();
  const styles = useMemo(() => chromeStyles(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={20}
      style={({ pressed }) => [styles.back, style, pressed && { opacity: 0.4 }]}
    >
      <Text style={styles.backText}>‹</Text>
    </Pressable>
  );
}

/**
 * 枠線（filled を渡すと塗りつぶし）の丸ボタン。
 * padding・letterSpacing は画面によって違うので style / textStyle で上書きする。
 */
export function PillButton({ onPress, children, filled, style, textStyle }) {
  const theme = useTheme();
  const styles = useMemo(() => chromeStyles(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        filled && styles.pillFilled,
        style,
        pressed && { opacity: filled ? 0.7 : 0.55 },
      ]}
    >
      <Text style={[styles.pillText, filled && styles.pillTextFilled, textStyle]}>{children}</Text>
    </Pressable>
  );
}

/** 枠なし・文字だけのボタン（「練習」「設定を変える」など） */
export function TextButton({ onPress, children, style, textStyle }) {
  const theme = useTheme();
  const styles = useMemo(() => chromeStyles(theme), [theme]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.text, style, pressed && { opacity: 0.5 }]}>
      <Text style={[styles.textLabel, textStyle]}>{children}</Text>
    </Pressable>
  );
}
