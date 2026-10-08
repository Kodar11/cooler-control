import { useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ConnectionStatus } from '@/components/device/ConnectionStatus';
import { FanControl } from '@/components/device/FanControl';
import { HumidityTile } from '@/components/device/HumidityTile';
import { OfflineNotice } from '@/components/device/OfflineNotice';
import { PowerControl } from '@/components/device/PowerControl';
import { PumpControl } from '@/components/device/PumpControl';
import { TemperatureGauge } from '@/components/device/TemperatureGauge';
import { WaterLevelTile } from '@/components/device/WaterLevelTile';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import type { ConnectionState } from '@/device';
import { clamp } from '@/lib/format';
import { useDeviceStore } from '@/store/deviceStore';
import { spacing } from '@/theme';

/** Sections rise in one after another on first render. */
const enter = (order: number) => FadeInDown.delay(order * 70).duration(380);

function describeSystem(connection: ConnectionState, coolerEnabled: boolean, fanSpeed: number): string {
  if (connection === 'connecting') return 'Connecting';
  if (connection !== 'connected') return 'No live data';
  if (!coolerEnabled) return 'Standby';
  return fanSpeed > 0 ? `Cooling · Fan ${fanSpeed}%` : 'On · Fan stopped';
}

export default function ControlScreen() {
  const { width, height } = useWindowDimensions();

  const connection = useDeviceStore((state) => state.connection);
  const temperature = useDeviceStore((state) => state.temperature);
  const humidity = useDeviceStore((state) => state.humidity);
  const waterLevel = useDeviceStore((state) => state.waterLevel);
  const fanSpeed = useDeviceStore((state) => state.fanSpeed);
  const pumpEnabled = useDeviceStore((state) => state.pumpEnabled);
  const coolerEnabled = useDeviceStore((state) => state.coolerEnabled);
  const previewFanSpeed = useDeviceStore((state) => state.previewFanSpeed);
  const setFanSpeed = useDeviceStore((state) => state.setFanSpeed);
  const setPump = useDeviceStore((state) => state.setPump);
  const setCooler = useDeviceStore((state) => state.setCooler);

  const connected = connection === 'connected';
  const running = connected && coolerEnabled;
  const lockedReason = !connected ? 'Unavailable while offline' : !coolerEnabled ? 'Turn the cooler on to adjust' : undefined;

  // The dial scales with the phone, but never crowds out the controls on short screens.
  const gaugeSize = Math.round(clamp(Math.min(width - spacing.gutter * 2 - 24, height * 0.36), 216, 320));

  return (
    <Screen>
      <Animated.View entering={enter(0)}>
        <View className="gap-1">
          <Txt variant="title">Cooler</Txt>
          <ConnectionStatus />
        </View>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <View className="items-center pb-1 pt-2">
          <TemperatureGauge
            temperature={temperature}
            active={running}
            status={describeSystem(connection, coolerEnabled, fanSpeed)}
            size={gaugeSize}
          />
        </View>
      </Animated.View>

      <Animated.View entering={enter(2)}>
        {connected ? (
          <PowerControl on={coolerEnabled} disabled={false} onChange={(on) => void setCooler(on)} />
        ) : (
          <OfflineNotice />
        )}
      </Animated.View>

      <Animated.View entering={enter(3)}>
        <View className="flex-row gap-gap">
          <HumidityTile humidity={humidity} />
          <WaterLevelTile level={waterLevel} />
        </View>
      </Animated.View>

      <Animated.View entering={enter(4)}>
        <FanControl
          speed={fanSpeed}
          disabled={!running}
          disabledReason={lockedReason}
          onPreview={previewFanSpeed}
          onCommit={(speed) => void setFanSpeed(speed)}
        />
      </Animated.View>

      <Animated.View entering={enter(5)}>
        <PumpControl
          on={pumpEnabled}
          disabled={!running}
          disabledReason={lockedReason}
          onChange={(on) => void setPump(on)}
        />
      </Animated.View>
    </Screen>
  );
}
