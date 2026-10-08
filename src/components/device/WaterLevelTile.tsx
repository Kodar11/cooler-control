import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Surface } from '@/components/ui/Surface';
import { Txt } from '@/components/ui/Txt';
import { describeWaterLevel } from '@/lib/describe';
import { colors, durations, radii } from '@/theme';

const TANK_WIDTH = 46;
const TANK_HEIGHT = 84;
const WAVE_HEIGHT = 6;
const MARKS = [0.25, 0.5, 0.75];

/** Two wavelengths wide, so sliding it left by one tank width loops seamlessly. */
const WAVE_PATH = (() => {
  const w = TANK_WIDTH;
  const h = WAVE_HEIGHT;
  const crest = (x: number) => `Q ${x + w / 4} 0 ${x + w / 2} ${h / 2} T ${x + w} ${h / 2}`;
  return `M 0 ${h / 2} ${crest(0)} ${crest(w)} V ${h + 1} H 0 Z`;
})();

interface WaterLevelTileProps {
  /** % of tank capacity, or `null` when there is no reading. */
  level: number | null;
}

/**
 * Tank level. This component only renders the number it is given — it neither knows nor
 * cares whether that number is modelled or measured.
 */
export function WaterLevelTile({ level }: WaterLevelTileProps) {
  const rounded = level === null ? null : Math.round(level);
  const copy = rounded === null ? null : describeWaterLevel(rounded);
  const fillColor = copy?.low ? colors.warn : colors.accentDeep;

  const fill = useSharedValue((level ?? 0) / 100);
  useEffect(() => {
    fill.value = withTiming((level ?? 0) / 100, { duration: durations.slow, easing: Easing.out(Easing.cubic) });
  }, [level, fill]);

  const drift = useSharedValue(0);
  const hasWater = level !== null && level > 0;
  useEffect(() => {
    if (hasWater) {
      drift.value = 0;
      drift.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(drift);
    }
    return () => cancelAnimation(drift);
  }, [hasWater, drift]);

  const fillStyle = useAnimatedStyle(() => ({ height: fill.value * (TANK_HEIGHT - WAVE_HEIGHT) }));
  const waveStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -drift.value * TANK_WIDTH }] }));

  return (
    <Surface
      className="flex-1 gap-3"
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        rounded === null || !copy ? 'Water level: no reading' : `Water level: ${rounded} percent, ${copy.label}`
      }>
      <Txt variant="label">Water level</Txt>

      <View className="flex-1 flex-row items-end justify-between gap-2">
        <View className="shrink">
          <View className="flex-row items-baseline gap-1">
            <Txt variant="value" tone={rounded === null ? 'faint' : 'ink'}>
              {rounded ?? '––'}
            </Txt>
            {rounded !== null && <Txt variant="unit">%</Txt>}
          </View>
          <Txt variant="caption" tone={copy?.low ? 'warn' : 'muted'}>
            {copy?.label ?? 'No reading'}
          </Txt>
        </View>

        <View style={styles.tank}>
          {hasWater && (
            <Animated.View style={[styles.water, { backgroundColor: fillColor }, fillStyle]}>
              <Animated.View style={[styles.wave, waveStyle]}>
                <Svg width={TANK_WIDTH * 2} height={WAVE_HEIGHT + 1}>
                  <Path d={WAVE_PATH} fill={fillColor} />
                </Svg>
              </Animated.View>
            </Animated.View>
          )}
          {MARKS.map((mark) => (
            <View key={mark} style={[styles.mark, { bottom: mark * TANK_HEIGHT }]} />
          ))}
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  tank: {
    width: TANK_WIDTH,
    height: TANK_HEIGHT,
    borderRadius: radii.sm + 2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.sunken,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  water: {
    width: '100%',
    opacity: 0.9,
  },
  wave: {
    position: 'absolute',
    top: -WAVE_HEIGHT,
    left: 0,
    width: TANK_WIDTH * 2,
  },
  mark: {
    position: 'absolute',
    right: 0,
    width: 8,
    height: 1,
    backgroundColor: colors.inkFaint,
    opacity: 0.6,
  },
});
