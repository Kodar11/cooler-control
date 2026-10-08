import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/ui/Txt';
import { haptics } from '@/lib/haptics';
import { colors, sizes } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'snowflake', inactive: 'snowflake' },
  stats: { active: 'chart-box', inactive: 'chart-box-outline' },
  settings: { active: 'cog', inactive: 'cog-outline' },
};

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View
      className="flex-row border-t border-line bg-bg px-gutter"
      style={{ paddingBottom: insets.bottom, height: sizes.tabBar + insets.bottom }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const icon = ICONS[route.name] ?? ICONS.index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            haptics.tick();
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            className="flex-1 items-center justify-center gap-1">
            <View className={`h-8 w-14 items-center justify-center rounded-pill ${focused ? 'bg-accentWash' : ''}`}>
              <MaterialCommunityIcons
                name={focused ? icon.active : icon.inactive}
                size={22}
                color={focused ? colors.accent : colors.inkMuted}
              />
            </View>
            <Txt
              variant="caption"
              tone={focused ? 'ink' : 'muted'}
              className={`text-[11px] leading-[14px] ${focused ? 'font-ui-medium' : ''}`}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
