import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  /** Unlocked by tapping the app version; reveals diagnostics in Settings. */
  developerMode: boolean;
  setDeveloperMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      developerMode: false,
      setDeveloperMode: (developerMode) => set({ developerMode }),
    }),
    {
      name: 'cooler-control/settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
