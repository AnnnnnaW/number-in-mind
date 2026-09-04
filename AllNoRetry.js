import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { t } from './i18n';

/**
 * 6枚すべて「ない」と答えられたときの聞き直し画面。
 * イントロとあてっこモードで文言・見た目ともに完全に同じなので共通化してある。
 *
 * styles はイントロ・あてっこモードそれぞれの makeStyles(theme) が持つ
 * introBody / introLead / introRule / introSub / startButton / startText を使う
 * （BackLink と同じ「呼び出し側の styles を受け取る」やり方）。
 */
export function AllNoRetry({ onRetry, styles }) {
  return (
    <>
      <View style={styles.introBody}>
        <Text style={styles.introLead}>{t('intro.oops')}</Text>
        <View style={styles.introRule} />
        <Text style={styles.introSub}>{t('intro.allNo1')}</Text>
        <Text style={styles.introSub}>{t('intro.allNo2')}</Text>
        <Text style={styles.introSub}>{t('intro.allNo3')}</Text>
      </View>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.55 }]}
      >
        <Text style={styles.startText}>{t('common.again')}</Text>
      </Pressable>
    </>
  );
}
