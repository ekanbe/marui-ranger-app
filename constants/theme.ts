import { Platform, TextStyle, ViewStyle } from 'react-native';

// ============================================================
// ブランドカラー
// ============================================================
export const Brand = {
  navy: '#1E3A5F',
  navyDark: '#0A2540',
  navyLight: '#3B5B8C',
  navyDeep: '#05162B',
  gold: '#C9A876',
  goldLight: '#E8D4A8',
  goldDark: '#A68855',
};

// ============================================================
// Ink（テキスト・背景用グレースケール）10段階
// ============================================================
export const Ink = {
  950: '#0B0B0C',
  900: '#111214',
  800: '#1F2024',
  700: '#333438',
  600: '#4B4D54',
  500: '#6B7280',
  400: '#9CA3AF',
  300: '#D1D5DB',
  200: '#E5E7EB',
  100: '#F1F3F5',
  50:  '#F8FAFC',
};

// ============================================================
// アクセント（ステータス・セマンティック）
// ============================================================
export const Accent = {
  emerald: '#10B981',
  emeraldLight: '#6EE7B7',
  emeraldDark: '#059669',
  amber: '#F59E0B',
  amberLight: '#FCD34D',
  red: '#EF4444',
  redLight: '#FCA5A5',
  blue: '#3B82F6',
  blueLight: '#93C5FD',
  violet: '#8B5CF6',
  violetLight: '#C4B5FD',
};

// ============================================================
// Appetite（食欲を刺激する暖色系・食品アプリ専用）
// ============================================================
export const Appetite = {
  ember: '#EA580C',        // CTA・ホットアクション
  emberLight: '#FB923C',
  coral: '#FB7185',        // 新着・ホット表示
  coralLight: '#FDA4AF',
  amber: '#F59E0B',        // 推薦バッジ
  amberSoft: '#FEF3C7',
  honey: '#FCD34D',
  tomato: '#E11D48',
};

// ============================================================
// ランク別カラー
// ============================================================
export const RankColor = {
  platinum: '#8B7FB3',
  platinumBg: 'rgba(139,127,179,0.12)',
  gold: Brand.gold,
  goldBg: 'rgba(201,168,118,0.12)',
  silver: '#9CA3AF',
  silverBg: 'rgba(156,163,175,0.12)',
  bronze: '#B8764A',
  bronzeBg: 'rgba(184,118,74,0.12)',
};

// ============================================================
// Colors（テーマ切り替え用）
// ============================================================
const tintColorLight = Brand.navy;
const tintColorDark = Brand.gold;

export const Colors = {
  light: {
    text: Ink[900],
    subtext: Ink[500],
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: Ink[50],
    surfaceMuted: Ink[100],
    border: Ink[200],
    borderSoft: Ink[100],
    tint: tintColorLight,
    icon: Ink[500],
    tabIconDefault: Ink[500],
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    subtext: '#9BA1A6',
    background: Brand.navyDeep,
    surface: '#0F1E35',
    surfaceAlt: '#142849',
    surfaceMuted: '#1A2F54',
    border: '#1F3558',
    borderSoft: '#142849',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// ============================================================
// タイポグラフィ
// ============================================================
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Noto Sans JP', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
})!;

export const Type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as TextStyle['fontWeight'], letterSpacing: -0.5 },
  h1:      { fontSize: 24, lineHeight: 30, fontWeight: '800' as TextStyle['fontWeight'], letterSpacing: -0.3 },
  h2:      { fontSize: 18, lineHeight: 24, fontWeight: '700' as TextStyle['fontWeight'] },
  h3:      { fontSize: 15, lineHeight: 20, fontWeight: '700' as TextStyle['fontWeight'] },
  body:    { fontSize: 14, lineHeight: 20, fontWeight: '500' as TextStyle['fontWeight'] },
  bodyBold: { fontSize: 14, lineHeight: 20, fontWeight: '700' as TextStyle['fontWeight'] },
  meta:    { fontSize: 11, lineHeight: 16, fontWeight: '500' as TextStyle['fontWeight'] },
  metaBold: { fontSize: 11, lineHeight: 16, fontWeight: '700' as TextStyle['fontWeight'] },
  label:   { fontSize: 10, lineHeight: 14, fontWeight: '700' as TextStyle['fontWeight'], letterSpacing: 1 },
  number:  { fontSize: 22, lineHeight: 26, fontWeight: '800' as TextStyle['fontWeight'], letterSpacing: -0.3 },
  numberLg: { fontSize: 36, lineHeight: 40, fontWeight: '800' as TextStyle['fontWeight'], letterSpacing: -1 },
  numberXl: { fontSize: 48, lineHeight: 52, fontWeight: '800' as TextStyle['fontWeight'], letterSpacing: -1.5 },
};

// ============================================================
// スペーシング（8pxグリッド）
// ============================================================
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
};

// ============================================================
// コーナー
// ============================================================
export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 36,
  full: 9999,
};

// ============================================================
// シャドウ（iOS/Android/Web対応）
// ============================================================
export const Shadow: Record<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'hero', ViewStyle> = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
  hero: {
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 8,
  },
};

// ============================================================
// トランジション（Reanimatedで使用する秒数）
// ============================================================
export const Motion = {
  fast: 150,
  base: 220,
  slow: 360,
  hero: 480,
};

// ============================================================
// グラス効果（iOS 15+ BlurView用のフォールバック）
// ============================================================
export const Glass = {
  soft:   { backgroundColor: 'rgba(255,255,255,0.72)' },
  medium: { backgroundColor: 'rgba(255,255,255,0.86)' },
  strong: { backgroundColor: 'rgba(255,255,255,0.94)' },
  dark:   { backgroundColor: 'rgba(10,37,64,0.72)' },
};
