const { colors, radii, spacing, fonts, sizes } = require('./src/theme/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // The app is dark-only; 'class' stops NativeWind's web runtime from fighting the browser's scheme.
  darkMode: 'class',
  theme: {
    extend: {
      colors,
      borderRadius: radii,
      spacing: { ...spacing, touch: sizes.touch },
      // Each weight is its own family on native, so weights are chosen by family, never by font-weight.
      fontFamily: {
        'ui-light': [fonts.light],
        ui: [fonts.regular],
        'ui-medium': [fonts.medium],
        'ui-semibold': [fonts.semibold],
      },
    },
  },
  plugins: [],
};
