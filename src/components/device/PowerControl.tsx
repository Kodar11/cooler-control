import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { haptics } from '@/lib/haptics';
import { colors, durations, radii, spacing } from '@/theme';

const BUTTON = 56;

interface PowerControlProps {
  on: boolean;
  disabled: boolean;
  onChange: (on: boolean) => void;
}

/** The master switch. The whole bar is the button; it lights up when the cooler runs. */
export function PowerControl({ on, disabled, onChange }: PowerControlProps) {
  const progress = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(on ? 1 : 0, { duration: durations.base });
  }, [on, progress]);

  const barStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.surface, colors.accentWash]),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.line, colors.accentDeep]),
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.raised, colors.accent]),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.lineStrong, colors.accent]),
  }));

  return (
    <View className={disabled ? 'opacity-40' : ''}>
      <PressableScale
        accessibilityRole="switch"
        accessibilityLabel="Cooler power"
        accessibilityState={{ checked: on, disabled }}
        accessibilityHint={on ? 'Turns the cooler off' : 'Turns the cooler on'}
        disabled={disabled}
        onPress={() => {
          haptics.heavy();
          onChange(!on);
        }}
        scaleTo={0.98}
        style={[styles.bar, barStyle]}>
        <Animated.View style={[styles.button, buttonStyle]}>
          <MaterialCommunityIcons name="power" size={28} color={on ? colors.onAccent : colors.inkMuted} />
        </Animated.View>
        <View className="flex-1">
          <Txt variant="label">Cooler</Txt>
          <Txt variant="value" className="text-[26px] leading-[32px]">
            {on ? 'On' : 'Off'}
          </Txt>
        </View>
        <Txt variant="caption" tone={on ? 'accent' : 'muted'}>
          {on ? 'Tap to turn off' : 'Tap to turn on'}
        </Txt>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 14,
    paddingRight: spacing.card,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
