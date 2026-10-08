import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';

import { Surface } from '@/components/ui/Surface';
import { Txt } from '@/components/ui/Txt';
import { useSmoothedNumber } from '@/hooks/useSmoothedNumber';
import { describeHumidity } from '@/lib/describe';
import { colors } from '@/theme';

const SEGMENTS = 10;

/** Relative humidity: the number, a word for how it feels, and a ten-step bar. */
export function HumidityTile({ humidity }: { humidity: number | null }) {
  const shown = useSmoothedNumber(humidity);
  const rounded = shown === null ? null : Math.round(shown);
  const filled = rounded === null ? 0 : Math.round((rounded / 100) * SEGMENTS);

  return (
    <Surface
      className="flex-1 justify-between gap-3"
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        rounded === null ? 'Humidity: no reading' : `Humidity: ${rounded} percent, ${describeHumidity(rounded)}`
      }>
      <View className="flex-row items-center justify-between">
        <Txt variant="label">Humidity</Txt>
        <MaterialCommunityIcons name="water-percent" size={18} color={colors.inkFaint} />
      </View>

      <View>
        <View className="flex-row items-baseline gap-1">
          <Txt variant="value" tone={rounded === null ? 'faint' : 'ink'}>
            {rounded ?? '––'}
          </Txt>
          {rounded !== null && <Txt variant="unit">%</Txt>}
        </View>
        <Txt variant="caption">{rounded === null ? 'No reading' : describeHumidity(rounded)}</Txt>
      </View>

      <View className="flex-row gap-1">
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <View key={index} className={`h-1.5 flex-1 rounded-pill ${index < filled ? 'bg-accent' : 'bg-line'}`} />
        ))}
      </View>
    </Surface>
  );
}
