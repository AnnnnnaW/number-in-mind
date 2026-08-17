import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import * as prefs from './prefs';
import { DEFAULT_FONT_ID, DEFAULT_PALETTE_ID, buildTheme } from './theme';

/**
 * 配色とフォントの選択を、アプリ全体に配る。
 *
 * 選択は prefs.js（AsyncStorage）に保存し、次回起動時も復元する。
 * 画面側は useTheme() で現在のテーマを読み、setPaletteId / setFontId で切り替える。
 */

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE_ID);
  const [fontId, setFontId] = useState(DEFAULT_FONT_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    prefs.load().then((p) => {
      if (!alive) return;
      if (p.paletteId) setPaletteId(p.paletteId);
      if (p.fontId) setFontId(p.fontId);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const theme = useMemo(() => buildTheme(paletteId, fontId), [paletteId, fontId]);

  const value = useMemo(
    () => ({
      theme,
      ready,
      paletteId,
      fontId,
      setPaletteId: (id) => {
        setPaletteId(id);
        prefs.update({ paletteId: id });
      },
      setFontId: (id) => {
        setFontId(id);
        prefs.update({ fontId: id });
      },
    }),
    [theme, ready, paletteId, fontId]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

/** 現在の配色・フォントを反映した theme オブジェクトを返す */
export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}

/** テーマの切り替え操作一式（設定画面から使う） */
export function useThemeSettings() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeSettings must be used within ThemeProvider');
  return ctx;
}
