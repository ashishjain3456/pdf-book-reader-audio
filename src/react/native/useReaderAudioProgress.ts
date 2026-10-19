import { useMemo } from 'react';
import { formatTime } from './richText';
import type { VerseAudioMapping } from './types';

type Options = {
  activeMapping: VerseAudioMapping | null;
  mappings: VerseAudioMapping[];
  status: { currentTime: number; duration?: number; durationSeconds?: number };
};

export function useReaderAudioProgress({ activeMapping, mappings, status }: Options) {
  const currentSeconds = Math.max(0, status.currentTime || 0);
  const durationSeconds = useMemo(() => {
    if (!activeMapping) return 0;
    const reportedDuration = Math.max(0, Number(status.duration ?? status.durationSeconds ?? 0));
    const mappedDuration = mappings
      .filter((mapping) => mapping.audioAssetUrl === activeMapping.audioAssetUrl)
      .reduce((maxEnd, mapping) => Math.max(maxEnd, mapping.segmentEndMs / 1000), 0);
    return Math.max(reportedDuration, mappedDuration);
  }, [activeMapping, mappings, status.duration, status.durationSeconds]);
  const elapsedSeconds = activeMapping
    ? Math.max(0, Math.min(durationSeconds, currentSeconds))
    : 0;
  const progress = durationSeconds > 0 ? elapsedSeconds / durationSeconds : 0;
  const timeText = activeMapping
    ? `${formatTime(currentSeconds)} / ${formatTime(durationSeconds)}`
    : '';

  return { currentSeconds, durationSeconds, elapsedSeconds, progress, timeText };
}
