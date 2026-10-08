import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Surface } from '@/components/ui/Surface';
import { Txt } from '@/components/ui/Txt';
import { useDeviceStore } from '@/store/deviceStore';
import { colors } from '@/theme';

const DEFAULT_HELP = "Connect your phone to the cooler's Wi-Fi network to take control.";

/** Shown in place of the power control whenever there is no cooler to control yet. */
export function OfflineNotice() {
  const connection = useDeviceStore((state) => state.connection);
  const connectionError = useDeviceStore((state) => state.connectionError);
  const connect = useDeviceStore((state) => state.connect);

  const failed = connection === 'error';
  const connecting = connection === 'connecting';

  const title = connecting ? 'Connecting to cooler' : failed ? "Can't reach the cooler" : 'Cooler offline';
  const body = connecting ? 'Looking for your cooler on Wi-Fi.' : (connectionError ?? DEFAULT_HELP);

  return (
    <Surface className="gap-4">
      <View className="flex-row items-start gap-4">
        <View className="h-11 w-11 items-center justify-center rounded-pill bg-raised">
          <MaterialCommunityIcons
            name={connecting ? 'wifi' : 'wifi-off'}
            size={22}
            color={failed ? colors.warn : colors.inkMuted}
          />
        </View>
        <View className="flex-1 gap-1">
          <Txt variant="heading">{title}</Txt>
          <Txt variant="caption">{body}</Txt>
        </View>
      </View>
      <Button
        label={connecting ? 'Connecting' : failed ? 'Try again' : 'Connect'}
        icon="wifi"
        loading={connecting}
        onPress={() => void connect()}
      />
    </Surface>
  );
}
