import { View, type ViewProps } from 'react-native';

interface SurfaceProps extends ViewProps {
  className?: string;
}

/** The standard card: one radius, one border, one fill. */
export function Surface({ className, ...rest }: SurfaceProps) {
  return <View className={`rounded-lg border border-line bg-surface p-card ${className ?? ''}`} {...rest} />;
}
