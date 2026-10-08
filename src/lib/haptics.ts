import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS !== 'web';

function fire(run: () => Promise<void>) {
  if (!enabled) return;
  run().catch(() => {
    // Haptics are a nicety; a device without a vibration motor must never surface an error.
  });
}

export const haptics = {
  /** Fine tick while scrubbing a control. */
  tick: () => fire(() => Haptics.selectionAsync()),
  /** A discrete control changed state. */
  toggle: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** The master control changed state. */
  heavy: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
