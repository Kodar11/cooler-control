import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type AnimatedStyle } from 'react-native-reanimated';

import { durations } from '@/theme';

interface PressableScaleProps extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  /** Layout of the touch target itself (e.g. `flex-1`). */
  className?: string;
  /** Style of the visible, scaling content. Accepts animated styles. */
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  scaleTo?: number;
}

/** A pressable whose content dips slightly under the finger. */
export function PressableScale({ children, style, scaleTo = 0.97, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
  }));

  return (
    <Pressable
      onPressIn={(event) => {
        pressed.value = withTiming(1, { duration: durations.fast });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withTiming(0, { duration: durations.base });
        onPressOut?.(event);
      }}
      {...rest}>
      <Animated.View style={[style, scaleStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
