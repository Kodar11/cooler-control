import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui/Txt';
import { useToastStore, type ToastTone } from '@/store/toastStore';
import { colors, durations, radii, sizes } from '@/theme';

const VISIBLE_MS = 2400;

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const TONES: Record<ToastTone, { icon: IconName; color: string }> = {
  neutral: { icon: 'information-outline', color: colors.inkMuted },
  success: { icon: 'check-circle-outline', color: colors.good },
  warning: { icon: 'alert-circle-outline', color: colors.warn },
};

/** Renders the current toast above everything else. Mounted once, in the root layout. */
export function ToastHost() {
  const toast = useToastStore((state) => state.toast);
  const dismiss = useToastStore((state) => state.dismiss);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismiss(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <View style={[styles.host, { bottom: insets.bottom + sizes.tabBar + 14 }]} pointerEvents="none">
      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(durations.base)}
          exiting={FadeOutDown.duration(durations.fast)}
          style={styles.toast}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert">
          <MaterialCommunityIcons name={TONES[toast.tone].icon} size={18} color={TONES[toast.tone].color} />
          <Txt variant="caption" tone="ink" className="shrink font-ui-medium">
            {toast.message}
          </Txt>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.raised,
    elevation: 6,
  },
});
