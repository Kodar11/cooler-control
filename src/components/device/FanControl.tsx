import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { Surface } from '@/components/ui/Surface';
import { Txt } from '@/components/ui/Txt';
import { describeFanSpeed } from '@/lib/describe';
import { colors } from '@/theme';

import { FanSlider } from './FanSlider';

const SCALE = [0, 25, 50, 75, 100];
const GLYPH = 18;

/** A fan icon that turns at a rate matching the setting, and rests when the fan is not running. */
function FanGlyph({ speed, running }: { speed: number; running: boolean }) {
  const angle = useSharedValue(0);
  /** Degrees per millisecond. */
  const rate = useSharedValue(0);

  useEffect(() => {
    rate.value = running ? 0.06 + (speed / 100) * 0.5 : 0;
  }, [running, speed, rate]);

  useFrameCallback((frame) => {
    if (rate.value === 0) return;
    angle.value = (angle.value + (frame.timeSincePreviousFrame ?? 16) * rate.value) % 360;
  });

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

  return (
    <Animated.View style={[styles.glyph, style]}>
      <MaterialCommunityIcons name="fan" size={GLYPH} color={running ? colors.accent : colors.inkFaint} />
    </Animated.View>
  );
}

interface FanControlProps {
  /** 0–100. */
  speed: number;
  disabled: boolean;
  /** Shown in place of the speed word when the control cannot be used. */
  disabledReason?: string;
  onPreview: (speed: number) => void;
  onCommit: (speed: number) => void;
}

export function FanControl({ speed, disabled, disabledReason, onPreview, onCommit }: FanControlProps) {
  const running = !disabled && speed > 0;

  return (
    <Surface className="gap-4">
      <View className="flex-row items-end justify-between">
        <View className="gap-1">
          <View className="flex-row items-center gap-2">
            <FanGlyph speed={speed} running={running} />
            <Txt variant="label">Fan speed</Txt>
          </View>
          <Txt variant="caption">{disabled && disabledReason ? disabledReason : describeFanSpeed(speed)}</Txt>
        </View>
        <View className={`flex-row items-baseline gap-1 ${disabled ? 'opacity-40' : ''}`}>
          <Txt variant="value" className="text-[40px] leading-[44px]" style={styles.tabular}>
            {speed}
          </Txt>
          <Txt variant="unit">%</Txt>
        </View>
      </View>

      <View className={`gap-2 ${disabled ? 'opacity-40' : ''}`}>
        <FanSlider value={speed} disabled={disabled} onChange={onPreview} onCommit={onCommit} />
        <View className="flex-row justify-between px-1" importantForAccessibility="no-hide-descendants">
          {SCALE.map((mark) => (
            <Txt key={mark} variant="caption" tone="faint" className="w-8 text-center text-[11px]">
              {mark}
            </Txt>
          ))}
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  glyph: {
    width: GLYPH,
    height: GLYPH,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
