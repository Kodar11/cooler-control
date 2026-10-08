import { Platform } from 'react-native';

import tokens from './tokens';

export const { colors, radii, spacing, fonts, durations, sizes } = tokens;

export const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export type ColorToken = keyof typeof colors;
