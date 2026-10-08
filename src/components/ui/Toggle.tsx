import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, durations, radii } from '@/theme';

const WIDTH = 54;
const HEIGHT = 32;
const KNOB = 24;
const INSET = (HEIGHT - KNOB) / 2;

/**
 * The visual half of a switch. It is deliberately not pressable: the row that contains it
 * is the touch target and carries the accessibility role.
 */
export function Toggle({ value }: { value: boolean }) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: durations.base });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.lineStrong, colors.accent]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (WIDTH - KNOB - INSET * 2) }],
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.inkMuted, colors.onAccent]),
  }));

  return (
    <Animated.View style={[styles.track, trackStyle]}>
      <Animated.View style={[styles.knob, knobStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: radii.pill,
    padding: INSET,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: radii.pill,
  },
});
