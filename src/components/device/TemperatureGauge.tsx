import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

import { Txt } from '@/components/ui/Txt';
import { useSmoothedNumber } from '@/hooks/useSmoothedNumber';
import { clamp } from '@/lib/format';
import { colors, durations, fonts } from '@/theme';

/** The range the dial covers, in °C. Readings outside it pin to the ends. */
const SCALE_MIN = 16;
const SCALE_MAX = 44;

/** The dial is three quarters of a circle, open at the bottom. */
const SWEEP = 0.75;
const START_ANGLE = 135;
const STROKE = 10;
const KNOB_RADIUS = 7;
const KNOB_HALO = 14;

interface TemperatureGaugeProps {
  /** °C, or `null` when there is no live reading. */
  temperature: number | null;
  /** Whether the cooler is running; drives the dial's colour and glow. */
  active: boolean;
  /** One line under the reading, e.g. "Cooling · Fan 65%". */
  status: string;
  size: number;
}

export function TemperatureGauge({ temperature, active, status, size }: TemperatureGaugeProps) {
  const shown = useSmoothedNumber(temperature);

  const glow = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    glow.value = withTiming(active ? 1 : 0, { duration: durations.slow });
  }, [active, glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const center = size / 2;
  const radius = center - KNOB_HALO - 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * SWEEP;

  const progress = shown === null ? null : clamp((shown - SCALE_MIN) / (SCALE_MAX - SCALE_MIN), 0, 1);
  const knobAngle = ((START_ANGLE + 360 * SWEEP * (progress ?? 0)) * Math.PI) / 180;
  const knobX = center + radius * Math.cos(knobAngle);
  const knobY = center + radius * Math.sin(knobAngle);

  // The open quarter at the bottom is dead space, so the frame stops just below the arc's ends.
  const endY = center + radius * Math.SQRT1_2;
  const endOffset = center - radius * Math.SQRT1_2;
  const height = endY + 34;

  const [whole, fraction] = shown === null ? ['––', ''] : shown.toFixed(1).split('.');
  const spoken = temperature === null ? 'No reading' : `${temperature.toFixed(1)} degrees Celsius`;

  return (
    <View
      style={{ width: size, height }}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Cabin temperature: ${spoken}. ${status}`}>
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="gaugeGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0.35" stopColor={colors.accent} stopOpacity={0.13} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={center} cy={center} r={center} fill="url(#gaugeGlow)" />
        </Svg>
      </Animated.View>

      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="gaugeArc" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.accentDeep} />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.line}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
          transform={`rotate(${START_ANGLE} ${center} ${center})`}
        />
        {progress !== null && (
          <>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={active ? 'url(#gaugeArc)' : colors.lineStrong}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${arc * progress} ${circumference}`}
              transform={`rotate(${START_ANGLE} ${center} ${center})`}
            />
            <Circle
              cx={knobX}
              cy={knobY}
              r={KNOB_HALO}
              fill={active ? colors.accent : colors.inkMuted}
              opacity={0.16}
            />
            <Circle cx={knobX} cy={knobY} r={KNOB_RADIUS} fill={active ? colors.ink : colors.inkMuted} />
          </>
        )}
      </Svg>

      <View style={[styles.readout, { height: size }]} pointerEvents="none">
        <Txt variant="label">Cabin</Txt>
        <View className="flex-row items-start">
          <Text style={[styles.whole, shown === null && styles.empty]} maxFontSizeMultiplier={1.1}>
            {whole}
          </Text>
          {shown !== null && (
            <Text style={styles.fraction} maxFontSizeMultiplier={1.1}>
              .{fraction}°
            </Text>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          <View className={`h-1.5 w-1.5 rounded-pill ${active ? 'bg-accent' : 'bg-inkFaint'}`} />
          <Txt variant="caption" tone={active ? 'ink' : 'muted'}>
            {status}
          </Txt>
        </View>
      </View>

      <View style={[styles.scale, { top: endY + 12, left: endOffset - 20, right: endOffset - 20 }]} pointerEvents="none">
        <Txt variant="caption" tone="faint" className="w-10 text-center">
          {SCALE_MIN}°
        </Txt>
        <Txt variant="caption" tone="faint" className="w-10 text-center">
          {SCALE_MAX}°
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  scale: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  whole: {
    fontFamily: fonts.light,
    fontSize: 88,
    lineHeight: 96,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  empty: {
    color: colors.inkFaint,
    letterSpacing: 0,
  },
  fraction: {
    fontFamily: fonts.light,
    fontSize: 34,
    lineHeight: 40,
    marginTop: 16,
    color: colors.inkMuted,
    fontVariant: ['tabular-nums'],
  },
});
