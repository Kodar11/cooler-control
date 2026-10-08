import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  /** Set false for screens that manage their own scrolling (e.g. lists). */
  scroll?: boolean;
}

/** Page frame: background, safe-area top inset, gutters, and vertical rhythm between sections. */
export function Screen({ children, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="gap-gap px-gutter pb-8"
      contentContainerStyle={{ paddingTop: insets.top + 12 }}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}
