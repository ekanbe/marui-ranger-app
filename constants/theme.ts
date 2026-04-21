import { Platform } from 'react-native';

export const Brand = {
  navy: '#1E3A5F',
  navyDark: '#0A2540',
  navyLight: '#3B5B8C',
  navyDeep: '#05162B',
  gold: '#C9A876',
  goldLight: '#E8D4A8',
};

export const Ink = {
  900: '#1A1A1A',
  700: '#333333',
  500: '#6B7280',
  300: '#D1D5DB',
  100: '#F3F4F6',
  50:  '#F9FAFB',
};

export const Accent = {
  emerald: '#10B981',
  emeraldLight: '#6EE7B7',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
};

const tintColorLight = Brand.navy;
const tintColorDark = Brand.gold;

export const Colors = {
  light: {
    text: Ink[900],
    subtext: Ink[500],
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: Ink[50],
    border: Ink[100],
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
    border: '#1F3558',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

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
});

export const Radius = { sm: 8, md: 14, lg: 20, xl: 28, full: 9999 };
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
