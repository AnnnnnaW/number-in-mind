import { Platform } from 'react-native';

/**
 * 配色とフォントのプリセット。
 *
 * 各パレットは ui.js の元の `C` と同じキーを持つ。
 * どれを選んでも、カードの見た目・文字色・強調色が一式で入れ替わる。
 */

export const PALETTES = {
  gold: {
    id: 'gold',
    label: '紺 × 金',
    backdrop: '#05070F',
    cardTop: '#1B2C63',
    cardBottom: '#101B44',
    accent: '#C9A75A',
    accentFaint: 'rgba(201,167,90,0.34)',
    accentWash: 'rgba(201,167,90,0.12)',
    ink: '#F5F2E8',
    inkSoft: 'rgba(245,242,232,0.55)',
    inkFaint: 'rgba(245,242,232,0.28)',
    inkLine: 'rgba(245,242,232,0.12)',
    yes: '#FFD98A',
    no: 'rgba(245,242,232,0.3)',
  },
  crimson: {
    id: 'crimson',
    label: '深紅 × 銀',
    backdrop: '#0D0607',
    cardTop: '#5A1620',
    cardBottom: '#3A0E15',
    accent: '#E4C9C9',
    accentFaint: 'rgba(228,201,201,0.34)',
    accentWash: 'rgba(228,201,201,0.12)',
    ink: '#F7EEEE',
    inkSoft: 'rgba(247,238,238,0.55)',
    inkFaint: 'rgba(247,238,238,0.28)',
    inkLine: 'rgba(247,238,238,0.12)',
    yes: '#FF9F9F',
    no: 'rgba(247,238,238,0.3)',
  },
  ivory: {
    id: 'ivory',
    label: '墨 × 白',
    backdrop: '#F4F1EA',
    cardTop: '#FFFFFF',
    cardBottom: '#EDE8DC',
    accent: '#8A6D1B',
    accentFaint: 'rgba(138,109,27,0.34)',
    accentWash: 'rgba(138,109,27,0.10)',
    ink: '#17140D',
    inkSoft: 'rgba(23,20,13,0.6)',
    inkFaint: 'rgba(23,20,13,0.32)',
    inkLine: 'rgba(23,20,13,0.14)',
    yes: '#8A6D1B',
    no: 'rgba(23,20,13,0.32)',
  },
};

export const DEFAULT_PALETTE_ID = 'gold';

export const FONTS = {
  avenir: {
    id: 'avenir',
    label: 'Avenir Next',
    family: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: undefined }),
  },
  georgia: {
    id: 'georgia',
    label: 'Georgia',
    family: Platform.select({ ios: 'Georgia', android: 'serif', default: undefined }),
  },
  engraved: {
    id: 'engraved',
    label: '刻印',
    family: Platform.select({
      // iOS の「Academy Engraved LET」は、家族名ではなくこの PostScript 名でないと
      // 見つからないことがあるための指定（iosfonts.com 等で確認できる正式名）
      ios: 'AcademyEngravedLetPlain',
      android: 'serif',
      default: undefined,
    }),
  },
};

export const DEFAULT_FONT_ID = 'avenir';

/** #rrggbb を rgba(...) 文字列にする。既存コードの「同じ色の薄め」を全テーマで再現するため */
export function withAlpha(hex, alpha) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** パレット + フォントから、画面が実際に使う theme オブジェクトを組み立てる */
export function buildTheme(paletteId, fontId) {
  const palette = PALETTES[paletteId] || PALETTES[DEFAULT_PALETTE_ID];
  const font = FONTS[fontId] || FONTS[DEFAULT_FONT_ID];
  return {
    ...palette,
    numberFont: font.family,
    fontId: font.id,
    // 「同じ色の薄め」をよく使う分だけ、あらかじめ計算しておく
    accentWash10: withAlpha(palette.accent, 0.1),
    accentWash12: withAlpha(palette.accent, 0.12),
    accentWash14: withAlpha(palette.accent, 0.14),
    accentWash18: withAlpha(palette.accent, 0.18),
    accentWash22: withAlpha(palette.accent, 0.22),
    accentWash34: withAlpha(palette.accent, 0.34),
    accentWash55: withAlpha(palette.accent, 0.55),
    inkWash05: withAlpha(palette.ink, 0.05),
    inkWash08: withAlpha(palette.ink, 0.08),
    inkWash12: withAlpha(palette.ink, 0.12),
    inkWash16: withAlpha(palette.ink, 0.16),
    inkWash30: withAlpha(palette.ink, 0.3),
  };
}
