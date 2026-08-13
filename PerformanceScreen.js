import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { CARDS, MAX_NUMBER } from './cards';
import { C, CardFace, Ornament, Surface } from './ui';

/**
 * 本番用の画面。
 *
 * ここには答えを計算する処理が一切ない。practice.js も import していない。
 * 手品の最中にアプリが答えを知ることはない。
 */

const END_INDEX = CARDS.length;

const DURATION_IN = 280;
const DURATION_OUT = 240;
const EDGE_WIDTH = 36; // 画面左端から戻れる幅
const TAP_SLOP = 8;

/** 最後の面。数字は出さない */
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

export default function PerformanceScreen({ onExit }) {
  const { width } = useWindowDimensions();

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [incoming, setIncoming] = useState(null); // 右から入ってくる面
  const [outgoing, setOutgoing] = useState(null); // 右へ抜けていく面

  const slide = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);
  const stateRef = useRef({ index: 0 });
  stateRef.current = { index };

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

  const handlers = useRef({ goNext, goBack });
  handlers.current = { goNext, goBack };

  const responder = useRef(
    PanResponder.create({
      // 最後の面では子（もう一度）にタップを渡したいので、開始時の横取りをやめる
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
    i >= END_INDEX ? <EndFace onRestart={restart} /> : <CardFace card={CARDS[i]} />;

  if (!started) {
    return (
      <SafeAreaView style={styles.root}>
        <Pressable
          onPress={onExit}
          hitSlop={20}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.4 }]}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
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
      </SafeAreaView>
    );
  }

  const baseIndex = outgoing !== null ? index - 1 : index;
  // めくり＝右から差し込む(1→0)、戻し＝右へ抜く(0→1)。どちらも同じ動きの逆再生
  const movingIndex = incoming !== null ? incoming : outgoing;
  const movingStyle = { transform: [{ translateX }, { rotate }] };

  return (
    <SafeAreaView style={styles.root} {...responder.panHandlers}>
      <View style={styles.stage}>
        <View style={StyleSheet.absoluteFill}>{renderFace(baseIndex)}</View>
        {movingIndex !== null ? (
          <Animated.View style={[StyleSheet.absoluteFill, styles.moving, movingStyle]}>
            {renderFace(movingIndex)}
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.backdrop,
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  stage: { flex: 1 },

  back: {
    position: 'absolute',
    top: 14,
    left: 18,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  backText: {
    color: C.inkFaint,
    fontSize: 30,
    lineHeight: 34,
  },

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
    color: C.inkFaint,
    fontSize: 12,
    letterSpacing: 1,
  },
});
