import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { CardFace, Ornament, Surface } from './ui';
import { useTheme } from './ThemeContext';
import { t } from './i18n';

/**
 * 本番用の画面。
 *
 * カードは指で横に払ってめくる。指の動きにそのまま追従し、
 * 一定量まで動かすと抜け、足りなければ元の位置に戻る。
 *
 * 7面（カード6枚 + 最後の面）を横一列に並べておき、列全体をずらして見せている。
 * 面を差し替えるのではなく列の位置を動かすだけなので、
 * めくった瞬間に数字が描き直されることがない（＝ちらつかない）。
 *
 * タップではめくれない。手に持ったまま、相手に見せるとき、渡すときに
 * 画面に触れてしまっても進まないようにするため。
 *
 * ここには答えを計算する処理が一切ない。solve.js も practice.js も import していない。
 */

const END_INDEX = CARDS.length;
const PAGES = END_INDEX + 1; // カード6枚 + 最後の面

const SETTLE_MS = 220;
const EDGE_RESIST = 0.22; // 端で引っぱったときの重さ
const SWIPE_RATIO = 0.2; // 画面幅のこれだけ動かせばめくれる
const SWIPE_VELOCITY = 0.35; // 速く払ったときはこの速度でめくれる

/** 最後の面。数字は出さない */
function EndFace({ onRestart, styles }) {
  return (
    <Surface>
      <Ornament />
      <View style={styles.endBody}>
        <Text style={styles.endLead} allowFontScaling={false}>
          {t('perform.end1')}
        </Text>
        <Text style={styles.endLead} allowFontScaling={false}>
          {t('perform.end2')}
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
        <Text style={styles.restartText}>{t('perform.restart')}</Text>
      </Pressable>
      <Ornament flipped />
    </Surface>
  );
}

export default function PerformanceScreen({ onExit }) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);

  // 列全体の横位置。中身は常に「-(いま見ている面の番号 × 画面幅)」
  const offset = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);
  const indexRef = useRef(0);
  indexRef.current = index;
  const widthRef = useRef(width);
  widthRef.current = width;

  // 画面の向きが変わったら位置を測り直す
  useEffect(() => {
    offset.setValue(-indexRef.current * width);
  }, [width, offset]);

  const settle = useCallback(
    (target) => {
      busy.current = true;
      Animated.timing(offset, {
        toValue: -target * widthRef.current,
        duration: SETTLE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // ここで番号を更新しても、列の位置は既に同じ場所にある。
        // だから画面上は何も動かない＝差し替えが見えない
        setIndex(target);
        busy.current = false;
      });
    },
    [offset]
  );

  const springBack = useCallback(() => {
    Animated.spring(offset, {
      toValue: -indexRef.current * widthRef.current,
      friction: 9,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [offset]);

  const restart = useCallback(() => {
    if (busy.current) return;
    offset.setValue(0);
    setIndex(0);
    setStarted(false);
  }, [offset]);

  const handlers = useRef({ settle, springBack });
  handlers.current = { settle, springBack };

  const responder = useRef(
    PanResponder.create({
      // タップは拾わない。横に動かしはじめたときだけカードを掴む
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        !busy.current && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),

      onPanResponderMove: (_e, g) => {
        const i = indexRef.current;
        let dx = g.dx;
        // 端では引っぱっても付いてこないようにして、行き止まりを指に伝える
        if (i <= 0 && dx > 0) dx *= EDGE_RESIST;
        if (i >= END_INDEX && dx < 0) dx *= EDGE_RESIST;
        offset.setValue(-i * widthRef.current + dx);
      },

      onPanResponderRelease: (_e, g) => {
        const i = indexRef.current;
        const threshold = widthRef.current * SWIPE_RATIO;
        const forward = g.dx < -threshold || g.vx < -SWIPE_VELOCITY;
        const backward = g.dx > threshold || g.vx > SWIPE_VELOCITY;

        if (forward && i < END_INDEX) handlers.current.settle(i + 1);
        else if (backward && i > 0) handlers.current.settle(i - 1);
        else handlers.current.springBack();
      },

      onPanResponderTerminate: () => handlers.current.springBack(),
    })
  ).current;

  if (!started) {
    return (
      <SafeAreaView style={styles.introRoot}>
        <Pressable
          onPress={onExit}
          hitSlop={20}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.4 }]}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.introBody}>
          <Text style={styles.introLead}>{t('perform.lead1', { max: MAX_NUMBER })}</Text>
          <Text style={styles.introLead}>{t('perform.lead2')}</Text>
          <Text style={styles.introLead}>{t('perform.lead3')}</Text>
          <View style={styles.introRule} />
          <Text style={styles.introSub}>
            {t('perform.sub1', { count: CARDS.length })}
          </Text>
          <Text style={styles.introSub}>{t('perform.sub2')}</Text>
          <Text style={styles.introSub}>{t('perform.sub3')}</Text>
        </View>
        <Pressable
          onPress={() => setStarted(true)}
          style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.55 }]}
        >
          <Text style={styles.startText}>START</Text>
        </Pressable>
        <Text style={styles.introHint}>{t('perform.hint')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} {...responder.panHandlers}>
      <Animated.View
        style={[styles.row, { width: width * PAGES, transform: [{ translateX: offset }] }]}
      >
        {Array.from({ length: PAGES }).map((_, i) => {
          // 中央から外れているあいだだけ、わずかに傾けて奥に置く
          const range = [-(i + 1) * width, -i * width, -(i - 1) * width];
          const rotate = offset.interpolate({
            inputRange: range,
            outputRange: ['-4deg', '0deg', '4deg'],
            extrapolate: 'clamp',
          });
          const scale = offset.interpolate({
            inputRange: range,
            outputRange: [0.97, 1, 0.97],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[styles.page, { width, transform: [{ rotate }, { scale }] }]}
            >
              {i >= END_INDEX ? (
                <EndFace onRestart={restart} styles={styles} />
              ) : (
                <CardFace card={CARDS[i]} />
              )}
            </Animated.View>
          );
        })}
      </Animated.View>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.backdrop,
      paddingVertical: 16,
      overflow: 'hidden',
    },
    introRoot: {
      flex: 1,
      backgroundColor: theme.backdrop,
      paddingHorizontal: 12,
      paddingVertical: 16,
      justifyContent: 'center',
    },
    row: {
      flex: 1,
      flexDirection: 'row',
    },
    page: {
      height: '100%',
      paddingHorizontal: 12,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.55,
          shadowRadius: 20,
          shadowOffset: { width: -8, height: 0 },
        },
        android: { elevation: 14 },
      }),
    },

    back: {
      position: 'absolute',
      top: 14,
      left: 18,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    backText: {
      color: theme.inkFaint,
      fontSize: 30,
      lineHeight: 34,
    },

    endBody: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    endLead: {
      color: theme.ink,
      fontSize: 25,
      lineHeight: 44,
      letterSpacing: 2,
      textAlign: 'center',
    },
    endDots: {
      color: theme.accent,
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
      color: theme.inkSoft,
      fontSize: 15,
      letterSpacing: 3,
    },

    introBody: {
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    introLead: {
      color: theme.ink,
      fontSize: 22,
      lineHeight: 38,
      letterSpacing: 1.5,
    },
    introRule: {
      width: 56,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.accentFaint,
      marginVertical: 26,
    },
    introSub: {
      color: theme.inkSoft,
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
      borderColor: theme.accent,
    },
    startText: {
      color: theme.accent,
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
      color: theme.inkFaint,
      fontSize: 12,
      letterSpacing: 1,
    },
  });
}
