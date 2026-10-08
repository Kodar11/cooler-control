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

import { Txt } from '@/components/ui/Txt';
import { describeConnection } from '@/lib/describe';
import { useDeviceStore } from '@/store/deviceStore';
import { colors, radii } from '@/theme';

const DOT = 8;
const HALO = 20;

/** "● Connected · Cooler-AB12" — the one-line answer to "is it talking to my cooler?". */
export function ConnectionStatus() {
  const connection = useDeviceStore((state) => state.connection);
  const deviceInfo = useDeviceStore((state) => state.deviceInfo);
  const copy = describeConnection(connection, deviceInfo);
  const color = colors[copy.color];

  const pulse = useSharedValue(0);
  const searching = connection === 'connecting';

  useEffect(() => {
    if (searching) {
      pulse.value = 0;
      pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
    }
    return () => cancelAnimation(pulse);
  }, [searching, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: searching ? 0.5 * (1 - pulse.value) : 0.16,
    transform: [{ scale: searching ? 0.4 + pulse.value * 0.6 : 0.8 }],
  }));

  return (
    <View
      className="flex-row items-center gap-2"
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${copy.label}. ${copy.detail}`}>
      <View style={styles.indicator}>
        <Animated.View style={[styles.halo, { backgroundColor: color }, haloStyle]} />
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
      <Txt variant="caption" tone="ink" className="font-ui-medium">
        {copy.label}
      </Txt>
      <Txt variant="caption" tone="faint">
        ·
      </Txt>
      <Txt variant="caption" numberOfLines={1} className="shrink">
        {copy.detail}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    width: HALO,
    height: HALO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO,
    height: HALO,
    borderRadius: radii.pill,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
  },
});
