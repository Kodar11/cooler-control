import '../../global.css';

import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  useFonts,
} from '@expo-google-fonts/outfit';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastHost } from '@/components/ToastHost';
import { logger } from '@/logging/logger';
import { useDeviceStore } from '@/store/deviceStore';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

let started = false;

/** One-time app start-up: runs once per launch, regardless of how often the layout mounts. */
function startApp() {
  if (started) return;
  started = true;
  logger.info('app', 'App started', {
    version: Constants.expoConfig?.version ?? 'unknown',
    platform: `${Platform.OS} ${Platform.Version ?? ''}`.trim(),
  });
  useDeviceStore.getState().initialize();
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    startApp();
  }, []);

  useEffect(() => {
    if (fontError) logger.warn('app', 'Fonts failed to load; using system font', { error: fontError.message });
    if (ready) SplashScreen.hide();
  }, [ready, fontError]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="logs" />
      </Stack>
      <ToastHost />
    </GestureHandlerRootView>
  );
}
