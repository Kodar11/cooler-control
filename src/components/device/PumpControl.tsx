import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { Toggle } from '@/components/ui/Toggle';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme';

interface PumpControlProps {
  on: boolean;
  disabled: boolean;
  /** Shown in place of the state description when the control cannot be used. */
  disabledReason?: string;
  onChange: (on: boolean) => void;
}

export function PumpControl({ on, disabled, disabledReason, onChange }: PumpControlProps) {
  const active = on && !disabled;
  const description = disabled && disabledReason ? disabledReason : on ? 'Circulating water' : 'Fan only, no water';

  return (
    <PressableScale
      accessibilityRole="switch"
      accessibilityLabel="Water pump"
      accessibilityState={{ checked: on, disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.toggle();
        onChange(!on);
      }}
      scaleTo={0.98}>
      <View className="flex-row items-center gap-4 rounded-lg border border-line bg-surface p-card">
        <View
          className={`h-11 w-11 items-center justify-center rounded-pill ${active ? 'bg-accentWash' : 'bg-raised'}`}>
          <MaterialCommunityIcons name="water-pump" size={22} color={active ? colors.accent : colors.inkFaint} />
        </View>
        <View className="flex-1">
          <Txt variant="heading">Pump</Txt>
          <Txt variant="caption" numberOfLines={1}>
            {description}
          </Txt>
        </View>
        <View className={`flex-row items-center gap-3 ${disabled ? 'opacity-40' : ''}`}>
          <Txt variant="label" tone={on ? 'accent' : 'muted'} className="text-[12px]">
            {on ? 'On' : 'Off'}
          </Txt>
          <Toggle value={on} />
        </View>
      </View>
    </PressableScale>
  );
}
