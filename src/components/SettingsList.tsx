import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Children, type ComponentProps, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Txt, type TxtTone } from '@/components/ui/Txt';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const rows = Children.toArray(children);

  return (
    <View className="gap-2">
      <Txt variant="label" className="px-1">
        {title}
      </Txt>
      <View className="overflow-hidden rounded-lg border border-line bg-surface">
        {rows.map((row, index) => (
          <View key={index} className={index > 0 ? 'border-t border-line' : ''}>
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

interface SettingsRowProps {
  label: string;
  value?: string;
  icon?: IconName;
  tone?: TxtTone;
  /** Shows a chevron; use for rows that open another screen. */
  navigates?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
}

export function SettingsRow({ label, value, icon, tone = 'ink', navigates, onPress, accessibilityHint }: SettingsRowProps) {
  const content = (
    <View className="min-h-[52px] flex-row items-center gap-3 px-card py-3">
      {icon && <MaterialCommunityIcons name={icon} size={20} color={colors.inkMuted} />}
      <Txt variant="body" tone={tone} className="flex-1">
        {label}
      </Txt>
      {value !== undefined && (
        <Txt variant="body" tone="muted" numberOfLines={1} className="max-w-[55%] shrink text-right">
          {value}
        </Txt>
      )}
      {navigates && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.inkFaint} />}
    </View>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={value !== undefined ? `${label}: ${value}` : label}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value !== undefined ? `${label}: ${value}` : label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      android_ripple={{ color: colors.raised }}
      className="active:bg-raised">
      {content}
    </Pressable>
  );
}
