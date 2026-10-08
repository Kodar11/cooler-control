import { useEffect } from 'react';
import { StyleSheet, View, type AccessibilityActionEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { clamp } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { colors, durations, radii } from '@/theme';

const TRACK_HEIGHT = 60;
const HANDLE_WIDTH = 4;
const HANDLE_HEIGHT = 26;
/** How far the handle stays from either end of the track. */
const HANDLE_INSET = 14;
/** Accessibility increment, in percentage points. */
const STEP = 5;
/** Values that give a haptic tick when crossed. */
const DETENT = 25;

interface FanSliderProps {
  /** 0–100. */
  value: number;
  disabled?: boolean;
  /** Fires continuously while dragging. */
  onChange: (value: number) => void;
  /** Fires once when the user lets go, with the final value. */
  onCommit: (value: number) => void;
}

/**
 * A wide, thumb-sized slider. The fill follows the finger on the UI thread; whole-percent
 * changes are reported to JS. A short stub of fill always remains so the handle has a home at 0.
 */
export function FanSlider({ value, disabled = false, onChange, onCommit }: FanSliderProps) {
  const width = useSharedValue(0);
  const progress = useSharedValue(value / 100);
  const dragging = useSharedValue(false);
  const startProgress = useSharedValue(0);
  const reported = useSharedValue(value);

  // Follow values that arrive from the device, unless the user's finger is on the track.
  useEffect(() => {
    if (dragging.get()) return;
    reported.set(value);
    progress.set(withTiming(value / 100, { duration: durations.base }));
  }, [value, dragging, progress, reported]);

  const report = (next: number, previous: number) => {
    if (Math.floor(next / DETENT) !== Math.floor(previous / DETENT) || next === 0 || next === 100) {
      haptics.tick();
    }
    onChange(next);
  };

  const moveTo = (next: number) => {
    'worklet';
    const clamped = Math.min(1, Math.max(0, next));
    progress.set(clamped);
    const percent = Math.round(clamped * 100);
    if (percent !== reported.get()) {
      const previous = reported.get();
      reported.set(percent);
      runOnJS(report)(percent, previous);
    }
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    // Claim only clearly horizontal drags, so the page can still scroll through the slider.
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onStart(() => {
      dragging.set(true);
      startProgress.set(progress.get());
    })
    .onUpdate((event) => {
      if (width.get() <= 0) return;
      moveTo(startProgress.get() + event.translationX / (width.get() - HANDLE_INSET * 2));
    })
    .onFinalize(() => {
      if (!dragging.get()) return;
      dragging.set(false);
      // Commit even if the gesture was interrupted, so the device always matches what is shown.
      runOnJS(onCommit)(reported.get());
    });

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(400)
    .onEnd((event, success) => {
      if (!success || width.get() <= 0) return;
      const target = (event.x - HANDLE_INSET) / (width.get() - HANDLE_INSET * 2);
      const percent = Math.round(Math.min(1, Math.max(0, target)) * 100);
      progress.set(withTiming(percent / 100, { duration: durations.base }));
      if (percent !== reported.get()) {
        const previous = reported.get();
        reported.set(percent);
        runOnJS(report)(percent, previous);
      }
      runOnJS(onCommit)(percent);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: HANDLE_INSET + progress.get() * (width.get() - HANDLE_INSET * 2) + HANDLE_INSET,
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 0.03, 1],
      [colors.lineStrong, colors.accentDeep, colors.accent],
    ),
  }));

  const handleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 0.03], [colors.inkMuted, colors.onAccent]),
    transform: [
      { translateX: HANDLE_INSET + progress.get() * (width.get() - HANDLE_INSET * 2) - HANDLE_WIDTH / 2 },
      { scaleY: withTiming(dragging.get() ? 1.25 : 1, { duration: durations.fast }) },
    ],
  }));

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    const direction = event.nativeEvent.actionName === 'increment' ? 1 : -1;
    const next = clamp(value + direction * STEP, 0, 100);
    onChange(next);
    onCommit(next);
  };

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <View
        style={styles.track}
        onLayout={(event) => {
          width.set(event.nativeEvent.layout.width);
        }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Fan speed"
        accessibilityValue={{ min: 0, max: 100, now: value, text: `${value} percent` }}
        accessibilityState={{ disabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAccessibilityAction}>
        <Animated.View style={[styles.fill, fillStyle]} />
        <Animated.View style={[styles.handle, handleStyle]} pointerEvents="none" />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.sunken,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radii.md - 2,
  },
  handle: {
    position: 'absolute',
    left: 0,
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: radii.pill,
  },
});
