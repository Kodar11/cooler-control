/**
 * Design tokens — the single source of truth for the visual system.
 * Plain CommonJS so both tailwind.config.js and the app can read it.
 */

const colors = {
  // Surfaces, darkest to lightest
  bg: '#07090D',
  sunken: '#0A0E14',
  surface: '#0F141B',
  raised: '#161D27',
  line: '#1C2531',
  lineStrong: '#2B3746',

  // Text
  ink: '#F1F5F9',
  inkMuted: '#8D9AAB',
  inkFaint: '#5B6779',

  // The single brand accent: cold air
  accent: '#5ECFFF',
  accentDeep: '#1C8FCC',
  accentWash: '#0D2533',
  onAccent: '#04141D',

  // Status
  good: '#5FDDA6',
  warn: '#F2B55A',
  danger: '#FF7A70',
  dangerWash: '#2A1416',
};

const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

const spacing = {
  gutter: 20, // horizontal screen padding
  gap: 12, // space between sibling surfaces
  card: 18, // inner padding of a surface
};

const fonts = {
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
};

const durations = {
  fast: 140,
  base: 240,
  slow: 520,
  value: 700, // numeric readouts easing to a new reading
};

const sizes = {
  touch: 48, // minimum touch target
  tabBar: 62,
};

module.exports = { colors, radii, spacing, fonts, durations, sizes };
