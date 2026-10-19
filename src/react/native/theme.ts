import type { ReaderTheme } from "./types";

const DEFAULT_READER_THEME: Required<ReaderTheme> = {
  background: "#f5f5f4",
  surface: "#fafaf9",
  page: "#fffbea",
  border: "#e4e4e7",
  text: "#111827",
  mutedText: "#6b7280",
  accent: "#f97316",
  accentSurface: "#fff7ed",
  buttonSurface: "#fff",
  shadow: "#111827",
  overlayText: "#27272a",
  accentBlue: "#1d4ed8",
  accentRed: "#7f1d1d",
  accentGreen: "#166534",
  accentIndigo: "#3730a3",
  preserveInlineColors: true,
};

export function resolveReaderTheme(theme?: ReaderTheme): Required<ReaderTheme> {
  return { ...DEFAULT_READER_THEME, ...(theme || {}) };
}
