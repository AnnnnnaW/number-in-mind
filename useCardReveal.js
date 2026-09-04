import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { CARDS } from './cards';
import { sumOf } from './solve';

/**
 * 「カードを1枚ずつ見せて ある/ない を聞き、最後に数字を言い当てる」の共通ロジック。
 *
 * イントロ（初回だけ・見せたら種明かしへ誘導）と、あてっこモード（何度でもループ）の
 * 両方が使う。この2つは「見せ方」が違うだけで「当て方」はまったく同じなので、
 * ロジックだけをここに切り出し、JSX は呼び出し側がそれぞれの流れに合わせて組み立てる。
 *
 * ここで sumOf（solve.js）を呼ぶ＝アプリが答えを計算する。イントロ・あてっこモードは
 * どちらも「アプリのほうが手品をする」体験なのでこれでよい。
 * ただし本番（PerformanceScreen）からは今までどおり一切 import しない。
 */

const OUT_MS = 240;
const IN_MS = 260;

export function useCardReveal() {
  const [stage, setStage] = useState('asking'); // 'asking' | 'reveal'
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState([]);
  const [revealDone, setRevealDone] = useState(false);

  const shift = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  const titleIn = useRef(new Animated.Value(0)).current;
  const numberIn = useRef(new Animated.Value(0)).current;
  const tailIn = useRef(new Animated.Value(0)).current;

  const number = sumOf(picks);

  /**
   * ASKING に戻す。「もう一度」でも「全部ないので聞き直し」でも、必ずここを通す。
   * reveal 演出の Animated 値を戻さないと、2回目以降フェードインせず
   * 数字がいきなり出た状態で表示されてしまう（値が前回の 1 のまま残るため）。
   */
  const reset = useCallback(() => {
    setPicks([]);
    setIndex(0);
    setRevealDone(false);
    titleIn.setValue(0);
    numberIn.setValue(0);
    tailIn.setValue(0);
    shift.setValue(0);
    busy.current = false;
    setStage('asking');
  }, [titleIn, numberIn, tailIn, shift]);

  const answer = useCallback(
    (yes) => {
      if (busy.current) return;
      busy.current = true;
      const card = CARDS[index];

      Animated.timing(shift, {
        toValue: -1,
        duration: OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setPicks((prev) => [...prev, { bit: card.bit, yes }]);

        if (index + 1 >= CARDS.length) {
          setStage('reveal');
          shift.setValue(0);
          busy.current = false;
          return;
        }

        setIndex(index + 1);
        shift.setValue(1);
        Animated.timing(shift, {
          toValue: 0,
          duration: IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          busy.current = false;
        });
      });
    },
    [index, shift]
  );

  // 「あなたが思い浮かべたのは」→ 数字 → 「ですね？」の順に出す
  useEffect(() => {
    if (stage !== 'reveal') return undefined;
    const anim = Animated.sequence([
      Animated.delay(500),
      Animated.timing(titleIn, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(1100),
      // バネで跳ねさせず、ゆっくり滲み出させる。
      // わずかに大きい状態から等倍へ沈み込むので、飛び出さずに「像を結ぶ」感じになる
      Animated.timing(numberIn, {
        toValue: 1,
        duration: 1700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(600),
      Animated.timing(tailIn, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    anim.start(() => setRevealDone(true));
    return () => anim.stop();
  }, [stage, titleIn, numberIn, tailIn]);

  return {
    stage,
    index,
    picks,
    number,
    revealDone,
    shift,
    titleIn,
    numberIn,
    tailIn,
    answer,
    reset,
  };
}
