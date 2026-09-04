import React from 'react';
import { Text, View } from 'react-native';

import { PillButton } from './ui';
import { t } from './i18n';

/**
 * 6枚すべて「ない」と答えられたときの聞き直し画面。
 * イントロとあてっこモードで文言・見た目ともに完全に同じなので共通化してある。
 *
 * styles はイントロ・あてっこモードそれぞれの makeStyles(theme) が持つ
 * introBody / introLead / introRule / introSub を使う。
 * ボタンは ui.js の PillButton を使い、buttonStyle / buttonTextStyle で
 * 呼び出し側の余白・letterSpacing の違いだけを上書きする。
 */
export function AllNoRetry({ onRetry, styles, buttonStyle, buttonTextStyle }) {
  return (
    <>
      <View style={styles.introBody}>
        <Text style={styles.introLead}>{t('intro.oops')}</Text>
        <View style={styles.introRule} />
        <Text style={styles.introSub}>{t('intro.allNo1')}</Text>
        <Text style={styles.introSub}>{t('intro.allNo2')}</Text>
        <Text style={styles.introSub}>{t('intro.allNo3')}</Text>
      </View>
      <PillButton onPress={onRetry} style={buttonStyle} textStyle={buttonTextStyle}>
        {t('common.again')}
      </PillButton>
    </>
  );
}
