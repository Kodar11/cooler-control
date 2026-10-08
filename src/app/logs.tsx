import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { deviceService } from '@/device';
import { formatClock } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { buildDiagnosticReport, formatDetails, logger, useLogStore, type LogEntry, type LogLevel } from '@/logging/logger';
import { useDeviceStore } from '@/store/deviceStore';
import { showToast } from '@/store/toastStore';
import { colors, monoFont, type ColorToken } from '@/theme';

const LEVEL_COLOR: Record<LogLevel, ColorToken> = {
  DEBUG: 'inkFaint',
  INFO: 'inkMuted',
  DATA: 'accent',
  COMMAND: 'ink',
  SUCCESS: 'good',
  WARN: 'warn',
  ERROR: 'danger',
};

type FilterKey = 'all' | 'events' | 'data' | 'problems';

const FILTERS: { key: FilterKey; label: string; levels: LogLevel[] | null }[] = [
  { key: 'all', label: 'All', levels: null },
  { key: 'events', label: 'Events', levels: ['INFO', 'COMMAND', 'SUCCESS', 'WARN', 'ERROR'] },
  { key: 'data', label: 'Data', levels: ['DATA', 'DEBUG'] },
  { key: 'problems', label: 'Problems', levels: ['WARN', 'ERROR'] },
];

const mono = { fontFamily: monoFont };

const LogRow = memo(function LogRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const details = entry.details ? Object.entries(entry.details).filter(([, value]) => value !== undefined) : [];
  const hasDetails = details.length > 0;

  return (
    <Pressable
      disabled={!hasDetails}
      onPress={() => setExpanded((value) => !value)}
      accessibilityRole={hasDetails ? 'button' : 'text'}
      accessibilityState={hasDetails ? { expanded } : undefined}
      accessibilityLabel={`${formatClock(entry.timestamp)}, ${entry.level}, ${entry.message}`}
      className="gap-1 border-b border-line px-gutter py-3 active:bg-surface">
      <View className="flex-row items-center gap-3">
        <Text style={mono} className="text-[12px] text-inkFaint">
          {formatClock(entry.timestamp)}
        </Text>
        <Text style={[mono, { color: colors[LEVEL_COLOR[entry.level]] }]} className="text-[12px] font-bold">
          {entry.level}
        </Text>
        <Text style={mono} className="flex-1 text-[12px] text-inkFaint">
          {entry.source}
        </Text>
        {hasDetails && (
          <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.inkFaint} />
        )}
      </View>
      <Txt variant="body" className="text-[14px] leading-[20px]">
        {entry.message}
      </Txt>
      {hasDetails &&
        (expanded ? (
          <View className="mt-1 gap-1 rounded-sm bg-sunken p-3">
            {details.map(([key, value]) => (
              <Text key={key} style={mono} className="text-[12px] leading-[17px] text-inkMuted" selectable>
                <Text className="text-inkFaint">{key}: </Text>
                {String(value)}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={mono} numberOfLines={1} className="text-[12px] text-inkMuted">
            {formatDetails(entry.details)}
          </Text>
        ))}
    </Pressable>
  );
});

export default function DeveloperLogsScreen() {
  const insets = useSafeAreaInsets();
  const entries = useLogStore((state) => state.entries);
  const [filter, setFilter] = useState<FilterKey>('all');

  const visible = useMemo(() => {
    const levels = FILTERS.find((item) => item.key === filter)?.levels;
    const matching = levels ? entries.filter((entry) => levels.includes(entry.level)) : entries;
    return [...matching].reverse();
  }, [entries, filter]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/settings');
  };

  const copyAll = async () => {
    const { connection, deviceInfo } = useDeviceStore.getState();
    const report = buildDiagnosticReport(entries, {
      appVersion: Constants.expoConfig?.version ?? 'unknown',
      platform: `${Platform.OS} ${Platform.Version ?? ''}`.trim(),
      deviceService: deviceService.label,
      connection: connection.toUpperCase(),
      deviceName: deviceInfo?.name ?? null,
    });

    try {
      await Clipboard.setStringAsync(report);
      haptics.success();
      showToast('Logs copied', 'success');
      logger.info('app', 'Diagnostic report copied', { entries: entries.length });
    } catch (error) {
      logger.error('app', 'Copy to clipboard failed', { error: error instanceof Error ? error.message : String(error) });
      showToast("Couldn't copy logs", 'warning');
    }
  };

  const clearAll = () => {
    logger.clear();
    showToast('Logs cleared');
  };

  return (
    <Screen scroll={false}>
      <View className="gap-4 border-b border-line px-gutter pb-4 pt-2">
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={goBack}
            hitSlop={8}
            className="-ml-2 h-10 w-10 items-center justify-center rounded-pill active:bg-raised">
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ink} />
          </Pressable>
          <View className="flex-1">
            <Txt variant="heading" className="text-[20px] leading-[26px]">
              Developer Logs
            </Txt>
            <Txt variant="caption">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · newest first
            </Txt>
          </View>
        </View>

        <View className="flex-row gap-gap">
          <Button label="Copy all" icon="content-copy" onPress={() => void copyAll()} className="flex-1" />
          <Button
            label="Clear"
            icon="trash-can-outline"
            variant="secondary"
            disabled={entries.length === 0}
            onPress={clearAll}
            className="flex-1"
          />
        </View>

        <View className="flex-row gap-2" accessibilityRole="tablist">
          {FILTERS.map((item) => {
            const selected = item.key === filter;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`Show ${item.label.toLowerCase()}`}
                onPress={() => setFilter(item.key)}
                hitSlop={6}
                className={`h-9 items-center justify-center rounded-pill border px-4 ${
                  selected ? 'border-accentDeep bg-accentWash' : 'border-line bg-surface'
                }`}>
                <Txt variant="caption" tone={selected ? 'accent' : 'muted'} className="font-ui-medium">
                  {item.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(entry) => String(entry.id)}
        renderItem={({ item }) => <LogRow entry={item} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, flexGrow: 1 }}
        initialNumToRender={20}
        windowSize={9}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-3 px-gutter py-16">
            <View className="h-12 w-12 items-center justify-center rounded-pill bg-surface">
              <MaterialCommunityIcons name="console" size={24} color={colors.inkMuted} />
            </View>
            <Txt variant="heading">{entries.length === 0 ? 'No logs yet' : 'Nothing in this view'}</Txt>
            <Txt variant="caption" className="max-w-[260px] text-center">
              {entries.length === 0
                ? 'Events appear here as the app talks to the cooler.'
                : 'No entries match this filter. Copy all still includes every entry.'}
            </Txt>
          </View>
        }
      />
    </Screen>
  );
}
