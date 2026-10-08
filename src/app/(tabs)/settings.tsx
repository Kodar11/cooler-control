import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useRef } from 'react';
import { View } from 'react-native';

import { ConnectionStatus } from '@/components/device/ConnectionStatus';
import { SettingsRow, SettingsSection } from '@/components/SettingsList';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { deviceSimulation } from '@/device';
import { formatClock } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { logger, useLogStore } from '@/logging/logger';
import { useDeviceStore } from '@/store/deviceStore';
import { useSettingsStore } from '@/store/settingsStore';
import { showToast } from '@/store/toastStore';

/** Fault injection, when the active device service offers it. */
const simulation = deviceSimulation;

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** Taps on the version row needed to reveal developer options. */
const UNLOCK_TAPS = 7;
/** Taps further apart than this start the count again. */
const TAP_WINDOW_MS = 1500;

export default function SettingsScreen() {
  const connection = useDeviceStore((state) => state.connection);
  const deviceInfo = useDeviceStore((state) => state.deviceInfo);
  const lastUpdated = useDeviceStore((state) => state.lastUpdated);
  const connect = useDeviceStore((state) => state.connect);
  const disconnect = useDeviceStore((state) => state.disconnect);

  const developerMode = useSettingsStore((state) => state.developerMode);
  const setDeveloperMode = useSettingsStore((state) => state.setDeveloperMode);
  const logCount = useLogStore((state) => state.entries.length);

  const taps = useRef({ count: 0, last: 0 });

  const connected = connection === 'connected';
  const connecting = connection === 'connecting';

  const onVersionPress = () => {
    if (developerMode) {
      showToast('Developer mode is already on');
      return;
    }

    const now = Date.now();
    const count = now - taps.current.last > TAP_WINDOW_MS ? 1 : taps.current.count + 1;
    taps.current = { count, last: now };

    const remaining = UNLOCK_TAPS - count;
    if (remaining <= 0) {
      taps.current = { count: 0, last: 0 };
      setDeveloperMode(true);
      haptics.success();
      logger.info('app', 'Developer mode unlocked');
      showToast('Developer mode unlocked', 'success');
    } else if (remaining <= 3) {
      showToast(`${remaining} more ${remaining === 1 ? 'tap' : 'taps'} for developer mode`);
    }
  };

  return (
    <Screen>
      <Txt variant="title">Settings</Txt>

      <SettingsSection title="Device">
        <View className="gap-4 p-card">
          <ConnectionStatus />
          {connected ? (
            <Button label="Disconnect" variant="secondary" onPress={() => void disconnect()} />
          ) : (
            <Button
              label={connecting ? 'Connecting' : 'Connect'}
              icon="wifi"
              loading={connecting}
              onPress={() => void connect()}
            />
          )}
        </View>
        <SettingsRow label="Name" value={connected ? (deviceInfo?.name ?? '––') : '––'} />
        <SettingsRow label="Address" value={connected ? (deviceInfo?.address ?? '––') : '––'} />
        <SettingsRow label="Firmware" value={connected ? (deviceInfo?.firmware ?? 'Unknown') : '––'} />
        <SettingsRow label="Last update" value={connected && lastUpdated ? formatClock(lastUpdated) : '––'} />
      </SettingsSection>

      <SettingsSection title="App">
        <SettingsRow label="Cooler Control" value="Car air cooler" />
        <SettingsRow label="Version" value={APP_VERSION} onPress={onVersionPress} />
      </SettingsSection>

      {developerMode && (
        <SettingsSection title="Developer">
          <SettingsRow
            label="Developer Logs"
            icon="console"
            value={`${logCount} ${logCount === 1 ? 'entry' : 'entries'}`}
            navigates
            onPress={() => router.push('/logs')}
          />
          {simulation && (
            <SettingsRow
              label="Simulate connection loss"
              icon="wifi-off"
              onPress={() => {
                if (!connected) {
                  showToast('Not connected');
                  return;
                }
                simulation.dropConnection();
              }}
            />
          )}
          {simulation && (
            <SettingsRow
              label="Fail next connection attempt"
              icon="timer-sand"
              onPress={() => {
                simulation.failNextConnection();
                showToast('Next connection attempt will time out');
              }}
            />
          )}
          {simulation && (
            <SettingsRow
              label="Fail next command"
              icon="alert-outline"
              onPress={() => {
                simulation.failNextCommand();
                showToast('Next command will fail');
              }}
            />
          )}
          <SettingsRow
            label="Turn off developer mode"
            icon="eye-off-outline"
            onPress={() => {
              setDeveloperMode(false);
              showToast('Developer mode off');
            }}
          />
        </SettingsSection>
      )}
    </Screen>
  );
}
