import type { VerseAudioMapping } from "../types/contracts";

export const AUTO_READ_CONFIG = {
  millisecondsPerCharacter: 120,
  speedMultiplier: 1,
  minimumPageDurationMs: 3000,
} as const;

export type ReaderPlaybackMapping = Pick<
  VerseAudioMapping,
  "verseId" | "audioAssetUrl" | "segmentStartMs" | "segmentEndMs" | "sortOrder"
>;

export type MappedPageProgress = {
  pageNumber: number | null;
  progress: number;
  mapping: ReaderPlaybackMapping | null;
};

export function getContinuousProgressIndex(
  mode: "audio" | "auto-read",
  pageNumber: number | null | undefined,
  verseId: string | null | undefined,
  verseIds: readonly string[],
) {
  const normalizedPage = Number(pageNumber);
  const pageIndex =
    Number.isInteger(normalizedPage) && normalizedPage > 0
      ? normalizedPage - 1
      : -1;
  const validPageIndex = pageIndex < verseIds.length ? pageIndex : -1;
  const verseIndex = verseId ? verseIds.indexOf(verseId) : -1;
  if (mode === "auto-read")
    return validPageIndex >= 0 ? validPageIndex : verseIndex;
  return verseIndex >= 0 ? verseIndex : validPageIndex;
}

export type AutoReadConfig = {
  millisecondsPerCharacter: number;
  speedMultiplier: number;
  minimumPageDurationMs: number;
};

function decodeNumericEntity(_match: string, rawCode: string, radix = 10) {
  const codePoint = parseInt(rawCode, radix);
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : " ";
}

export function countReadableCharacters(html: string) {
  const text = String(html || "")
    .replace(/<\s*br\s*\/?>/gi, " ")
    .replace(/<\s*\/p\s*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (match, code: string) =>
      decodeNumericEntity(match, code),
    )
    .replace(/&#x([\da-f]+);/gi, (match, code: string) =>
      decodeNumericEntity(match, code, 16),
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return 0;
  const Segmenter = Intl.Segmenter;
  if (Segmenter) {
    return [
      ...new Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    ].length;
  }
  let count = 0;
  let previousWasJoiner = false;
  let previousWasVirama = false;
  for (const character of Array.from(text.normalize("NFC"))) {
    if (/\p{M}/u.test(character)) {
      if (
        /^[\u094d\u09cd\u0a4d\u0acd\u0b4d\u0bcd\u0c4d\u0ccd\u0d4d\u0dca]$/u.test(
          character,
        )
      ) {
        previousWasVirama = true;
      }
      continue;
    }
    if (character === "\u200d") {
      previousWasJoiner = true;
      continue;
    }
    if (!previousWasJoiner && !previousWasVirama) count += 1;
    previousWasJoiner = false;
    previousWasVirama = false;
  }
  return count;
}

export function getAutoReadDurationMs(
  html: string,
  config: AutoReadConfig = AUTO_READ_CONFIG,
) {
  const characters = countReadableCharacters(html);
  if (!characters) return 0;
  const speedMultiplier = Math.max(0.1, Number(config.speedMultiplier) || 1);
  return Math.max(
    Math.max(
      Math.max(0, Number(config.minimumPageDurationMs) || 0),
      characters * Math.max(0, Number(config.millisecondsPerCharacter) || 0),
    ) / speedMultiplier,
  );
}

function normalizeTimeline(
  mappings: ReaderPlaybackMapping[],
  audioAssetUrl: string,
) {
  return mappings
    .filter((mapping) => {
      const start = Number(mapping.segmentStartMs);
      const end = Number(mapping.segmentEndMs);
      return (
        String(mapping.audioAssetUrl || "").trim() === audioAssetUrl &&
        mapping.verseId !== null &&
        mapping.verseId !== undefined &&
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        end > start
      );
    })
    .map((mapping, index) => ({
      ...mapping,
      verseId: String(mapping.verseId),
      segmentStartMs: Math.max(0, Math.floor(Number(mapping.segmentStartMs))),
      segmentEndMs: Math.max(0, Math.floor(Number(mapping.segmentEndMs))),
      sortOrder: Number.isFinite(Number(mapping.sortOrder))
        ? Number(mapping.sortOrder)
        : index,
    }))
    .sort(
      (left, right) =>
        left.segmentStartMs - right.segmentStartMs ||
        left.sortOrder - right.sortOrder ||
        left.verseId.localeCompare(right.verseId),
    );
}

/**
 * Resolves page and progress from audio timestamp order. Only adjacent mapped
 * intervals that touch within one millisecond and belong to the same page are
 * treated as one visit. A gap holds the previous visit at 100% until the next
 * mapped interval begins.
 */
export function getMappedPageProgress(
  mappings: ReaderPlaybackMapping[],
  audioAssetUrl: string,
  currentTimeMs: number,
  getPageForVerse: (verseId: string) => number | null | undefined,
): MappedPageProgress | null {
  const normalizedUrl = String(audioAssetUrl || "").trim();
  if (!normalizedUrl) return null;
  const timeline = normalizeTimeline(mappings, normalizedUrl);
  if (!timeline.length) return null;
  const time = Math.max(0, Number(currentTimeMs) || 0);
  let index = -1;
  for (let cursor = 0; cursor < timeline.length; cursor += 1) {
    const candidate = timeline[cursor];
    if (time >= candidate.segmentStartMs && time < candidate.segmentEndMs) {
      index = cursor;
      break;
    }
  }
  if (index < 0) {
    for (let cursor = timeline.length - 1; cursor >= 0; cursor -= 1) {
      if (time >= timeline[cursor].segmentEndMs) {
        index = cursor;
        break;
      }
    }
    if (index < 0) {
      return { pageNumber: null, progress: 0, mapping: null };
    }
  }

  const mapping = timeline[index];
  const pageNumber = getPageForVerse(mapping.verseId) ?? null;
  if (!pageNumber) return { pageNumber: null, progress: 0, mapping };

  let first = index;
  while (first > 0) {
    const previous = timeline[first - 1];
    if ((getPageForVerse(previous.verseId) ?? null) !== pageNumber) break;
    first -= 1;
  }

  let last = index;
  while (last + 1 < timeline.length) {
    const next = timeline[last + 1];
    if ((getPageForVerse(next.verseId) ?? null) !== pageNumber) break;
    last += 1;
  }

  const startMs = timeline[first].segmentStartMs;
  const intervals = timeline
    .slice(first, last + 1)
    .map(({ segmentStartMs, segmentEndMs }) => ({
      start: segmentStartMs,
      end: segmentEndMs,
    }))
    .sort((left, right) => left.start - right.start || left.end - right.end);
  const mergedIntervals: Array<{ start: number; end: number }> = [];
  for (const interval of intervals) {
    const previous = mergedIntervals[mergedIntervals.length - 1];
    if (previous && interval.start <= previous.end) {
      previous.end = Math.max(previous.end, interval.end);
    } else {
      mergedIntervals.push({ ...interval });
    }
  }
  const totalDuration = mergedIntervals.reduce(
    (total, interval) => total + interval.end - interval.start,
    0,
  );
  const elapsedDuration = mergedIntervals.reduce((total, interval) => {
    const reachedEnd = Math.min(time, interval.end);
    return total + Math.max(0, reachedEnd - interval.start);
  }, 0);
  return {
    pageNumber,
    progress:
      totalDuration > 0
        ? Math.max(0, Math.min(1, elapsedDuration / totalDuration))
        : Number(time >= startMs),
    mapping,
  };
}
