import { Text, type TextProps } from 'react-native';

/** The app's type scale. Every piece of text picks one of these rather than ad-hoc sizes. */
const variants = {
  title: 'font-ui-semibold text-[26px] leading-[32px]',
  heading: 'font-ui-medium text-[17px] leading-[22px]',
  body: 'font-ui text-[15px] leading-[21px]',
  caption: 'font-ui text-[13px] leading-[18px]',
  label: 'font-ui-medium text-[11px] leading-[14px] tracking-[1.5px] uppercase',
  value: 'font-ui-medium text-[32px] leading-[36px]',
  unit: 'font-ui text-[16px] leading-[22px]',
} as const;

const tones = {
  ink: 'text-ink',
  muted: 'text-inkMuted',
  faint: 'text-inkFaint',
  accent: 'text-accent',
  onAccent: 'text-onAccent',
  good: 'text-good',
  warn: 'text-warn',
  danger: 'text-danger',
} as const;

export type TxtVariant = keyof typeof variants;
export type TxtTone = keyof typeof tones;

const defaultTone: Record<TxtVariant, TxtTone> = {
  title: 'ink',
  heading: 'ink',
  body: 'ink',
  caption: 'muted',
  label: 'muted',
  value: 'ink',
  unit: 'muted',
};

interface TxtProps extends TextProps {
  variant?: TxtVariant;
  tone?: TxtTone;
  className?: string;
}

export function Txt({ variant = 'body', tone, className, ...rest }: TxtProps) {
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      className={`${variants[variant]} ${tones[tone ?? defaultTone[variant]]} ${className ?? ''}`}
      {...rest}
    />
  );
}
