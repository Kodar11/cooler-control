import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '@/theme';

const PADDING = 6;

interface TrendChartProps {
  /** Readings, oldest first. Needs at least two to draw. */
  values: number[];
  /** Unique within the screen; namespaces the gradient definition. */
  id: string;
  height?: number;
  /** The smallest vertical span the chart will show, so sensor noise is not blown up to full height. */
  minSpan?: number;
}

/** A single-series area line for recent readings. Purely visual; pair it with numeric values. */
export function TrendChart({ values, id, height = 84, minSpan = 1 }: TrendChartProps) {
  const [width, setWidth] = useState(0);

  let line = '';
  let area = '';
  let last: { x: number; y: number } | null = null;

  if (width > 0 && values.length >= 2) {
    const low = Math.min(...values);
    const high = Math.max(...values);
    const span = Math.max(high - low, minSpan);
    const middle = (high + low) / 2;
    const innerHeight = height - PADDING * 2;
    const innerWidth = width - PADDING * 2;

    const points = values.map((value, index) => ({
      x: PADDING + (index / (values.length - 1)) * innerWidth,
      y: PADDING + (0.5 - (value - middle) / span) * innerHeight,
    }));

    line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;
    last = points[points.length - 1];
  }

  return (
    <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {last && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={0.22} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill={`url(#${id}-fill)`} />
          <Path d={line} fill="none" stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={last.x} cy={last.y} r={4} fill={colors.accent} stroke={colors.surface} strokeWidth={2} />
        </Svg>
      )}
    </View>
  );
}
