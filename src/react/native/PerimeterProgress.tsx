import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import type { PlaybackMode, ReaderAnimatedValue, ReaderTheme } from "./types";

type NativeAnimatedValue = InstanceType<
  typeof import("react-native").Animated.Value
>;

export type PagePlaybackProgress = {
  mode: PlaybackMode;
  progress: number;
  complete: boolean;
  pageNumber?: number | null;
  verseId?: string | null;
  completedVerseIds?: string[];
  progressStore?: {
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => number;
  };
};

export function getVersePlaybackProgress(
  playback: PagePlaybackProgress | null | undefined,
  verseId: string | number,
  pageNumber: number,
  isActive: boolean,
): PagePlaybackProgress | null {
  if (!playback) return null;
  const normalizedVerseId = String(verseId);
  if (playback.mode === "auto-read" && isActive) return playback;
  if (playback.completedVerseIds?.includes(normalizedVerseId)) {
    return {
      ...playback,
      progress: 1,
      complete: true,
      pageNumber,
      verseId: normalizedVerseId,
      progressStore: undefined,
    };
  }
  return isActive ? playback : null;
}

// Native line segments keep this overlay independent of SVG/native dependencies.
// Short chords approximate the rounded border while the native driver updates
// each segment without scheduling React renders on progress ticks.
export function PerimeterProgress({
  playback,
  theme,
  radius,
  inset = 0,
  pageNumberBounds,
  pageNumberGap = 10,
  containerSize,
}: {
  playback: PagePlaybackProgress;
  theme: Required<ReaderTheme>;
  radius: number;
  inset?: number;
  pageNumberBounds?: { x: number; width: number };
  pageNumberGap?: number;
  containerSize?: { width: number; height: number };
}) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const lastProgressRef = useRef(0);
  const [accessibilityProgress, setAccessibilityProgress] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const hasContainerSize = Boolean(
    containerSize && containerSize.width > 0 && containerSize.height > 0,
  );
  const measuredSize = useMemo(
    () =>
      hasContainerSize && containerSize
        ? {
            width: Math.max(0, containerSize.width + 2 * inset),
            height: Math.max(0, containerSize.height + 2 * inset),
          }
        : size,
    [
      containerSize?.height,
      containerSize?.width,
      hasContainerSize,
      inset,
      size,
    ],
  );
  const fallbackProgress = playback.progressStore ? null : playback.progress;

  useEffect(() => {
    const store = playback.progressStore;
    let lastAccessibilityUpdate = 0;
    const update = () => {
      const next = Math.max(
        0,
        Math.min(1, store?.getSnapshot() ?? fallbackProgress ?? 0),
      );
      lastProgressRef.current = next;

      const now = Date.now();
      if (now - lastAccessibilityUpdate >= 250 || next === 0 || next === 1) {
        lastAccessibilityUpdate = now;
        setAccessibilityProgress(next);
      }
    };

    update();
    return store?.subscribe(update);
  }, [animatedProgress, fallbackProgress, playback.progressStore]);

  const segments = useMemo(() => {
    const { width, height } = measuredSize;
    if (!width || !height) return [];
    const r = Math.max(0, Math.min(radius, width / 2, height / 2) - 1);
    const hasPageNumberBounds = Boolean(pageNumberBounds?.width);
    const pageNumberLeft =
      hasPageNumberBounds && pageNumberBounds
        ? pageNumberBounds.x + inset
        : width / 2;
    const pageNumberRight =
      hasPageNumberBounds && pageNumberBounds
        ? pageNumberBounds.x + pageNumberBounds.width + inset
        : width / 2;
    const startX = Math.max(1, pageNumberLeft - pageNumberGap);
    const endX = Math.min(width - 1, pageNumberRight + pageNumberGap);
    const points = [{ x: startX, y: height - 1 }];
    const lineTo = (x: number, y: number) => points.push({ x, y });
    const arc = (cx: number, cy: number, start: number) => {
      const cornerSteps = 8;
      for (let step = 0; step <= cornerSteps; step += 1) {
        const angle = start + (step / cornerSteps) * (Math.PI / 2);
        points.push({
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
        });
      }
    };
    if (hasPageNumberBounds) {
      lineTo(1 + r, height - 1);
      arc(1 + r, height - 1 - r, Math.PI / 2);
      lineTo(1, 1 + r);
      arc(1 + r, 1 + r, Math.PI);
      lineTo(width - 1 - r, 1);
      arc(width - 1 - r, 1 + r, -Math.PI / 2);
      lineTo(width - 1, height - 1 - r);
      arc(width - 1 - r, height - 1 - r, 0);
      lineTo(endX, height - 1);
    } else {
      lineTo(1 + r, height - 1);
      arc(1 + r, height - 1 - r, Math.PI / 2);
      lineTo(1, 1 + r);
      arc(1 + r, 1 + r, Math.PI);
      lineTo(width - 1 - r, 1);
      arc(width - 1 - r, 1 + r, -Math.PI / 2);
      lineTo(width - 1, height - 1 - r);
      arc(width - 1 - r, height - 1 - r, 0);
      lineTo(width / 2, height - 1);
    }
    let offset = 0;
    return points
      .slice(1)
      .map((point, index) => {
        const start = points[index];
        const dx = point.x - start.x;
        const dy = point.y - start.y;
        const length = Math.hypot(dx, dy);
        const segment = {
          start,
          dx,
          dy,
          length,
          offset,
          angle: Math.atan2(dy, dx),
        };
        offset += length;
        return segment;
      })
      .filter((segment) => segment.length > 0);
  }, [inset, measuredSize, pageNumberBounds, pageNumberGap, radius]);
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  const color = playback.mode === "audio" ? theme.accent : theme.autoReadAccent;
  const symbolColors = [
    color,
    theme.accentBlue,
    theme.accentRed,
    theme.accentGreen,
    theme.accentIndigo,
  ];
  const progressDistance = accessibilityProgress * total;
  const progressSymbols = useMemo(() => {
    if (!total || progressDistance <= 0) return [];
    const spacing = 17;
    const symbolCount = Math.floor(progressDistance / spacing) + 1;
    return Array.from({ length: symbolCount }, (_, index) => {
      const distance = Math.min(index * spacing, progressDistance);
      const segment =
        segments.find(
          (candidate) => distance <= candidate.offset + candidate.length,
        ) || segments[segments.length - 1];
      const segmentDistance = Math.max(0, distance - segment.offset);
      return {
        key: index,
        x: segment.start.x + Math.cos(segment.angle) * segmentDistance,
        y: segment.start.y + Math.sin(segment.angle) * segmentDistance,
      };
    });
  }, [progressDistance, segments, total]);

  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={
        playback.mode === "audio"
          ? "Audio page progress"
          : "Auto-read page progress"
      }
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(accessibilityProgress * 100),
      }}
      onLayout={(event: {
        nativeEvent: { layout: { width: number; height: number } };
      }) => {
        if (hasContainerSize) return;
        const { width, height } = event.nativeEvent.layout;
        setSize((previous) =>
          previous.width === width && previous.height === height
            ? previous
            : { width, height },
        );
      }}
      style={{
        position: "absolute",
        top: -inset,
        right: -inset,
        bottom: -inset,
        left: -inset,
        zIndex: 4,
      }}
    >
      {progressSymbols.map((symbol) => (
        <Text
          key={symbol.key}
          accessible={false}
          style={{
            position: "absolute",
            left: symbol.x - 8,
            top: symbol.y - 9,
            color: symbolColors[symbol.key % symbolColors.length],
            fontSize: 14,
            lineHeight: 18,
            fontWeight: "700",
            includeFontPadding: false,
          }}
        >
          卐
        </Text>
      ))}
    </View>
  );
}

