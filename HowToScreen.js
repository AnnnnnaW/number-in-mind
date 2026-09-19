import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CARDS, MAX_NUMBER } from './cards';
import { useTheme } from './ThemeContext';
import { BackLink, PillButton } from './ui';
import { t } from './i18n';

/**
 * 遊び方。ホーム右上の「？」から開く。
 * 種明かしそのものは書かず、ホームのどこかに隠れていることだけ伝える。
 */

export default function HowToScreen({ onClose }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const vars = { max: MAX_NUMBER, count: CARDS.length };

  return (
    <SafeAreaView style={styles.root}>
      <BackLink onPress={onClose} style={styles.back} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{t('howto.title')}</Text>

        <Text style={styles.h}>{t('howto.performTitle')}</Text>
        <Text style={styles.p}>{t('howto.perform1', vars)}</Text>
        <Text style={styles.p}>{t('howto.perform2')}</Text>
        <Text style={styles.p}>{t('howto.perform3', vars)}</Text>

        <Text style={styles.h}>{t('howto.guessTitle')}</Text>
        <Text style={styles.p}>{t('howto.guess1')}</Text>
        <Text style={styles.p}>{t('howto.guess2')}</Text>

        <View style={styles.secret}>
          <Text style={styles.secretText}>{t('howto.secret1')}</Text>
          <Text style={styles.secretText}>{t('howto.secret2')}</Text>
        </View>

        <PillButton onPress={onClose} style={styles.primary} textStyle={styles.primaryText}>
          {t('common.close')}
        </PillButton>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.backdrop },
    body: { paddingTop: 44, paddingBottom: 50, paddingHorizontal: 36 },

    back: { top: 60, left: 18, paddingVertical: 4 },

    title: {
      color: theme.ink,
      fontSize: 26,
      letterSpacing: 6,
      textAlign: 'center',
      marginBottom: 10,
      marginLeft: 6,
    },

    h: {
      color: theme.accent,
      fontSize: 16,
      letterSpacing: 2,
      textAlign: 'center',
      marginTop: 30,
      marginBottom: 12,
    },
    p: {
      color: theme.inkSoft,
      fontSize: 16,
      lineHeight: 28,
      letterSpacing: 0.6,
      marginTop: 8,
    },

    secret: {
      marginTop: 34,
      paddingTop: 22,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.inkLine,
      alignItems: 'center',
    },
    secretText: {
      color: theme.ink,
      fontSize: 16,
      lineHeight: 28,
      letterSpacing: 1,
      textAlign: 'center',
    },

    primary: { marginTop: 30, paddingVertical: 14, paddingHorizontal: 52 },
    primaryText: { fontSize: 15 },
  });
}
