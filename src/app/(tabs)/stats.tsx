import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo } from 'react';
import { View } from 'react-native';

import { TrendChart } from '@/components/TrendChart';
import { Screen } from '@/components/ui/Screen';
import { Surface } from '@/components/ui/Surface';
import { Txt } from '@/components/ui/Txt';
import { useNow } from '@/hooks/useNow';
import { describeFanSpeed } from '@/lib/describe';
import { formatDuration, formatShortClock } from '@/lib/format';
import { useDeviceStore } from '@/store/deviceStore';
import { colors } from '@/theme';

interface Summary {
  low: number;
  high: number;
  average: number;
}

function summarize(values: number[]): Summary | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return { low: Math.min(...values), high: Math.max(...values), average: total / values.length };
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-1">
      <Txt variant="label">{label}</Txt>
      <Txt variant="heading">{value}</Txt>
    </View>
  );
}

interface TrendCardProps {
  id: string;
  title: string;
  values: number[];
  current: number | null;
  unit: string;
  digits: number;
  minSpan: number;
}

function TrendCard({ id, title, values, current, unit, digits, minSpan }: TrendCardProps) {
  const summary = useMemo(() => summarize(values), [values]);
  const format = (value: number) => `${value.toFixed(digits)}${unit}`;

  return (
    <Surface className="gap-4">
      <View className="flex-row items-end justify-between">
        <Txt variant="label">{title}</Txt>
        <Txt variant="value" tone={current === null ? 'faint' : 'ink'} className="text-[26px] leading-[28px]">
          {current === null ? '––' : format(current)}
        </Txt>
      </View>
      <TrendChart id={id} values={values} minSpan={minSpan} />
      {summary && (
        <View className="flex-row border-t border-line pt-4">
          <Figure label="Low" value={format(summary.low)} />
          <Figure label="Average" value={format(summary.average)} />
          <Figure label="High" value={format(summary.high)} />
        </View>
      )}
    </Surface>
  );
}

function Tile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Surface className="flex-1 gap-2">
      <Txt variant="label">{label}</Txt>
      <View>
        <Txt variant="value" className="text-[24px] leading-[30px]">
          {value}
        </Txt>
        <Txt variant="caption" numberOfLines={1}>
          {detail}
        </Txt>
      </View>
    </Surface>
  );
}

export default function SessionScreen() {
  const now = useNow();
  const connection = useDeviceStore((state) => state.connection);
  const history = useDeviceStore((state) => state.history);
  const temperature = useDeviceStore((state) => state.temperature);
  const humidity = useDeviceStore((state) => state.humidity);
  const fanSpeed = useDeviceStore((state) => state.fanSpeed);
  const pumpEnabled = useDeviceStore((state) => state.pumpEnabled);
  const coolerEnabled = useDeviceStore((state) => state.coolerEnabled);
  const connectedAt = useDeviceStore((state) => state.connectedAt);
  const readingCount = useDeviceStore((state) => state.readingCount);
  const lastUpdated = useDeviceStore((state) => state.lastUpdated);

  const temperatures = useMemo(() => history.map((sample) => sample.temperature), [history]);
  const humidities = useMemo(() => history.map((sample) => sample.humidity), [history]);

  const connected = connection === 'connected';
  const hasTrend = connected && history.length >= 2;

  return (
    <Screen>
      <View className="gap-1">
        <Txt variant="title">Session</Txt>
        <Txt variant="caption">
          {connected && connectedAt
            ? `Connected since ${formatShortClock(connectedAt)}`
            : 'Live readings from the current connection'}
        </Txt>
      </View>

      {hasTrend ? (
        <>
          <TrendCard
            id="temperature"
            title="Temperature"
            values={temperatures}
            current={temperature}
            unit="°"
            digits={1}
            minSpan={2}
          />
          <TrendCard
            id="humidity"
            title="Humidity"
            values={humidities}
            current={humidity}
            unit="%"
            digits={0}
            minSpan={6}
          />

          <View className="flex-row gap-gap">
            <Tile
              label="Connected for"
              value={connectedAt ? formatDuration(now - connectedAt) : '––'}
              detail={
                !lastUpdated
                  ? 'Waiting for data'
                  : now - lastUpdated < 3000
                    ? 'Updated just now'
                    : `Updated ${formatDuration(now - lastUpdated)} ago`
              }
            />
            <Tile label="Readings" value={String(readingCount)} detail="Received this session" />
          </View>
          <View className="flex-row gap-gap">
            <Tile
              label="Fan"
              value={coolerEnabled ? `${fanSpeed}%` : 'Idle'}
              detail={coolerEnabled ? describeFanSpeed(fanSpeed) : 'Cooler is off'}
            />
            <Tile
              label="Pump"
              value={coolerEnabled && pumpEnabled ? 'On' : 'Off'}
              detail={coolerEnabled ? (pumpEnabled ? 'Circulating water' : 'Fan only') : 'Cooler is off'}
            />
          </View>

          <Txt variant="caption" tone="faint" className="px-1 pt-1">
            Charts cover up to the last five minutes. Readings are kept only while the app is connected.
          </Txt>
        </>
      ) : (
        <Surface className="items-center gap-3 py-12">
          <View className="h-12 w-12 items-center justify-center rounded-pill bg-raised">
            <MaterialCommunityIcons name="chart-timeline-variant" size={24} color={colors.inkMuted} />
          </View>
          <Txt variant="heading">{connected ? 'Collecting readings' : 'No recent data'}</Txt>
          <Txt variant="caption" className="max-w-[260px] text-center">
            {connected
              ? 'Trends appear here after the first few readings arrive.'
              : 'Temperature and humidity trends appear here once the cooler is connected.'}
          </Txt>
        </Surface>
      )}
    </Screen>
  );
}