const ProgressSegment = memo(function ProgressSegment({
  segment,
  total,
  progress,
  color,
}: {
  segment: {
    start: { x: number; y: number };
    dx: number;
    dy: number;
    length: number;
    offset: number;
    angle: number;
  };
  total: number;
  progress: NativeAnimatedValue;
  color: string;
}) {
  const scaleX = useMemo(() => {
    const interpolate = progress.interpolate as unknown as (
      this: NativeAnimatedValue,
      config: {
        inputRange: number[];
        outputRange: number[];
        extrapolate: "clamp";
      },
    ) => ReaderAnimatedValue;
    return interpolate.call(progress, {
      inputRange: [
        segment.offset / total,
        (segment.offset + segment.length) / total,
      ],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });
  }, [progress, segment.length, segment.offset, total]);
  if (!segment.length || !total) return null;
  return (
    <Animated.View
      style={{
        position: "absolute",
        // transformOrigin anchors scaling at the segment's first point. Keep
        // that point at the segment's untransformed top-left, then rotate the
        // line out from it. Centering the unrotated box here shifts vertical
        // and diagonal segments away from the verse border.
        left: segment.start.x,
        top: segment.start.y - 1,
        width: segment.length,
        height: 2,
        borderRadius: 1,
        backgroundColor: color,
        transformOrigin: "left center",
        transform: [{ rotate: `${segment.angle}rad` }, { scaleX }],
      }}
    />
  );
});
