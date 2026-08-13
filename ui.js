import React, { useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { COLUMNS, ROWS, ACCENT_COLORS } from './cards';

/* ------------------------------------------------------------------ *
 * 配色とカードの見た目。本番・練習の両方でこれを使う
 * ------------------------------------------------------------------ */
export const C = {
  backdrop: '#05070F',
  cardTop: '#1B2C63',
  cardBottom: '#101B44',
  gold: '#C9A75A',
  goldFaint: 'rgba(201,167,90,0.34)',
  ink: '#F5F2E8',
  inkSoft: 'rgba(245,242,232,0.55)',
  inkFaint: 'rgba(245,242,232,0.28)',
  yes: '#FFD98A',
  no: 'rgba(245,242,232,0.3)',
};

export const numberFont = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-medium',
  default: undefined,
});

/** カードの台紙（濃紺 + 金の二重枠） */
export function Surface({ children }) {
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
  return (
    <View style={[styles.ornament, flipped && { transform: [{ rotate: '180deg' }] }]}>
      <View style={styles.ornamentLine} />
      <View style={styles.ornamentDiamond} />
      <View style={styles.ornamentLine} />
    </View>
  );
}

/** 数字が並んだカードの面 */
export function CardFace({ card }) {
  const { numbers, accents, color } = card;
  const accentColor = ACCENT_COLORS[color];
  const [grid, setGrid] = useState(null);

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setGrid({ width, height });
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
                      { fontSize, lineHeight: Math.round(fontSize * 1.12) },
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

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: C.cardBottom,
    borderWidth: 1.5,
    borderColor: C.gold,
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
    backgroundColor: C.cardTop,
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
    borderColor: C.goldFaint,
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
    backgroundColor: C.goldFaint,
  },
  ornamentDiamond: {
    width: 6,
    height: 6,
    marginHorizontal: 10,
    backgroundColor: C.gold,
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
    color: C.ink,
    fontFamily: numberFont,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
