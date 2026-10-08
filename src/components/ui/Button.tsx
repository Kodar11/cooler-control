import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/theme';

import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, className }: ButtonProps) {
  const primary = variant === 'primary';
  const foreground = primary ? colors.onAccent : colors.ink;
  const inactive = disabled || loading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={className}>
      <View
        className={`h-touch flex-row items-center justify-center gap-2 rounded-md px-5 ${
          primary ? 'bg-accent' : 'border border-lineStrong bg-raised'
        } ${disabled ? 'opacity-40' : ''}`}>
        {loading ? (
          <ActivityIndicator size="small" color={foreground} />
        ) : icon ? (
          <MaterialCommunityIcons name={icon} size={18} color={foreground} />
        ) : null}
        <Txt variant="heading" tone={primary ? 'onAccent' : 'ink'} className="text-[15px]">
          {label}
        </Txt>
      </View>
    </PressableScale>
  );
}
