import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { CARDS, COLUMNS, ROWS, MAX_NUMBER, ACCENT_COLORS } from './cards';

/* ------------------------------------------------------------------ *
 * 配色
 * ------------------------------------------------------------------ */
const C = {
  backdrop: '#05070F',
  cardTop: '#1B2C63',
  cardBottom: '#101B44',
  gold: '#C9A75A',
  goldFaint: 'rgba(201,167,90,0.34)',
  ink: '#F5F2E8',
  inkSoft: 'rgba(245,242,232,0.55)',
};

/** カードの枚数（END 面はこの次のインデックス） */
const LAST_CARD = CARDS.length - 1;
const END_INDEX = CARDS.length;

const DURATION_IN = 280;
const DURATION_OUT = 240;
const EDGE_WIDTH = 36; // 画面左端から戻れる幅
const TAP_SLOP = 8;

/* ------------------------------------------------------------------ *
 * カード1枚ぶんの面
 * ------------------------------------------------------------------ */
function CardFace({ card }) {
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

/* ------------------------------------------------------------------ *
 * END 面（結果は絶対に出さない）
 * ------------------------------------------------------------------ */
function EndFace({ onRestart }) {
  return (
    <Surface>
      <Ornament />
      <View style={styles.endBody}>
        <Text style={styles.endLead} allowFontScaling={false}>
          あなたの思い浮かべた
        </Text>
        <Text style={styles.endLead} allowFontScaling={false}>
          数字は
        </Text>
        <Text style={styles.endDots} allowFontScaling={false}>
          …
        </Text>
      </View>
      <Pressable
        onPress={onRestart}
        hitSlop={16}
        style={({ pressed }) => [styles.restart, pressed && { opacity: 0.5 }]}
      >
        <Text style={styles.restartText}>もう一度</Text>
      </Pressable>
      <Ornament flipped />
    </Surface>
  );
}

/* ------------------------------------------------------------------ *
 * カードの台紙（濃紺 + 金の二重枠）
 * ------------------------------------------------------------------ */
function Surface({ children }) {
  return (
    <View style={styles.surface}>
      <View style={styles.surfaceSheen} pointerEvents="none" />
      <View style={styles.surfaceInner} pointerEvents="none" />
      <View style={styles.surfaceBody}>{children}</View>
    </View>
  );
}

/** カード上下の細い金のライン + 中央の菱形 */
function Ornament({ flipped }) {
  return (
    <View style={[styles.ornament, flipped && { transform: [{ rotate: '180deg' }] }]}>
      <View style={styles.ornamentLine} />
      <View style={styles.ornamentDiamond} />
      <View style={styles.ornamentLine} />
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * 本体
 * ------------------------------------------------------------------ */
export default function App() {
  const { width } = useWindowDimensions();

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  // アニメーション中に一時的に2面を重ねて描くための状態
  const [incoming, setIncoming] = useState(null); // 右から入ってくる面
  const [outgoing, setOutgoing] = useState(null); // 右へ抜けていく面

  const slide = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);
  const stateRef = useRef({ index: 0, started: false });
  stateRef.current = { index, started };

  const goNext = useCallback(() => {
    const cur = stateRef.current.index;
    if (busy.current || cur >= END_INDEX) return;
    busy.current = true;
    setIncoming(cur + 1);
    slide.setValue(1);
    Animated.timing(slide, {
      toValue: 0,
      duration: DURATION_IN,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIndex(cur + 1);
      setIncoming(null);
      busy.current = false;
    });
  }, [slide]);

  const goBack = useCallback(() => {
    const cur = stateRef.current.index;
    if (busy.current || cur <= 0) return;
    busy.current = true;
    setOutgoing(cur);
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: DURATION_OUT,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIndex(cur - 1);
      setOutgoing(null);
      busy.current = false;
    });
  }, [slide]);

  const restart = useCallback(() => {
    if (busy.current) return;
    setIncoming(null);
    setOutgoing(null);
    slide.setValue(0);
    setIndex(0);
    setStarted(false);
  }, [slide]);

  // PanResponder は一度しか作らないので、最新の関数は ref 経由で呼ぶ
  const handlers = useRef({ goNext, goBack });
  handlers.current = { goNext, goBack };

  // タップで次へ / 左端からのスワイプで前へ
  const responder = useRef(
    PanResponder.create({
      // END 面では子（もう一度）にタップを渡したいので、開始時の横取りをやめる
      onStartShouldSetPanResponder: () => stateRef.current.index < END_INDEX,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderRelease: (_e, g) => {
        const isEdgeSwipe = g.x0 < EDGE_WIDTH && g.dx > 48 && Math.abs(g.dy) < 80;
        const isTap = Math.abs(g.dx) < TAP_SLOP && Math.abs(g.dy) < TAP_SLOP;
        if (isEdgeSwipe) handlers.current.goBack();
        else if (isTap) handlers.current.goNext();
      },
    })
  ).current;

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 1.04],
  });
  const rotate = slide.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '3.5deg'],
  });

  const renderFace = (i) =>
    i >= END_INDEX ? (
      <EndFace onRestart={restart} />
    ) : (
      <CardFace card={CARDS[i]} />
    );

  if (!started) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <View style={styles.introBody}>
          <Text style={styles.introLead}>1 〜 {MAX_NUMBER} の中から</Text>
          <Text style={styles.introLead}>好きな数字をひとつ</Text>
          <Text style={styles.introLead}>思い浮かべてください</Text>
          <View style={styles.introRule} />
          <Text style={styles.introSub}>これから {CARDS.length} 枚のカードをお見せします</Text>
          <Text style={styles.introSub}>その数字があれば「ある」</Text>
          <Text style={styles.introSub}>なければ「ない」とお答えください</Text>
        </View>
        <Pressable
          onPress={() => setStarted(true)}
          style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.55 }]}
        >
          <Text style={styles.startText}>START</Text>
        </Pressable>
        <Text style={styles.introHint}>カードは画面をタップするとめくれます</Text>
      </View>
    );
  }

  // 下に置く面（アニメーション中は「めくる前」の面）
  const baseIndex = outgoing !== null ? index - 1 : index;
  // 上に重ねてアニメーションさせる面
  // めくり＝右から差し込む(1→0)、戻し＝右へ抜く(0→1)。どちらも同じ動きの逆再生。
  const movingIndex = incoming !== null ? incoming : outgoing;
  const movingStyle = { transform: [{ translateX }, { rotate }] };

  return (
    <View style={styles.root} {...responder.panHandlers}>
      <StatusBar hidden />
      <View style={styles.stage}>
        <View style={StyleSheet.absoluteFill}>{renderFace(baseIndex)}</View>
        {movingIndex !== null ? (
          <Animated.View style={[StyleSheet.absoluteFill, styles.moving, movingStyle]}>
            {renderFace(movingIndex)}
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * スタイル
 * ------------------------------------------------------------------ */
const numberFont = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-medium',
  default: undefined,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.backdrop,
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
  },

  /* ---- カード台紙 ---- */
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
  // 上から下へのわずかな明暗差（グラデーション代わり）
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

  /* ---- 装飾 ---- */
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

  /* ---- 数字グリッド ---- */
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

  /* ---- 動くカード ---- */
  moving: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.6,
        shadowRadius: 22,
        shadowOffset: { width: -10, height: 0 },
      },
      android: { elevation: 20 },
    }),
  },

  /* ---- END ---- */
  endBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endLead: {
    color: C.ink,
    fontSize: 25,
    lineHeight: 44,
    letterSpacing: 2,
    textAlign: 'center',
  },
  endDots: {
    color: C.gold,
    fontSize: 40,
    lineHeight: 56,
    marginTop: 6,
    letterSpacing: 4,
  },
  restart: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  restartText: {
    color: C.inkSoft,
    fontSize: 15,
    letterSpacing: 3,
  },

  /* ---- イントロ ---- */
  introBody: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  introLead: {
    color: C.ink,
    fontSize: 22,
    lineHeight: 38,
    letterSpacing: 1.5,
  },
  introRule: {
    width: 56,
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.goldFaint,
    marginVertical: 26,
  },
  introSub: {
    color: C.inkSoft,
    fontSize: 14,
    lineHeight: 26,
    letterSpacing: 1,
  },
  startButton: {
    alignSelf: 'center',
    marginTop: 48,
    paddingVertical: 15,
    paddingHorizontal: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.gold,
  },
  startText: {
    color: C.gold,
    fontSize: 16,
    letterSpacing: 6,
    marginLeft: 6,
  },
  introHint: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(245,242,232,0.28)',
    fontSize: 12,
    letterSpacing: 1,
  },
});
