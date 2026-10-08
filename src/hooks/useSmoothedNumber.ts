import { useEffect, useRef, useState } from 'react';

import { durations } from '@/theme';

/**
 * Eases a displayed number toward each new reading instead of snapping to it,
 * so live sensor values glide. Returns `null` whenever the target is `null`.
 */
export function useSmoothedNumber(target: number | null, duration: number = durations.value): number | null {
  const [value, setValue] = useState<number | null>(target);
  const current = useRef<number | null>(target);

  useEffect(() => {
    let frame: number;

    if (target === null) {
      current.current = null;
      frame = requestAnimationFrame(() => setValue(null));
      return () => cancelAnimationFrame(frame);
    }

    const from = current.current ?? target;
    const startedAt = Date.now();

    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      current.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  if (target === null) return null;
  return value ?? target;
}
